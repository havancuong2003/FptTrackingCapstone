import React from 'react';
import styles from './index.module.scss';
import sharedLayout from '../sharedLayout.module.scss';
import DataTable from '../../../components/DataTable/DataTable';
import Modal from '../../../components/Modal/Modal';
import Textarea from '../../../components/Textarea/Textarea';
import { sendDocumentUploadEmail } from '../../../email/documents';
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from '../../../auth/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getFilesByGroup, uploadGroupDocument, deleteGroupDocument } from '../../../api/upload';
import SupervisorGroupFilter from '../../../components/SupervisorGroupFilter/SupervisorGroupFilter';

export default function SupervisorDocuments() {
  const [loading, setLoading] = React.useState(false);
  const [userGroups, setUserGroups] = React.useState([]); // [number]
  const [groupOptions, setGroupOptions] = React.useState([]); // [{value,label}]
  const [selectedGroupId, setSelectedGroupId] = React.useState('');
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [files, setFiles] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const fileInputRef = React.useRef(null);
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active'); // 'active' or 'expired'
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(getCurrentSemesterId());
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [uploadDescription, setUploadDescription] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState(null);
  // Load semesters and set default to current semester
  React.useEffect(() => {
    function loadSemesters() {
      const uniqueSemesters = getUniqueSemesters();
      setSemesters(uniqueSemesters);
      
      // Luôn ưu tiên kì hiện tại khi lần đầu render
      const currentSemesterId = getCurrentSemesterId();
      if (currentSemesterId) {
        // Kiểm tra xem currentSemesterId có trong danh sách không
        const existsInList = uniqueSemesters.some(s => s.id === currentSemesterId);
        if (existsInList) {
          setSelectedSemesterId(currentSemesterId);
        } else if (uniqueSemesters.length > 0) {
          // Nếu không có trong danh sách, fallback về semester đầu tiên
          setSelectedSemesterId(uniqueSemesters[0].id);
        }
      } else if (uniqueSemesters.length > 0) {
        // Nếu không có currentSemesterId, fallback về semester đầu tiên
        setSelectedSemesterId(uniqueSemesters[0].id);
      }
    }
    loadSemesters();
    loadUserInfo();
  }, []);

  React.useEffect(() => {
    if (selectedSemesterId === null) {
      setGroupOptions([]);
      setUserGroups([]);
      return;
    }
    
    loadGroups();
    
    // Check if selected group is still in filtered list
    const isExpired = groupExpireFilter === 'expired';
    const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
    
    const selectedGroupExists = selectedGroupId && groupsFromStorage.some(g => g.id === Number(selectedGroupId));
    
    if (selectedGroupId && !selectedGroupExists) {
      // Selected group is not in filtered list, clear selection and data
      setSelectedGroupId('');
      setGroupInfo(null);
      setFiles([]);
    }
  }, [selectedSemesterId, groupExpireFilter]);

  const loadUserInfo = () => {
    setLoading(true);
    setMessage('');
    try {
      // Get info from localStorage, don't call API
      const userInfo = getUserInfo();
      if (!userInfo) {
        setGroupOptions([]);
        setUserGroups([]);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Error loading user info:', e);
      setMessage('Could not get user information');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = () => {
    try {
      if (selectedSemesterId === null) {
        setGroupOptions([]);
        setUserGroups([]);
        return;
      }
      
      // Get groups from selected semester based on expired status (no API call)
      const isExpired = groupExpireFilter === 'expired';
      const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
      
      if (groupsFromStorage.length === 0) {
        setGroupOptions([]);
        setUserGroups([]);
        return;
      }
      
      // Build options from localStorage only (no API call)
      const options = groupsFromStorage.map((groupInfo) => {
        const gid = String(groupInfo.id);
        const label = groupInfo.name || groupInfo.code || `Group #${gid}`;
        return { value: gid, label };
      });
      
      setGroupOptions(options);
      setUserGroups(groupsFromStorage.map(g => g.id));
    } catch (e) {
      console.error('Error loading groups from localStorage:', e);
      setMessage('Could not get group information');
    }
  };

  const onSelectGroup = async (groupId) => {
    setSelectedGroupId(groupId);
    setGroupInfo(null);
    setFiles([]);
    if (!groupId) return;
    
    // Only call API when group is selected
    await Promise.all([loadGroupInfo(groupId), loadFiles(groupId)]);
  };

  const loadGroupInfo = async (groupId) => {
    try {
      setLoading(true);
      const res = await getCapstoneGroupDetail(groupId);
      if (res?.status === 200) {
        setGroupInfo(res.data);
        // Update select label if needed for groupCode
        setGroupOptions((prev) => {
          const exists = prev.some((o) => o.value === String(groupId) && o.label.includes('SEP') );
          if (exists) return prev;
          return prev.map((o) => (o.value === String(groupId) && res.data?.groupCode
            ? { value: o.value, label: `${res.data.groupCode} - ${res.data.projectName || ''}`.trim() }
            : o));
        });
      } else {
        setMessage(res?.message || 'Could not get group information');
      }
    } catch (e) {
      setMessage(e?.message || 'Could not get group information');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (groupId) => {
    try {
      setLoading(true);
      const res = await getFilesByGroup(groupId);
      if (res?.status === 200) {
        setFiles(res.data || []);
      } else {
        setFiles([]);
        setMessage(res?.message || 'Could not get document list');
      }
    } catch (e) {
      setFiles([]);
      setMessage(e?.message || 'Could not get document list');
    } finally {
      setLoading(false);
    }
  };

  const getUploadsBaseOrigin = async () => {
    try {
      const axiosClient = (await import('../../../utils/axiosClient')).default;
      const base = axiosClient.defaults.baseURL || '';
      const u = new URL(base, window.location.origin);
      return u.origin; // https://host:port
    } catch {
      return '';
    }
  };

  const handleDownload = async (row) => {
    const origin = await getUploadsBaseOrigin();
    const url = `${origin}${row.path}`;
    try {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) throw new Error('Could not download file');
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = row.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback mở trực tiếp nếu blob lỗi
      const a = document.createElement('a');
      a.href = url;
      a.download = row.fileName || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      setLoading(true);
      const res = await deleteGroupDocument(row.id);
      if (res?.status === 200) {
        setFiles((prev) => prev.filter((f) => f.id !== row.id));
      } else {
        setMessage(res?.message || 'Delete failed');
      }
    } catch (e) {
      setMessage(e?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!selectedGroupId) {
      setMessage('Please select a group first');
      return;
    }
    setUploadModalOpen(true);
    setUploadDescription('');
    setSelectedFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !selectedGroupId || !selectedSemesterId) {
      setMessage('Please select a file and ensure group and semester are selected');
      return;
    }
    
    try {
      setLoading(true);
      const res = await uploadGroupDocument(selectedGroupId, selectedSemesterId, uploadDescription || '', selectedFile);
      if (res?.status === 200) {
        const uploadedFile = res.data; // File info from response
        await loadFiles(selectedGroupId);
        
        // Send email notification to students in group
        try {
          const currentUser = getUserInfo();
          if (groupInfo && groupInfo.students && Array.isArray(groupInfo.students)) {
            const studentEmails = groupInfo.students
              .map(student => student.email)
              .filter(email => email);
            
            if (studentEmails.length > 0) {
              // Build file download URL
              const origin = await getUploadsBaseOrigin();
              const fileUrl = uploadedFile?.path ? `${origin}${uploadedFile.path}` : null;
              
              // Build system URL to documents page (student sẽ xem ở đâu?)
              // Có thể là trang documents của student hoặc trang chung
              const systemUrl = `${window.location.origin}/student/documents?groupId=${selectedGroupId}`;
              
              await sendDocumentUploadEmail({
                recipientEmails: studentEmails,
                fileName: selectedFile.name,
                supervisorName: currentUser?.name || 'Supervisor',
                groupName: groupInfo.groupCode || `Group ${selectedGroupId}`,
                message: '',
                fileUrl: fileUrl,
                systemUrl: systemUrl
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending document upload email:', emailError);
          // Don't block flow if email error
        }
        
        // Close modal and reset
        setUploadModalOpen(false);
        setUploadDescription('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setMessage('Document uploaded successfully');
      } else {
        setMessage(res?.message || 'Upload failed');
      }
    } catch (e1) {
      setMessage(e1?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setUploadDescription('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleString('vi-VN');
    } catch {
      return 'Invalid Date';
    }
  };

  const columns = [
    {
      key: 'fileName',
      title: 'Document Name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fileName || '—'}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{row.path}</div>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => (
        <div style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
          {row.description || '—'}
        </div>
      )
    },
    {
      key: 'userName',
      title: 'Uploaded By',
      render: (row) => row.userName || '—'
    },
    {
      key: 'createAt',
      title: 'Time',
      render: (row) => formatDate(row.createAt)
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(row); }}
            style={{
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >Download</button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            style={{
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >Delete</button>
      </div>
      )
  }
  ];

  return (
    <div className={sharedLayout.container}>
      <div className={sharedLayout.header}>
        <h1>Documents Shared with Group</h1>
        <p>Supervisor can share documents with their groups</p>
      </div>

      <SupervisorGroupFilter
        semesters={semesters}
        selectedSemesterId={selectedSemesterId}
        onSemesterChange={(newSemesterId) => {
          setSelectedSemesterId(newSemesterId);
          // Clear data when semester changes
          setSelectedGroupId('');
          setGroupInfo(null);
          setFiles([]);
        }}
        groupExpireFilter={groupExpireFilter}
        onGroupExpireFilterChange={(newFilter) => {
          setGroupExpireFilter(newFilter);
          // Clear data when filter changes
          setSelectedGroupId('');
          setGroupInfo(null);
          setFiles([]);
        }}
        groups={groupOptions.map(opt => ({ id: opt.value, name: opt.label }))}
        selectedGroupId={selectedGroupId || ''}
        onGroupChange={onSelectGroup}
        groupSelectPlaceholder="-- Select group --"
        loading={loading}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
        <button
          disabled={!selectedGroupId}
          onClick={handleUploadClick}
          style={{
            background: selectedGroupId ? '#10B981' : '#9CA3AF',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 8,
            cursor: selectedGroupId ? 'pointer' : 'not-allowed',
            minWidth: 140,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
          title={selectedGroupId ? 'Upload document to selected group' : 'Select group before uploading'}
        >
          Upload
        </button>
      </div>
      
      {message && (
        <div className={styles.message}>{message}</div>
      )}

      {!selectedGroupId && (
        <div className={sharedLayout.emptyState}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>Please select a group</div>
          <div style={{ opacity: 0.7 }}>You will see group information and document list after selection.</div>
        </div>
      )}
      
      {selectedGroupId && groupInfo && (
        <div className={sharedLayout.contentSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{groupInfo.groupCode} — {groupInfo.projectName}</h2>
            <button
              onClick={() => loadFiles(selectedGroupId)}
              style={{
                background: '#0EA5E9',
                color: '#fff',
                border: 'none',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >Refresh</button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: 8 }}>Number of Students: <b>{Array.isArray(groupInfo.students) ? groupInfo.students.length : 0}</b></div>
            <div style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: 8 }}>Supervisors: <b>{(groupInfo.supervisors || []).join(', ')}</b></div>
          </div>
        </div>
      )}

      {selectedGroupId && (
        <div className={styles.semesterList}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Document List</div>
            <div style={{ opacity: 0.7 }}>{files.length} document{files.length !== 1 ? 's' : ''}</div>
          </div>
          <DataTable
            columns={columns}
            data={files}
            loading={loading}
            emptyMessage="No documents yet"
          />
          </div>
        )}

      {/* Upload Modal */}
      <Modal open={uploadModalOpen} onClose={handleCloseUploadModal}>
        <div style={{ padding: 24, minWidth: '500px', maxWidth: '90vw' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: 20 }}>Upload Document</h2>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
              Description
            </label>
            <Textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Enter document description..."
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
              File
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Choose File
              </button>
              {selectedFile && (
                <span style={{ fontSize: 14, color: '#374151' }}>
                  {selectedFile.name}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button
              onClick={handleCloseUploadModal}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || loading}
              style={{
                background: !selectedFile || loading ? '#9ca3af' : '#10b981',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                cursor: !selectedFile || loading ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

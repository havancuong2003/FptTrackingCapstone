import React from 'react';
import styles from './index.module.scss';
import sharedLayout from '../sharedLayout.module.scss';
import DataTable from '../../../components/DataTable/DataTable';
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

  React.useEffect(() => {
    loadUserInfo();
  }, []);

  React.useEffect(() => {
    loadGroups();
    
    // Check if selected group is still in filtered list
    const isExpired = groupExpireFilter === 'expired';
    const allSemesters = getUniqueSemesters();
    let filteredGroups = [];
    
    // Get all groups from all semesters
    allSemesters.forEach(semester => {
      const groupsFromStorage = getGroupsBySemesterAndStatus(semester.id, isExpired);
      filteredGroups = [...filteredGroups, ...groupsFromStorage];
    });
    
    const selectedGroupExists = selectedGroupId && filteredGroups.some(g => g.id === Number(selectedGroupId));
    
    if (selectedGroupId && !selectedGroupExists) {
      // Selected group is not in filtered list, clear selection and data
      setSelectedGroupId('');
      setGroupInfo(null);
      setFiles([]);
    }
  }, [groupExpireFilter]);

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
      // Get groups from all semesters based on expired status (no API call)
      const isExpired = groupExpireFilter === 'expired';
      const allSemesters = getUniqueSemesters();
      let allGroups = [];
      
      // Get all groups from all semesters
      allSemesters.forEach(semester => {
        const groupsFromStorage = getGroupsBySemesterAndStatus(semester.id, isExpired);
        allGroups = [...allGroups, ...groupsFromStorage];
      });
      
      if (allGroups.length === 0) {
        setGroupOptions([]);
        setUserGroups([]);
        return;
      }
      
      // Build options from localStorage only (no API call)
      const options = allGroups.map((groupInfo) => {
        const gid = String(groupInfo.id);
        const label = groupInfo.name || groupInfo.code || `Group #${gid}`;
        return { value: gid, label };
      });
      
      setGroupOptions(options);
      setUserGroups(allGroups.map(g => g.id));
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

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUploadChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroupId) return;
    try {
      setLoading(true);
      const res = await uploadGroupDocument(selectedGroupId, file);
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
                fileName: file.name,
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
      } else {
        setMessage(res?.message || 'Upload failed');
      }
    } catch (e1) {
      setMessage(e1?.message || 'Upload failed');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        semesters={[]}
        selectedSemesterId={null}
        onSemesterChange={() => {}}
        groupExpireFilter={groupExpireFilter}
        onGroupExpireFilterChange={setGroupExpireFilter}
        groups={groupOptions.map(opt => ({ id: opt.value, name: opt.label }))}
        selectedGroupId={selectedGroupId || ''}
        onGroupChange={onSelectGroup}
        groupSelectPlaceholder="-- Select group --"
        loading={loading}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <input ref={fileInputRef} type="file" onChange={handleUploadChange} style={{ display: 'none' }} />
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
    </div>
  );
}

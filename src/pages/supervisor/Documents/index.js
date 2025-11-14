import React from 'react';
import styles from './index.module.scss';
import DataTable from '../../../components/DataTable/DataTable';
import client from '../../../utils/axiosClient';
import { sendDocumentUploadEmail } from '../../../email/documents';
import { getUserInfo } from '../../../auth/auth';

export default function SupervisorDocuments() {
  const [loading, setLoading] = React.useState(false);
  const [userGroups, setUserGroups] = React.useState([]); // [number]
  const [groupOptions, setGroupOptions] = React.useState([]); // [{value,label}]
  const [selectedGroupId, setSelectedGroupId] = React.useState('');
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [files, setFiles] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await client.get('/auth/user-info');
      if (res?.data?.status === 200) {
        const groups = Array.isArray(res.data.data?.groups) ? res.data.data.groups : [];
        setUserGroups(groups);
        // Tải thông tin tên nhóm để hiển thị label đẹp (groupCode - projectName)
        if (groups.length > 0) {
          const fetchInfos = await Promise.allSettled(
            groups.map((gid) => client.get(`/Staff/capstone-groups/${gid}`))
          );
          const options = fetchInfos.map((r, idx) => {
            const gid = String(groups[idx]);
            if (r.status === 'fulfilled' && r.value?.data?.status === 200) {
              const gi = r.value.data.data || {};
              const label = gi.groupCode ? `${gi.groupCode} - ${gi.projectName || ''}`.trim() : `Nhóm #${gid}`;
              return { value: gid, label };
            }
            return { value: gid, label: `Nhóm #${gid}` };
          });
          setGroupOptions(options);
        } else {
          setGroupOptions([]);
        }
      } else {
        setMessage(res?.data?.message || 'Không lấy được thông tin người dùng');
      }
    } catch (e) {
      setMessage(e?.message || 'Không lấy được thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const onSelectGroup = async (groupId) => {
    setSelectedGroupId(groupId);
    setGroupInfo(null);
    setFiles([]);
    if (!groupId) return;
    await Promise.all([loadGroupInfo(groupId), loadFiles(groupId)]);
  };

  const loadGroupInfo = async (groupId) => {
    try {
      setLoading(true);
      const res = await client.get(`/Staff/capstone-groups/${groupId}`);
      if (res?.data?.status === 200) {
        setGroupInfo(res.data.data);
        // Cập nhật nhãn select nếu cần groupCode
        setGroupOptions((prev) => {
          const exists = prev.some((o) => o.value === String(groupId) && o.label.includes('SEP') );
          if (exists) return prev;
          return prev.map((o) => (o.value === String(groupId) && res.data.data?.groupCode
            ? { value: o.value, label: `${res.data.data.groupCode} - ${res.data.data.projectName || ''}`.trim() }
            : o));
        });
      } else {
        setMessage(res?.data?.message || 'Không lấy được thông tin nhóm');
      }
    } catch (e) {
      setMessage(e?.message || 'Không lấy được thông tin nhóm');
      } finally {
        setLoading(false);
      }
    };

  const loadFiles = async (groupId) => {
    try {
      setLoading(true);
      const res = await client.get(`/upload/files`, { params: { groupId } });
      if (res?.data?.status === 200) {
        setFiles(res.data.data || []);
      } else {
        setFiles([]);
        setMessage(res?.data?.message || 'Không lấy được danh sách tài liệu');
      }
    } catch (e) {
      setFiles([]);
      setMessage(e?.message || 'Không lấy được danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const getUploadsBaseOrigin = () => {
    try {
      const base = client.defaults.baseURL || '';
      const u = new URL(base, window.location.origin);
      return u.origin; // https://host:port
    } catch {
      return '';
    }
  };

  const handleDownload = async (row) => {
    const origin = getUploadsBaseOrigin();
    const url = `${origin}${row.path}`;
    try {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) throw new Error('Không thể tải file');
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
    if (!window.confirm('Xóa tài liệu này?')) return;
    try {
      setLoading(true);
      const res = await client.delete(`/upload/group`, { params: { attachmentId: row.id } });
      if (res?.data?.status === 200) {
        setFiles((prev) => prev.filter((f) => f.id !== row.id));
      } else {
        setMessage(res?.data?.message || 'Xóa thất bại');
      }
    } catch (e) {
      setMessage(e?.message || 'Xóa thất bại');
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
      const form = new FormData();
      form.append('file', file);
      const res = await client.post(`/upload/group`, form, {
        params: { groupId: selectedGroupId },
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res?.data?.status === 200) {
        const uploadedFile = res.data.data; // File info từ response
        await loadFiles(selectedGroupId);
        
        // Gửi email thông báo cho sinh viên trong nhóm
        try {
          const currentUser = getUserInfo();
          if (groupInfo && groupInfo.students && Array.isArray(groupInfo.students)) {
            const studentEmails = groupInfo.students
              .map(student => student.email)
              .filter(email => email);
            
            if (studentEmails.length > 0) {
              // Build file download URL
              const origin = getUploadsBaseOrigin();
              const fileUrl = uploadedFile?.path ? `${origin}${uploadedFile.path}` : null;
              
              // Build system URL to documents page (student sẽ xem ở đâu?)
              // Có thể là trang documents của student hoặc trang chung
              const systemUrl = `${window.location.origin}/student/documents?groupId=${selectedGroupId}`;
              
              await sendDocumentUploadEmail({
                recipientEmails: studentEmails,
                fileName: file.name,
                supervisorName: currentUser?.name || 'Giảng viên hướng dẫn',
                groupName: groupInfo.groupCode || `Nhóm ${selectedGroupId}`,
                message: '',
                fileUrl: fileUrl,
                systemUrl: systemUrl
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending document upload email:', emailError);
          // Không block flow nếu email lỗi
        }
      } else {
        setMessage(res?.data?.message || 'Upload thất bại');
      }
    } catch (e1) {
      setMessage(e1?.message || 'Upload thất bại');
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
      title: 'Tên tài liệu',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fileName || '—'}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{row.path}</div>
        </div>
      )
    },
    {
      key: 'userName',
      title: 'Người tải lên',
      render: (row) => row.userName || '—'
    },
    {
      key: 'createAt',
      title: 'Thời gian',
      render: (row) => formatDate(row.createAt)
    },
    {
      key: 'actions',
      title: 'Thao tác',
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
          >Tải xuống</button>
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
          >Xóa</button>
      </div>
      )
  }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Tài liệu chia sẻ cho nhóm</h1>
            <div style={{ opacity: 0.7, marginTop: 4 }}>Mentor có thể chia sẻ tài liệu hướng dẫn cho nhóm của mình</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 260 }}>
            <select
              value={selectedGroupId}
              onChange={(e) => onSelectGroup(e.target.value)}
              className={styles.select}
            >
              <option value="">-- Chọn nhóm --</option>
              {groupOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
              title={selectedGroupId ? 'Tải tài liệu lên nhóm đã chọn' : 'Chọn nhóm trước khi upload'}
            >
              Tải lên
            </button>
          </div>
        </div>
      </div>
      
      {message && (
        <div className={styles.message}>{message}</div>
      )}

      {!selectedGroupId && (
        <div className={styles.emptyState}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>Hãy chọn một nhóm</div>
          <div style={{ opacity: 0.7 }}>Bạn sẽ thấy thông tin nhóm và danh sách tài liệu sau khi chọn.</div>
        </div>
      )}
      
      {selectedGroupId && groupInfo && (
        <div className={styles.groupInfo}>
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
            >Làm mới</button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: 8 }}>Semester: <b>{groupInfo.semesterId}</b></div>
            <div style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: 8 }}>Số SV: <b>{Array.isArray(groupInfo.students) ? groupInfo.students.length : 0}</b></div>
            <div style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: 8 }}>Supervisors: <b>{(groupInfo.supervisors || []).join(', ')}</b></div>
          </div>
        </div>
      )}

      {selectedGroupId && (
        <div className={styles.semesterList}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Danh sách tài liệu</div>
            <div style={{ opacity: 0.7 }}>{files.length} tài liệu</div>
          </div>
          <DataTable
            columns={columns}
            data={files}
            loading={loading}
            emptyMessage="Chưa có tài liệu nào"
          />
          </div>
        )}
    </div>
  );
}

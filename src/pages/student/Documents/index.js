import React from 'react';
import styles from './index.module.scss';
import DataTable from '../../../components/DataTable/DataTable';
import client from '../../../utils/axiosClient';

export default function StudentDocuments() {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [groupOptions, setGroupOptions] = React.useState([]);
  const [selectedGroupId, setSelectedGroupId] = React.useState('');
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [files, setFiles] = React.useState([]);

  React.useEffect(() => {
    loadUserAndGroups();
  }, []);

  const loadUserAndGroups = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await client.get('/auth/user-info');
      if (res?.data?.status === 200) {
        const groups = Array.isArray(res.data.data?.groups) ? res.data.data.groups : [];
        if (groups.length === 0) {
          setGroupOptions([]);
          setSelectedGroupId('');
          setFiles([]);
          return;
        }
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
        const firstId = String(groups[0]);
        setSelectedGroupId(firstId);
        await Promise.all([loadGroupInfo(firstId), loadFiles(firstId)]);
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
      return u.origin;
    } catch {
      return '';
    }
  };

  const handleDownload = async (row) => {
    const origin = getUploadsBaseOrigin();
    const url = `${origin}${row.path}`;
    try {
      // Tải blob để buộc trình duyệt tải xuống thay vì mở xem
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
      // Fallback: mở link trực tiếp nếu blob thất bại
      const a = document.createElement('a');
      a.href = url;
      a.download = row.fileName || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      title: 'Người upload',
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
      </div>
      )
  }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Tài liệu từ Supervisor</h1>
            <div style={{ opacity: 0.7, marginTop: 4 }}>Sinh viên có thể tải các tài liệu được supervisor chia sẻ</div>
      </div>
          {groupOptions.length > 1 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 260 }}>
              <select
                value={selectedGroupId}
                onChange={(e) => onSelectGroup(e.target.value)}
                className={styles.select}
              >
                {groupOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
      </div>
    )}
        </div>
      </div>

      {message && (
        <div className={styles.message}>{message}</div>
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

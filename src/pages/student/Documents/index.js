import React from 'react';
import styles from './index.module.scss';
import DataTable from '../../../components/DataTable/DataTable';
import { getUserInfo, getGroupId } from '../../../auth/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getFilesByGroup, uploadGroupDocument, deleteGroupDocument } from '../../../api/upload';

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

  // Check if no group
  const hasNoGroup = !loading && groupOptions.length === 0;

  const loadUserAndGroups = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Get info from localStorage, don't call API
      const userInfo = getUserInfo();
      if (!userInfo) {
        setGroupOptions([]);
        setSelectedGroupId('');
        setFiles([]);
        setLoading(false);
        return;
      }
      
      const groups = Array.isArray(userInfo.groups) ? userInfo.groups : [];
      if (groups.length === 0) {
        setGroupOptions([]);
        setSelectedGroupId('');
        setFiles([]);
        setLoading(false);
        return;
      }
        const fetchInfos = await Promise.allSettled(
          groups.map((gid) => getCapstoneGroupDetail(gid))
        );
        const options = fetchInfos.map((r, idx) => {
          const gid = String(groups[idx]);
          if (r.status === 'fulfilled' && r.value?.status === 200) {
            const gi = r.value.data || {};
            const label = gi.groupCode ? `${gi.groupCode} - ${gi.projectName || ''}`.trim() : `Group #${gid}`;
            return { value: gid, label };
          }
          return { value: gid, label: `Group #${gid}` };
        });
        setGroupOptions(options);
        const firstId = String(groups[0]);
        setSelectedGroupId(firstId);
        await Promise.all([loadGroupInfo(firstId), loadFiles(firstId)]);
    } catch (e) {
      setMessage('Could not get user information');
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
      const res = await getCapstoneGroupDetail(groupId);
      if (res?.status === 200) {
        setGroupInfo(res.data);
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
        setMessage(res?.message || 'Could not get documents list');
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
          >Tải xuống</button>
      </div>
      )
  }
  ];

  // If no group, show message
  if (hasNoGroup) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState || styles.message}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            You are not in any group
          </div>
          <div style={{ color: '#6b7280' }}>
            Please contact the supervisor to be added to a group.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Documents from Supervisor</h1>
            <div style={{ opacity: 0.7, marginTop: 4 }}>Students can download documents shared by supervisor</div>
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
            >Refresh</button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: 8 }}>Students: <b>{Array.isArray(groupInfo.students) ? groupInfo.students.length : 0}</b></div>
            <div style={{ padding: '6px 10px', background: '#F1F5F9', borderRadius: 8 }}>Supervisors: <b>{(groupInfo.supervisors || []).join(', ')}</b></div>
              </div>
            </div>
      )}

      {selectedGroupId && (
        <div className={styles.semesterList}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Documents List</div>
            <div style={{ opacity: 0.7 }}>{files.length} documents</div>
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

import React from 'react';
import styles from './Sync.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import { getMockDataGroups, syncMockDataGroups } from '../../../api/staff/groups';

export default function SyncGroup() {
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [groupsData, setGroupsData] = React.useState([]);
  const [message, setMessage] = React.useState('');

  const handleLoadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await getMockDataGroups();
      if (res.status === 200) {
        setGroupsData(res.data || []);
        setMessage(`Đã tải ${res.data?.length || 0} nhóm từ Call4Project`);
      } else {
        setMessage(res.message || 'Lỗi khi tải dữ liệu');
        setGroupsData([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
      setGroupsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!groupsData || groupsData.length === 0) {
      alert('Vui lòng tải dữ liệu trước khi đồng bộ!');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn đồng bộ ${groupsData.length} nhóm từ Call4Project?`)) {
      return;
    }

    setSyncing(true);
    setMessage('');
    try {
      const res = await syncMockDataGroups(groupsData);
      if (res.status === 200) {
        alert('Đồng bộ dữ liệu thành công!');
        setMessage('Đồng bộ dữ liệu thành công!');
      } else {
        alert(res.message || 'Lỗi khi đồng bộ dữ liệu');
        setMessage(res.message || 'Lỗi khi đồng bộ dữ liệu');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      alert('Lỗi khi đồng bộ dữ liệu. Vui lòng thử lại.');
      setMessage('Lỗi khi đồng bộ dữ liệu. Vui lòng thử lại.');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      key: 'groupCode',
      title: 'Group Code',
      render: (row) => (
        <div style={{ fontWeight: 500, color: '#1f2937' }}>
          {row.groupCode || '-'}
        </div>
      )
    },
    {
      key: 'groupName',
      title: 'Group Name',
      render: (row) => (
        <div style={{ fontWeight: 500, color: '#1f2937' }}>
          {row.groupName || '-'}
        </div>
      )
    },
    {
      key: 'vietnameseTitle',
      title: 'Vietnamese Title',
      render: (row) => row.vietnameseTitle || '-'
    },
    {
      key: 'majorId',
      title: 'Major ID',
      render: (row) => row.majorId || '-'
    },
    {
      key: 'profession',
      title: 'Profession',
      render: (row) => row.profession || '-'
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <span style={{
          color: row.status === 'ACTIVE' ? '#059669' : '#64748b',
          background: row.status === 'ACTIVE' ? '#ecfdf5' : '#f3f4f6',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          border: `1px solid ${row.status === 'ACTIVE' ? '#a7f3d0' : '#d1d5db'}`
        }}>
          {row.status || '-'}
        </span>
      )
    },
    {
      key: 'members',
      title: 'Members',
      render: (row) => (
        <div>
          {row.members && row.members.length > 0 ? (
            <span style={{ color: '#3b82f6', fontWeight: 500 }}>
              {row.members.length} thành viên
            </span>
          ) : (
            '-'
          )}
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => (
        <div style={{ 
          maxWidth: '300px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {row.description || '-'}
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <h1>Sync Group from Call4Project</h1>
      
      <div className={styles.actions}>
        <Button
          onClick={handleLoadData}
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Đang tải...' : 'Load Data from Call4Project'}
        </Button>
        
        <Button
          onClick={handleSync}
          disabled={syncing || groupsData.length === 0}
          variant="primary"
        >
          {syncing ? 'Đang đồng bộ...' : 'Sync'}
        </Button>
      </div>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {groupsData.length > 0 && (
        <div className={styles.previewSection}>
          <h2>Preview Data ({groupsData.length} groups)</h2>
          <div className={styles.tableWrapper}>
            <DataTable
              columns={columns}
              data={groupsData}
              loading={loading}
              emptyMessage="Không có dữ liệu"
              showIndex={true}
              indexTitle="STT"
            />
          </div>

          {/* Members Detail */}
          <div className={styles.membersDetail}>
            <h3>Chi tiết thành viên các nhóm</h3>
            {groupsData.map((group, groupIndex) => (
              <div key={groupIndex} className={styles.groupDetail}>
                <h4>{group.groupCode} - {group.groupName}</h4>
                {group.members && group.members.length > 0 ? (
                  <table className={styles.membersTable}>
                    <thead>
                      <tr>
                        <th>Fullname</th>
                        <th>Roll Number</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.members.map((member, memberIndex) => (
                        <tr key={memberIndex}>
                          <td>{member.fullname || '-'}</td>
                          <td>{member.rollNumber || '-'}</td>
                          <td>{member.email || '-'}</td>
                          <td>{member.phone || '-'}</td>
                          <td>
                            <span style={{
                              color: member.roleInGroup === 'Leader' ? '#3b82f6' :
                                     member.roleInGroup === 'Supervisor' ? '#059669' : '#64748b',
                              fontWeight: 500
                            }}>
                              {member.roleInGroup || '-'}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              color: member.status === 'Active' ? '#059669' : '#64748b',
                              background: member.status === 'Active' ? '#ecfdf5' : '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              border: `1px solid ${member.status === 'Active' ? '#a7f3d0' : '#d1d5db'}`
                            }}>
                              {member.status || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: 12, color: '#64748b', fontStyle: 'italic' }}>
                    Không có thành viên
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && groupsData.length === 0 && !message && (
        <div className={styles.emptyState}>
          <p>Nhấn "Load Data from Call4Project" để tải dữ liệu từ Call4Project</p>
        </div>
      )}
    </div>
  );
}


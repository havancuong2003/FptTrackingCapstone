import React from 'react';
import styles from './Sync.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import Modal from '../../../components/Modal/Modal';
import Input from '../../../components/Input/Input';
import { getMockDataGroups, syncMockDataGroups } from '../../../api/staff/groups';

export default function SyncGroup() {
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [groupsData, setGroupsData] = React.useState([]);
  const [majorCategories, setMajorCategories] = React.useState({ alreadyExist: [], notExistYet: [] });
  const [message, setMessage] = React.useState('');
  const [syncProgress, setSyncProgress] = React.useState(0);
  const [syncStatus, setSyncStatus] = React.useState(''); // 'idle', 'syncing', 'completed', 'error'
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [jumpToPage, setJumpToPage] = React.useState('');

  const handleLoadData = async () => {
    setLoading(true);
    setMessage('');
    setSyncProgress(0);
    setSyncStatus('idle');
    try {
      const res = await getMockDataGroups();
      if (res.status === 200) {
        // Parse data từ format mới: data.result.groups và data.result.majorCategories
        const result = res.data?.result || res.data || {};
        const groups = result.groups || [];
        const majorCats = result.majorCategories || { alreadyExist: [], notExistYet: [] };
        
        setGroupsData(groups);
        setMajorCategories(majorCats);
        setMessage(`Loaded ${groups.length} groups from FAP System`);
      } else {
        setMessage(res.message || 'Error loading data');
        setGroupsData([]);
        setMajorCategories({ alreadyExist: [], notExistYet: [] });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Error loading data. Please try again.');
      setGroupsData([]);
      setMajorCategories({ alreadyExist: [], notExistYet: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!groupsData || groupsData.length === 0) {
      alert('Please load data before syncing!');
      return;
    }

    if (!window.confirm(`Are you sure you want to sync ${groupsData.length} groups from FAP System?`)) {
      return;
    }

    setSyncing(true);
    setMessage('');
    setSyncStatus('syncing');
    setSyncProgress(0);

    // Simulate progress (trong thực tế có thể dùng WebSocket hoặc polling để lấy progress từ server)
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const res = await syncMockDataGroups(groupsData);
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      if (res.status === 200) {
        setSyncStatus('completed');
        setMessage('Data synced successfully!');
        setTimeout(() => {
          alert('Data synced successfully!');
        }, 100);
      } else {
        setSyncStatus('error');
        setMessage(res.message || 'Error syncing data');
        alert(res.message || 'Error syncing data');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setSyncProgress(0);
      setSyncStatus('error');
      console.error('Error syncing data:', error);
      setMessage('Error syncing data. Please try again.');
      alert('Error syncing data. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Filter groups based on search query
  const filteredGroupsData = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return groupsData;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return groupsData.filter(group => {
      // Search in Group Code
      if ((group.groupCode || '').toLowerCase().includes(query)) return true;
      
      // Search in Group Name
      if ((group.groupName || '').toLowerCase().includes(query)) return true;
      
      // Search in Vietnamese Title
      if ((group.vietnameseTitle || '').toLowerCase().includes(query)) return true;
      
      // Search in Major ID
      if (String(group.majorId || '').toLowerCase().includes(query)) return true;
      
      // Search in Profession
      if ((group.profession || '').toLowerCase().includes(query)) return true;
      
      // Search in Description
      if ((group.description || '').toLowerCase().includes(query)) return true;
      
      // Search in Members (name, rollNumber, email)
      if (group.members && group.members.length > 0) {
        const memberMatch = group.members.some(member => 
          (member.fullname || '').toLowerCase().includes(query) ||
          (member.rollNumber || '').toLowerCase().includes(query) ||
          (member.email || '').toLowerCase().includes(query)
        );
        if (memberMatch) return true;
      }
      
      return false;
    });
  }, [groupsData, searchQuery]);

  // Paginate filtered data
  const paginatedGroupsData = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredGroupsData.slice(startIndex, endIndex);
  }, [filteredGroupsData, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredGroupsData.length / pageSize));

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Handle jump to page
  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
      setJumpToPage('');
    }
  };

  const handleOpenDetail = (group) => {
    setSelectedGroup(group);
    setDetailModalOpen(true);
  };

  const columns = [
    {
      key: 'groupCode',
      title: 'Group Code',
      render: (row) => (
        <div style={{ 
          fontWeight: 500, 
          color: '#1f2937',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }} title={row.groupCode || '-'}>
          {row.groupCode || '-'}
        </div>
      )
    },
    {
      key: 'groupName',
      title: 'Group Name',
      render: (row) => (
        <div style={{ 
          fontWeight: 500, 
          color: '#1f2937',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }} title={row.groupName || '-'}>
          {row.groupName || '-'}
        </div>
      )
    },
    {
      key: 'vietnameseTitle',
      title: 'Vietnamese Title',
      render: (row) => (
        <div style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }} title={row.vietnameseTitle || '-'}>
          {row.vietnameseTitle || '-'}
        </div>
      )
    },
    {
      key: 'majorId',
      title: 'Major ID',
      render: (row) => (
        <div style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }} title={String(row.majorId || '-')}>
          {row.majorId || '-'}
        </div>
      )
    },
    {
      key: 'profession',
      title: 'Profession',
      render: (row) => (
        <div style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }} title={row.profession || '-'}>
          {row.profession || '-'}
        </div>
      )
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
          border: `1px solid ${row.status === 'ACTIVE' ? '#a7f3d0' : '#d1d5db'}`,
          whiteSpace: 'nowrap',
          display: 'inline-block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }} title={row.status || '-'}>
          {row.status || '-'}
        </span>
      )
    },
    {
      key: 'members',
      title: 'Members',
      render: (row) => (
        <div style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {row.members && row.members.length > 0 ? (
            <span style={{ color: '#3b82f6', fontWeight: 500 }}>
              {row.members.length} member{row.members.length !== 1 ? 's' : ''}
            </span>
          ) : (
            '0 members'
          )}
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => (
        <div style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }} title={row.description || '-'}>
          {row.description || '-'}
        </div>
      )
    },
    {
      key: 'details',
      title: 'Details',
      render: (row) => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          whiteSpace: 'nowrap'
        }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenDetail(row)}
            style={{
              whiteSpace: 'nowrap',
              writingMode: 'horizontal-tb',
              minWidth: '70px'
            }}
          >
            Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <h1>Sync Groups from FAP System</h1>
      
      <div className={styles.actions}>
        <Button
          onClick={handleLoadData}
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Loading...' : 'Load Data from FAP System'}
        </Button>
        
        <Button
          onClick={handleSync}
          disabled={syncing || groupsData.length === 0}
          variant="primary"
        >
          {syncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {/* Progress Bar */}
      {syncing && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Sync Progress</span>
            <span className={styles.progressPercent}>{syncProgress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          {syncStatus === 'syncing' && (
            <div className={styles.progressStatus}>
              Processing data...
            </div>
          )}
        </div>
      )}

      {/* Major Categories Info */}
      {(majorCategories.alreadyExist.length > 0 || majorCategories.notExistYet.length > 0) && (
        <div className={styles.majorCategoriesSection}>
          <h2>Major Categories Information</h2>
          {majorCategories.alreadyExist.length > 0 && (
            <div className={styles.majorCategoryBox}>
              <h3>Already Exist ({majorCategories.alreadyExist.length})</h3>
              <div className={styles.majorList}>
                {majorCategories.alreadyExist.map((major, index) => (
                  <span key={index} className={styles.majorTag}>
                    {major.code} - {major.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {majorCategories.notExistYet.length > 0 && (
            <div className={styles.majorCategoryBox}>
              <h3>Not Exist Yet ({majorCategories.notExistYet.length})</h3>
              <div className={styles.majorList}>
                {majorCategories.notExistYet.map((major, index) => (
                  <span key={index} className={styles.majorTag}>
                    {major.code} - {major.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {groupsData.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.sectionHeader}>
            <h2>Group Data ({filteredGroupsData.length} of {groupsData.length} groups)</h2>
            <div className={styles.pageSizeSelector}>
              <label>Rows per page:</label>
              <select 
                value={pageSize} 
                onChange={e => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
                className={styles.pageSizeSelect}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className={styles.searchBox}>
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.totalCount}>
              Showing {paginatedGroupsData.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, filteredGroupsData.length)} of {filteredGroupsData.length.toLocaleString()} groups
            </span>
          </div>
          <div className={styles.tableWrapper}>
            <DataTable
              columns={columns}
              data={paginatedGroupsData}
              loading={loading}
              emptyMessage="No data found"
              showIndex={true}
              indexTitle="STT"
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(1)}
                  title="First page"
                >
                  ««
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
              </div>
              
              <div className={styles.paginationCenter}>
                <span className={styles.pageInfo}>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <div className={styles.jumpToPage}>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    placeholder="Go to"
                    value={jumpToPage}
                    onChange={e => setJumpToPage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleJumpToPage()}
                    className={styles.jumpInput}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleJumpToPage}
                    disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                  >
                    Go
                  </Button>
                </div>
              </div>

              <div className={styles.paginationInfo}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(totalPages)}
                  title="Last page"
                >
                  »»
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Group Detail Modal */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        {selectedGroup && (
          <div className={styles.groupDetailModal}>
            <h2>Group Details</h2>
            
            <section className={styles.groupInfoSection}>
              <h3>Group Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <strong>Group Code:</strong>
                  <span>{selectedGroup.groupCode || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Group Name:</strong>
                  <span>{selectedGroup.groupName || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Vietnamese Title:</strong>
                  <span>{selectedGroup.vietnameseTitle || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Major ID:</strong>
                  <span>{selectedGroup.majorId || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Profession:</strong>
                  <span>{selectedGroup.profession || '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Status:</strong>
                  <span className={selectedGroup.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
                    {selectedGroup.status || '-'}
                  </span>
                </div>
                <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                  <strong>Description:</strong>
                  <span>{selectedGroup.description || '-'}</span>
                </div>
              </div>
            </section>

            <section className={styles.membersSection}>
              <h3>Members ({selectedGroup.members?.length || 0})</h3>
              {selectedGroup.members && selectedGroup.members.length > 0 ? (
                <div className={styles.membersTableWrapper}>
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
                      {selectedGroup.members.map((member, index) => (
                        <tr key={index}>
                          <td>{member.fullname || '-'}</td>
                          <td>{member.rollNumber || '-'}</td>
                          <td>{member.email || '-'}</td>
                          <td>{member.phone || '-'}</td>
                          <td>
                            <span className={
                              member.roleInGroup === 'Leader' ? styles.badgeLeader :
                              member.roleInGroup === 'Supervisor' ? styles.badgeSupervisor :
                              styles.badgeStudent
                            }>
                              {member.roleInGroup === 'Student' ? 'Member' : (member.roleInGroup || 'Member')}
                            </span>
                          </td>
                          <td>
                            <span className={member.status === 'Active' ? styles.badgeActive : styles.badgeInactive}>
                              {member.status || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#64748b', fontStyle: 'italic', padding: '12px' }}>No members found</p>
              )}
            </section>
          </div>
        )}
      </Modal>

      {!loading && groupsData.length === 0 && !message && (
        <div className={styles.emptyState}>
          <p>Click "Load Data from FAP System" to load data from FAP System</p>
        </div>
      )}
    </div>
  );
}


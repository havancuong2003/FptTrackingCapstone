import React from 'react';
import styles from './Sync.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import Modal from '../../../components/Modal/Modal';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import { getMockDataGroups, syncMockDataGroups, getSemesters } from '../../../api/staff/groups';

export default function SyncGroup() {
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [groupsData, setGroupsData] = React.useState([]);
  const [groupsByStatus, setGroupsByStatus] = React.useState({ alreadyExist: [], notExistYet: [] });
  const [majorCategories, setMajorCategories] = React.useState({ alreadyExist: [], notExistYet: [] });
  const [message, setMessage] = React.useState('');
  const [syncProgress, setSyncProgress] = React.useState(0);
  const [syncStatus, setSyncStatus] = React.useState(''); // 'idle', 'syncing', 'completed', 'error'
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [pageOld, setPageOld] = React.useState(1);
  const [pageNew, setPageNew] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [jumpToPageOld, setJumpToPageOld] = React.useState('');
  const [jumpToPageNew, setJumpToPageNew] = React.useState('');
  const [searchQueryOld, setSearchQueryOld] = React.useState('');
  const [searchQueryNew, setSearchQueryNew] = React.useState('');
  
  // Semester selection
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState('');
  const [loadingSemesters, setLoadingSemesters] = React.useState(false);
  const [dataLoaded, setDataLoaded] = React.useState(false);

  // Load semesters on mount
  React.useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    setLoadingSemesters(true);
    try {
      const res = await getSemesters();
      if (res.status === 200) {
        setSemesters(res.data || []);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
    } finally {
      setLoadingSemesters(false);
    }
  };

  const handleLoadData = async () => {
    if (!selectedSemesterId) {
      alert('Please select a semester first!');
      return;
    }

    setLoading(true);
    setMessage('');
    setSyncProgress(0);
    setSyncStatus('idle');
    setDataLoaded(false);
    try {
      const res = await getMockDataGroups(selectedSemesterId);
      if (res.status === 200) {
        // Parse data từ format mới: data.groups.alreadyExist, data.groups.notExistYet và data.majorCategories
        const data = res.data || {};
        const groupsObj = data.groups || {};
        const alreadyExistGroups = Array.isArray(groupsObj.alreadyExist) ? groupsObj.alreadyExist : [];
        const notExistYetGroups = Array.isArray(groupsObj.notExistYet) ? groupsObj.notExistYet : [];
        
        const majorCats = data.majorCategories || { alreadyExist: [], notExistYet: [] };
        
        setGroupsData([]);
        setGroupsByStatus({ alreadyExist: alreadyExistGroups, notExistYet: notExistYetGroups });
        setMajorCategories(majorCats);
        setDataLoaded(true);
        
        if (alreadyExistGroups.length === 0 && notExistYetGroups.length === 0) {
          setMessage('No groups found for this semester');
        } else {
          setMessage(`Loaded ${alreadyExistGroups.length + notExistYetGroups.length} groups from FAP System (${alreadyExistGroups.length} existing, ${notExistYetGroups.length} new)`);
        }
        setPageOld(1);
        setPageNew(1);
        setSearchQueryOld('');
        setSearchQueryNew('');
      } else {
        setMessage(res.message || 'Error loading data');
        setGroupsData([]);
        setGroupsByStatus({ alreadyExist: [], notExistYet: [] });
        setMajorCategories({ alreadyExist: [], notExistYet: [] });
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Error loading data. Please try again.');
      setGroupsData([]);
      setGroupsByStatus({ alreadyExist: [], notExistYet: [] });
      setMajorCategories({ alreadyExist: [], notExistYet: [] });
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedSemesterId) {
      alert('Please select a semester first!');
      return;
    }

    const alreadyExistCount = groupsByStatus.alreadyExist.length;
    const notExistYetCount = groupsByStatus.notExistYet.length;
    const totalGroups = alreadyExistCount + notExistYetCount;

    if (totalGroups === 0) {
      alert('No data to sync!');
      return;
    }

    if (!window.confirm(`Are you sure you want to sync ${totalGroups} groups from FAP System?\n- ${alreadyExistCount} existing groups\n- ${notExistYetCount} new groups`)) {
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
      // Gửi dữ liệu với cấu trúc đúng: groups có alreadyExist và notExistYet
      const syncData = {
        semesterId: parseInt(selectedSemesterId),
        groups: {
          alreadyExist: groupsByStatus.alreadyExist,
          notExistYet: groupsByStatus.notExistYet
        },
        majorCategories: majorCategories
      };
      
      const res = await syncMockDataGroups(syncData, parseInt(selectedSemesterId));
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

  // Filter existing groups
  const filteredExistingGroups = React.useMemo(() => {
    if (!searchQueryOld.trim()) {
      return groupsByStatus.alreadyExist;
    }
    
    const query = searchQueryOld.toLowerCase().trim();
    return groupsByStatus.alreadyExist.filter(group => {
      if ((group.groupCode || '').toLowerCase().includes(query)) return true;
      if ((group.groupName || '').toLowerCase().includes(query)) return true;
      if ((group.profession || '').toLowerCase().includes(query)) return true;
      if ((group.description || '').toLowerCase().includes(query)) return true;
      return false;
    });
  }, [groupsByStatus.alreadyExist, searchQueryOld]);

  // Filter new groups
  const filteredNewGroups = React.useMemo(() => {
    if (!searchQueryNew.trim()) {
      return groupsByStatus.notExistYet;
    }
    
    const query = searchQueryNew.toLowerCase().trim();
    return groupsByStatus.notExistYet.filter(group => {
      if ((group.groupCode || '').toLowerCase().includes(query)) return true;
      if ((group.groupName || '').toLowerCase().includes(query)) return true;
      if ((group.profession || '').toLowerCase().includes(query)) return true;
      if ((group.description || '').toLowerCase().includes(query)) return true;
      return false;
    });
  }, [groupsByStatus.notExistYet, searchQueryNew]);

  // Paginate existing groups
  const paginatedExistingGroups = React.useMemo(() => {
    const startIndex = (pageOld - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredExistingGroups.slice(startIndex, endIndex);
  }, [filteredExistingGroups, pageOld, pageSize]);

  // Paginate new groups
  const paginatedNewGroups = React.useMemo(() => {
    const startIndex = (pageNew - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNewGroups.slice(startIndex, endIndex);
  }, [filteredNewGroups, pageNew, pageSize]);

  const totalPagesOld = Math.max(1, Math.ceil(filteredExistingGroups.length / pageSize));
  const totalPagesNew = Math.max(1, Math.ceil(filteredNewGroups.length / pageSize));

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setPageOld(1);
  }, [searchQueryOld]);

  React.useEffect(() => {
    setPageNew(1);
  }, [searchQueryNew]);

  // Handle jump to page
  const handleJumpToPageOld = () => {
    const pageNum = parseInt(jumpToPageOld);
    if (pageNum >= 1 && pageNum <= totalPagesOld) {
      setPageOld(pageNum);
      setJumpToPageOld('');
    }
  };

  const handleJumpToPageNew = () => {
    const pageNum = parseInt(jumpToPageNew);
    if (pageNum >= 1 && pageNum <= totalPagesNew) {
      setPageNew(pageNum);
      setJumpToPageNew('');
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

  // Semester options for select
  const semesterOptions = semesters.map(sem => ({
    value: sem.id,
    label: sem.name
  }));

  return (
    <div className={styles.container}>
      <h1>Sync Groups from FAP System</h1>
      
      {/* Semester Selection */}
      <div className={styles.semesterSelection}>
        <label className={styles.semesterLabel}>Select Semester:</label>
        <div className={styles.semesterSelectWrapper}>
          <Select
            value={selectedSemesterId}
            onChange={(e) => {
              setSelectedSemesterId(e.target.value);
              // Reset data when semester changes
              setGroupsByStatus({ alreadyExist: [], notExistYet: [] });
              setMajorCategories({ alreadyExist: [], notExistYet: [] });
              setMessage('');
              setDataLoaded(false);
            }}
            options={[
              { value: '', label: '-- Select a semester --' },
              ...semesterOptions
            ]}
            disabled={loadingSemesters}
          />
        </div>
      </div>
      
      <div className={styles.actions}>
        <Button
          onClick={handleLoadData}
          disabled={loading || !selectedSemesterId}
          variant="primary"
        >
          {loading ? 'Loading...' : 'Load Data from FAP System'}
        </Button>
        
        <Button
          onClick={handleSync}
          disabled={syncing || !selectedSemesterId || (groupsByStatus.alreadyExist.length === 0 && groupsByStatus.notExistYet.length === 0)}
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
      {dataLoaded && !loading && (
        <div className={styles.majorCategoriesSection}>
          <h2>Major Categories Information</h2>
          
          {/* New Major Categories */}
          <div className={styles.majorCategoryBox}>
            <h3>New Major Categories ({majorCategories.notExistYet?.length || 0})</h3>
            {majorCategories.notExistYet?.length > 0 ? (
              <div className={styles.majorList}>
                {majorCategories.notExistYet.map((major, index) => (
                  <span key={index} className={styles.majorTag}>
                    {major.code} - {major.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateBox}>
                <p>No new major categories</p>
              </div>
            )}
          </div>
          
          {/* Existing Major Categories */}
          <div className={styles.majorCategoryBox}>
            <h3>Existing Major Categories ({majorCategories.alreadyExist?.length || 0})</h3>
            {majorCategories.alreadyExist?.length > 0 ? (
              <div className={styles.majorList}>
                {majorCategories.alreadyExist.map((major, index) => (
                  <span key={index} className={styles.majorTag}>
                    {major.code} - {major.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateBox}>
                <p>No existing major categories</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show empty state messages when data is loaded but sections are empty */}
      {dataLoaded && !loading && (
        <>
          {/* New Groups Section */}
          <div className={styles.previewSection}>
            <div className={styles.sectionHeader}>
              <h2>New Groups ({groupsByStatus.notExistYet.length} groups)</h2>
              {groupsByStatus.notExistYet.length > 0 && (
                <div className={styles.pageSizeSelector}>
                  <label>Rows per page:</label>
                  <select 
                    value={pageSize} 
                    onChange={e => {
                      setPageNew(1);
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
              )}
            </div>
            
            {groupsByStatus.notExistYet.length > 0 ? (
              <>
                <div className={styles.searchBox}>
                  <Input
                    placeholder="Search..."
                    value={searchQueryNew}
                    onChange={(e) => setSearchQueryNew(e.target.value)}
                  />
                </div>
                <div className={styles.summaryInfo}>
                  <span className={styles.totalCount}>
                    Showing {paginatedNewGroups.length > 0 ? (pageNew - 1) * pageSize + 1 : 0} - {Math.min(pageNew * pageSize, filteredNewGroups.length)} of {filteredNewGroups.length.toLocaleString()} groups
                  </span>
                </div>
                <div className={styles.tableWrapper}>
                  <DataTable
                    columns={columns}
                    data={paginatedNewGroups}
                    loading={loading}
                    emptyMessage="No data found"
                    showIndex={true}
                    indexTitle="#"
                  />
                </div>

                {/* Pagination */}
                {totalPagesNew > 1 && (
                  <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageNew === 1} 
                        onClick={() => setPageNew(1)}
                        title="First page"
                      >
                        ««
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageNew === 1} 
                        onClick={() => setPageNew(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                    </div>
                    
                    <div className={styles.paginationCenter}>
                      <span className={styles.pageInfo}>
                        Page <strong>{pageNew}</strong> of <strong>{totalPagesNew}</strong>
                      </span>
                      <div className={styles.jumpToPage}>
                        <input
                          type="number"
                          min="1"
                          max={totalPagesNew}
                          placeholder="Go to"
                          value={jumpToPageNew}
                          onChange={e => setJumpToPageNew(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleJumpToPageNew()}
                          className={styles.jumpInput}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleJumpToPageNew}
                          disabled={!jumpToPageNew || parseInt(jumpToPageNew) < 1 || parseInt(jumpToPageNew) > totalPagesNew}
                        >
                          Go
                        </Button>
                      </div>
                    </div>

                    <div className={styles.paginationInfo}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageNew >= totalPagesNew} 
                        onClick={() => setPageNew(p => Math.min(totalPagesNew, p + 1))}
                      >
                        Next
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageNew >= totalPagesNew} 
                        onClick={() => setPageNew(totalPagesNew)}
                        title="Last page"
                      >
                        »»
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyStateBox}>
                <p>No new groups to sync for this semester</p>
              </div>
            )}
          </div>

          {/* Existing Groups Section */}
          <div className={styles.previewSection}>
            <div className={styles.sectionHeader}>
              <h2>Existing Groups ({groupsByStatus.alreadyExist.length} groups)</h2>
              {groupsByStatus.alreadyExist.length > 0 && (
                <div className={styles.pageSizeSelector}>
                  <label>Rows per page:</label>
                  <select 
                    value={pageSize} 
                    onChange={e => {
                      setPageOld(1);
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
              )}
            </div>
            
            {groupsByStatus.alreadyExist.length > 0 ? (
              <>
                <div className={styles.searchBox}>
                  <Input
                    placeholder="Search..."
                    value={searchQueryOld}
                    onChange={(e) => setSearchQueryOld(e.target.value)}
                  />
                </div>
                <div className={styles.summaryInfo}>
                  <span className={styles.totalCount}>
                    Showing {paginatedExistingGroups.length > 0 ? (pageOld - 1) * pageSize + 1 : 0} - {Math.min(pageOld * pageSize, filteredExistingGroups.length)} of {filteredExistingGroups.length.toLocaleString()} groups
                  </span>
                </div>
                <div className={styles.tableWrapper}>
                  <DataTable
                    columns={columns}
                    data={paginatedExistingGroups}
                    loading={loading}
                    emptyMessage="No data found"
                    showIndex={true}
                    indexTitle="#"
                  />
                </div>

                {/* Pagination */}
                {totalPagesOld > 1 && (
                  <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageOld === 1} 
                        onClick={() => setPageOld(1)}
                        title="First page"
                      >
                        ««
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageOld === 1} 
                        onClick={() => setPageOld(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                    </div>
                    
                    <div className={styles.paginationCenter}>
                      <span className={styles.pageInfo}>
                        Page <strong>{pageOld}</strong> of <strong>{totalPagesOld}</strong>
                      </span>
                      <div className={styles.jumpToPage}>
                        <input
                          type="number"
                          min="1"
                          max={totalPagesOld}
                          placeholder="Go to"
                          value={jumpToPageOld}
                          onChange={e => setJumpToPageOld(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleJumpToPageOld()}
                          className={styles.jumpInput}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleJumpToPageOld}
                          disabled={!jumpToPageOld || parseInt(jumpToPageOld) < 1 || parseInt(jumpToPageOld) > totalPagesOld}
                        >
                          Go
                        </Button>
                      </div>
                    </div>

                    <div className={styles.paginationInfo}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageOld >= totalPagesOld} 
                        onClick={() => setPageOld(p => Math.min(totalPagesOld, p + 1))}
                      >
                        Next
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={pageOld >= totalPagesOld} 
                        onClick={() => setPageOld(totalPagesOld)}
                        title="Last page"
                      >
                        »»
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyStateBox}>
                <p>No existing groups found for this semester</p>
              </div>
            )}
          </div>
        </>
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
                              {member.roleInGroup || 'Member'}
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

      {!loading && !dataLoaded && !selectedSemesterId && (
        <div className={styles.emptyState}>
          <p>Please select a semester and click "Load Data from FAP System" to load data</p>
        </div>
      )}
      
      {!loading && !dataLoaded && selectedSemesterId && (
        <div className={styles.emptyState}>
          <p>Click "Load Data from FAP System" to load data for the selected semester</p>
        </div>
      )}
    </div>
  );
}

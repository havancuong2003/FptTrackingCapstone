import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import axiosClient from '../../../utils/axiosClient';

export default function GroupsList({ isExpired = false }) {
    const navigate = useNavigate();
    const [groups, setGroups] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let isMounted = true;
        let abortController = new AbortController();
        
        const fetchGroups = async () => {
            try {
                setLoading(true);
                
                // Call API based on isExpired flag
                const apiEndpoint = isExpired ? '/Mentor/expired-groups' : '/Mentor/getGroups';
                const groupsResponse = await axiosClient.get(apiEndpoint, {
                    signal: abortController.signal
                });
                
                // Chỉ update state nếu component vẫn còn mounted
                if (!isMounted) return;
                
                if (groupsResponse.data.status === 200) {
                    const groupList = groupsResponse.data.data || [];
                    
                    // Format groups data - API returns: {id, groupCode, status, name, isExpired, students: [...]}
                    // API đã trả về isExpired trong data, chỉ cần filter và format
                    const filteredGroups = groupList.filter(group => {
                        // Nếu API có isExpired thì dùng, không thì fallback về check status
                        const groupIsExpired = group.isExpired !== undefined 
                            ? group.isExpired 
                            : (group.status === 'inactive');
                        return isExpired === groupIsExpired;
                    });
                    
                    const formattedGroups = filteredGroups.map(group => {
                        // Nếu API có isExpired thì dùng, không thì fallback về check status
                        const groupIsExpired = group.isExpired !== undefined 
                            ? group.isExpired 
                            : (group.status === 'inactive');
                        
                        return {
                            id: group.id,
                            groupCode: group.groupCode || '',
                            projectName: group.name || '',
                            isExpired: groupIsExpired,
                            students: group.students || []
                        };
                    });
                    
                    if (isMounted) {
                        setGroups(formattedGroups);
                    }
                } else {
                    console.error('Error fetching groups:', groupsResponse.data.message);
                    if (isMounted) {
                        setGroups([]);
                    }
                }
            } catch (error) {
                // Ignore abort errors
                if (error.name === 'AbortError' || error.name === 'CanceledError') {
                    return;
                }
                console.error('Error fetching groups:', error);
                if (isMounted) {
                    setGroups([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchGroups();
        
        // Cleanup function
        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [isExpired]);

    const handleViewDetail = (groupId, groupIsExpired) => {
        navigate(`/supervisor/groups/${groupId}`, { state: { isExpired: groupIsExpired } });
    };

    const handleViewTasks = (groupId, groupIsExpired) => {
        navigate(`/supervisor/tasks?groupId=${groupId}`, { state: { isExpired: groupIsExpired } });
    };

    const handleViewMilestones = (groupId, groupIsExpired) => {
        navigate(`/supervisor/tracking?groupId=${groupId}`, { state: { isExpired: groupIsExpired } });
    };

    const getExpireStatus = (groupIsExpired) => {
        // isExpired: false = còn hạn, true = hết hạn
        if (!groupIsExpired) {
            return { text: 'Còn hạn', color: '#059669' };
        }
        return { text: 'Hết hạn', color: '#dc2626' };
    };

    const columns = [
        {
            key: 'projectName',
            title: 'Project Name',
            render: (group) => (
                <div className={styles.projectName}>{group.projectName || 'N/A'}</div>
            )
        },
        {
            key: 'groupCode',
            title: 'Group Code',
            render: (group) => group.groupCode || 'N/A'
        },
        {
            key: 'expire',
            title: 'Expire',
            render: (group) => {
                const expireInfo = getExpireStatus(group.isExpired);
                return (
                    <span style={{ color: expireInfo.color, fontWeight: 600 }}>
                        {expireInfo.text}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (group) => (
                <div className={styles.actionButtons}>
                    <button 
                        className={styles.actionBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(group.id, group.isExpired);
                        }}
                    >
                        Detail
                    </button>
                    <button 
                        className={styles.actionBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewTasks(group.id, group.isExpired);
                        }}
                    >
                        Tasks
                    </button>
                    <button 
                        className={styles.actionBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewMilestones(group.id, group.isExpired);
                        }}
                    >
                        Milestone
                    </button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className={styles.loading}>
                <div>Loading groups...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>{isExpired ? 'Groups (Expired)' : 'Groups (Active)'}</h1>
            <p className={styles.subtitle}>
                {isExpired 
                    ? 'View expired groups (read-only mode).'
                    : 'Manage and track the active groups you are supervising.'
                }
            </p>
            
            <div className={styles.groupsList}>
                <DataTable
                    columns={columns}
                    data={groups}
                    loading={loading}
                    emptyMessage={
                        isExpired 
                            ? "You have no expired groups"
                            : "You have not been assigned to any groups yet"
                    }
                    showIndex={true}
                    indexTitle="No"
                />
            </div>
        </div>
    );
}


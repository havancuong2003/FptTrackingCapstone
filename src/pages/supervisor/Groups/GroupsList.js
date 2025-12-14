import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from '../../../auth/auth';
import Select from '../../../components/Select/Select';

export default function GroupsList({ isExpired = false }) {
    const navigate = useNavigate();
    const [groups, setGroups] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [semesters, setSemesters] = React.useState([]);
    const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);

    React.useEffect(() => {
        // Get semesters and set default to current semester
        const uniqueSemesters = getUniqueSemesters();
        setSemesters(uniqueSemesters);
        
        const currentSemesterId = getCurrentSemesterId();
        if (currentSemesterId) {
            setSelectedSemesterId(currentSemesterId);
        } else if (uniqueSemesters.length > 0) {
            // Fallback to first semester if no current semester
            setSelectedSemesterId(uniqueSemesters[0].id);
        }
    }, []);

    React.useEffect(() => {
        if (selectedSemesterId === null) return;
        
        setLoading(true);
        try {
            // Get groups from localStorage based on semester and expired status
            const filteredGroups = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
            
            // Format groups data
            const formattedGroups = filteredGroups.map(group => ({
                id: group.id,
                groupCode: group.code || group.groupCode || '',
                projectName: group.name || '',
                isExpired: group.isExpired || false,
                semesterId: group.semesterId,
                semesterName: group.sesesterName || group.semesterName || ''
            }));
            
            setGroups(formattedGroups);
        } catch (error) {
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, [selectedSemesterId, isExpired]);

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
        // isExpired: false = active, true = expired
        if (!groupIsExpired) {
            return { text: 'Active', color: '#059669' };
        }
        return { text: 'Expired', color: '#dc2626' };
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
            title: 'Status',
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

    if (loading && groups.length === 0) {
        return (
            <div className={styles.loading}>
                <div>Loading groups...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h1>{isExpired ? 'Groups (Expired)' : 'Groups (Active)'}</h1>
                    <p className={styles.subtitle}>
                        {isExpired 
                            ? 'View expired groups (read-only mode).'
                            : 'Manage and track the active groups you are supervising.'
                        }
                    </p>
                </div>
                {semesters.length > 0 && (
                    <div style={{ minWidth: 200 }}>
                        <Select
                            value={selectedSemesterId?.toString() || ''}
                            onChange={(e) => setSelectedSemesterId(parseInt(e.target.value))}
                            options={semesters.map(s => ({ value: s.id.toString(), label: s.name }))}
                            placeholder="Select Semester"
                        />
                    </div>
                )}
            </div>
            
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

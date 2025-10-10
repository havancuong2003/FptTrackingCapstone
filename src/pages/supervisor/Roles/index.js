import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function SupervisorRoles() {
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [roleModal, setRoleModal] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState(null);

  React.useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "groupId": "GR01",
              "groupName": "Team Alpha",
              "members": [
                {
                  "id": "SE00001",
                  "name": "Nguyen Van A",
                  "currentRole": "Leader",
                  "email": "nguyenvana@student.fpt.edu.vn",
                  "roleHistory": [
                    {
                      "role": "Member",
                      "assignedDate": "2025-10-01T00:00:00Z",
                      "assignedBy": "SUPERVISOR001"
                    },
                    {
                      "role": "Leader",
                      "assignedDate": "2025-10-10T00:00:00Z",
                      "assignedBy": "SUPERVISOR001"
                    }
                  ]
                },
                {
                  "id": "SE00002",
                  "name": "Nguyen Van B",
                  "currentRole": "Member",
                  "email": "nguyenvanb@student.fpt.edu.vn",
                  "roleHistory": [
                    {
                      "role": "Member",
                      "assignedDate": "2025-10-01T00:00:00Z",
                      "assignedBy": "SUPERVISOR001"
                    }
                  ]
                },
                {
                  "id": "SE00003",
                  "name": "Nguyen Van C",
                  "currentRole": "Secretary",
                  "email": "nguyenvanc@student.fpt.edu.vn",
                  "roleHistory": [
                    {
                      "role": "Member",
                      "assignedDate": "2025-10-01T00:00:00Z",
                      "assignedBy": "SUPERVISOR001"
                    },
                    {
                      "role": "Secretary",
                      "assignedDate": "2025-10-15T00:00:00Z",
                      "assignedBy": "SUPERVISOR001"
                    }
                  ]
                }
              ]
            }
          ]
        };
        
        setGroups(mockData.data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const getRoleInfo = (role) => {
    switch (role) {
      case 'Leader':
        return { color: '#dc2626', text: 'Leader', icon: '👑' };
      case 'Secretary':
        return { color: '#059669', text: 'Secretary', icon: '📝' };
      case 'Member':
        return { color: '#3b82f6', text: 'Member', icon: '👤' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '❓' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openRoleModal = (group, member) => {
    setSelectedGroup(group);
    setSelectedMember(member);
    setRoleModal(true);
  };

  const changeRole = (newRole) => {
    if (!selectedMember || !selectedGroup) return;
    
    // Update the role in the groups state
    setGroups(prev => prev.map(group => {
      if (group.groupId === selectedGroup.groupId) {
        return {
          ...group,
          members: group.members.map(member => {
            if (member.id === selectedMember.id) {
              return {
                ...member,
                currentRole: newRole,
                roleHistory: [
                  ...member.roleHistory,
                  {
                    role: newRole,
                    assignedDate: new Date().toISOString(),
                    assignedBy: 'SUPERVISOR001'
                  }
                ]
              };
            }
            return member;
          })
        };
      }
      return group;
    }));
    
    alert(`Role changed to ${newRole}!`);
    setRoleModal(false);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading role management...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Role Management</h1>
      <p className={styles.subtitle}>
        Assign and manage roles for students in your supervised groups.
      </p>
      
      <div className={styles.groupsList}>
        {groups.map((group) => (
          <div key={group.groupId} className={styles.groupCard}>
            <div className={styles.groupHeader}>
              <h3>{group.groupName} ({group.groupId})</h3>
              <span className={styles.memberCount}>
                {group.members.length} members
              </span>
            </div>
            
            <div className={styles.membersList}>
              {group.members.map((member) => {
                const roleInfo = getRoleInfo(member.currentRole);
                return (
                  <div key={member.id} className={styles.memberCard}>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>
                        <h4>{member.name}</h4>
                        <span className={styles.memberEmail}>{member.email}</span>
                      </div>
                      <div className={styles.memberRole}>
                        <span 
                          className={styles.roleIcon}
                          style={{ color: roleInfo.color }}
                        >
                          {roleInfo.icon}
                        </span>
                        <span 
                          className={styles.roleText}
                          style={{ color: roleInfo.color }}
                        >
                          {roleInfo.text}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.roleHistory}>
                      <h5>Role History</h5>
                      <div className={styles.historyList}>
                        {member.roleHistory.map((history, index) => (
                          <div key={index} className={styles.historyItem}>
                            <span className={styles.historyRole}>{history.role}</span>
                            <span className={styles.historyDate}>
                              {formatDate(history.assignedDate)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={styles.memberActions}>
                      <Button 
                        size="sm"
                        onClick={() => openRoleModal(group, member)}
                      >
                        Change Role
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal open={roleModal} onClose={() => setRoleModal(false)}>
        <div className={styles.roleModal}>
          <h2>Change Role</h2>
          <p>Select a new role for <strong>{selectedMember?.name}</strong></p>
          
          <div className={styles.roleOptions}>
            <div className={styles.roleOption}>
              <input
                type="radio"
                id="member"
                name="role"
                value="Member"
                defaultChecked={selectedMember?.currentRole === 'Member'}
              />
              <label htmlFor="member" className={styles.roleLabel}>
                <span className={styles.roleIcon}>👤</span>
                <div>
                  <strong>Member</strong>
                  <p>Regular team member with basic permissions</p>
                </div>
              </label>
            </div>
            
            <div className={styles.roleOption}>
              <input
                type="radio"
                id="leader"
                name="role"
                value="Leader"
                defaultChecked={selectedMember?.currentRole === 'Leader'}
              />
              <label htmlFor="leader" className={styles.roleLabel}>
                <span className={styles.roleIcon}>👑</span>
                <div>
                  <strong>Leader</strong>
                  <p>Team leader with full management permissions</p>
                </div>
              </label>
            </div>
            
            <div className={styles.roleOption}>
              <input
                type="radio"
                id="secretary"
                name="role"
                value="Secretary"
                defaultChecked={selectedMember?.currentRole === 'Secretary'}
              />
              <label htmlFor="secretary" className={styles.roleLabel}>
                <span className={styles.roleIcon}>📝</span>
                <div>
                  <strong>Secretary</strong>
                  <p>Can create meeting minutes and manage documentation</p>
                </div>
              </label>
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              const selectedRole = document.querySelector('input[name="role"]:checked')?.value;
              if (selectedRole) changeRole(selectedRole);
            }}>
              Change Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

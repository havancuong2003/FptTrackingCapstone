import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function SupervisorVotes() {
  const [votes, setVotes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [createModal, setCreateModal] = React.useState(false);
  const [newVote, setNewVote] = React.useState({
    title: '',
    description: '',
    timeSlots: []
  });

  React.useEffect(() => {
    const fetchVotes = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": 1,
              "title": "Weekly Meeting Schedule - Week 3",
              "description": "Vote for the best time slot for our weekly meeting",
              "createdBy": "SUPERVISOR001",
              "createdDate": "2025-10-20T09:00:00Z",
              "deadline": "2025-10-22T23:59:00Z",
              "status": "active",
              "timeSlots": [
                {
                  "id": 1,
                  "datetime": "2025-10-25T14:00:00Z",
                  "duration": 60,
                  "votes": ["SE00001", "SE00002", "SE00003"],
                  "voteCount": 3
                },
                {
                  "id": 2,
                  "datetime": "2025-10-25T16:00:00Z",
                  "duration": 60,
                  "votes": ["SE00001", "SE00003"],
                  "voteCount": 2
                },
                {
                  "id": 3,
                  "datetime": "2025-10-26T10:00:00Z",
                  "duration": 60,
                  "votes": ["SE00002"],
                  "voteCount": 1
                }
              ],
              "selectedSlot": null
            }
          ]
        };
        
        setVotes(mockData.data);
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { color: '#059669', text: 'Active', icon: '🗳️' };
      case 'completed':
        return { color: '#3b82f6', text: 'Completed', icon: '✅' };
      case 'expired':
        return { color: '#dc2626', text: 'Expired', icon: '⏰' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '❓' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openCreateModal = () => {
    setCreateModal(true);
  };

  const createVote = () => {
    if (!newVote.title || !newVote.description) {
      alert('Please fill in all required fields');
      return;
    }

    const vote = {
      id: Date.now(),
      title: newVote.title,
      description: newVote.description,
      createdBy: 'SUPERVISOR001',
      createdDate: new Date().toISOString(),
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      status: 'active',
      timeSlots: [
        {
          id: 1,
          datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          votes: [],
          voteCount: 0
        },
        {
          id: 2,
          datetime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          votes: [],
          voteCount: 0
        }
      ],
      selectedSlot: null
    };

    setVotes(prev => [vote, ...prev]);
    setCreateModal(false);
    setNewVote({
      title: '',
      description: '',
      timeSlots: []
    });
    alert('Vote created successfully!');
  };

  const selectSlot = (voteId, slotId) => {
    setVotes(prev => prev.map(vote => {
      if (vote.id === voteId) {
        return {
          ...vote,
          selectedSlot: slotId,
          status: 'completed'
        };
      }
      return vote;
    }));
    alert('Time slot selected!');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading votes...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Vote Scheduler</h1>
        <Button onClick={openCreateModal}>
          Create New Vote
        </Button>
      </div>
      
      <p className={styles.subtitle}>
        Create polls for meeting times and let students vote for their preferred slots.
      </p>
      
      <div className={styles.votesList}>
        {votes.map((vote) => {
          const statusInfo = getStatusInfo(vote.status);
          const totalVotes = vote.timeSlots.reduce((sum, slot) => sum + slot.voteCount, 0);
          const mostVoted = vote.timeSlots.reduce((max, slot) => 
            slot.voteCount > max.voteCount ? slot : max
          );
          
          return (
            <div key={vote.id} className={styles.voteCard}>
              <div className={styles.voteHeader}>
                <div className={styles.voteInfo}>
                  <h3>{vote.title}</h3>
                  <p className={styles.voteDescription}>{vote.description}</p>
                  <div className={styles.voteMeta}>
                    <span>Created: {formatDate(vote.createdDate)}</span>
                    <span>Deadline: {formatDate(vote.deadline)}</span>
                    <span>Total votes: {totalVotes}</span>
                  </div>
                </div>
                <div className={styles.voteStatus}>
                  <span 
                    className={styles.statusIcon}
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.icon}
                  </span>
                  <span 
                    className={styles.statusText}
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              
              <div className={styles.timeSlots}>
                <h4>Time Slots</h4>
                <div className={styles.slotsList}>
                  {vote.timeSlots.map((slot) => (
                    <div key={slot.id} className={styles.slotCard}>
                      <div className={styles.slotInfo}>
                        <div className={styles.slotTime}>
                          <strong>{formatTime(slot.datetime)}</strong>
                          <span>{formatDate(slot.datetime)}</span>
                        </div>
                        <div className={styles.slotDuration}>
                          {slot.duration} minutes
                        </div>
                      </div>
                      
                      <div className={styles.slotVotes}>
                        <div className={styles.voteCount}>
                          {slot.voteCount} votes
                        </div>
                        <div className={styles.voteBar}>
                          <div 
                            className={styles.voteProgress}
                            style={{ 
                              width: `${totalVotes > 0 ? (slot.voteCount / totalVotes) * 100 : 0}%`,
                              backgroundColor: slot.voteCount === mostVoted.voteCount ? '#059669' : '#3b82f6'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.slotActions}>
                        {vote.status === 'active' && (
                          <Button 
                            size="sm"
                            onClick={() => selectSlot(vote.id, slot.id)}
                          >
                            Select This Slot
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {vote.status === 'active' && (
                <div className={styles.voteActions}>
                  <Button variant="secondary">
                    View Results
                  </Button>
                  <Button variant="secondary">
                    Edit Vote
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)}>
        <div className={styles.createModal}>
          <h2>Create New Vote</h2>
          
          <div className={styles.formGroup}>
            <label>Vote Title</label>
            <input
              type="text"
              value={newVote.title}
              onChange={(e) => setNewVote({...newVote, title: e.target.value})}
              placeholder="Enter vote title"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={newVote.description}
              onChange={(e) => setNewVote({...newVote, description: e.target.value})}
              placeholder="Describe the purpose of this vote"
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Time Slots</label>
            <div className={styles.timeSlotsInput}>
              <p>Add time slots for students to vote on:</p>
              <div className={styles.slotInput}>
                <input
                  type="datetime-local"
                  className={styles.input}
                  placeholder="Select date and time"
                />
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  className={styles.input}
                  style={{ width: '120px' }}
                />
                <Button size="sm" variant="secondary">
                  Add Slot
                </Button>
              </div>
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createVote}>
              Create Vote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

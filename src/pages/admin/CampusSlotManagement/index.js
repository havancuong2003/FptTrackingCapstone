import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { getAllCampuses, getCampusById, upsertSlots } from '../../../api/campus';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';

export default function CampusSlotManagement() {
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [slots, setSlots] = useState([]);
  const [originalSlots, setOriginalSlots] = useState([]); // Lưu slots gốc từ API
  const [slotsToDelete, setSlotsToDelete] = useState([]); // Track các slot đã đánh dấu xóa
  const [editedSlots, setEditedSlots] = useState({}); // Track các slot đã chỉnh sửa {slotId: slotData}
  const [newSlots, setNewSlots] = useState([]); // Track các slot mới thêm
  const [editingSlotId, setEditingSlotId] = useState(null); // Track slot đang được edit (inline)
  const [editingValues, setEditingValues] = useState({}); // Track giá trị đang edit {slotId: {startAt, endAt}}
  const [hasChanges, setHasChanges] = useState(false); // Track xem có thay đổi chưa

  // Load all campuses
  const loadCampuses = async () => {
    setLoading(true);
    try {
      const response = await getAllCampuses();
      if (response.status === 200 && response.data) {
        setCampuses(response.data);
      }
    } catch (error) {
      console.error('Error loading campuses:', error);
      alert('Unable to load campus list');
    } finally {
      setLoading(false);
    }
  };

  // Convert time format from API (HH:MM AM/PM) to HH:MM for input type="time"
  const convertTimeToInputFormat = (timeStr) => {
    if (!timeStr) return '';
    // Nếu đã là format HH:MM (24h) thì giữ nguyên
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    // Convert từ HH:MM AM/PM sang HH:MM
    const cleaned = timeStr.replace(/[AP]M/i, '').trim();
    const [hours, minutes] = cleaned.split(':').map(Number);
    let hour24 = hours || 0;
    
    if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
      hour24 = hours + 12;
    }
    if (timeStr.toUpperCase().includes('AM') && hours === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
  };

  // Load slots for selected campus
  const loadCampusSlots = async (campusId) => {
    if (!campusId) return;
    
    setLoading(true);
    try {
      const response = await getCampusById(campusId);
      if (response.status === 200 && response.data) {
        setSelectedCampus(response.data);
        const loadedSlots = response.data.slots || [];
        setSlots(loadedSlots);
        setOriginalSlots(loadedSlots);
        // Reset các thay đổi khi load lại
        setSlotsToDelete([]);
        setEditedSlots({});
        setNewSlots([]);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading campus slots:', error);
      alert('Unable to load slot list');
    } finally {
      setLoading(false);
    }
  };

  // Handle campus selection
  const handleCampusSelect = (campusId) => {
    setSelectedCampusId(campusId);
    if (campusId) {
      loadCampusSlots(campusId);
    } else {
      setSelectedCampus(null);
      setSlots([]);
    }
  };

  // Open slot modal for adding
  const handleAddSlot = () => {
    const tempId = `new-${Date.now()}`;
    const newSlot = {
      id: tempId,
      nameSlot: '',
      startAt: '',
      endAt: ''
    };
    setNewSlots(prev => [...prev, newSlot]);
    setSlots(prev => [...prev, newSlot]);
    setEditingSlotId(tempId);
    setEditingValues({
      [tempId]: {
        nameSlot: '',
        startAt: '',
        endAt: ''
      }
    });
    setHasChanges(true);
  };

  // Start editing slot inline
  const handleEditSlot = (slot) => {
    // If slot is marked for delete, don't allow editing
    if (slotsToDelete.includes(slot.id)) {
      alert('This slot is marked for deletion. Please undo delete before editing.');
      return;
    }
    
    setEditingSlotId(slot.id);
    // Lấy dữ liệu từ editedSlots nếu có, không thì dùng slot hiện tại
    const slotData = editedSlots[slot.id] || slot;
    setEditingValues({
      [slot.id]: {
        nameSlot: slotData.nameSlot || '',
        startAt: convertTimeToInputFormat(slotData.startAt || ''),
        endAt: convertTimeToInputFormat(slotData.endAt || '')
      }
    });
  };

  // Cancel editing
  const handleCancelEdit = (slotId) => {
    setEditingSlotId(null);
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[slotId];
      return newValues;
    });
    
    // Nếu là slot mới chưa lưu, xóa luôn
    if (slotId && slotId.toString().startsWith('new-')) {
      setNewSlots(prev => prev.filter(s => s.id !== slotId));
      setSlots(prev => prev.filter(s => s.id !== slotId));
      setHasChanges(false);
    }
  };

  // Update editing values
  const handleEditValueChange = (slotId, field, value) => {
    setEditingValues(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [field]: value
      }
    }));
  };

  // Parse time to minutes for comparison (format HH:MM)
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    // Format từ input type="time" là HH:MM (24h format)
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  // Format time from HH:MM to display format (HH:MM AM/PM)
  const formatTimeForDisplay = (timeStr) => {
    if (!timeStr) return '';
    // Nếu đã có AM/PM thì giữ nguyên
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    // Format từ HH:MM sang HH:MM AM/PM
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  // Save single slot changes (not saved to database yet)
  const handleSaveSlot = (slot) => {
    const editingValue = editingValues[slot.id];
    if (!editingValue || !editingValue.nameSlot || !editingValue.startAt || !editingValue.endAt) {
      alert('Please fill in all information');
      return;
    }

    // Validate: startAt must be before endAt
    const startMinutes = parseTimeToMinutes(editingValue.startAt);
    const endMinutes = parseTimeToMinutes(editingValue.endAt);
    
    if (startMinutes >= endMinutes) {
      alert('Start time must be before end time');
      return;
    }

    const slotData = {
      ...slot,
      nameSlot: editingValue.nameSlot,
      startAt: editingValue.startAt,
      endAt: editingValue.endAt
    };

    if (slot.id.toString().startsWith('new-')) {
      // Slot mới - cập nhật trong newSlots
      setNewSlots(prev => prev.map(s => s.id === slot.id ? slotData : s));
      setSlots(prev => prev.map(s => s.id === slot.id ? slotData : s));
    } else {
      // Slot cũ - lưu vào editedSlots
      setEditedSlots(prev => ({
        ...prev,
        [slot.id]: slotData
      }));
      setSlots(prev => prev.map(s => s.id === slot.id ? slotData : s));
    }

    setEditingSlotId(null);
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[slot.id];
      return newValues;
    });
    setHasChanges(true);
  };


  // Save all changes to database
  const handleSaveAllChanges = async () => {
    if (!selectedCampusId) {
      alert('Please select a campus first');
      return;
    }

    if (!hasChanges) {
      alert('No changes to save');
      return;
    }

    setLoading(true);
    try {
      // Prepare slots to send: original slots (trừ những cái bị xóa) + edited slots + new slots
      const slotsToSend = [];
      
      // Thêm các slot gốc (trừ những cái bị xóa và những cái đã được sửa)
      originalSlots.forEach(slot => {
        if (!slotsToDelete.includes(slot.id) && !editedSlots[slot.id]) {
          slotsToSend.push({
            nameSlot: slot.nameSlot,
            startAt: slot.startAt, // Giữ nguyên format từ API
            endAt: slot.endAt // Giữ nguyên format từ API
          });
        }
      });
      
      // Thêm các slot đã được sửa
      Object.values(editedSlots).forEach(slot => {
        if (!slotsToDelete.includes(slot.id)) {
          slotsToSend.push({
            nameSlot: slot.nameSlot,
            startAt: formatTimeForDisplay(slot.startAt),
            endAt: formatTimeForDisplay(slot.endAt)
          });
        }
      });
      
      // Thêm các slot mới
      newSlots.forEach(slot => {
        slotsToSend.push({
          nameSlot: slot.nameSlot,
          startAt: formatTimeForDisplay(slot.startAt),
          endAt: formatTimeForDisplay(slot.endAt)
        });
      });

      const response = await upsertSlots(selectedCampusId, slotsToSend);
      
      if (response.status === 200) {
        alert('Changes saved successfully!');
        // Reload slots
        await loadCampusSlots(selectedCampusId);
      } else {
        alert('Error occurred while saving: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error occurred while saving changes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete slot (only mark, not actually delete)
  const handleDeleteSlot = (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    // Mark slot for deletion
    setSlotsToDelete(prev => [...prev, slotId]);
    setHasChanges(true);
  };

  // Undo delete (hủy xóa)
  const handleUndoDelete = (slotId) => {
    setSlotsToDelete(prev => prev.filter(id => id !== slotId));
    setHasChanges(true);
  };

  useEffect(() => {
    loadCampuses();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Campus & Slot Management</h1>
        <p>Manage campuses and time slots for each campus</p>
      </div>

      <div className={styles.content}>
        {/* Campus Selection */}
        <div className={styles.section}>
          <h2>Select Campus</h2>
          <div className={styles.campusSelector}>
            <select
              value={selectedCampusId}
              onChange={(e) => handleCampusSelect(e.target.value)}
              className={styles.campusSelect}
              disabled={loading}
            >
              <option value="">-- Select Campus --</option>
              {campuses.map(campus => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Slots Management */}
        {selectedCampus && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Slot Management - {selectedCampus.name}</h2>
              <div className={styles.headerActions}>
                {hasChanges && (
                  <Button
                    onClick={handleSaveAllChanges}
                    className={styles.saveAllButton}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
                <Button
                  onClick={handleAddSlot}
                  className={styles.addButton}
                >
                  + Add Slot
                </Button>
              </div>
            </div>

            <DataTable
              columns={[
                {
                  key: 'nameSlot',
                  title: 'Slot Name',
                  render: (slot) => {
                    const isEditing = editingSlotId === slot.id;
                    const editingValue = editingValues[slot.id] || {};
                    const isMarkedForDelete = slotsToDelete.includes(slot.id);
                    const isEdited = editedSlots[slot.id];
                    const isNew = slot.id && slot.id.toString().startsWith('new-');
                    
                    return (
                      <div className={styles.slotNameCell}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingValue.nameSlot || ''}
                            onChange={(e) => handleEditValueChange(slot.id, 'nameSlot', e.target.value)}
                            placeholder="Slot name"
                            className={styles.nameInput}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className={styles.slotNameContent}>
                            <span className={styles.slotName}>{slot.nameSlot}</span>
                            <div className={styles.badges}>
                              {isMarkedForDelete && (
                                <span className={styles.deleteBadge}>Marked for Delete</span>
                              )}
                              {isEdited && !isMarkedForDelete && (
                                <span className={styles.editedBadge}>Edited</span>
                              )}
                              {isNew && !isMarkedForDelete && (
                                <span className={styles.newBadge}>New</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                },
                {
                  key: 'startAt',
                  title: 'Start Time',
                  render: (slot) => {
                    const isEditing = editingSlotId === slot.id;
                    const editingValue = editingValues[slot.id] || {};
                    
                    return (
                      <div className={styles.timeCell}>
                        {isEditing ? (
                          <input
                            type="time"
                            value={editingValue.startAt || ''}
                            onChange={(e) => handleEditValueChange(slot.id, 'startAt', e.target.value)}
                            className={styles.timeInput}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={styles.timeValue}>{formatTimeForDisplay(slot.startAt)}</span>
                        )}
                      </div>
                    );
                  }
                },
                {
                  key: 'endAt',
                  title: 'End Time',
                  render: (slot) => {
                    const isEditing = editingSlotId === slot.id;
                    const editingValue = editingValues[slot.id] || {};
                    
                    return (
                      <div className={styles.timeCell}>
                        {isEditing ? (
                          <input
                            type="time"
                            value={editingValue.endAt || ''}
                            onChange={(e) => handleEditValueChange(slot.id, 'endAt', e.target.value)}
                            className={styles.timeInput}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={styles.timeValue}>{formatTimeForDisplay(slot.endAt)}</span>
                        )}
                      </div>
                    );
                  }
                },
                {
                  key: 'actions',
                  title: 'Actions',
                  render: (slot) => {
                    const isMarkedForDelete = slotsToDelete.includes(slot.id);
                    const isEditing = editingSlotId === slot.id;
                    
                    return (
                      <div className={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                        {isMarkedForDelete ? (
                          <button
                            type="button"
                            onClick={() => handleUndoDelete(slot.id)}
                            className={styles.undoButton}
                            title="Undo Delete"
                          >
                            Undo Delete
                          </button>
                        ) : isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveSlot(slot)}
                              className={styles.saveButton}
                              title="Save"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelEdit(slot.id)}
                              className={styles.cancelEditButton}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditSlot(slot)}
                              className={styles.editButton}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className={styles.deleteButton}
                              title="Delete"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    );
                  }
                }
              ]}
              data={slots}
              loading={loading && slots.length === 0}
              emptyMessage="No slots found. Please add a new slot."
              showIndex={true}
              indexTitle="No"
            />
          </div>
        )}
      </div>

    </div>
  );
}


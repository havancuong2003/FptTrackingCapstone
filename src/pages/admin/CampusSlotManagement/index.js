import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { getAllCampuses, getCampusById, upsertSlots, softDeleteSlot } from '../../../api/campus';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';

export default function CampusSlotManagement() {
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [slots, setSlots] = useState([]);
  const [originalSlots, setOriginalSlots] = useState([]); // Lưu slots gốc từ API (chỉ active slots)
  const [newSlots, setNewSlots] = useState([]); // Track các slot mới thêm
  const [editingSlotId, setEditingSlotId] = useState(null); // Track slot mới đang được nhập
  const [editingValues, setEditingValues] = useState({}); // Track giá trị đang nhập {slotId: {nameSlot, startAt, endAt}}
  const [validationErrors, setValidationErrors] = useState({}); // Track lỗi validation {slotId: {nameError, timeError}}
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
        const loadedSlots = (response.data.slots || []).filter(slot => slot.isActive !== false);
        setSlots(loadedSlots);
        setOriginalSlots(loadedSlots);
        // Reset các thay đổi khi load lại
        setNewSlots([]);
        setEditingSlotId(null);
        setEditingValues({});
        setValidationErrors({});
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

  // Add new slot row
  const handleAddSlot = () => {
    const tempId = `new-${Date.now()}`;
    const newSlot = {
      id: tempId,
      nameSlot: '',
      startAt: '',
      endAt: '',
      isNew: true
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
    setValidationErrors({
      [tempId]: {
        nameError: '',
        timeError: ''
      }
    });
    setHasChanges(true);
  };

  // Cancel adding new slot
  const handleCancelAdd = (slotId) => {
    setEditingSlotId(null);
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[slotId];
      return newValues;
    });
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[slotId];
      return newErrors;
    });
    
    // Xóa slot mới chưa lưu
    if (slotId && slotId.toString().startsWith('new-')) {
      setNewSlots(prev => prev.filter(s => s.id !== slotId));
      setSlots(prev => prev.filter(s => s.id !== slotId));
      // Kiểm tra xem còn slot mới nào không
      const remainingNewSlots = newSlots.filter(s => s.id !== slotId);
      setHasChanges(remainingNewSlots.length > 0);
    }
  };

  // Update editing values and validate
  const handleEditValueChange = (slotId, field, value) => {
    const newValues = {
      ...editingValues,
      [slotId]: {
        ...editingValues[slotId],
        [field]: value
      }
    };
    
    setEditingValues(newValues);
    
    // Validate on change
    validateSlot(slotId, newValues[slotId]);
  };

  // Validate slot: check duplicate name and time conflict
  const validateSlot = (slotId, slotData) => {
    const errors = {
      nameError: '',
      timeError: ''
    };

    if (!slotData) {
      setValidationErrors(prev => ({
        ...prev,
        [slotId]: errors
      }));
      return;
    }

    // Check duplicate name
    if (slotData.nameSlot && slotData.nameSlot.trim()) {
      const slotName = `Slot ${slotData.nameSlot.trim()}`.toLowerCase();
      const isDuplicate = slots.some(slot => {
        if (slot.id === slotId) return false; // Skip self
        
        // Get the actual name - use editingValues if slot is being edited, otherwise use saved name
        let existingName = '';
        if (editingSlotId === slot.id && editingValues[slot.id]?.nameSlot) {
          // Slot is currently being edited
          existingName = `Slot ${editingValues[slot.id].nameSlot.trim()}`.toLowerCase();
        } else if (slot.nameSlot) {
          // Slot has been saved (either new or existing)
          existingName = slot.nameSlot.toLowerCase();
        }
        
        return existingName && existingName === slotName;
      });
      
      if (isDuplicate) {
        errors.nameError = 'Slot name already exists';
      }
    }

    // Check time conflict
    if (slotData.startAt && slotData.endAt) {
      const startMinutes = parseTimeToMinutes(slotData.startAt);
      const endMinutes = parseTimeToMinutes(slotData.endAt);
      
      if (startMinutes >= endMinutes) {
        errors.timeError = 'Start time must be before end time';
      } else {
        // Check conflict with other slots
        const hasConflict = slots.some(slot => {
          if (slot.id === slotId) return false; // Skip self
          
          let otherStart = null;
          let otherEnd = null;
          
          // Get time from editing values if slot is being edited, otherwise from saved slot
          if (editingSlotId === slot.id && editingValues[slot.id]) {
            // Slot is currently being edited
            if (editingValues[slot.id].startAt) {
              otherStart = parseTimeToMinutes(editingValues[slot.id].startAt);
            }
            if (editingValues[slot.id].endAt) {
              otherEnd = parseTimeToMinutes(editingValues[slot.id].endAt);
            }
          } else if (slot.startAt && slot.endAt) {
            // Slot has been saved (either new or existing)
            otherStart = parseTimeToMinutes(convertTimeToInputFormat(slot.startAt));
            otherEnd = parseTimeToMinutes(convertTimeToInputFormat(slot.endAt));
          }
          
          if (otherStart === null || otherEnd === null) return false;
          
          // Check if time ranges overlap
          return (startMinutes < otherEnd && endMinutes > otherStart);
        });
        
        if (hasConflict) {
          errors.timeError = 'Time conflicts with another slot';
        }
      }
    }

    setValidationErrors(prev => ({
      ...prev,
      [slotId]: errors
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

  // Save single new slot (not saved to database yet, just validate and close edit mode)
  const handleSaveSlot = (slot) => {
    const editingValue = editingValues[slot.id];
    if (!editingValue || !editingValue.nameSlot || !editingValue.startAt || !editingValue.endAt) {
      alert('Please fill in all information');
      return;
    }

    // Check validation errors
    const errors = validationErrors[slot.id] || {};
    if (errors.nameError || errors.timeError) {
      alert('Please fix validation errors before saving');
      return;
    }

    // Format name as "Slot {name}"
    const formattedName = `Slot ${editingValue.nameSlot.trim()}`;

    const slotData = {
      ...slot,
      nameSlot: formattedName,
      startAt: editingValue.startAt,
      endAt: editingValue.endAt
    };

    // Update new slot
    setNewSlots(prev => prev.map(s => s.id === slot.id ? slotData : s));
    setSlots(prev => prev.map(s => s.id === slot.id ? slotData : s));

    setEditingSlotId(null);
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[slot.id];
      return newValues;
    });
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[slot.id];
      return newErrors;
    });
    setHasChanges(true);
  };


  // Save all new slots to database
  const handleSaveAllChanges = async () => {
    if (!selectedCampusId) {
      alert('Please select a campus first');
      return;
    }

    if (!hasChanges || newSlots.length === 0) {
      alert('No new slots to save');
      return;
    }

    // Validate all new slots before saving
    const invalidSlots = newSlots.filter(slot => {
      const errors = validationErrors[slot.id] || {};
      return errors.nameError || errors.timeError || !slot.nameSlot || !slot.startAt || !slot.endAt;
    });

    if (invalidSlots.length > 0) {
      alert('Please fix all validation errors before saving');
      return;
    }

    setLoading(true);
    try {
      // Chỉ gửi các slot mới
      const slotsToSend = newSlots.map(slot => ({
        nameSlot: slot.nameSlot,
        startAt: formatTimeForDisplay(slot.startAt),
        endAt: formatTimeForDisplay(slot.endAt)
      }));

      const response = await upsertSlots(selectedCampusId, slotsToSend);
      
      if (response.status === 200) {
        const message = response.data?.message || response.message || 'Slots saved successfully!';
        alert(message);
        // Reload slots
        await loadCampusSlots(selectedCampusId);
      } else {
        alert('Error occurred while saving: ' + (response.data?.message || response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error occurred while saving changes: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Soft delete slot
  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    // Nếu là slot mới chưa lưu, chỉ cần xóa khỏi state
    if (slotId.toString().startsWith('new-')) {
      setNewSlots(prev => prev.filter(s => s.id !== slotId));
      setSlots(prev => prev.filter(s => s.id !== slotId));
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[slotId];
        return newValues;
      });
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[slotId];
        return newErrors;
      });
      if (editingSlotId === slotId) {
        setEditingSlotId(null);
      }
      const remainingNewSlots = newSlots.filter(s => s.id !== slotId);
      setHasChanges(remainingNewSlots.length > 0);
      return;
    }

    // Soft delete slot đã lưu
    setLoading(true);
    try {
      const response = await softDeleteSlot(selectedCampusId, slotId);
      
      if (response.status === 200) {
        alert('Slot deleted successfully!');
        // Reload slots
        await loadCampusSlots(selectedCampusId);
      } else {
        alert('Error occurred while deleting: ' + (response.data?.message || response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Error occurred while deleting slot: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
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
                {hasChanges && newSlots.length > 0 && (
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
                    const isNew = slot.id && slot.id.toString().startsWith('new-');
                    const errors = validationErrors[slot.id] || {};
                    
                    return (
                      <div className={styles.slotNameCell}>
                        {isEditing && isNew ? (
                          <div className={styles.slotNameInputContainer}>
                            <div className={styles.slotNameInputGroup}>
                              <span className={styles.slotPrefix}>Slot</span>
                              <input
                                type="text"
                                value={editingValue.nameSlot || ''}
                                onChange={(e) => handleEditValueChange(slot.id, 'nameSlot', e.target.value)}
                                placeholder="name slot"
                                className={`${styles.nameInput} ${errors.nameError ? styles.inputError : ''}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className={styles.errorContainer}>
                              {errors.nameError && (
                                <span className={styles.errorText}>{errors.nameError}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.slotNameContent}>
                            <span className={styles.slotName}>{slot.nameSlot}</span>
                            {isNew && (
                              <span className={styles.newBadge}>New</span>
                            )}
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
                    const isNew = slot.id && slot.id.toString().startsWith('new-');
                    const errors = validationErrors[slot.id] || {};
                    
                    return (
                      <div className={styles.timeCell}>
                        {isEditing && isNew ? (
                          <div className={styles.timeInputContainer}>
                            <input
                              type="time"
                              value={editingValue.startAt || ''}
                              onChange={(e) => handleEditValueChange(slot.id, 'startAt', e.target.value)}
                              className={`${styles.timeInput} ${errors.timeError ? styles.inputError : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className={styles.errorContainer}>
                              {/* Error sẽ hiển thị ở cột End Time */}
                            </div>
                          </div>
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
                    const isNew = slot.id && slot.id.toString().startsWith('new-');
                    const errors = validationErrors[slot.id] || {};
                    
                    return (
                      <div className={styles.timeCell}>
                        {isEditing && isNew ? (
                          <div className={styles.timeInputContainer}>
                            <input
                              type="time"
                              value={editingValue.endAt || ''}
                              onChange={(e) => handleEditValueChange(slot.id, 'endAt', e.target.value)}
                              className={`${styles.timeInput} ${errors.timeError ? styles.inputError : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className={styles.errorContainer}>
                              {errors.timeError && (
                                <span className={styles.errorText}>{errors.timeError}</span>
                              )}
                            </div>
                          </div>
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
                    const isEditing = editingSlotId === slot.id;
                    const isNew = slot.id && slot.id.toString().startsWith('new-');
                    
                    return (
                      <div className={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                        {isEditing && isNew ? (
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
                              onClick={() => handleCancelAdd(slot.id)}
                              className={styles.cancelEditButton}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className={styles.deleteButton}
                            title="Delete"
                            disabled={loading}
                          >
                            Delete
                          </button>
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


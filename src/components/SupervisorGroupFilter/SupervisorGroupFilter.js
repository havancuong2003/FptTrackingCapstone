import React from 'react';
import Select from '../Select/Select';
import styles from './SupervisorGroupFilter.module.scss';

/**
 * Common filter component for supervisor pages
 * Includes: Semester selector, Group Status (Active/Expired), and Group selector
 */
export default function SupervisorGroupFilter({
  semesters = [],
  selectedSemesterId,
  onSemesterChange,
  groupExpireFilter,
  onGroupExpireFilterChange,
  groups = [],
  selectedGroupId,
  onGroupChange,
  groupSelectPlaceholder = 'Select group',
  loading = false,
  hideGroupSelect = false,
}) {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterRow}>
        {semesters.length > 0 && (
          <div className={styles.controlGroup}>
            <label className={styles.filterLabel}>Semester:</label>
            <Select
              value={selectedSemesterId?.toString() || ''}
              onChange={(e) => onSemesterChange(parseInt(e.target.value))}
              options={semesters.map((s) => ({
                value: s.id.toString(),
                label: s.name,
              }))}
              placeholder="Select Semester"
            />
          </div>
        )}
        <div className={styles.controlGroup}>
          <label className={styles.filterLabel}>Group Status:</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="groupExpireFilter"
                value="active"
                checked={groupExpireFilter === 'active'}
                onChange={(e) => onGroupExpireFilterChange(e.target.value)}
              />
              <span>Active</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="groupExpireFilter"
                value="expired"
                checked={groupExpireFilter === 'expired'}
                onChange={(e) => onGroupExpireFilterChange(e.target.value)}
              />
              <span>Expired</span>
            </label>
          </div>
        </div>
      </div>
      {!hideGroupSelect && (
        <div className={styles.groupRow}>
          <div className={styles.controlGroup}>
            <label className={styles.filterLabel}>Group:</label>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => {
                console.log('select value =', e.target.value); // xem có đổi thật không
                onGroupChange(e.target.value);
              }}
              className={styles.groupSelect}
              disabled={loading}
            >
              <option value="">{groupSelectPlaceholder}</option>
              {groups.map((group) => {
                const groupId =
                  typeof group === 'object' ? group.id || group.groupId : group;
                const groupName =
                  typeof group === 'object'
                    ? group.name || group.groupName || group.label
                    : group;
                return (
                  <option key={groupId} value={groupId}>
                    {groupName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

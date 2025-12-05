import React from 'react';
import styles from './DataTable.module.scss';

const DataTable = ({ 
  columns = [], 
  data = [], 
  loading = false, 
  emptyMessage = 'Không có dữ liệu',
  onRowClick = null,
  className = '',
  rowClassName = '',
  headerClassName = '',
  showIndex = true,
  indexTitle = 'No'
}) => {
  const handleRowClick = (row, index) => {
    if (onRowClick && typeof onRowClick === 'function') {
      onRowClick(row, index);
    }
  };

  const renderCellContent = (column, row, index) => {
    if (column.render && typeof column.render === 'function') {
      return column.render(row, index);
    }
    
    if (column.key && row[column.key] !== undefined) {
      return row[column.key];
    }
    
    return '';
  };

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.table}>
        <thead className={headerClassName}>
          <tr>
            {showIndex && (
              <th className={styles.indexHeader}>{''}{indexTitle}</th>
            )}
            {columns.map((column, index) => (
              <th 
                key={column.key || index}
                className={column.headerClassName || ''}
                style={column.headerStyle || {}}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={styles.loadingCell}>
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                  <span>Đang tải...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const dynamicRowClassName = typeof rowClassName === 'function' 
                ? rowClassName(row, rowIndex) 
                : rowClassName;
              const finalRowClassName = row._rowClassName || dynamicRowClassName;
              
              return (
              <tr 
                key={row.id || rowIndex}
                className={`${styles.tableRow} ${finalRowClassName || ''} ${onRowClick ? styles.clickableRow : ''}`}
                onClick={() => handleRowClick(row, rowIndex)}
              >
                {showIndex && (
                  <td className={styles.indexCell}>{rowIndex + 1}</td>
                )}
                {columns.map((column, colIndex) => (
                  <td 
                    key={column.key || colIndex}
                    className={column.cellClassName || ''}
                    style={column.cellStyle || {}}
                  >
                    {renderCellContent(column, row, rowIndex)}
                  </td>
                ))}
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

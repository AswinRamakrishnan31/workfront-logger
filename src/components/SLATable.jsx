import React, { useState } from 'react';
import { Plus } from 'lucide-react';

function SLATable({ channel, onUpdate, readOnly = false }) {
  const { id, name, columns, data } = channel;
  const [newRowName, setNewRowName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!newColumnName.trim()) return;
    if (columns.includes(newColumnName.trim())) return; // Prevent duplicates

    const updatedColumns = [...columns, newColumnName.trim()];
    
    // Add the new column with value 0 to all existing rows
    const updatedData = data.map(row => ({
      ...row,
      [newColumnName.trim()]: 0
    }));

    onUpdate({ ...channel, columns: updatedColumns, data: updatedData });
    setNewColumnName('');
  };

  const handleCellChange = (rowIndex, colName, value) => {
    if (readOnly) return;
    const numValue = parseFloat(value) || 0;
    const newData = [...data];
    
    const rowToUpdate = { ...newData[rowIndex], [colName]: numValue };

    // Auto-calculate logic when Dev changes
    if (colName === 'Dev' || colName === 'Development') {
      const devHours = numValue;
      if (columns.includes('QA')) rowToUpdate['QA'] = devHours * 0.3;
      if (columns.includes('PM')) rowToUpdate['PM'] = devHours * 0.1;
      if (columns.includes('Communication')) rowToUpdate['Communication'] = devHours * 0.1;
      if (columns.includes('UAT')) rowToUpdate['UAT'] = devHours * 0.1;
    }

    newData[rowIndex] = rowToUpdate;
    onUpdate({ ...channel, data: newData });
  };

  const handleAddRow = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!newRowName.trim()) return;

    const newRowData = { row: newRowName };
    columns.forEach(col => newRowData[col] = 0);

    onUpdate({ ...channel, data: [...data, newRowData] });
    setNewRowName('');
  };

  const calculateRowStats = (row) => {
    let totalHours = 0;
    columns.forEach(col => {
      totalHours += parseFloat(row[col]) || 0;
    });

    const pmCommHours = (parseFloat(row['PM']) || 0) + (parseFloat(row['Communication']) || 0);
    const capacityHours = totalHours - (pmCommHours * 0.20);

    return { totalHours, capacityHours };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* HOURS TABLE */}
      <div>
        <h4 style={{ marginBottom: '1rem', color: '#818cf8' }}>In Hours</h4>
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <table className="data-table" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 1 }}>Type of work (Complexity)</th>
                {columns.map(col => <th key={col}>{col}</th>)}
                <th style={{ background: 'rgba(52, 211, 153, 0.1)' }}>Total Hours</th>
                <th style={{ background: 'rgba(129, 140, 248, 0.1)' }}>Capacity (80% PM/Comm)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rIndex) => {
                const { totalHours, capacityHours } = calculateRowStats(row);
                return (
                  <tr key={rIndex}>
                    <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, borderRight: '1px solid var(--surface-border)' }}>
                      {row.row}
                    </td>
                    {columns.map(col => (
                      <td key={col} style={{ padding: '0.5rem' }}>
                        <input
                          type="number"
                          step="0.01"
                          disabled={readOnly}
                          value={row[col] === 0 ? '' : Number(row[col]).toFixed(2).replace(/\.00$/, '')}
                          onChange={(e) => handleCellChange(rIndex, col, e.target.value)}
                          style={{ 
                            width: '60px', 
                            padding: '0.25rem', 
                            background: readOnly ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', 
                            border: '1px solid var(--surface-border)',
                            color: readOnly ? '#cbd5e1' : 'white',
                            borderRadius: '4px',
                            textAlign: 'center',
                            cursor: readOnly ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                    ))}
                    <td style={{ fontWeight: 'bold', background: 'rgba(52, 211, 153, 0.05)' }}>
                      {totalHours.toFixed(2)}
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#818cf8', background: 'rgba(129, 140, 248, 0.05)' }}>
                      {capacityHours.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {!readOnly && (
          <>
            <form onSubmit={handleAddRow} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
              <input 
                type="text" 
                placeholder="Add Complexity (e.g., Simple Updates)" 
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', flex: 1, maxWidth: '300px' }}
              />
              <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <Plus size={16} /> Add Row
              </button>
            </form>
            
            <form onSubmit={handleAddColumn} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
              <input 
                type="text" 
                placeholder="Add Column (e.g., Config)" 
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'white', flex: 1, maxWidth: '300px' }}
              />
              <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <Plus size={16} /> Add Column
              </button>
            </form>
          </>
        )}
      </div>

      {/* DAYS TABLE */}
      <div>
        <h4 style={{ marginBottom: '1rem', color: '#c084fc' }}>In Days (8h / day)</h4>
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <table className="data-table" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 1 }}>Type of work (Complexity)</th>
                {columns.map(col => <th key={col}>{col}</th>)}
                <th style={{ background: 'rgba(52, 211, 153, 0.1)' }}>Total Days</th>
                <th style={{ background: 'rgba(129, 140, 248, 0.1)' }}>Capacity Days</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rIndex) => {
                const { totalHours, capacityHours } = calculateRowStats(row);
                return (
                  <tr key={rIndex}>
                    <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, borderRight: '1px solid var(--surface-border)' }}>
                      {row.row}
                    </td>
                    {columns.map(col => {
                      const days = (row[col] || 0) / 8;
                      return (
                        <td key={col} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {days === 0 ? '-' : days.toFixed(2)}
                        </td>
                      );
                    })}
                    <td style={{ fontWeight: 'bold', background: 'rgba(52, 211, 153, 0.05)' }}>
                      {(totalHours / 8).toFixed(2)}
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#c084fc', background: 'rgba(192, 132, 252, 0.05)' }}>
                      {(capacityHours / 8).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SLATable;

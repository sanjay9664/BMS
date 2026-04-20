import React from 'react';
import { Table } from 'react-bootstrap';

const DataTable = ({ headers, data, className = "" }) => {
  return (
    <div className={`table-responsive ${className}`}>
      <Table className="scada-table border-0">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="border-0">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {Object.values(row).map((cell, cellIdx) => (
                <td key={cellIdx} className="border-secondary border-opacity-10 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DataTable;

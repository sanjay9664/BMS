import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClass = (s) => {
    switch (s?.toLowerCase()) {
      case 'running': return 'status-running';
      case 'fault': return 'status-fault';
      case 'warning': return 'status-warning';
      default: return 'status-stopped';
    }
  };

  return (
    <span className={`status-indicator ${getStatusClass(status)}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;

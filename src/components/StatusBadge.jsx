import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClass = (s) => {
    switch (s?.toLowerCase()) {
      case 'running':
      case 'online': return 'status-running';
      case 'fault': return 'status-fault';
      case 'warning': return 'status-warning';
      case 'offline':
      case 'stopped': return 'status-stopped';
      case 'not mapped': return 'status-not-mapped';
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

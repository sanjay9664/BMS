import React from 'react';
import { Card } from 'react-bootstrap';

const ScadaCard = ({ title, children, icon, trend, value, unit, status }) => {
  return (
    <Card className="scada-card h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="icon-wrapper p-2 rounded bg-opacity-10 bg-info text-info">
            {icon}
          </div>
          {status && (
            <span className={`status-indicator status-${status.toLowerCase()}`}>
              {status}
            </span>
          )}
        </div>
        <h6 className="text-muted fw-semibold mb-1">{title}</h6>
        <div className="d-flex align-items-baseline">
          <h3 className="mb-0 fw-bold">{value}</h3>
          <span className="ms-1 text-muted fs-6">{unit}</span>
        </div>
        {trend && (
          <div className={`mt-2 fs-7 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last hour
          </div>
        )}
        <div className="mt-3">
          {children}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ScadaCard;

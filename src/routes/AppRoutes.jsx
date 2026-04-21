import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Dashboard from '../pages/Dashboard';
import WaterOverview from '../pages/WaterManagement/Overview';
import DGSetOverview from '../pages/DGSet/Overview';
import AlarmOverview from '../pages/AlarmSystem/Overview';
import ActiveAlarms from '../pages/AlarmSystem/Active';
import TransformerOverview from '../pages/Transformer/Overview';
import Settings from '../pages/Settings/Settings';
import AgTank from '../pages/WaterManagement/AgTank';
import UgTank from '../pages/WaterManagement/UgTank';
import TicketingSystem from '../pages/Ticketing/Index';

// Fallback for other routes until customized
const PlaceholderPage = ({ title }) => (
  <div className="fade-in">
    <div className="page-header">
      <div>
        <h2 className="mb-1">{title}</h2>
        <p className="text-muted">Detailed monitoring and controls for {title}</p>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary btn-sm">Refresh Data</button>
        <button className="btn btn-info btn-sm">System Check</button>
      </div>
    </div>
    
    <div className="scada-card p-5 text-center mt-4">
      <div className="text-muted opacity-50 mb-3">
        <div className="display-4 font-monospace">DATA_STREAM_ACTIVE</div>
      </div>
      <h4>{title} Module</h4>
      <p>Continuous monitoring in progress. All sensors reporting normal operation.</p>
      <div className="d-flex justify-content-center gap-4 mt-4">
        <div className="text-center">
          <div className="h3 mb-0 text-success">98%</div>
          <small className="text-muted">Efficiency</small>
        </div>
        <div className="text-center border-start border-end px-4">
          <div className="h3 mb-0 text-info">24.5°C</div>
          <small className="text-muted">Amb. Temp</small>
        </div>
        <div className="text-center">
          <div className="h3 mb-0 text-warning">1.2kW</div>
          <small className="text-muted">Load</small>
        </div>
      </div>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Water Management */}
      <Route path="/water-management/overview" element={<WaterOverview />} />
      <Route path="/water-management/ag-pump" element={<AgTank />} />
      <Route path="/water-management/ug-pump" element={<UgTank />} />
      <Route path="/water-management/domestic" element={<PlaceholderPage title="Domestic / Flushing" />} />
      <Route path="/water-management/level" element={<PlaceholderPage title="OHT / UG Level Monitoring" />} />
      <Route path="/water-management/report" element={<PlaceholderPage title="Water Management PDF Reports" />} />

      {/* Motors */}
      <Route path="/motors/overview" element={<PlaceholderPage title="Motors Overview" />} />
      <Route path="/motors/room1" element={<PlaceholderPage title="Pump Room 1" />} />
      <Route path="/motors/room2" element={<PlaceholderPage title="Pump Room 2" />} />
      <Route path="/motors/status" element={<PlaceholderPage title="VFD / DOL Status" />} />
      <Route path="/motors/report" element={<PlaceholderPage title="Motors PDF Reports" />} />

      {/* DG Set */}
      <Route path="/dg-set/overview" element={<DGSetOverview />} />
      <Route path="/dg-set/dg1" element={<DGSetOverview />} />
      <Route path="/dg-set/dg2" element={<DGSetOverview />} />
      <Route path="/dg-set/dg3" element={<DGSetOverview />} />
      <Route path="/dg-set/fuel" element={<PlaceholderPage title="Fuel Level Monitoring" />} />
      <Route path="/dg-set/runtime" element={<PlaceholderPage title="Runtime / Diesel Consumption" />} />
      <Route path="/dg-set/report" element={<PlaceholderPage title="DG Set PDF Reports" />} />

      {/* Alarm System */}
      <Route path="/alarm-system/overview" element={<AlarmOverview />} />
      <Route path="/alarm-system/active" element={<ActiveAlarms />} />
      <Route path="/alarm-system/inactive" element={<PlaceholderPage title="Inactive Alarms" />} />
      <Route path="/alarm-system/ack" element={<PlaceholderPage title="ACK (Acknowledge)" />} />
      <Route path="/alarm-system/history" element={<PlaceholderPage title="Alarm History" />} />
      <Route path="/alarm-system/report" element={<PlaceholderPage title="Alarm PDF Reports" />} />

      {/* Transformer */}
      <Route path="/transformer/overview" element={<TransformerOverview />} />
      <Route path="/transformer/t1" element={<PlaceholderPage title="Transformer-1" />} />
      <Route path="/transformer/t2" element={<PlaceholderPage title="Transformer-2" />} />
      <Route path="/transformer/load" element={<PlaceholderPage title="Load / Temperature Monitoring" />} />
      <Route path="/transformer/report" element={<PlaceholderPage title="Transformer PDF Reports" />} />

      {/* Settings */}
      <Route path="/settings" element={<Settings />} />

      {/* Ticketing */}
      <Route path="/ticketing" element={<TicketingSystem />} />

      {/* Catch-all */}
      <Route path="*" element={<PlaceholderPage title="Module Under Calibration" />} />
    </Routes>
  );
};

export default AppRoutes;

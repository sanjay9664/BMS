import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Bell, ShieldAlert, ShieldCheck, History, AlertTriangle } from 'lucide-react';
import ScadaCard from '../../components/ScadaCard';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const AlarmOverview = () => {
  const data = [
    { name: 'Critical', value: 1, color: '#ef4444' },
    { name: 'Warning', value: 3, color: '#f59e0b' },
    { name: 'Info', value: 8, color: '#38bdf8' },
  ];

  const recentAlarms = [
    { time: '12:15:20', source: 'Pump #2', msg: 'Vibration High', severity: 'Warning' },
    { time: '12:10:05', source: 'DG-1', msg: 'Fuel Low', severity: 'Critical' },
    { time: '11:45:30', source: 'LT Panel', msg: 'Phase Unbalance', severity: 'Info' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="mb-1 text-white">Alarm System Overview</h2>
          <p className="text-muted">Master control for all system alerts and fault notifications.</p>
        </div>
        <div className="d-flex gap-2">
            <PdfButton />
            <button className="btn btn-danger btn-sm">Mute Buzzer</button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="scada-card h-100">
            <Card.Body>
              <h6 className="mb-4 fw-bold">Alarm Distribution by Severity</h6>
              <div className="d-flex flex-column flex-md-row align-items-center">
                <div style={{ width: '100%', height: 250, maxWidth: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-grow-1 ps-md-4 w-100">
                   {data.map((item, idx) => (
                     <div key={idx} className="d-flex justify-content-between align-items-center mb-3 p-3 bg-dark bg-opacity-50 rounded border-start border-4" style={{ borderColor: item.color }}>
                        <div>
                            <span className="fw-bold">{item.name}</span>
                            <div className="text-muted fs-8">{item.value} Active Alarms</div>
                        </div>
                        <div className="h4 mb-0">{Math.round((item.value / 12) * 100)}%</div>
                     </div>
                   ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
           <Card className="scada-card h-100 border-danger border-opacity-25">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0 fw-bold">System Integrity</h6>
                <ShieldAlert className="text-danger" size={20} />
              </div>
              <div className="text-center py-4">
                <div className="display-1 fw-bold text-danger mb-2">1</div>
                <div className="h5 text-white">Unacknowledged Critical</div>
                <p className="text-muted fs-8 px-4">Immediate attention required for DG-1 Power Output stability.</p>
              </div>
              <button className="btn btn-outline-danger btn-sm w-100 mt-2">Go to Active Alarms</button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={6}>
          <Card className="scada-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="mb-0 fw-bold">Recent Flash Logs</h6>
                <History size={16} className="text-muted" />
              </div>
              {recentAlarms.map((alarm, idx) => (
                <div key={idx} className="d-flex align-items-center p-3 mb-2 rounded border border-secondary border-opacity-10 hover-bg-secondary cursor-pointer">
                  <div className={`p-2 rounded me-3 ${alarm.severity === 'Critical' ? 'bg-danger' : alarm.severity === 'Warning' ? 'bg-warning' : 'bg-info'} bg-opacity-10`}>
                    <AlertTriangle size={16} className={alarm.severity === 'Critical' ? 'text-danger' : alarm.severity === 'Warning' ? 'text-warning' : 'text-info'} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold fs-7">{alarm.source}</span>
                      <span className="text-muted fs-8">{alarm.time}</span>
                    </div>
                    <div className="fs-8 text-white-50">{alarm.msg}</div>
                  </div>
                </div>
              ))}
              <button className="btn btn-link text-info text-decoration-none w-100 mt-2 fs-8">View All Logs</button>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
            <Card className="scada-card h-100">
                <Card.Body>
                    <h6 className="mb-4 fw-bold">Annunciator Status</h6>
                    <div className="annunciator-grid">
                        {[
                            { label: 'FIRE', active: false },
                            { label: 'PUMP TRIP', active: true },
                            { label: 'OVERLOAD', active: false },
                            { label: 'LOW LEVEL', active: false },
                            { label: 'PHASE REV', active: false },
                            { label: 'COMM FAIL', active: false },
                            { label: 'GEN ON', active: false },
                            { label: 'BATT LOW', active: false }
                        ].map((item, idx) => (
                            <div key={idx} className={`annunciator-cell ${item.active ? 'active blink' : ''}`}>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      <style dangerouslySetInnerHTML={{ __html: `
        .annunciator-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        .annunciator-cell {
            background-color: #0c121e;
            border: 1px solid #1e293b;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 800;
            color: #334155;
            text-align: center;
            border-radius: 4px;
        }
        .annunciator-cell.active {
            background-color: #ef4444;
            color: #fff;
            border-color: #f87171;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }
        .blink {
            animation: blinker 1s linear infinite;
        }
        @keyframes blinker {
            50% { opacity: 0.5; }
        }
        .hover-bg-secondary:hover {
            background-color: rgba(255,255,255,0.02);
        }
      `}} />
    </div>
  );
};

export default AlarmOverview;

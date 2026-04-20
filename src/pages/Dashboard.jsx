import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { 
  Zap, Droplets, Activity, Bell, 
  Thermometer, Wind, Gauge, ShieldCheck 
} from 'lucide-react';
import ScadaCard from '../components/ScadaCard';
import StatusBadge from '../components/StatusBadge';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const data = [
  { name: '00:00', load: 45, water: 60 },
  { name: '04:00', load: 30, water: 55 },
  { name: '08:00', load: 85, water: 80 },
  { name: '12:00', load: 95, water: 75 },
  { name: '16:00', load: 70, water: 65 },
  { name: '20:00', load: 50, water: 70 },
];

const Dashboard = () => {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="mb-1 text-white">System Overview</h2>
          <p className="text-muted">Live monitoring of all building systems.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center bg-dark p-2 rounded border border-secondary border-opacity-25 me-3">
            <ShieldCheck className="text-success me-2" size={18} />
            <span className="fs-8 fw-semibold">SYSTEM SECURE</span>
          </div>
          <button className="btn btn-info btn-sm">Refresh Metrics</button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col lg={3} md={6}>
          <ScadaCard title="Total Power Load" value="482" unit="kW" trend={12} icon={<Zap size={24} />} status="Running">
             <div className="mt-3 fs-8 text-muted d-flex justify-content-between">
               <span>Voltage: 415.2V</span>
               <span>Freq: 50.01Hz</span>
             </div>
          </ScadaCard>
        </Col>
        <Col lg={3} md={6}>
          <ScadaCard title="Main Tank Level" value="84" unit="%" trend={-2} icon={<Droplets size={24} />} status="Running">
             <div className="mt-3 fs-8 text-muted d-flex justify-content-between">
               <span>Input: 12 LPS</span>
               <span>Output: 8 LPS</span>
             </div>
          </ScadaCard>
        </Col>
        <Col lg={3} md={6}>
          <ScadaCard title="Active Pems" value="12" unit="Online" trend={0} icon={<Activity size={24} />} status="Running">
             <div className="mt-3 fs-8 text-muted d-flex justify-content-between">
               <span>Faults: 0</span>
               <span>Warnings: 2</span>
             </div>
          </ScadaCard>
        </Col>
        <Col lg={3} md={6}>
          <ScadaCard title="Alarm System" value="0" unit="Active" icon={<Bell size={24} />} status="Running">
             <div className="mt-3 fs-8 text-muted d-flex justify-content-between">
               <span>Last ACK: 10m ago</span>
               <span>Critical: 0</span>
             </div>
          </ScadaCard>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="scada-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between mb-4">
                <h6 className="mb-0 fw-bold">Power Consumption Trend (24h)</h6>
                <div className="d-flex gap-3">
                  <div className="d-flex align-items-center fs-8">
                    <span className="bg-info rounded-circle me-1" style={{ width: 8, height: 8 }}></span> Main Load
                  </div>
                </div>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Area type="monotone" dataKey="load" stroke="#38bdf8" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="scada-card h-100">
            <Card.Body>
              <h6 className="mb-4 fw-bold">System Health</h6>
              {['HVAC System', 'Fire Safety', 'Elevation', 'Security'].map((item, idx) => (
                <div key={idx} className="mb-3 p-3 rounded border border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 fw-semibold">{item}</p>
                    <small className="text-muted">Uptime: 99.9%</small>
                  </div>
                  <StatusBadge status="Running" />
                </div>
              ))}
              <div className="mt-4 p-3 bg-dark rounded border border-warning border-opacity-25">
                <div className="d-flex align-items-center text-warning mb-1">
                  <Bell size={16} className="me-2" />
                  <span className="fw-bold">1 Warning Detected</span>
                </div>
                <small className="text-muted">Secondary water pump (UG-2) needs maintenance check.</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

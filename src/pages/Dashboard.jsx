import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, ProgressBar, Table } from 'react-bootstrap';
import { 
  Zap, Droplets, Database, ShieldAlert, Activity, 
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  ChevronRight, ArrowUpRight, ArrowDownRight, LayoutPanelTop,
  Gauge, Thermometer, Battery, Wind
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const StatusCard = ({ title, value, unit, icon, color, trend, trendValue, path }) => (
    <Card 
      onClick={() => navigate(path)}
      className="dash-card h-100 border-0 bg-panel shadow-sm cursor-pointer transition-all overflow-hidden position-relative"
    >
      <div className={`card-accent-line bg-${color}`}></div>
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`icon-box bg-${color} bg-opacity-10 text-${color}`}>
            {icon}
          </div>
          {trend && (
            <div className={`trend-badge fs-13 d-flex align-items-center gap-1 text-${trend === 'up' ? 'success' : 'danger'}`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trendValue}
            </div>
          )}
        </div>
        <h6 className="text-secondary fw-black uppercase tracking-widest fs-13 mb-1">{title}</h6>
        <div className="d-flex align-items-baseline gap-2">
          <h3 className="text-white fw-black mb-0 fs-5">{value}</h3>
          <small className="text-muted fw-bold">{unit}</small>
        </div>
        <div className="mt-3 d-flex justify-content-between align-items-center">
            <Badge bg="dark" className="border border-white border-opacity-10 text-muted fs-13 rounded-1 px-2 py-1">REAL-TIME</Badge>
            <ChevronRight size={16} className="text-muted opacity-50" />
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="dashboard-wrapper fade-in p-4">
      {/* PROFESSIONAL WELCOME BAR */}
      <div className="d-flex justify-content-between align-items-end mb-5 pb-3 border-bottom border-white border-opacity-5">
        <div>
           <div className="d-flex align-items-center gap-2 mb-2">
              <div className="bg-info bg-opacity-20 px-3 py-1 rounded-pill border border-info border-opacity-10">
                 <small className="text-info-scada fw-black fs-13 tracking-widest uppercase">System Operational</small>
              </div>
              <small className="text-muted fw-bold fs-12 uppercase">{time.toLocaleDateString()} | {time.toLocaleTimeString()}</small>
           </div>
           <h2 className="text-white fw-black tracking-tight mb-0">SOCHIOT <span className="text-info-scada">COMMAND</span> CENTER</h2>
           <p className="text-muted fs-11 mt-1 mb-0 uppercase tracking-widest opacity-75">Integrated Building Management & Automation Infrastructure</p>
        </div>
        <div className="d-flex gap-2">
            <button className="btn-scada-outline"><Activity size={16} className="me-2" /> Live Audit</button>
            <button className="btn-scada-primary"><CheckCircle2 size={16} className="me-2" /> Systems OK</button>
        </div>
      </div>

      <Row className="g-4 mb-5">
        <Col xl={3} md={6}>
            <StatusCard 
                title="Power Consumption" 
                value="482.5" 
                unit="KW" 
                icon={<Zap size={22} />} 
                color="warning" 
                trend="down" 
                trendValue="12%"
                path="/lt-panel/overview"
            />
        </Col>
        <Col xl={3} md={6}>
            <StatusCard 
                title="Current Generation" 
                value="125.8" 
                unit="KW" 
                icon={<Database size={22} />} 
                color="info" 
                trend="up" 
                trendValue="5.4%"
                path="/dg-set/overview"
            />
        </Col>
        <Col xl={3} md={6}>
            <StatusCard 
                title="Total Water Stock" 
                value="84.2" 
                unit="Kilo Ltrs" 
                icon={<Droplets size={22} />} 
                color="primary" 
                trend="up" 
                trendValue="2.1%"
                path="/water-management/overview"
            />
        </Col>
        <Col xl={3} md={6}>
            <StatusCard 
                title="Active Alarms" 
                value="03" 
                unit="Critical" 
                icon={<ShieldAlert size={22} />} 
                color="danger" 
                trend="down" 
                trendValue="1 Alarm ACK"
                path="/alarm-system/active"
            />
        </Col>
      </Row>

      <Row className="g-4">
        {/* LEFT: LIVE SYSTEMS OVERVIEW */}
        <Col xl={8}>
            <Card className="bg-panel border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div className="px-4 py-3 border-bottom border-white border-opacity-5 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 text-white fw-black tracking-widest uppercase fs-12"><LayoutPanelTop size={16} className="me-2 text-info" /> Critical Infrastructure Monitoring</h6>
                    <Badge bg="info" className="text-dark fs-13">6 SYSTEMS LIVE</Badge>
                </div>
                <Card.Body className="p-0">
                    <Table borderless responsive className="scada-table mb-0 align-middle">
                        <thead>
                            <tr>
                                <th className="ps-4">System Node</th>
                                <th>Operational Status</th>
                                <th>Primary Value</th>
                                <th className="text-center">Utility Score</th>
                                <th className="pe-4 text-end">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                {name: 'Main LT Panel-1', status: 'Healthy', val: '415.2 V', score: 98, icon: <Zap size={14}/>, color: 'success'},
                                {name: 'DG SET-01', status: 'Running', val: '124.5 KW', score: 85, icon: <Database size={14}/>, color: 'info'},
                                {name: 'Water Pump RM-1', status: 'Active', val: '8.5 Bar', score: 92, icon: <Droplets size={14}/>, color: 'primary'},
                                {name: 'Fire Pump RM', status: 'Standby', val: '7.2 Bar', score: 100, icon: <ShieldAlert size={14}/>, color: 'warning'},
                                {name: 'Transformer-01', status: 'Optimal', val: '52.4 °C', score: 94, icon: <Zap size={14}/>, color: 'success'},
                                {name: 'Tank UG-01', status: 'Filling', val: '78.2 %', score: 88, icon: <Droplets size={14}/>, color: 'primary'}
                            ].map((item, i) => (
                                <tr key={i} className="hover-light">
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`p-2 rounded-circle bg-${item.color} bg-opacity-10 text-${item.color}`}>
                                                {item.icon}
                                            </div>
                                            <span className="text-white fw-bold fs-12 uppercase">{item.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className={`node-dot bg-${item.color}`}></div>
                                            <span className={`text-${item.color} fs-13 fw-bold uppercase`}>{item.status}</span>
                                        </div>
                                    </td>
                                    <td><span className="text-white font-monospace fw-bold fs-12">{item.val}</span></td>
                                    <td>
                                        <div className="px-5">
                                            <ProgressBar now={item.score} variant={item.color} style={{height: 4, borderRadius: 10}} className="bg-white bg-opacity-5" />
                                        </div>
                                    </td>
                                    <td className="pe-4 text-end text-muted fs-13 fw-bold uppercase">12:45:0{i} PM</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Col>

        {/* RIGHT: HEALTH & METRICS */}
        <Col xl={4}>
            <Row className="g-4 h-100">
                <Col xs={12}>
                    <Card className="bg-panel border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <h6 className="text-white fw-black tracking-widest uppercase fs-12 mb-4"><Gauge size={16} className="me-2 text-warning" /> Environmental Sensor Nodes</h6>
                            <Row className="g-3">
                                <Col xs={6}>
                                    <div className="sensor-tile p-3 rounded-4 bg-black bg-opacity-30 border border-white border-opacity-5">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Thermometer size={18} className="text-danger" />
                                            <Badge bg="danger" className="bg-opacity-10 text-danger fs-13">HOT</Badge>
                                        </div>
                                        <small className="text-muted d-block fw-bold fs-13 uppercase mb-1">Ambient Temp</small>
                                        <h4 className="text-white fw-black font-monospace mb-0">32.4<small className="fs-13">°C</small></h4>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="sensor-tile p-3 rounded-4 bg-black bg-opacity-30 border border-white border-opacity-5">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Wind size={18} className="text-info" />
                                            <Badge bg="success" className="bg-opacity-10 text-success fs-13">NORMAL</Badge>
                                        </div>
                                        <small className="text-muted d-block fw-bold fs-13 uppercase mb-1">Humidity</small>
                                        <h4 className="text-white fw-black font-monospace mb-0">58<small className="fs-13">%</small></h4>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="sensor-tile p-3 rounded-4 bg-black bg-opacity-30 border border-white border-opacity-5">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Battery size={18} className="text-success" />
                                            <Badge bg="success" className="bg-opacity-10 text-success fs-13">FULL</Badge>
                                        </div>
                                        <small className="text-muted d-block fw-bold fs-13 uppercase mb-1">UPS Health</small>
                                        <h4 className="text-white fw-black font-monospace mb-0">99<small className="fs-13">%</small></h4>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="sensor-tile p-3 rounded-4 bg-black bg-opacity-30 border border-white border-opacity-5">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <Activity size={18} className="text-warning" />
                                            <Badge bg="warning" className="bg-opacity-10 text-warning fs-13">MODERATE</Badge>
                                        </div>
                                        <small className="text-muted d-block fw-bold fs-13 uppercase mb-1">Vibration</small>
                                        <h4 className="text-white fw-black font-monospace mb-0">1.2<small className="fs-13">Hz</small></h4>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12}>
                    <Card className="bg-panel border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                        <div className="bg-info bg-opacity-10 p-4 text-center">
                            <ShieldAlert size={32} className="text-info mb-3" />
                            <h5 className="text-white fw-black uppercase tracking-tight">Security Protocol ACTIVE</h5>
                            <p className="text-muted fs-13 px-4 mb-0">System is under advanced 24/7 autonomous surveillance. All access attempts are logged with biometric verification.</p>
                        </div>
                        <div className="px-4 py-3 bg-black bg-opacity-40 border-top border-white border-opacity-5">
                             <div className="d-flex justify-content-between mb-2">
                                <small className="text-muted fw-bold fs-13 uppercase">Firewall Integrity</small>
                                <small className="text-success fw-bold fs-13">STABLE</small>
                             </div>
                             <ProgressBar now={100} variant="success" style={{height: 4}} className="bg-white bg-opacity-5 rounded-pill" />
                        </div>
                    </Card>
                </Col>
            </Row>
        </Col>
      </Row>

      <style dangerouslySetInnerHTML={{ __html: `
        .bg-panel { background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.05) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .dash-card:hover { transform: translateY(-5px); background-color: rgba(15, 23, 42, 0.6); }
        .card-accent-line { position: absolute; top: 0; left: 0; height: 3px; width: 100%; border-radius: 4px 4px 0 0; }
        .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        
        .scada-table thead th { 
            background: rgba(255, 255, 255, 0.02); 
            color: #64748b; 
            font-size: 0.65rem; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            font-weight: 900;
            padding: 15px;
            border: 0;
        }
        .scada-table tbody td { 
            padding: 15px; 
            border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
            color: #f8fafc !important;
            background-color: #0f172a;
        }
        .hover-light:hover { background: rgba(255, 255, 255, 0.02); }
        .node-dot { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
        
        .btn-scada-outline {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #94a3b8;
            padding: 8px 18px;
            border-radius: 8px;
            font-size: 0.72rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s;
        }
        .btn-scada-outline:hover { color: white; border-color: rgba(255, 255, 255, 0.3); background: rgba(255,255,255,0.05); }
        
        .btn-scada-primary {
            background: #0ea5e9;
            border: 0;
            color: #020617;
            padding: 8px 18px;
            border-radius: 8px;
            font-size: 0.72rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
        }
        .btn-scada-primary:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4); }
        
        .sensor-tile:hover { border-color: rgba(14, 165, 233, 0.3) !important; background-color: rgba(0, 0, 0, 0.45) !important; }

        .text-info-scada { color: #0ea5e9; }
        .fw-black { font-weight: 900 !important; }
        .fs-13 { font-size: 0.65rem !important; }
        .fs-12 { font-size: 0.75rem !important; }
        .fs-11 { font-size: 0.85rem !important; }
        .tracking-widest { letter-spacing: 3px !important; }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.3s ease; }
      `}} />
    </div>
  );
};

export default Dashboard;

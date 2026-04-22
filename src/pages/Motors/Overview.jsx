import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, ProgressBar, Table, Button } from 'react-bootstrap';
import { 
  Zap, Activity, Gauge, Thermometer, Wind, 
  RotateCw, RefreshCw, Power, AlertCircle, 
  ShieldCheck, ArrowRight, Settings, Download
} from 'lucide-react';
import motorImage from '../../assets/motor.png';

const MotorCard = ({ id, name, status, rpm, current, temp, vibration, efficiency }) => {
  const isRunning = status === 'Running';
  const isFault = status === 'Fault';
  
  return (
    <Card className="motor-card border-0 shadow-lg overflow-hidden position-relative mb-4" 
          style={{ background: 'linear-gradient(145deg, #0f172a 0%, #020617 100%)' }}>
      <div className={`status-stripe bg-${isFault ? 'danger' : isRunning ? 'success' : 'warning'}`}></div>
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <Badge bg="dark" className="border border-white border-opacity-10 text-muted fs-11 uppercase fw-black tracking-widest mb-1">
              ID: {id}
            </Badge>
            <h4 className="text-white fw-black mb-0">{name}</h4>
          </div>
          <Badge bg={isFault ? 'danger' : isRunning ? 'success' : 'warning'} 
                 className="bg-opacity-10 text-opacity-100 rounded-pill px-3 py-2 border-0 shadow-glow">
            <div className="d-flex align-items-center gap-2">
              <div className={`pulse-dot bg-${isFault ? 'danger' : isRunning ? 'success' : 'warning'}`}></div>
              {status.toUpperCase()}
            </div>
          </Badge>
        </div>

        <Row className="align-items-center">
          <Col md={5} className="text-center position-relative py-4">
            <div className="motor-visual-container">
              {/* Rotating HUD Rings */}
              <div className={`hud-ring hud-outer ${isRunning ? 'spin-slow' : ''}`}></div>
              <div className={`hud-ring hud-inner ${isRunning ? 'spin-reverse' : ''}`}></div>
              
              {/* Energy Glow */}
              <div className={`motor-glow ${isRunning ? 'active' : ''} ${isFault ? 'fault' : ''}`}></div>
              
              {/* Motor Image with Circular Mask */}
              <div className="motor-image-wrapper">
                <img src={motorImage} alt="Motor" className="motor-img-styled" />
              </div>

              {/* Data Overlay Particles */}
              {isRunning && (
                <div className="energy-particles">
                  <div className="particle p1"></div>
                  <div className="particle p2"></div>
                  <div className="particle p3"></div>
                </div>
              )}
            </div>
          </Col>
          <Col md={7}>
            <div className="telemetry-grid mt-3 mt-md-0">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="h6 text-info-scada fw-black uppercase tracking-widest mb-0">System Telemetry</div>
                <Badge bg="info" className="bg-opacity-10 text-info fw-bold fs-10 tracking-widest uppercase">Node: {id.split('-')[1]}</Badge>
              </div>
              <Row className="g-3">
                {[
                  { label: 'Speed', val: rpm, unit: 'RPM', icon: <RotateCw size={14} />, color: '#0ea5e9', trend: '+12' },
                  { label: 'Current', val: current, unit: 'AMP', icon: <Zap size={14} />, color: '#f59e0b', trend: 'STABLE' },
                  { label: 'Temp', val: temp, unit: '°C', icon: <Thermometer size={14} />, color: '#ef4444', trend: '+2.4' },
                  { label: 'Vibration', val: vibration, unit: 'mm/s', icon: <Activity size={14} />, color: '#10b981', trend: 'LOW' }
                ].map((stat, i) => (
                  <Col xs={6} key={i}>
                    <div className="stat-tile-premium p-3 rounded-4 bg-black bg-opacity-40 border border-white border-opacity-5">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ color: stat.color }}>{stat.icon}</span>
                        <small className="text-secondary fw-black fs-9 opacity-50">{stat.trend}</small>
                      </div>
                      <div className="d-flex align-items-baseline gap-1">
                        <span className="text-white fw-black fs-4 font-monospace">{stat.val}</span>
                        <small className="text-muted fs-11 fw-bold uppercase tracking-tighter">{stat.unit}</small>
                      </div>
                      <small className="text-secondary fw-bold fs-10 uppercase mt-1 d-block opacity-75">{stat.label}</small>
                    </div>
                  </Col>
                ))}
              </Row>
              
              <div className="mt-4 p-3 bg-white bg-opacity-5 rounded-4 border border-white border-opacity-5">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-secondary fw-black fs-11 uppercase letter-spacing-1">Operational Load Factor</small>
                  <small className="text-info-scada fw-black font-monospace">{efficiency}%</small>
                </div>
                <div className="progress-container shadow-inner">
                   <div className="progress-fill" style={{ width: `${efficiency}%`, background: `linear-gradient(90deg, #0ea5e9, ${efficiency > 80 ? '#10b981' : '#f59e0b'})` }}></div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <div className="mt-4 pt-3 border-top border-white border-opacity-5 d-flex gap-3">
          <Button variant="outline-primary" className="flex-grow-1 btn-scada-pill-outline py-2">
            <Settings size={14} className="me-2" /> CORE DIAGNOSTICS
          </Button>
          <Button variant={isRunning ? "danger" : "success"} className={`flex-grow-1 btn-scada-pill py-2 shadow-${isRunning ? 'danger' : 'success'}`}>
            <Power size={14} className="me-2" /> {isRunning ? 'EMERGENCY STOP' : 'INITIALIZE MOTOR'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const MotorsOverview = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const motorsData = [
    { id: 'M-01-AF', name: 'Main Supply Pump 01', status: 'Running', rpm: '1440', current: '12.4', temp: '42', vibration: '0.8', efficiency: 94 },
    { id: 'M-02-AF', name: 'Main Supply Pump 02', status: 'Standby', rpm: '12', current: '0.2', temp: '28', vibration: '0.1', efficiency: 5 },
    { id: 'F-01-VNT', name: 'Exhaust Fan A1', status: 'Running', rpm: '980', current: '4.2', temp: '35', vibration: '1.2', efficiency: 88 },
    { id: 'C-01-CHL', name: 'Chiller Compressor 01', status: 'Fault', rpm: '0', current: '0.0', temp: '75', vibration: '0.0', efficiency: 0 },
  ];

  return (
    <div className="motors-page fade-in p-4">
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-start mb-5 pb-4 border-bottom border-white border-opacity-5">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="status-badge-glow">
              <div className="pulse-dot bg-success"></div>
              <span>TELEMETRY_SYNCED</span>
            </div>
            <div className="text-secondary fw-bold fs-11 uppercase p-2 border border-white border-opacity-10 rounded-pill bg-black bg-opacity-30 tracking-widest px-3">
              NODE_TX_STABLE // {time.toLocaleTimeString()}
            </div>
          </div>
          <h1 className="text-white fw-black tracking-tight mb-2 size-2 uppercase">Systems <span className="text-info-scada">Motorization</span> Hub</h1>
          <div className="d-flex gap-3 align-items-center opacity-50">
             <small className="text-muted fs-11 uppercase fw-bold tracking-widest">Protocol: MQTT/MODBUS</small>
             <div className="dot-divider"></div>
             <small className="text-muted fs-11 uppercase fw-bold tracking-widest">Latency: 14ms</small>
          </div>
        </div>
        <div className="d-flex gap-3">
          <button className="btn-scada-glass-premium"><RefreshCw size={16} className="me-2" /> RE-CALIBRATE</button>
          <button className="btn-scada-glow-premium"><Download size={16} className="me-2" /> EXPORT LOGS</button>
        </div>
      </div>

      {/* QUICK STATS */}
      <Row className="g-4 mb-5">
        {[
          { label: 'TOTAL ASSETS', val: '42', icon: <Activity />, color: '#0ea5e9' },
          { label: 'OPERATIONAL', val: '38', icon: <Power />, color: '#10b981' },
          { label: 'CONSUMPTION', val: '450 kW', icon: <Zap />, color: '#f59e0b' },
          { label: 'SYSTEM HEALTH', val: '92%', icon: <ShieldCheck />, color: '#38bdf8' }
        ].map((stat, i) => (
          <Col md={3} key={i}>
            <div className="quick-stat-card p-3 rounded-4 bg-panel border-0 position-relative overflow-hidden">
              <div className="stat-accent" style={{ background: stat.color }}></div>
              <div className="d-flex align-items-center gap-3 z-1 position-relative">
                <div className="stat-icon-container" style={{ color: stat.color, background: `${stat.color}15` }}>{stat.icon}</div>
                <div>
                  <small className="text-secondary fw-black uppercase fs-10 d-block mb-1 opacity-50">{stat.label}</small>
                  <h3 className="text-white fw-black mb-0 font-monospace">{stat.val}</h3>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* MOTORS GRID */}
      <Row className="g-4">
        {motorsData.map((motor, i) => (
          <Col xl={6} key={i}>
            <MotorCard {...motor} />
          </Col>
        ))}
      </Row>

      <style dangerouslySetInnerHTML={{ __html: `
        .motors-page { background: #020617; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .bg-panel { background-color: #0f172a; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
        .text-info-scada { color: #0ea5e9; }
        .fw-black { font-weight: 900 !important; }
        .size-2 { font-size: 2.5rem; letter-spacing: -2px; }
        
        .motor-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255,255,255,0.03) !important; }
        .motor-card:hover { transform: translateY(-8px); border: 1px solid rgba(14, 165, 233, 0.3) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.8); }
        
        .status-stripe { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        
        /* THE "ROUND" MOTOR VISUALIZATION */
        .motor-visual-container { 
          position: relative; 
          width: 200px;
          height: 200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hud-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(14, 165, 233, 0.3);
          pointer-events: none;
        }
        .hud-outer { width: 100%; height: 100%; border: 2px solid rgba(14, 165, 233, 0.1); border-top-color: #0ea5e9; }
        .hud-inner { width: 85%; height: 85%; border: 1px dashed rgba(14, 165, 233, 0.2); }
        
        .spin-slow { animation: rotate 10s linear infinite; }
        .spin-reverse { animation: rotate-reverse 15s linear infinite; }
        
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rotate-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        
        .motor-image-wrapper {
          width: 75%;
          height: 75%;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
          z-index: 2;
          background: #020617;
          border: 4px solid rgba(14, 165, 233, 0.2);
          box-shadow: 0 0 30px rgba(14, 165, 233, 0.2);
        }
        
        .motor-img-styled { 
          width: 130%;
          height: 130%;
          object-fit: cover;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: brightness(1.1) contrast(1.1);
        }
        
        .motor-glow {
          position: absolute;
          width: 90%;
          height: 90%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .motor-glow.active { opacity: 1; animation: breathe 2s ease-in-out infinite; }
        .motor-glow.fault { background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%); }
        
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
        
        .motor-vibrating { animation: vibrate 0.15s linear infinite; }
        @keyframes vibrate {
          0% { transform: translate(1px, 1px) scale(1.01); }
          50% { transform: translate(-1px, -1px) scale(1.01); }
          100% { transform: translate(0, 0) scale(1.01); }
        }
        
        .stat-tile-premium { transition: background 0.3s ease; }
        .stat-tile-premium:hover { background: rgba(255,255,255,0.08); }
        
        .progress-container { width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; position: relative; }
        .progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
        .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
        
        .btn-scada-pill { 
          border-radius: 50px; border: none; font-weight: 900; font-size: 0.75rem; 
          text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s ease;
        }
        .btn-scada-pill-outline { 
          border-radius: 50px; background: transparent; border: 1px solid rgba(14, 165, 233, 0.3); 
          color: #0ea5e9; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; 
          letter-spacing: 2px; 
        }
        .btn-scada-pill-outline:hover { background: rgba(14, 165, 233, 0.1); border-color: #0ea5e9; }
        
        .status-badge-glow {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 6px 16px;
          border-radius: 50px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 1px;
        }
        
        .quick-stat-card { border: 1px solid rgba(255,255,255,0.03) !important; transition: transform 0.3s ease; }
        .quick-stat-card:hover { transform: scale(1.02); }
        .stat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; opacity: 0.5; }
        .stat-icon-container { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        
        .letter-spacing-1 { letter-spacing: 1px; }
        .dot-divider { width: 4px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 50%; }
        
        .btn-scada-glass-premium { 
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
          color: #94a3b8; padding: 10px 24px; border-radius: 50px; font-weight: 900; 
          text-transform: uppercase; font-size: 0.72rem; letter-spacing: 1.5px;
        }
        .btn-scada-glow-premium { 
          background: linear-gradient(135deg, #0ea5e9, #2563eb); border: none; 
          color: white; padding: 10px 24px; border-radius: 50px; font-weight: 900; 
          text-transform: uppercase; font-size: 0.72rem; letter-spacing: 1.5px;
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);
        }
      `}} />
    </div>
  );
};

export default MotorsOverview;

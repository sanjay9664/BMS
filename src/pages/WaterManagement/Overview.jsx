import React from 'react';
import { Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import { Droplets, Waves, Gauge, ArrowRight, LayoutGrid, TowerControl as Control, Activity, ShieldCheck, Zap, AlertTriangle, Info, ToggleRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PdfButton from '../../components/PdfButton';

const WaterOverview = () => {
  const navigate = useNavigate();
  const [hoverData, setHoverData] = React.useState({ ag: null, ug: null });

  const handleMouseMove = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400; 
    const timeIndex = Math.floor((x / 400) * 24);
    const hours = timeIndex % 12 || 12;
    const ampm = timeIndex < 12 ? 'AM' : 'PM';
    const timeStr = `${hours}:00 ${ampm}`;
    
    // Improved simulation logic
    const baseLoad = id === 'ag' ? 70 : 45;
    const loadVal = Math.floor(Math.sin(x/40) * 15 + baseLoad); 
    
    const statusText = loadVal > 80 ? 'HIGH' : loadVal < 40 ? 'LOW' : 'NORMAL';
    setHoverData(prev => ({ ...prev, [id]: { x, time: timeStr, load: loadVal, status: statusText } }));
  };

  const handleMouseLeave = (id) => {
    setHoverData(prev => ({ ...prev, [id]: null }));
  };

  const stations = [
    {
      id: 'ag',
      title: 'Above Ground (AG) Tanks',
      subtitle: 'Tertiary Distribution & Rooftop Supply',
      path: '/water-management/ag-pump',
      primaryStat: '48',
      statLabel: 'ACTIVE TANKS',
      level: 72,
      pumps: '6 ACTIVE',
      flow: '1250 LPM',
      color: '#38bdf8',
      icon: <Waves size={32} />
    },
    {
      id: 'ug',
      title: 'Underground (UG) Network',
      subtitle: 'Primary Collection & Fire Reservoirs',
      path: '/water-management/ug-pump',
      primaryStat: '02',
      statLabel: 'PUMPING STATIONS',
      level: 65,
      pumps: '4 RUNNING',
      flow: '2450 LPM',
      color: '#22c55e',
      icon: <Droplets size={32} />
    }
  ];

  return (
    <div className="fade-in">
      {/* --- GATEWAY MONITOR (NEW) --- */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
      <div>
          <h2 className="mb-1 text-white fw-bold">Hydraulic Master Overview</h2>
          <p className="text-secondary fs-7">Enterprise-wide water distribution, pressure, and asset health monitoring.</p>
           <PdfButton />
        </div>
      <div className="gateway-monitor mb-4 p-3 rounded-4 bg-dark bg-opacity-40 border border-secondary border-opacity-10 d-flex gap-4 align-items-center">
            <div className="d-flex align-items-center gap-3 pe-4 border-end border-secondary border-opacity-20">
                <div className="p-2 rounded-circle bg-success bg-opacity-10">
                    <Activity className="text-success" size={20} />
                </div>
                <div>
                    <small className="text-muted d-block fs-10 fw-bold uppercase letter-spacing-1">Gateways Online</small>
                    <span className="text-white fs-5 fw-black">14 <Badge bg="success" className="ms-2 fs-11 bg-opacity-10 text-success border border-success border-opacity-20">ACTIVE</Badge></span>
                </div>
            </div>
            <div className="d-flex align-items-center gap-3 pe-4 border-end border-secondary border-opacity-20">
                <div className="p-2 rounded-circle bg-danger bg-opacity-10">
                    <AlertTriangle className="text-danger" size={20} />
                </div>
                <div>
                    <small className="text-muted d-block fs-10 fw-bold uppercase letter-spacing-1">Gateways Offline</small>
                    <span className="text-white fs-5 fw-black">01 <Badge bg="danger" className="ms-2 fs-11 bg-opacity-10 text-danger border border-danger border-opacity-20">CRITICAL</Badge></span>
                </div>
            </div>
            <div className="ms-auto d-flex align-items-center gap-3">
                <div className="text-end me-3">
                    <small className="text-muted d-block fs-10 fw-bold uppercase">System Latency</small>
                    <span className="text-info fw-bold fs-9">24ms</span>
                </div>
                <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 px-3 py-2 fs-10 fw-bold">NETWORK STABLE</Badge>
            </div>
      </div>

      
        
       
      </div>

      {/* --- NEW ASSET & ALARM SNAPSHOT --- */}
      <Row className="g-3 mb-4">
        <Col lg={4}>
            <Card className="bg-dark bg-opacity-20 border border-secondary border-opacity-10 h-100 rounded-4">
                <Card.Body className="p-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <Zap size={18} className="text-info" />
                        <span className="text-white fw-bold fs-9 letter-spacing-1">PUMP STATUS</span>
                    </div>
                    <div className="d-flex justify-content-around text-center py-2">
                        <div>
                            <h3 className="text-success fw-black mb-0">10</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">ACTIVE</small>
                        </div>
                        <div className="border-start border-secondary border-opacity-10 px-4">
                            <h3 className="text-muted fw-black mb-0">06</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">INACTIVE</small>
                        </div>
                        <div className="border-start border-secondary border-opacity-10 px-4">
                            <h3 className="text-warning fw-black mb-0">02</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">STANDBY</small>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col lg={4}>
            <Card className="bg-dark bg-opacity-20 border border-secondary border-opacity-10 h-100 rounded-4">
                <Card.Body className="p-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-danger" />
                        <span className="text-white fw-bold fs-9 letter-spacing-1">TANKS STATUS</span>
                    </div>
                    <div className="d-flex justify-content-around text-center py-2">
                        <div>
                            <h3 className="text-danger fw-black mb-0">01</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">CRITICAL</small>
                        </div>
                        <div className="border-start border-secondary border-opacity-10 px-4">
                            <h3 className="text-warning fw-black mb-0">02</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">HIGH</small>
                        </div>
                        <div className="border-start border-secondary border-opacity-10 px-4">
                            <h3 className="text-info fw-black mb-0">05</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">LOW</small>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col lg={4}>
            <Card className="bg-dark bg-opacity-20 border border-secondary border-opacity-10 h-100 rounded-4">
                <Card.Body className="p-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <ToggleRight size={18} className="text-primary" />
                        <span className="text-white fw-bold fs-9 letter-spacing-1">VALVE STATUS</span>
                    </div>
                    <div className="d-flex justify-content-around text-center py-2">
                        <div>
                            <h3 className="text-info fw-black mb-0">38</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">OPEN</small>
                        </div>
                        <div className="border-start border-secondary border-opacity-10 px-4">
                            <h3 className="text-danger fw-black mb-0">10</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">CLOSED</small>
                        </div>
                        <div className="border-start border-secondary border-opacity-10 px-4">
                            <h3 className="text-muted fw-black mb-0">48</h3>
                            <small className="text-muted fs-10 fw-bold uppercase">TOTAL</small>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        
      </Row>

      {/* --- MASTER OVERVIEW TILES (Existing) --- */}
      <div className="mb-3 d-flex align-items-center gap-2">
          <Settings size={18} className="text-secondary" />
          <span className="text-secondary fw-bold fs-9 letter-spacing-1 uppercase">DAY AVERAGE</span>
      </div>
      <Row className="g-4 mb-5">
        {stations.map((s) => (
          <Col lg={6} key={s.id}>
            <Card 
              className="scada-card border-0 overflow-hidden position-relative interactive-overview-card"
              onClick={() => navigate(s.path)}
              style={{ cursor: 'pointer', background: 'linear-gradient(145deg, #0f172a 0%, #020617 100%)' }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-3 rounded-4" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <h4 className="text-white fw-bold truncate mb-0">{s.title}</h4>
                      <small className="text-secondary opacity-75">{s.subtitle}</small>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1 position-relative mt-2" style={{ minHeight: '180px' }}>
                    <svg 
                        width="100%" 
                        height="200" 
                        viewBox="0 0 400 180" 
                        preserveAspectRatio="none" 
                        className="overflow-visible cursor-crosshair"
                        onMouseMove={(e) => handleMouseMove(e, s.id)}
                        onMouseLeave={() => handleMouseLeave(s.id)}
                    >
                         <defs>
                             <linearGradient id={`areaGrad-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                 <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
                                 <stop offset="100%" stopColor={s.color} stopOpacity="0.05" />
                             </linearGradient>
                             <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                         </defs>

                         {/* BACKGROUND REFERENCE ZONES */}
                         <rect x="0" y="20" width="400" height="30" fill="#ef4444" fillOpacity="0.03" /> {/* Critical Area */}
                         <rect x="0" y="50" width="400" height="70" fill={s.color} fillOpacity="0.05" /> {/* Optimal Zone */}
                         <rect x="0" y="120" width="400" height="30" fill="#f59e0b" fillOpacity="0.03" /> {/* Low Buffer */}

                         <text x="-5" y="30" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="end">CRITICAL</text>
                         <text x="-5" y="85" fill={s.color} fontSize="7" fontWeight="bold" textAnchor="end" opacity="0.5">OPTIMAL</text>
                         <text x="-5" y="145" fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="end">LOW</text>

                         {/* Trend Path */}
                         <path 
                             d={s.id === 'ag' 
                                 ? "M0 120 Q50 135 100 110 T200 40 T300 20 T400 80 V150 H0 Z" 
                                 : "M0 140 Q60 120 120 130 T240 90 T360 110 T400 100 V150 H0 Z"
                             } 
                             fill={`url(#areaGrad-${s.id})`} 
                         />
                         <path 
                             d={s.id === 'ag' 
                                 ? "M0 120 Q50 135 100 110 T200 40 T300 20 T400 80" 
                                 : "M0 140 Q60 120 120 130 T240 90 T360 110 T400 100"
                             } 
                             fill="none" 
                             stroke={s.color} 
                             strokeWidth="3" 
                             strokeLinecap="round" 
                             filter="url(#glow)"
                         />

                         {/* Peak indicators for 'Human Understanding' */}
                         {s.id === 'ag' ? (
                             <g transform="translate(300, 20)">
                                 <circle r="4" fill="#ef4444" className="pulse-dot" />
                                 <text y="-8" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle">PEAK FILL</text>
                             </g>
                         ) : (
                             <g transform="translate(240, 90)">
                                 <circle r="4" fill="#22c55e" className="pulse-dot" />
                                 <text y="-8" fill="#22c55e" fontSize="7" fontWeight="bold" textAnchor="middle">MAX FLOW</text>
                             </g>
                         )}

                         {hoverData[s.id] && (
                             <g style={{ pointerEvents: 'none' }}>
                                 <line x1={hoverData[s.id].x} y1="150" x2={hoverData[s.id].x} y2="20" stroke={s.color} strokeWidth="1" opacity="0.6" strokeDasharray="2,2" />
                                 <circle cx={hoverData[s.id].x} cy={150 - (hoverData[s.id].load * 1.3)} r="5" fill="#020617" stroke="#fff" strokeWidth="2" />
                                 <g transform={`translate(${hoverData[s.id].x > 320 ? -85 : 10}, 0)`}>
                                     <rect x={hoverData[s.id].x} y="30" width="80" height="50" rx="6" fill="#1e293b" className="shadow-lg border border-secondary border-opacity-20" />
                                     <text x={hoverData[s.id].x + 40} y="45" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">{hoverData[s.id].time}</text>
                                     <text x={hoverData[s.id].x + 40} y="60" fill="#fff" fontSize="11" fontWeight="900" textAnchor="middle">
                                         {hoverData[s.id].load}{s.id === 'ag' ? '%' : ' LPM'}
                                     </text>
                                     <text x={hoverData[s.id].x + 40} y="72" fill={hoverData[s.id].status === 'HIGH' ? '#ef4444' : '#22c55e'} fontSize="7" fontWeight="black" textAnchor="middle" letter-spacing="1">
                                         {hoverData[s.id].status} RANGE
                                     </text>
                                 </g>
                             </g>
                         )}

                         {['00:00', '06:00', '12:00', '18:00', '24:00'].map((t, i) => (
                             <text key={t} x={i * 100} y="170" fill="#475569" fontSize="9" textAnchor={i === 4 ? "end" : "middle"}>{t}</text>
                         ))}
                    </svg>
                </div>

                <div className="d-flex justify-content-between pt-4 border-top border-secondary border-opacity-10 mt-3">
                    <div className="text-start">
                        <small className="text-muted d-block mb-1 fs-10 fw-bold uppercase letter-spacing-1">{s.id === 'ag' ? 'Rooftop Storage' : 'Network Health'}</small>
                        <span className="text-white fs-8 fw-black">{s.id === 'ag' ? 'STABLE SUPPLY' : 'ACTIVE MONITORING'}</span>
                    </div>
                    <div className="text-center">
                        <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 px-3 py-1 fs-10 fw-bold uppercase">LIVE FEED</Badge>
                    </div>
                    <div className="text-end">
                        <small className="text-muted d-block mb-1 fw-bold uppercase letter-spacing-1">Current Load</small>
                        <span className="text-info fs-8 fw-black">{s.id === 'ag' ? 'High Capacity' : 'Normal Pressure'}</span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                   <div className="d-flex flex-column gap-1">
                      <div className="d-flex align-items-center gap-2 text-success">
                         <ShieldCheck size={16} />
                         <span className="fs-9 fw-bold">ALL ASSETS REPORTING HEALTHY</span>
                      </div>
                      <small className="text-secondary opacity-50 fs-11 fw-bold">
                        {s.id === 'ag' ? 'SYSTEM MAINTAINS OPTIMAL ROOFTOP HEAD PRESSURE' : 'ENSURING FIRE-SAFETY AND DOMESTIC BUFFER'}
                      </small>
                   </div>
                   <div className="navigate-badge d-flex align-items-center gap-2 text-info opacity-75">
                      <span className="fs-9 fw-bold">VIEW NETWORK MAP</span>
                      <ArrowRight size={16} />
                   </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
        <LayoutGrid size={20} className="text-info" />
        Infrastructure Analytics Bar
      </h5>
      <Row className="g-4">
        {[
            { label: 'SYSTEM PRESSURE', value: '4.2 BAR', trend: 'STABLE', color: 'text-success' },
            { label: 'POWER DRAW', value: '18.4 kW', trend: '+1.5%', color: 'text-primary' },
        ].map((m, i) => (
            <Col md={3} key={i}>
                <div className="p-3 rounded-4 bg-dark bg-opacity-20 border border-secondary border-opacity-10 h-100">
                    <small className="text-muted d-block mb-1 fs-10 fw-bold letter-spacing-1">{m.label}</small>
                    <div className="d-flex align-items-end justify-content-between">
                        <span className={`fs-4 fw-black ${m.color}`}>{m.value}</span>
                        <small className="text-secondary fs-10 opacity-50 mb-1">{m.trend}</small>
                    </div>
                </div>
            </Col>
        ))}
      </Row>

      <style dangerouslySetInnerHTML={{ __html: `
        .interactive-overview-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .interactive-overview-card:hover { transform: translateY(-8px); border: 1px solid rgba(56, 189, 248, 0.3) !important; }
        .interactive-overview-card:hover .navigate-badge { transform: translateX(4px); opacity: 1 !important; }
        .fw-black { font-weight: 900 !important; }
        .fs-11 { font-size: 0.55rem; }
        .letter-spacing-1 { letter-spacing: 1px; }
        .letter-spacing-2 { letter-spacing: 2px; }
        .fs-10 { font-size: 0.65rem; }
        .fs-9 { font-size: 0.75rem; }
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.5); }
        .sparkline-path { stroke-dasharray: 200; stroke-dashoffset: 200; animation: draw-spark 2s ease-out forwards; }
        .cursor-crosshair { cursor: crosshair; }
        @keyframes draw-spark { to { stroke-dashoffset: 0; } }
        .tracking-tight { letter-spacing: -1px; }
        .gateway-monitor { backdrop-filter: blur(10px); }
      `}} />
    </div>
  );
};

export default WaterOverview;

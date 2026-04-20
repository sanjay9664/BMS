import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Row, Col, Card, Button, Form, Badge, Modal } from 'react-bootstrap';
import { Activity, Zap, ShieldCheck, Play, Square, Info, ArrowRight, Droplets, ToggleRight, ToggleLeft, X, Layers, Gauge, Maximize, Minimize } from 'lucide-react';
import PdfButton from '../../components/PdfButton';

const UgTank = () => {
  const [activeStation, setActiveStation] = useState(1);
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const [pumps1, setPumps1] = useState([
    { id: 1, status: 'Running', mode: 'AUTO', hz: '50.0', amp: '12.2', pressure: 3.8, startLimit: 1.5, stopLimit: 4.5 },
    { id: 2, status: 'Running', mode: 'AUTO', hz: '50.0', amp: '12.0', pressure: 3.7, startLimit: 1.5, stopLimit: 4.5 },
    { id: 3, status: 'Running', mode: 'AUTO', hz: '50.0', amp: '12.8', pressure: 4.1, startLimit: 1.5, stopLimit: 4.5 },
    { id: 4, status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: 0.0, startLimit: 1.5, stopLimit: 4.5 },
  ]);

  const [pumps2, setPumps2] = useState([
    { id: 1, status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: 0.0, startLimit: 1.5, stopLimit: 4.5 },
    { id: 2, status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: 0.0, startLimit: 1.5, stopLimit: 4.5 },
    { id: 3, status: 'Running', mode: 'MANUAL', hz: '48.5', amp: '11.5', pressure: 3.2, startLimit: 1.5, stopLimit: 4.5 },
    { id: 4, status: 'Running', mode: 'AUTO', hz: '50.0', amp: '12.2', pressure: 3.9, startLimit: 1.5, stopLimit: 4.5 },
  ]);

  const [tanks] = useState([
    { id: 1, name: 'FIRE RESERVOIR', level: 88, desc: 'PRIMARY FIRE' },
    { id: 2, name: 'DOMESTIC SUMP', level: 62, desc: 'POTABLE SUPPLY' },
    { id: 3, name: 'PROCESS TANK', level: 45, desc: 'INDUSTRIAL RECLAIM' },
  ]);

  const [selectedPump, setSelectedPump] = useState(null);
  const [showPumpModal, setShowPumpModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitForm, setLimitForm] = useState({ start: 0, stop: 0 });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) pageRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const getJitter = () => (Math.random() - 0.5) * 0.15;
      setPumps1(prev => prev.map(p => p.status === 'Running' ? { ...p, pressure: Math.max(0, p.pressure + getJitter()) } : p));
      setPumps2(prev => prev.map(p => p.status === 'Running' ? { ...p, pressure: Math.max(0, p.pressure + getJitter()) } : p));
      setPulseTrigger(prev => prev + 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const activePumps = activeStation === 1 ? pumps1 : pumps2;
  const isAnyPumpRunning = useMemo(() => activePumps.some(p => p.status === 'Running'), [activePumps]);

  const masterPressureValue = useMemo(() => {
    if (!isAnyPumpRunning) return 0.0;
    const active = activePumps.filter(p => p.status === 'Running');
    return active.reduce((acc, curr) => acc + curr.pressure, 0) / active.length;
  }, [activePumps, isAnyPumpRunning]);

  const masterRotation = useMemo(() => {
    const angle = (masterPressureValue / 10) * 270 - 135;
    return Math.min(Math.max(angle, -135), 135);
  }, [masterPressureValue]);

  const handlePumpControl = (id, updates) => {
    const setter = activeStation === 1 ? setPumps1 : setPumps2;
    setter(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selectedPump && selectedPump.id === id) setSelectedPump(prev => ({ ...prev, ...updates }));
  };

  const openPumpSettings = (p) => {
    setSelectedPump(p);
    setShowPumpModal(true);
  };

  const openLimitSettings = (e, p) => {
    e.stopPropagation();
    setSelectedPump(p);
    setLimitForm({ start: p.startLimit, stop: p.stopLimit });
    setShowLimitModal(true);
  };

  const handleApplyLimits = () => {
    handlePumpControl(selectedPump.id, { startLimit: parseFloat(limitForm.start), stopLimit: parseFloat(limitForm.stop) });
    setShowLimitModal(false);
  };

  return (
    <div className={`fade-in p-2 ${isFullscreen ? 'fullscreen-scada-page' : ''}`} ref={pageRef}>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 text-white fw-bold">UG Pump Network{isFullscreen ? ' [ENLARGED]' : ''}</h2>
          <small className="text-secondary fw-bold">STATION MONITORING & CONTROL</small>
        </div>
        <div className="d-flex gap-2">
            <Button variant="info" size="sm" className="fw-bold px-3" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={16} className="me-2" /> : <Maximize size={16} className="me-2" />} 
                {isFullscreen ? 'NORMAL VIEW' : 'EXPAND VIEW'}
            </Button>
            <PdfButton />
        </div>
      </div>

      <Row className="g-3 mb-4">
        {[1, 2].map(station => (
            <Col md={6} key={station}>
                <div className={`p-3 rounded-4 border ${activeStation === station ? 'border-info bg-info bg-opacity-10' : 'border-secondary border-opacity-20 bg-dark bg-opacity-20'}`} onClick={() => setActiveStation(station)} style={{ cursor: 'pointer' }}>
                    <h6 className="mb-0 text-white fw-bold">UG PUMP STATION #0{station}</h6>
                </div>
            </Col>
        ))}
      </Row>

      <Card className="bg-transparent border-0 mb-4 overflow-hidden shadow-2xl">
        <div className="scada-schematic-bg rounded-4 border border-secondary border-opacity-10 overflow-auto" 
             style={{ backgroundColor: '#020408', position: 'relative', height: isFullscreen ? 'calc(100vh - 250px)' : 'auto' }}>
          
          <div className="station-label-header p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
             <div className="text-white fw-bold fs-7 letter-spacing-2">UNIT STATION #0{activeStation} MONITORING</div>
             <div className="d-flex align-items-center gap-5">
                <div className="text-center">
                    <small className="text-secondary d-block fs-10 fw-bold">PRESSURE</small>
                    <span className="text-white fw-black fs-4">{masterPressureValue.toFixed(1)} <small className="fs-9 text-info">BAR</small></span>
                </div>
                <div className="text-center border-start border-secondary border-opacity-20 ps-5">
                    <small className="text-secondary d-block fs-10 fw-bold">FLOW</small>
                    <span className="text-white fw-black fs-4">{isAnyPumpRunning ? "2450" : "0"} <small className="fs-9 text-info">LPM</small></span>
                </div>
             </div>
          </div>

          <div style={{ minWidth: '1200px', height: isFullscreen ? '750px' : '620px', padding: '40px' }}>
              <svg width="1200" height={isFullscreen ? "720" : "540"} viewBox="0 0 1200 540" preserveAspectRatio="xMidYMid meet" 
                   style={{ transformOrigin: 'top left', transform: isFullscreen ? 'scale(1.15) translateY(-50px)' : 'none', transition: 'all 0.5s ease' }}>
                  
                  <defs>
                     <pattern id="thickGrid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="1"/></pattern>
                     <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#0369a1" /></linearGradient>
                      <filter id="liquidGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      <pattern id="wavePattern" x="0" y="0" width="80" height="20" patternUnits="userSpaceOnUse"><path d="M0 15 Q20 0 40 15 T80 15 V20 H0 Z" fill="#38bdf8" /><animateTransform attributeName="patternTransform" type="translate" from="0 0" to="80 0" dur="4s" repeatCount="indefinite" /></pattern>
                      <clipPath id="tankInnerClip"><rect x="0" y="0" width="180" height="130" rx="8" /></clipPath>
                  </defs>
                  
                  <rect width="100%" height="100%" fill="url(#thickGrid)" />
                  <text x="60" y="30" fill="#f59e0b" fontSize="11" fontWeight="900">INLET RESERVOIRS</text>
                  <text x="320" y="30" fill="#64748b" fontSize="11" fontWeight="900">MAIN MANIFOLD SYSTEM</text>

                  {tanks.map((tank, idx) => {
                      const yPos = 40 + (idx * 160);
                      return (
                          <g key={tank.id} transform={`translate(60, ${yPos})`}>
                              <rect width="180" height="130" rx="10" fill="#0c121e" stroke="#1e293b" strokeWidth={isFullscreen ? 4 : 3} />
                              <g clipPath="url(#tankInnerClip)">
                                  <rect x="0" y={130 - (tank.level * 1.3)} width="180" height={tank.level * 1.3} fill="url(#waterGrad)" fillOpacity="0.7" />
                                  <rect x="0" y={125 - (tank.level * 1.3)} width="180" height="20" fill="url(#wavePattern)" fillOpacity="0.8" />
                                  <text x="90" y="75" textAnchor="middle" fill="#fff" fontSize="42" fontWeight="900" filter="url(#liquidGlow)">{tank.level}%</text>
                              </g>
                              <text x="90" y="152" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900">{tank.name}</text>
                              <path d="M180 65 L220 65" fill="none" stroke="#1e293b" strokeWidth="18" />
                          </g>
                      )
                  })}

                  {/* Tank to Manifold 1 Flow (High Intensity) */}
                  {[105, 265, 425].map((y) => (
                      <g key={y}>
                          <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#1e293b" strokeWidth="26" strokeLinecap="round" />
                          {isAnyPumpRunning && (
                              <g>
                                  <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#0077be" strokeWidth="18" strokeOpacity="0.4" />
                                  <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#38bdf8" strokeWidth="18" strokeDasharray="30,20">
                                      <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.8s" repeatCount="indefinite" />
                                  </path>
                              </g>
                          )}
                      </g>
                  ))}
                  
                  <path d="M280 100 L280 435" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
                  <path d="M280 270 L360 270" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
                  {isAnyPumpRunning && (
                      <g>
                          <path d="M280 270 L360 270" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
                          <path d="M280 270 L360 270" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
                              <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1s" repeatCount="indefinite" />
                          </path>
                      </g>
                  )}
                  <path d="M360 80 L360 450" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />

                  {isAnyPumpRunning && (
                    <g>
                        <path d="M280 100 L280 435" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
                        <path d="M280 100 L280 435" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
                            <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1.2s" repeatCount="indefinite" />
                        </path>
                        <path d="M360 80 L360 450" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
                        <path d="M360 80 L360 450" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
                            <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1.2s" repeatCount="indefinite" />
                        </path>
                    </g>
                  )}

                  {[80, 180, 280, 380].map((y, i) => {
                      const p = activePumps[i];
                      const active = p.status === 'Running';
                      return (
                      <g key={i} onClick={() => openPumpSettings(p)} style={{ cursor: 'pointer' }}>
                           <path d={`M360 ${y + 35} L440 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                           {active && (<path d={`M360 ${y + 35} L440 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10"><animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" /></path>)}
                           <g transform={`translate(460, ${y + 35})`}>
                               <circle r="38" fill="#111827" stroke={active ? "#22c55e" : "#334155"} strokeWidth="4" />
                               {active && (
                                   <circle r="46" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="8,6" opacity="0.8">
                                       <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite" />
                                   </circle>
                               )}
                               <Droplets size={32} x="-16" y="-16" className={active ? "text-success" : "text-muted"} />
                           </g>
                           
                           {/* Circle to Label Connection */}
                           <path d={`M498 ${y + 35} L540 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                           {active && (
                               <path d={`M498 ${y + 35} L540 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10">
                                   <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                               </path>
                           )}

                           <g transform={`translate(540, ${y + 5})`}>
                               <rect width="200" height="60" rx="8" fill="#0f172a" fillOpacity="0.9" stroke="#1e293b" strokeWidth="2" />
                               <text x="14" y="20" fill="#94a3b8" fontSize="9" fontWeight="bold">PUMP P{p.id}</text>
                               <text x="14" y="44" fill={active ? "#22c55e" : "#475569"} fontSize="17" fontWeight="900">{p.status.toUpperCase()}</text>
                               <g transform="translate(165, 30)" style={{ cursor: 'pointer' }} onClick={(e) => openLimitSettings(e, p)}>
                                    <circle r="22" fill="#111827" stroke="#334155" strokeWidth="1.5" />
                                    
                                    {/* Numeric Scale */}
                                    {[0, 2.5, 5, 7.5, 10].map(v => {
                                        const angle = (v / 10) * 270 - 135;
                                        const x = Math.sin(angle * Math.PI / 180) * 16;
                                        const y = -Math.cos(angle * Math.PI / 180) * 16;
                                        return (
                                            <text key={v} x={x} y={y + 3} textAnchor="middle" fill="#94a3b8" fontSize="5" fontWeight="bold">
                                                {v}
                                            </text>
                                        )
                                    })}

                                    {/* Tick Marks */}
                                    {[...Array(21)].map((_, i) => {
                                        const val = i * 0.5;
                                        const angle = (val / 10) * 270 - 135;
                                        return <line key={i} x1="0" y1="-21" x2="0" y2={i % 2 === 0 ? "-17" : "-19"} stroke="#334155" strokeWidth="0.5" transform={`rotate(${angle})`} />
                                    })}

                                    {/* User Set Limits (Markers) */}
                                    <line x1="0" y1="-22" x2="0" y2="-15" stroke="#22c55e" strokeWidth="2.5" transform={`rotate(${(p.startLimit / 10) * 270 - 135})`} style={{ transition: 'all 0.5s ease' }} />
                                    <line x1="0" y1="-22" x2="0" y2="-15" stroke="#ef4444" strokeWidth="2.5" transform={`rotate(${(p.stopLimit / 10) * 270 - 135})`} style={{ transition: 'all 0.5s ease' }} />
                                    
                                    {/* Needle */}
                                    <line x1="0" y1="0" x2="0" y2="-19" stroke={active ? "#ef4444" : "#475569"} strokeWidth="2" strokeLinecap="round" transform={`rotate(${(p.pressure / 10) * 270 - 135})`} style={{ transition: 'transform 0.8s ease-out' }} />
                                    <circle r="2.5" fill="#fff" />
                                    
                                    <text y="24" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="900">{active ? p.pressure.toFixed(1) : "0.0"} <small style={{fontSize: '6px'}}>kg/cm²</small></text>
                               </g>
                           </g>
                           {/* Pump Output Connection to Final Manifold */}
                           <path d={`M740 ${y + 35} L820 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                           {active && (
                               <path d={`M740 ${y + 35} L820 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10">
                                   <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                               </path>
                           )}
                       </g>);})}

                  <path d="M820 70 L820 460 L1040 460" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
                  {isAnyPumpRunning && (<path d="M820 75 L820 460 L1050 460" fill="none" stroke="#38bdf8" strokeWidth={isFullscreen ? 18 : 14} strokeOpacity="0.8" strokeDasharray="30,20" filter="url(#liquidGlow)"><animate attributeName="stroke-dashoffset" from="50" to="0" dur="1s" repeatCount="indefinite" /></path>)}

                  <g transform="translate(935, 230)">
                     <circle r={isFullscreen ? 95 : 75} fill="#f8fafc" stroke="#94a3b8" strokeWidth={isFullscreen ? 8 : 6} />
                     <circle r={isFullscreen ? 88 : 70} fill="none" stroke="#334155" strokeWidth="1" />
                     {[...Array(11)].map((_, t) => (<line key={t} x1="0" y1={isFullscreen ? "-85" : "-65"} x2="0" y2={t % 2 === 0 ? (isFullscreen ? "-65" : "-48") : (isFullscreen ? "-75" : "-55")} stroke={t > 7 ? "#ef4444" : "#1e293b"} strokeWidth={t % 2 === 0 ? "4" : "2"} transform={`rotate(${t * 27 - 135})`} />))}
                     <circle r="10" fill="#1e293b" /><g transform={`rotate(${masterRotation})`} style={{ transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}><path d="M-6 0 L0 -85 L6 0 Z" fill="#1e293b" /></g>
                     <text x="0" y={isFullscreen ? 120 : 98} textAnchor="middle" fill="#fff" fontSize={isFullscreen ? 26 : 19} fontWeight="900" filter="url(#liquidGlow)">{masterPressureValue.toFixed(1)} BAR</text>
                  </g>
                  <text x="1040" y="495" textAnchor="end" fill="#38bdf8" fontSize={isFullscreen ? 28 : 20} fontWeight="900">➤ DIRECT TO ROOFTOP NETWORK</text>
              </svg>
          </div>
        </div>
      </Card>

      <Modal show={showLimitModal} onHide={() => setShowLimitModal(false)} centered contentClassName="bg-dark border-secondary shadow-lg">
        {selectedPump && (
          <Modal.Body className="p-4 text-white">
                <div className="text-center mb-4"><h5 className="fw-bold text-info">PUMP P{selectedPump.id} THRESHOLD SETUP</h5></div>
                <div className="bg-black bg-opacity-30 p-4 rounded-4 mb-4 border border-secondary border-opacity-10">
                    <Form.Group className="mb-4">
                        <Form.Label className="fs-9 text-muted uppercase fw-bold mb-2">AUTO-START THRESHOLD (kg/cm²)</Form.Label>
                        <Form.Control type="number" step="0.1" value={limitForm.start} onChange={(e) => setLimitForm({...limitForm, start: e.target.value})} className="bg-dark border-secondary text-white fw-bold fs-4" />
                        <small className="text-secondary opacity-50 fs-10 mt-1 d-block">PUMP WILL IGNITE BELOW THIS PRESSURE</small>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fs-9 text-muted uppercase fw-bold mb-2">AUTO-STOP THRESHOLD (kg/cm²)</Form.Label>
                        <Form.Control type="number" step="0.1" value={limitForm.stop} onChange={(e) => setLimitForm({...limitForm, stop: e.target.value})} className="bg-dark border-secondary text-white fw-bold fs-4" />
                        <small className="text-secondary opacity-50 fs-10 mt-1 d-block">PUMP WILL TERMINATE ABOVE THIS PRESSURE</small>
                    </Form.Group>
                </div>
                <div className="d-flex gap-3 mt-4">
                    <Button variant="outline-secondary" className="w-100 py-2 fw-bold" onClick={() => setShowLimitModal(false)}>CANCEL</Button>
                    <Button variant="info" className="w-100 py-2 fw-bold" onClick={handleApplyLimits}>APPLY CONFIG</Button>
                </div>
          </Modal.Body>
        )}
      </Modal>

      <Modal show={showPumpModal} onHide={() => setShowPumpModal(false)} centered contentClassName="bg-dark border-secondary shadow-lg">
        {selectedPump && (
          <Modal.Body className="p-4 text-white">
                <div className="text-center mb-4"><h5 className="fw-bold text-info">PUMP P{selectedPump.id} MANIFEST</h5></div>

                <div className="d-flex justify-content-between align-items-center p-3 rounded-4 bg-black bg-opacity-50 border border-secondary mb-4">
                    <div className="fw-bold">SYSTEM MODE</div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="fs-9 fw-bold">AUTO</span>
                        <div onClick={() => handlePumpControl(selectedPump.id, { mode: selectedPump.mode === 'AUTO' ? 'MANUAL' : 'AUTO' })} style={{ cursor: 'pointer' }}>
                            {selectedPump.mode === 'AUTO' ? <ToggleRight className="text-info" size={36} /> : <ToggleLeft className="text-muted" size={36} />}
                        </div>
                        <span className="fs-9 fw-bold">MANUAL</span>
                    </div>
                </div>
                <Row className="g-3">
                    <Col xs={6}><Button variant="success" className="w-100 py-3 fw-bold" disabled={selectedPump.mode === 'AUTO'} onClick={() => handlePumpControl(selectedPump.id, { status: 'Running', hz: '50.0' })}>START</Button></Col>
                    <Col xs={6}><Button variant="danger" className="w-100 py-3 fw-bold" disabled={selectedPump.mode === 'AUTO'} onClick={() => handlePumpControl(selectedPump.id, { status: 'Stopped', hz: '0.0' })}>STOP</Button></Col>
                </Row>
          </Modal.Body>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .fullscreen-scada-page { background-color: #020617 !important; height: 100vh !important; width: 100vw !important; padding: 40px !important; overflow-y: auto !important; }
        .scada-schematic-bg { transition: all 0.5s ease; background-image: radial-gradient(circle at 50% 50%, #0a1118 0%, #020408 100%); }
        .scada-selector-tile { background-color: #0c121e; cursor: pointer; transition: all 0.3s ease; }
        .scada-selector-tile.active-station { background-color: #0d1525; border-color: #38bdf8 !important; }
        .text-info { color: #38bdf8 !important; }
        .fw-black { font-weight: 900 !important; }
        .fs-10 { font-size: 0.65rem; }
        .fs-9 { font-size: 0.75rem; }
      `}} />
    </div>
  );
};

export default UgTank;

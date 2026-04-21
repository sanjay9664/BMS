import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Row, Col, Card, Tooltip, OverlayTrigger, Form, Button, Modal, Badge } from 'react-bootstrap';
import { Home, Waves, LayoutGrid, Settings, Save, AlertCircle, CheckCircle2, XCircle, Activity, X, Droplets, ToggleRight, ToggleLeft, Maximize, Minimize, ShieldCheck } from 'lucide-react';
import PdfButton from '../../components/PdfButton';

const AgTank = () => {
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showConfig, setShowConfig] = useState(false);
  const [tempDomesticCount, setTempDomesticCount] = useState(24);
  const [domesticCount, setDomesticCount] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageRef = useRef(null);

  // Status Filter Sync
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const totalTanks = 48;

  // Initialize tanks with valve states
  const [allTanks, setAllTanks] = useState(() =>
    Array.from({ length: totalTanks }, (_, i) => ({
      id: i + 1,
      type: i < 24 ? 'DOMESTIC' : 'FLUSHING',
      level: Math.floor(Math.random() * 100),
      status: Math.random() > 0.92 ? 'Fault' : Math.random() > 0.85 ? 'Warning' : 'Running',
      valveMode: 'AUTO',
      valveStatus: 'OPEN'
    }))
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) pageRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const updateTankValve = (id, updates) => {
    const userRole = localStorage.getItem('userRole') || 'user';
    if (userRole !== 'admin') {
      setActionFeedback("ACCESS DENIED: ADMIN ONLY");
      setTimeout(() => setActionFeedback(null), 1500);
      return;
    }

    setAllTanks(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          let syncedUpdates = { ...updates };
          // Synchronize Valve and Status for "Same Value" logic
          if (updates.valveStatus === 'OPEN') syncedUpdates.status = 'Running';
          if (updates.valveStatus === 'CLOSE') syncedUpdates.status = 'Stopped';
          if (updates.status === 'Running') syncedUpdates.valveStatus = 'OPEN';
          if (updates.status === 'Stopped') syncedUpdates.valveStatus = 'CLOSE';

          return { ...t, ...syncedUpdates };
        }
        return t;
      });

      if (selectedTank && selectedTank.id === id) {
        const currentItem = next.find(t => t.id === id);
        setSelectedTank(currentItem);
      }
      return next;
    });

    if (updates.valveStatus) {
      setActionFeedback(`${updates.valveStatus === 'OPEN' ? 'STARTED' : 'STOPPED'} SUCCESSFULLY`);
      setTimeout(() => setActionFeedback(null), 800);
       // Auto-hide modal after brief success visualization
       setTimeout(() => setShowValveModal(false), 500);
    }
  };

  // Re-allocate types when configuration changes
  useMemo(() => {
    setAllTanks(prev => prev.map((t, i) => ({
      ...t,
      type: i < domesticCount ? 'DOMESTIC' : 'FLUSHING'
    })));
  }, [domesticCount]);

  // Comprehensive Stats Calculation including Sector Counts
  const stats = useMemo(() => {
    const s = {
      total: { running: 0, fault: 0, warning: 0, healthy: 0, all: totalTanks },
      domestic: { running: 0, fault: 0, warning: 0, healthy: 0, count: domesticCount },
      flushing: { running: 0, fault: 0, warning: 0, healthy: 0, count: totalTanks - domesticCount }
    };

    allTanks.forEach(t => {
      const statusKey = t.status.toLowerCase();
      if (t.status === 'Running') {
        s.total.healthy++;
        if (t.type === 'DOMESTIC') s.domestic.healthy++;
        else s.flushing.healthy++;
      }
      s.total[statusKey]++;
      if (t.type === 'DOMESTIC') s.domestic[statusKey]++;
      else s.flushing[statusKey]++;
    });

    return s;
  }, [allTanks, domesticCount]);

  const filteredTanks = allTanks.filter(t => {
    const matchesSector = sectorFilter === 'ALL' || t.type === sectorFilter;
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'RUNNING' && t.status === 'Running') ||
      (statusFilter === 'FAULT' && t.status === 'Fault') ||
      (statusFilter === 'WARNING' && t.status === 'Warning') ||
      (statusFilter === 'ACTIVE' && (t.status === 'Running' || t.status === 'Warning'));
    return matchesSector && matchesStatus;
  });

  const getTankColor = (type, level, status, valveStatus) => {
    if (valveStatus === 'CLOSE') return '#71717a'; // Gray inside when closed
    if (status === 'Fault') return '#ef4444';
    if (level < 20) return '#f59e0b';
    return '#38bdf8'; // Constant Blue inside when open
  };

  const handleTankClick = (tank) => {
    setSelectedTank(tank);
    setShowValveModal(true);
  };

  // Valve Control States
  const [selectedTank, setSelectedTank] = useState(null);
  const [showValveModal, setShowValveModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  return (
    <div className={`fade-in p-2 ${isFullscreen ? 'fullscreen-scada-page' : ''}`} ref={pageRef}>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 text-white fw-bold">AG Tank Master Control</h2>
          <p className="text-secondary fs-8 opacity-75">Industrial Dashboard | Active Sector Allotment: {domesticCount} Domestic / {48 - domesticCount} Flushing</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="info" size="sm" className="d-flex align-items-center fw-bold shadow-sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={16} className="me-2" /> : <Maximize size={16} className="me-2" />}
            {isFullscreen ? 'NORMAL VIEW' : 'EXPAND VIEW'}
          </Button>
          <Button variant="outline-info" size="sm" className="d-flex align-items-center" onClick={() => setShowConfig(true)}>
            <Settings size={16} className="me-2" /> Sector Config
          </Button>
          <PdfButton />
        </div>
      </div>

      {/* QUICK STATUS BAR (Numbers for Running, Fault, etc) */}
      <Row className="g-3 mb-4">
        {[
          { id: 'RUNNING', label: 'Healthy', value: stats.total.healthy, icon: <CheckCircle2 size={16} />, color: 'success' },
          { id: 'FAULT', label: 'Critical', value: stats.total.fault, icon: <XCircle size={16} />, color: 'danger' },
          { id: 'WARNING', label: 'Warnings', value: stats.total.warning, icon: <AlertCircle size={16} />, color: 'warning' },
          { id: 'ACTIVE', label: 'Active', value: stats.total.running + stats.total.warning, icon: <Activity size={16} />, color: 'info' }
        ].map((item) => (
          <Col md={3} key={item.id}>
            <div
              className={`status-filter-card p-2 bg-dark rounded border-bottom border-3 border-${item.color} ${statusFilter === item.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === item.id ? 'ALL' : item.id)}
              style={{ cursor: 'pointer' }}
            >
              <small className="text-muted d-flex align-items-center gap-2 mb-1">
                {item.icon} {item.label}
              </small>
              <h3 className={`mb-0 fw-bold text-${item.color}`}>{item.value}</h3>
            </div>
          </Col>
        ))}
      </Row>

      {/* SECTOR FILTERS WITH NUMBERS (Domestic, Flushing, All) */}
      <Row className="g-3 mb-4">
        {[
          { id: 'DOMESTIC', label: 'DOMESTIC', count: stats.domestic.count, icon: <Home size={16} />, color: 'info' },
          { id: 'FLUSHING', label: 'FLUSHING', count: stats.flushing.count, icon: <Waves size={16} />, color: 'success' },
          { id: 'ALL', label: 'SYSTEM TOTAL', count: stats.total.all, icon: <LayoutGrid size={16} />, color: 'secondary' }
        ].map(mode => (
          <Col md={4} key={mode.id}>
            <div className={`filter-tile ${sectorFilter === mode.id ? 'active ' + mode.id.toLowerCase() : ''}`} onClick={() => setSectorFilter(mode.id)}
              style={{ cursor: 'pointer', transition: '0.3s' }}>
              <div className="d-flex align-items-center justify-content-between p-2 px-3">
                <div className="d-flex align-items-center">
                  <div className={`tile-icon me-3 bg-${mode.color} bg-opacity-10 text-${mode.color} p-2 rounded`}>
                    {mode.icon}
                  </div>
                  <h6 className="mb-0 fw-bold text-white uppercase">{mode.label}</h6>
                </div>
                <div className="text-end">
                  <span className="fs-5 fw-black text-white">{mode.count}</span>
                  <small className="text-muted d-block fs-10 fw-bold">UNITS</small>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div className={`scada-card ${isFullscreen ? 'p-5' : 'p-4'}`}>
        <Row className="g-4">
          {filteredTanks.map((tank) => (
            <Col key={tank.id} xs={isFullscreen ? 2 : 3} md={isFullscreen ? 1 : 2} lg={isFullscreen ? 1 : 1}>
              <div
                className={`tank-unit-wrapper p-2 rounded text-center position-relative ${tank.status === 'Stopped' ? 'tank-stopped-outline' : ''} ${isFullscreen ? 'expanded-unit' : ''}`}
                onClick={() => handleTankClick(tank)}
                style={{ cursor: 'pointer' }}
              >
                <div className="tank-assembly-anchor mx-auto position-relative" style={{ width: isFullscreen ? '48px' : '36px' }}>
                  <div 
                    className={`tank-vessel ${isFullscreen ? 'vessel-large' : ''} ${tank.valveStatus === 'CLOSE' ? 'vessel-closed-state' : ''} ${tank.status === 'Stopped' ? 'vessel-stopped' : ''}`}
                    style={{ borderColor: '#475569' }}
                  >
                    <div className="tank-fill" style={{ height: `${tank.level}%`, backgroundColor: getTankColor(tank.type, tank.level, tank.status, tank.valveStatus) }}>
                      <div className="tank-water-wave"></div>
                    </div>
                  </div>
                  <div className="valve-connector-pipe"></div>
                  <div className={`industrial-valve-node ${tank.valveStatus === 'OPEN' ? 'valve-open' : 'valve-closed'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 6L20 18V6L4 18V6Z" 
                            fill={tank.valveStatus === 'OPEN' ? '#22c55e' : '#ef4444'} 
                            stroke={tank.valveStatus === 'OPEN' ? '#22c55e' : '#ef4444'} 
                            strokeWidth="2"
                            style={{ transition: 'all 0.3s ease', filter: tank.valveStatus === 'OPEN' ? 'drop-shadow(0 0 5px #22c55e)' : 'drop-shadow(0 0 5px #ef4444)' }} />
                      <rect x="11" y="2" width="2" height="6" fill="#94a3b8" />
                      <rect x="9" y="2" width="6" height="1" fill="#94a3b8" />
                    </svg>
                  </div>
                  {/* Discharge Flow Animation - Reacts to both Valve and Operation Status */}
                  {tank.valveStatus === 'OPEN' && tank.status === 'Running' && (
                    <div className="discharge-manifold-system">
                      
                    </div>
                  )}
                </div>
                <div className={`fw-bold text-white mb-0 mt-1 ${isFullscreen ? 'fs-7' : 'fs-10'}`}>
                  {tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-{tank.id}
                </div>
                <div className={`opacity-75 ${isFullscreen ? 'fs-7' : 'fs-10'}`} style={{ color: getTankColor(tank.type, tank.level, tank.status, tank.valveStatus) }}>{tank.level}%</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .tank-unit-wrapper { transition: all 0.3s ease; }
        .tank-stopped-outline { border: 1px dashed rgba(255,255,255,0.1); }
        .vessel-stopped { border-style: dashed !important; opacity: 0.7; }
        .valve-inactive { color: #475569 !important; filter: none !important; }
        .expanded-unit { transform: scale(1.35); margin-bottom: 25px; }
        .vessel-large { width: 48px !important; height: 62px !important; border-width: 3px !important; }
        .filter-tile { background-color: #0f172a; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; }
        .filter-tile:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); }
        .filter-tile.active.domestic { border-bottom: 4px solid #38bdf8; background-color: rgba(56, 189, 248, 0.1); }
        .filter-tile.active.flushing { border-bottom: 4px solid #10b981; background-color: rgba(16, 185, 129, 0.1); }
        .filter-tile.active.all { border-bottom: 4px solid #94a3b8; background-color: rgba(148, 163, 184, 0.1); }
        .status-filter-card:hover { transform: translateY(-2px); background-color: rgba(255,255,255,0.02); }
        .status-filter-card.active { border-bottom-width: 4px !important; background-color: rgba(255,255,255,0.05); }
        .tank-vessel { width: 36px; height: 50px; border: 3px solid #475569; border-radius: 6px; background: #0c121e; position: relative; overflow: hidden; transition: 0.4s; box-shadow: 0 0 10px rgba(0,0,0,0.3); }
        .vessel-closed-state { background: #1e293b !important; border-color: #334155 !important; }
        .tank-fill { position: absolute; bottom: 0; left: 0; width: 100%; transition: height 1s; }
        .tank-water-wave { position: absolute; top: -4px; width: 100%; height: 8px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 28'%3E%3Cpath d='M0 28h120V12C90 12 90 0 60 0S30 12 0 12z' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E"); background-size: 30px 8px; animation: ag-wave 2s linear infinite; }
        @keyframes ag-wave { from { background-position-x: 0; } to { background-position-x: 30px; } }
        .industrial-valve-node { width: 24px; height: 16px; position: absolute; top: 45%; right: -24px; transform: translateY(-50%) rotate(90deg); display: flex; align-items: center; justify-content: center; z-index: 10; transition: 0.3s; }
        .vessel-large + .valve-connector-pipe { width: 20px !important; height: 8px !important; }
        .expanded-unit .industrial-valve-node { right: -32px; transform: translateY(-50%) rotate(90deg) scale(1.3); }
        .valve-connector-pipe { position: absolute; top: 45%; left: 100%; width: 14px; height: 6px; background: #475569; transform: translateY(-50%); z-index: 5; }
        .valve-handle-stem { width: 3px; height: 8px; background: #94a3b8; position: absolute; top: -3px; left: 10px; border-radius: 1px; }
        .valve-body-wing { width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; }
        
        .discharge-manifold-system { position: absolute; top: 45%; left: calc(100% + 24px); width: 20px; height: 100%; transform: translateY(-50%); }
        .horizontal-stream { width: 30px; height: 6px; background: rgba(71, 85, 105, 0.5); position: relative; overflow: hidden; border-radius: 0 4px 4px 0; }
        .stream-pulse { position: absolute; top: 0; left: 0; height: 100%; width: 50%; background: linear-gradient(90deg, transparent, #38bdf8, transparent); animation: stream-flow 1s linear infinite; }
        
        @keyframes stream-flow { from { transform: translateX(-100%); } to { transform: translateX(200%); } }

        .fw-black { font-weight: 900 !important; }
        .fs-10 { font-size: 0.65rem; }
        .fs-9 { font-size: 0.75rem; }
        .fs-7 { font-size: 1.1rem; }
        .custom-modal-wide { width: 85% !important; max-width: 85% !important; }
        .fade-in { animation: ag-fadeIn 0.5s ease-out; }
        .scale-in { animation: ag-scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes ag-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ag-scaleIn { from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
      `}} />

      {/* Control Modals */}
      {/* Control Modals */}
      <Modal show={showValveModal} onHide={() => setShowValveModal(false)} centered size="lg" contentClassName="bg-dark border-secondary shadow-lg custom-modal-wide">
        {selectedTank && (
          <Modal.Body className="p-5 text-white">
            <div className="text-center mb-4">
              <h5 className="fw-bold text-info">
                {selectedTank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-{selectedTank.id} CONTROL
              </h5>
            </div>

            <div className="d-flex justify-content-between align-items-center p-3 rounded-4 bg-black bg-opacity-50 border border-secondary mb-4">
              <div className="fw-bold fs-9">AUTO / MANUAL OVERRIDE</div>
              <div className="d-flex align-items-center gap-2">
                <span className={`fs-10 fw-bold ${selectedTank.valveMode === 'MANUAL' ? 'text-info' : 'text-muted opacity-50'}`}>MANUAL</span>
                <div onClick={() => updateTankValve(selectedTank.id, { valveMode: selectedTank.valveMode === 'AUTO' ? 'MANUAL' : 'AUTO' })} style={{ cursor: 'pointer' }}>
                  {selectedTank.valveMode === 'AUTO' ? <ToggleRight className="text-info" size={32} /> : <ToggleLeft className="text-muted" size={32} />}
                </div>
                <span className={`fs-10 fw-bold ${selectedTank.valveMode === 'AUTO' ? 'text-info' : 'text-muted opacity-50'}`}>AUTO</span>
              </div>
            </div>

            <div className="mb-4">
              <Form.Label className="fs-10 text-muted fw-bold mb-2">SUPPLY CONTROL</Form.Label>
              <Row className="g-2">
                <Col xs={6}>
                  <Button 
                    className="w-100 py-3 fw-bold border-0"
                    style={{ 
                      backgroundColor: selectedTank.valveStatus === 'OPEN' ? '#22c55e' : 'rgba(34, 197, 94, 0.1)', 
                      color: selectedTank.valveStatus === 'OPEN' ? '#fff' : '#22c55e',
                      border: '1px solid #22c55e !important'
                    }}
                    disabled={selectedTank.valveMode === 'AUTO'}
                    onClick={() => updateTankValve(selectedTank.id, { valveStatus: 'OPEN' })}>
                    <Droplets size={16} className="me-2" /> OPEN SUPPLY
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button 
                    className="w-100 py-3 fw-bold border-0"
                    style={{ 
                      backgroundColor: selectedTank.valveStatus === 'CLOSE' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)', 
                      color: selectedTank.valveStatus === 'CLOSE' ? '#fff' : '#ef4444',
                      border: '1px solid #ef4444 !important'
                    }}
                    disabled={selectedTank.valveMode === 'AUTO'}
                    onClick={() => updateTankValve(selectedTank.id, { valveStatus: 'CLOSE' })}>
                    <X size={16} className="me-2" /> CLOSE SUPPLY
                  </Button>
                </Col>
              </Row>
            </div>

             {actionFeedback && (
                <div className="action-success-overlay position-absolute top-50 start-50 translate-middle w-75 p-4 rounded-4 shadow-2xl text-center border-2 border-white d-flex flex-column align-items-center gap-2" 
                     style={{ 
                       backgroundColor: actionFeedback.includes('DENIED') ? '#7f1d1d' : '#064e3b', 
                       zIndex: 1000, 
                       boxShadow: actionFeedback.includes('DENIED') ? '0 0 40px rgba(239, 68, 68, 0.4)' : '0 0 40px rgba(6, 78, 59, 0.4)' 
                     }}>
                    <div className="bg-white rounded-circle p-2 mb-2">
                       {actionFeedback.includes('DENIED') ? <XCircle size={40} className="text-danger" /> : <ShieldCheck size={40} style={{ color: '#059669' }} />}
                    </div>
                    <h4 className="text-white fw-black mb-0 letter-spacing-2">{actionFeedback}</h4>
                    <small className="text-white opacity-90 fw-bold">{actionFeedback.includes('DENIED') ? 'SECURITY PROTOCOL ACTIVE' : 'VALVE OPERATION VERIFIED'}</small>
                </div>
             )}

            <div className="mt-4 pt-3 border-top border-secondary border-opacity-10 text-center">
              <Button variant="link" className="text-secondary fs-10 text-decoration-none" onClick={() => setShowValveModal(false)}>DISMISS CONTROLS</Button>
            </div>
          </Modal.Body>
        )}
      </Modal>

      <Modal show={showConfig} onHide={() => setShowConfig(false)} centered contentClassName="bg-dark border-secondary">
        <Modal.Header closeButton className="border-secondary text-white"><Modal.Title className="fs-6">Sector Calibration</Modal.Title></Modal.Header>
        <Modal.Body className="text-white p-3">
          <Form.Label className="fs-9 text-muted d-flex justify-content-between mb-3">DOMESTIC TANK COUNT <span>{tempDomesticCount} / 48</span></Form.Label>
          <Form.Range min={0} max={48} value={tempDomesticCount} onChange={(e) => setTempDomesticCount(parseInt(e.target.value))} />
          <Button variant="info" size="sm" className="w-100 mt-4 fw-bold" onClick={() => { setDomesticCount(tempDomesticCount); setShowConfig(false); }}>CALIBRATE SECTORS</Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AgTank;

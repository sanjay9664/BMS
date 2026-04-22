import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Row, Col, Card, Tooltip, OverlayTrigger, Form, Button, Modal, Badge } from 'react-bootstrap';
import { Home, Waves, LayoutGrid, Settings, Save, AlertCircle, CheckCircle2, XCircle, Activity, X, Droplets, ToggleRight, ToggleLeft, Maximize, Minimize, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react';
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
      valveStatus: 'OPEN',
      minLevel: 20,
      maxLevel: 90
    }))
  );

  const [controlMode, setControlMode] = useState('REMOTE');

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

  const getTankColor = (type, level, status) => {
    if (status === 'Fault') return '#ef4444';
    if (level < 20) return '#f59e0b';
    return '#38bdf8'; // Constant Blue inside
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
      <div className="page-header d-flex justify-content-between align-items-center mb-4 p-3 bg-dark bg-opacity-20 rounded-4 border border-white border-opacity-5">
        <div className="d-flex align-items-center gap-4">
          <div>
            <h2 className="mb-0 text-white fw-black tracking-tighter">AG TANK <span className="text-info">SCADA</span></h2>
            <p className="text-secondary fs-10 fw-bold opacity-75 mb-0 uppercase letter-spacing-1">Unit Array: 01-48 | Active Sector: {domesticCount}D / {48 - domesticCount}F</p>
          </div>
          
          <div className="d-none d-xl-flex gap-4 border-start border-white border-opacity-10 ps-4">
             <div className="hud-stat-container">
                <div className="hud-label">Net Storage</div>
                <div className="hud-value">{Math.round(allTanks.reduce((acc, t) => acc + t.level, 0) / 48)}<span className="fs-10 text-info ms-1">%</span></div>
             </div>
             <div className="hud-stat-container">
                <div className="hud-label">Avg Temp</div>
                <div className="hud-value">24.2<span className="fs-10 text-muted ms-1">°C</span></div>
             </div>
             <div className="hud-stat-container border-info border-opacity-50">
                <div className="hud-label text-info">System Health</div>
                <div className="hud-value text-info">98.5<span className="fs-10 ms-1">%</span></div>
             </div>
          </div>
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
            <div className={`filter-tile ${sectorFilter === mode.id ? 'active ' + mode.id.toLowerCase() : ''}`} 
              onClick={() => {
                setSectorFilter(mode.id);
                if (mode.id === 'ALL') setStatusFilter('ALL');
              }}
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
            <Col key={tank.id} xs={6} sm={4} md={isFullscreen ? 4 : 2} lg={isFullscreen ? 2 : 1} className={isFullscreen ? 'col-fs-2' : ''}>
              <div
                className={`tank-unit-wrapper p-2 rounded text-center position-relative ${tank.status === 'Stopped' ? 'tank-stopped-outline' : ''} ${isFullscreen ? 'expanded-unit' : ''}`}
                onClick={() => handleTankClick(tank)}
                style={{ cursor: 'pointer' }}
              >
                <div className="tank-assembly-anchor mx-auto position-relative" style={{ width: isFullscreen ? '48px' : '36px' }}>
                  <div 
                    className={`tank-vessel ${isFullscreen ? 'vessel-large' : ''}`}
                    style={{ borderColor: '#475569' }}
                  >
                    <div className="tank-fill" style={{ height: `${tank.level}%`, backgroundColor: getTankColor(tank.type, tank.level, tank.status) }}>
                      <div className="tank-water-wave"></div>
                    </div>
                    {/* Visual Threshold Markers */}
                    <div className="threshold-marker lower" style={{ bottom: `${tank.minLevel}%` }}></div>
                    <div className="threshold-marker upper" style={{ bottom: `${tank.maxLevel}%` }}></div>
                  </div>
                  <div className="valve-connector-pipe"></div>
                  <div className={`industrial-valve-node ${tank.valveStatus === 'OPEN' ? 'valve-open' : 'valve-closed'}`}>
                    {/* Mode Indicator A/M */}
                    <div className={`valve-mode-pill mode-${tank.valveMode.toLowerCase()}`}>
                      {tank.valveMode === 'AUTO' ? 'A' : tank.valveMode === 'MANUAL' ? 'M' : 'B'}
                    </div>
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
                <div className={`opacity-75 ${isFullscreen ? 'fs-7' : 'fs-10'}`} style={{ color: getTankColor(tank.type, tank.level, tank.status) }}>{tank.level}%</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .fullscreen-scada-page { 
            background: #020617 !important; 
            background-image: 
                radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.03) 0%, transparent 100%),
                linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
            background-size: 100% 100%, 40px 40px, 40px 40px;
            min-height: 100vh !important; 
            width: 100% !important; 
            padding: 60px !important; 
            overflow-y: auto !important; 
            position: fixed; 
            top: 0; 
            left: 0; 
            z-index: 2000; 
        }
        .ag-tank-main-container {
            background-image: 
                radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.05) 0%, transparent 50%),
                linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
            background-size: 100% 100%, 30px 30px, 30px 30px;
            min-height: 100vh;
        }

        .tank-unit-wrapper { 
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
            border: 1px solid transparent;
        }
        .tank-unit-wrapper:hover {
            background: rgba(255,255,255,0.03);
            border-color: rgba(56, 189, 248, 0.1);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }

        .tank-vessel { 
            width: 36px; 
            height: 52px; 
            border: 2px solid #475569; 
            border-radius: 4px 4px 8px 8px; 
            background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); 
            position: relative; 
            overflow: hidden; 
            transition: 0.4s; 
            box-shadow: 
                inset 0 0 10px rgba(0,0,0,0.5),
                0 4px 6px -1px rgba(0,0,0,0.2); 
        }
        
        /* 3D Glossy Highlight Overlay */
        .tank-vessel::after {
            content: '';
            position: absolute;
            top: 0;
            left: 5px;
            width: 8px;
            height: 100%;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
            z-index: 5;
            pointer-events: none;
        }

        .tank-fill { 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            width: 100%; 
            transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); 
            background-image: linear-gradient(90deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.2) 100%);
        }
        
        .tank-stopped-outline { border: 1px dashed rgba(255,255,255,0.1); }
        .vessel-stopped { opacity: 0.6; grayscale: 100%; filter: grayscale(1); }
        .expanded-unit { transform: scale(1.15); margin-bottom: 80px; margin-top: 40px; }
        .vessel-large { width: 48px !important; height: 68px !important; border-width: 3px !important; }
        .vessel-closed-state { background: #1e293b !important; border-color: #334155 !important; }

        .filter-tile { background-color: #0f172a; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; transition: 0.3s; }
        .filter-tile:hover { transform: translateY(-2px); border-color: rgba(56, 189, 248, 0.2); background: rgba(15, 23, 42, 0.8); }
        .filter-tile.active.domestic { border-bottom: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.08); }
        .filter-tile.active.flushing { border-bottom: 4px solid #10b981; background: rgba(16, 185, 129, 0.08); }
        .filter-tile.active.all { border-bottom: 4px solid #94a3b8; background: rgba(148, 163, 184, 0.1); }
        
        .status-filter-card { transition: 0.3s; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); }
        .status-filter-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.02); }
        .status-filter-card.active { border-bottom-width: 4px !important; background: rgba(56, 189, 248, 0.05); }

        .scada-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; backdrop-filter: blur(10px); }
        
        .hud-stat-container { border-left: 2px solid rgba(56, 189, 248, 0.2); padding-left: 15px; }
        .hud-label { font-size: 9px; color: #94a3b8; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
        .hud-value { font-size: 18px; color: #fff; font-weight: 900; }
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
        
        .valve-mode-pill {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%) rotate(-90deg);
            background: #1e293b;
            color: #38bdf8;
            font-size: 7px;
            font-weight: 900;
            width: 10px;
            height: 10px;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #334155;
            z-index: 20;
            transition: all 0.3s ease;
        }
        .valve-mode-pill.mode-auto { color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }
        .valve-mode-pill.mode-manual { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
        .valve-mode-pill.mode-bypass { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

        .threshold-marker {
            position: absolute;
            left: 0;
            width: 100%;
            height: 1px;
            border-top: 1px dashed rgba(255, 255, 255, 0.4);
            z-index: 10;
        }
        .threshold-marker.lower { border-color: rgba(56, 189, 248, 0.6); }
        .threshold-marker.upper { border-color: rgba(239, 68, 68, 0.6); }

        .horizontal-stream { width: 30px; height: 6px; background: rgba(71, 85, 105, 0.5); position: relative; overflow: hidden; border-radius: 0 4px 4px 0; }
        .stream-pulse { position: absolute; top: 0; left: 0; height: 100%; width: 50%; background: linear-gradient(90deg, transparent, #38bdf8, transparent); animation: stream-flow 1s linear infinite; }
        
        @keyframes stream-flow { from { transform: translateX(-100%); } to { transform: translateX(200%); } }

        .fw-black { font-weight: 900 !important; }
        .fs-10 { font-size: 0.65rem; }
        .fs-9 { font-size: 0.75rem; }
        .fs-7 { font-size: 1.1rem; }
        .w-40 { width: 40% !important; }
        .custom-modal-wide { width: 85% !important; max-width: 85% !important; }
        .text-glow { text-shadow: 0 0 10px currentColor; }
        .hover-glow:hover { border-color: rgba(56, 189, 248, 0.3) !important; box-shadow: 0 0 20px rgba(56, 189, 248, 0.1); }
        .transition-all { transition: all 0.3s ease; }
        .premium-action-btn { 
            padding: 16px; 
            border-radius: 12px; 
            border: 1px solid rgba(255,255,255,0.1); 
            background: rgba(255,255,255,0.02); 
            color: #94a3b8; 
            transition: all 0.3s ease; 
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .premium-action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .premium-action-btn .btn-label { font-size: 12px; font-weight: 900; letter-spacing: 1px; }
        .premium-action-btn .btn-subtext { font-size: 9px; font-weight: 600; opacity: 0.5; text-transform: uppercase; }
        
        .premium-action-btn.open.active { background: rgba(34, 197, 94, 0.15); border-color: #22c55e; color: #22c55e; box-shadow: 0 0 20px rgba(34, 197, 94, 0.1); }
        .premium-action-btn.open:hover:not(:disabled) { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; color: #22c55e; }
        
        .premium-action-btn.close.active { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.1); }
        .premium-action-btn.close:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }

        .pulse-icon { animation: ag-pulse 2s infinite; }
        @keyframes ag-pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        .fade-in { animation: ag-fadeIn 0.5s ease-out; }
        .scale-in { animation: ag-scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes ag-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ag-scaleIn { from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
      `}} />

      <Modal show={showValveModal} onHide={() => setShowValveModal(false)} centered size="lg" contentClassName="bg-transparent border-0 shadow-2xl custom-modal-wide">
        {selectedTank && (
          <Modal.Body className="p-0 text-white overflow-hidden rounded-5" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Modal Header Bar */}
            <div className="p-4 text-center border-bottom border-white border-opacity-10" style={{ background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.05) 0%, transparent 100%)' }}>
               <Badge bg="info" className="bg-opacity-10 text-info px-3 py-1 mb-2 border border-info border-opacity-25 rounded-pill">
                  <div className="d-flex align-items-center gap-2 fs-12 fw-black tracking-widest uppercase">
                    <Activity size={10} className="pulse-icon" /> Operational Control
                  </div>
               </Badge>
               <h3 className="fw-black text-white mb-0 size-3 tracking-tighter" style={{ textShadow: '0 0 20px rgba(56, 189, 248, 0.3)' }}>
                 {selectedTank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-{selectedTank.id} <span className="text-info-scada">COMMAND</span>
               </h3>
            </div>
            <div className="p-4 px-5">
              {/* Mode Control Section */}
              <div className="d-flex justify-content-between align-items-center p-3 rounded-4 position-relative overflow-hidden mb-3" 
                   style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="position-absolute top-0 start-0 h-100 w-1 bg-info bg-opacity-50"></div>
                <div>
                   <div className="fw-black fs-10 tracking-widest text-secondary uppercase">Control Strategy</div>
                   <div className="text-white fw-bold fs-6">AUTO / MANUAL OVERRIDE</div>
                </div>
                <div className="d-flex align-items-center gap-1 bg-dark bg-opacity-80 p-1 rounded-pill border border-white border-opacity-10 shadow-inner">
                  {['AUTO', 'MANUAL', 'BYPASS'].map(mode => (
                    <div 
                      key={mode}
                      onClick={() => updateTankValve(selectedTank.id, { valveMode: mode })}
                      className={`px-4 py-2 rounded-pill fw-black tracking-widest transition-all cursor-pointer ${
                        selectedTank.valveMode === mode 
                          ? 'bg-info text-white shadow-lg scale-105' 
                          : 'text-secondary opacity-40 hover-opacity-100 hover-white'
                      }`}
                      style={{ fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}
                    >
                      {mode}
                    </div>
                  ))}
                </div>
              </div>

              {/* Thresholds Section */}
              <Row className="g-3 mb-3">
                <Col md={6}>
                   <div className="p-3 rounded-4 bg-black bg-opacity-40 border border-white border-opacity-5 hover-glow transition-all">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="p-1 px-2 rounded bg-info bg-opacity-10 text-info border border-info border-opacity-20"><ArrowDown size={12} /></div>
                        <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-0 uppercase">Lower Limit</Form.Label>
                      </div>
                      <div className="d-flex align-items-center gap-3 bg-dark border border-white border-opacity-10 rounded-3 p-1 px-3">
                         <Form.Control 
                            type="number" 
                            value={selectedTank.minLevel} 
                            onChange={(e) => updateTankValve(selectedTank.id, { minLevel: parseInt(e.target.value) })}
                            className="bg-transparent border-0 text-white fw-black fs-4 p-0 shadow-none w-100"
                         />
                         <span className="text-info fw-black fs-5">%</span>
                      </div>
                   </div>
                </Col>
                <Col md={6}>
                   <div className="p-3 rounded-4 bg-black bg-opacity-40 border border-white border-opacity-5 hover-glow transition-all">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="p-1 px-2 rounded bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20"><ArrowUp size={12} /></div>
                        <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-0 uppercase">Upper Limit</Form.Label>
                      </div>
                      <div className="d-flex align-items-center gap-3 bg-dark border border-white border-opacity-10 rounded-3 p-1 px-3">
                         <Form.Control 
                            type="number" 
                            value={selectedTank.maxLevel} 
                            onChange={(e) => updateTankValve(selectedTank.id, { maxLevel: parseInt(e.target.value) })}
                            className="bg-transparent border-0 text-white fw-black fs-4 p-0 shadow-none w-100"
                         />
                         <span className="text-danger fw-black fs-5">%</span>
                      </div>
                   </div>
                </Col>
              </Row>

              {/* Action Section */}
              <div className="mb-2">
                <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-2 uppercase">Supply Override Commands</Form.Label>
                <Row className="g-3">
                  <Col xs={6}>
                    <button 
                      className={`premium-action-btn open w-100 ${selectedTank.valveStatus === 'OPEN' ? 'active' : ''}`}
                      disabled={selectedTank.valveMode === 'AUTO' || selectedTank.valveMode === 'BYPASS'}
                      style={{ padding: '12px' }}
                      onClick={() => updateTankValve(selectedTank.id, { valveStatus: 'OPEN' })}>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                         <Droplets size={16} />
                         <div>
                            <div className="btn-label">OPEN SUPPLY</div>
                         </div>
                      </div>
                    </button>
                  </Col>
                  <Col xs={6}>
                    <button 
                      className={`premium-action-btn close w-100 ${selectedTank.valveStatus === 'CLOSE' ? 'active' : ''}`}
                      disabled={selectedTank.valveMode === 'AUTO' || selectedTank.valveMode === 'BYPASS'}
                      style={{ padding: '12px' }}
                      onClick={() => updateTankValve(selectedTank.id, { valveStatus: 'CLOSE' })}>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                         <X size={16} />
                         <div>
                            <div className="btn-label">CLOSE SUPPLY</div>
                         </div>
                      </div>
                    </button>
                  </Col>
                </Row>
              </div>
            </div>

            <div className="p-4 border-top border-white border-opacity-5 text-center bg-black bg-opacity-20 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2 text-muted fs-12 fw-bold tracking-widest">
                 <ShieldCheck size={14} className="text-success" /> BMS VERIFIED LINK
              </div>
              <Button variant="link" className="text-secondary fs-12 fw-black text-decoration-none hover-white transition-all uppercase tracking-widest" onClick={() => setShowValveModal(false)}>
                Dismiss Panel
              </Button>
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

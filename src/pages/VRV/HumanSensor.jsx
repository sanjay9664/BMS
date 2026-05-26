import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { User, Activity, Clock, ShieldCheck, Target, Power, Maximize, Settings, Wifi, Zap, Crosshair, MapPin, Radio } from 'lucide-react';
import './VRVOverview.css';

const HumanSensor = () => {
  const [selectedUnit, setSelectedUnit] = useState('Lobby');
  const [sensorEnabled, setSensorEnabled] = useState(true);
  const [autoPowerLink, setAutoPowerLink] = useState(true);
  const [detectionRange, setDetectionRange] = useState(8); // meters (1-15)
  const [offDelayTime, setOffDelayTime] = useState(15); // minutes (1-60)

  // Standard Settings from manual
  const [autoSaveTime, setAutoSaveTime] = useState(60);
  const [autoOnOffTime, setAutoOnOffTime] = useState(120);
  const [autoOffStatus, setAutoOffStatus] = useState('Disable');
  const [isExecuting, setIsExecuting] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Animation state for realistic radar
  const [humanDetected, setHumanDetected] = useState(true);
  const [blipPos, setBlipPos] = useState({ x: 40, y: -30 });
  const [signalStrength, setSignalStrength] = useState(98);

  // Load config from localStorage when selected unit changes
  useEffect(() => {
    const saved = localStorage.getItem('VRVRoomsState');
    if (saved) {
      const rooms = JSON.parse(saved);
      const room = rooms.find(r => r.name === selectedUnit);
      if (room) {
        setSensorEnabled(room.sensorEnabled ?? true);
        setAutoPowerLink(room.autoPowerLink ?? true);
        setDetectionRange(room.detectionRange ?? 8);
        setOffDelayTime(room.offDelayTime ?? 15);
      }
    }
  }, [selectedUnit]);

  useEffect(() => {
    if (!sensorEnabled) {
      setHumanDetected(false);
      return;
    }
    setHumanDetected(true);

    // Simulate realistic human detection pinging & movement
    const interval = setInterval(() => {
      const maxRadius = (detectionRange / 15) * 160; // Keep it slightly inside the current range
      
      // Random walk for the blip
      setBlipPos(prev => {
        let newX = prev.x + (Math.random() - 0.5) * 40;
        let newY = prev.y + (Math.random() - 0.5) * 40;
        
        // Constrain to radius
        const dist = Math.sqrt(newX*newX + newY*newY);
        if (dist > maxRadius) {
          const angle = Math.atan2(newY, newX);
          newX = Math.cos(angle) * maxRadius * 0.9;
          newY = Math.sin(angle) * maxRadius * 0.9;
        }
        return { x: newX, y: newY };
      });
      
      setSignalStrength(Math.floor(85 + Math.random() * 15));
    }, 2500);

    return () => clearInterval(interval);
  }, [sensorEnabled, detectionRange]);

  const handleApplyConfig = () => {
    const saved = localStorage.getItem('VRVRoomsState');
    let rooms = [];
    if (saved) {
      rooms = JSON.parse(saved);
    } else {
      // Fallback if Overview was never visited
      rooms = [
        { id: 1, name: 'Common', currentTemp: 26.0, setTemp: 26.0, state: 'ON', mode: 'Cool', fanSpeed: 'Auto', faultCode: null, occupied: true, sensorEnabled: true, autoPowerLink: true, detectionRange: 5, offDelayTime: 15 },
        { id: 2, name: 'Lobby', currentTemp: 20.0, setTemp: 29.5, state: 'ON', mode: 'Cool', fanSpeed: 'High', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: true, detectionRange: 8, offDelayTime: 10 },
        { id: 3, name: 'Office', currentTemp: 20.0, setTemp: 29.5, state: 'ON', mode: 'Heat', fanSpeed: 'Middle', faultCode: null, occupied: true, sensorEnabled: false, autoPowerLink: false, detectionRange: 3, offDelayTime: 30 },
        { id: 4, name: 'Conference', currentTemp: null, setTemp: 24.0, state: 'OFF', mode: 'Cool', fanSpeed: 'Auto', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: true, detectionRange: 10, offDelayTime: 5 },
        { id: 5, name: 'Warehouse', currentTemp: 15.5, setTemp: 26.0, state: 'ON', mode: 'Cool', fanSpeed: 'Low', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: false, detectionRange: 15, offDelayTime: 60 },
        { id: 6, name: 'Laboratory', currentTemp: 15.5, setTemp: 26.0, state: 'ON', mode: 'Heat', fanSpeed: 'Auto', faultCode: 'E11', occupied: true, sensorEnabled: true, autoPowerLink: true, detectionRange: 6, offDelayTime: 20 },
      ];
    }
    
    // Update the specific room
    const updatedRooms = rooms.map(r => {
      if (r.name === selectedUnit) {
        return { ...r, sensorEnabled, autoPowerLink, detectionRange, offDelayTime };
      }
      return r;
    });
    
    localStorage.setItem('VRVRoomsState', JSON.stringify(updatedRooms));
    
    // Show success animation
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const units = ['Common', 'Lobby', 'Office', 'Conference', 'Warehouse', 'Laboratory'];

  return (
    <div className="hs-container p-2 fade-in">
      {/* Header Section */}
      <div className="hs-header mb-4 d-flex justify-content-between align-items-end">
        <div>
          <Badge bg="transparent" className="border border-info text-info mb-2 px-3 py-1 rounded-pill">
            <Radio size={12} className="me-2 mb-1" /> SENSOR NETWORK ACTIVE
          </Badge>
          <h2 className="mb-0 text-white d-flex align-items-center fw-bold hs-title">
            Occupancy Sensor Configuration
          </h2>
          <p className="text-secondary fs-7 mt-1 hs-subtitle">Advanced human presence detection and intelligent VRV automation</p>
        </div>
        
        <div className="hs-unit-selector">
          <label className="text-secondary fs-8 fw-bold text-uppercase mb-1 d-block">Target VRV Unit</label>
          <Form.Select
            className="hs-select shadow-none"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            {units.map(u => <option key={u} value={u}>{u} AC Unit</option>)}
          </Form.Select>
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column - Configuration Panel */}
        <Col lg={5} className="d-flex flex-column gap-4">

          {/* Quick Settings Card */}
          <Card className="hs-card hs-glass-card border-0">
            <div className="hs-card-glow"></div>
            <Card.Header className="bg-transparent border-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h6 className="text-white fw-bold m-0 d-flex align-items-center">
                <Settings size={16} className="me-2 text-info" /> Operation Modes
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col xs={4}>
                  <div className="hs-stat-box p-3 rounded text-center h-100">
                    <div className="text-secondary fs-8 fw-bold text-uppercase mb-2">Auto Save</div>
                    <div className="d-flex justify-content-center align-items-end hs-number-input-group">
                      <Form.Control type="number" value={autoSaveTime} onChange={e => setAutoSaveTime(e.target.value)} className="hs-number-input" />
                      <span className="text-secondary fs-8 ms-1 mb-1">m</span>
                    </div>
                    <Button
                      variant={isExecuting ? "info" : "outline-secondary"}
                      size="sm"
                      className={`w-100 mt-3 hs-btn-execute ${isExecuting ? 'active' : ''}`}
                      onClick={() => setIsExecuting(!isExecuting)}
                    >
                      {isExecuting ? 'Active' : 'Execute'}
                    </Button>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="hs-stat-box p-3 rounded text-center h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="text-secondary fs-8 fw-bold text-uppercase mb-2">ON/OFF Limit</div>
                      <div className="d-flex justify-content-center align-items-end hs-number-input-group mt-3">
                        <Form.Control type="number" value={autoOnOffTime} onChange={e => setAutoOnOffTime(e.target.value)} className="hs-number-input" />
                        <span className="text-secondary fs-8 ms-1 mb-1">m</span>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="hs-stat-box p-3 rounded text-center h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="text-secondary fs-8 fw-bold text-uppercase mb-2">Auto OFF Mode</div>
                      <Form.Select
                        value={autoOffStatus}
                        onChange={e => setAutoOffStatus(e.target.value)}
                        className="hs-small-select mt-3"
                      >
                        <option value="Disable">Disable</option>
                        <option value="Enable">Enable</option>
                      </Form.Select>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Advanced Parameter Settings */}
          <Card className="hs-card hs-glass-card border-0 flex-grow-1">
            <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-4">
              <h5 className="text-white fw-bold m-0 d-flex align-items-center">
                <Zap size={18} className="me-2 text-warning hs-pulse-icon" /> Advanced Automation
              </h5>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column gap-4">

              {/* 1. Enabled / Disabled */}
              <div className="hs-setting-row d-flex justify-content-between align-items-center p-3 rounded">
                <div>
                  <label className="text-white fw-bold fs-6 d-block mb-1">Hardware Sensor Power</label>
                  <span className="text-secondary fs-7">Enable physical motion detection</span>
                </div>
                <Form.Check
                  type="switch"
                  id="hs-sensor-switch"
                  checked={sensorEnabled}
                  onChange={(e) => setSensorEnabled(e.target.checked)}
                  className="hs-custom-switch m-0"
                />
              </div>

              <div className="hs-settings-group" style={{ opacity: sensorEnabled ? 1 : 0.3, pointerEvents: sensorEnabled ? 'auto' : 'none' }}>
                
                {/* 2. Auto Power Link */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="text-white fw-bold fs-6">VRV Power Link</label>
                    <Badge bg={autoPowerLink ? "info" : "secondary"} className="hs-badge">{autoPowerLink ? 'AUTO' : 'MANUAL'}</Badge>
                  </div>
                  <p className="text-secondary fs-7 mb-3">Automatically toggle VRV power based on room occupancy.</p>
                  
                  <div className="hs-segmented-control">
                    <div 
                      className={`hs-segment ${autoPowerLink ? 'active' : ''}`}
                      onClick={() => setAutoPowerLink(true)}
                    >
                      Linked (Auto)
                    </div>
                    <div 
                      className={`hs-segment ${!autoPowerLink ? 'active' : ''}`}
                      onClick={() => setAutoPowerLink(false)}
                    >
                      Unlinked (Manual)
                    </div>
                  </div>
                </div>

                {/* 3. Detection Range */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="text-white fw-bold fs-6">Detection Radius</label>
                    <div className="hs-value-display text-info">{detectionRange} <small>m</small></div>
                  </div>
                  <p className="text-secondary fs-7 mb-3">Adjust the physical scanning radius of the sensor.</p>
                  
                  <div className="hs-range-wrapper px-2">
                    <Form.Range
                      min={1} max={15} value={detectionRange}
                      onChange={(e) => setDetectionRange(Number(e.target.value))}
                      className="hs-range hs-range-info"
                    />
                    <div className="hs-range-labels">
                      <span>1m</span><span>5m</span><span>10m</span><span>15m</span>
                    </div>
                  </div>
                </div>

                {/* 4. Auto-OFF Delay */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="text-white fw-bold fs-6">Absence Delay Timer</label>
                    <div className="hs-value-display text-warning">{offDelayTime} <small>min</small></div>
                  </div>
                  <p className="text-secondary fs-7 mb-3">Time before shutting down VRV after zero motion.</p>
                  
                  <div className="hs-range-wrapper px-2">
                    <Form.Range
                      min={1} max={60} step={1} value={offDelayTime}
                      onChange={(e) => setOffDelayTime(Number(e.target.value))}
                      className="hs-range hs-range-warning"
                    />
                    <div className="hs-range-labels">
                      <span>1m</span><span>15m</span><span>30m</span><span>45m</span><span>60m</span>
                    </div>
                  </div>
                </div>
                
              </div>
              
              <div className="mt-auto pt-3 border-top border-secondary border-opacity-25">
                <Button 
                  variant={saveSuccess ? "success" : "info"} 
                  className="w-100 py-3 fw-bold hs-apply-btn d-flex justify-content-center align-items-center gap-2"
                  onClick={handleApplyConfig}
                  style={saveSuccess ? { background: '#10b981', color: 'white', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.4)' } : {}}
                >
                  {saveSuccess ? <ShieldCheck size={18} /> : <Crosshair size={18} />} 
                  {saveSuccess ? 'Configuration Saved!' : 'Apply Configuration to Sensor'}
                </Button>
              </div>

            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Premium Radar Visualization */}
        <Col lg={7}>
          <Card className="hs-card hs-radar-card border-0 h-100">
            <Card.Header className="bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-start z-3 position-relative">
              <div>
                <h5 className="text-white fw-bold m-0 d-flex align-items-center hs-glow-text">
                  <Target size={20} className="me-2 text-info" /> Spatial Mapping
                </h5>
                <div className="text-secondary fs-8 mt-1 font-monospace">LAT: 34.0522 N / LNG: 118.2437 W</div>
              </div>
              <div className="hs-status-indicator d-flex align-items-center gap-2 px-3 py-2 rounded-pill">
                <div className={`hs-status-dot ${sensorEnabled ? 'active' : ''}`}></div>
                <span className={`fw-bold fs-8 tracking-wider ${sensorEnabled ? 'text-success' : 'text-secondary'}`}>
                  {sensorEnabled ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                </span>
              </div>
            </Card.Header>

            <Card.Body className="p-0 d-flex flex-column position-relative justify-content-center align-items-center hs-radar-body" style={{ minHeight: '600px', overflow: 'hidden' }}>
              
              {/* Telemetry Overlay */}
              {sensorEnabled && (
                <div className="hs-telemetry-overlay position-absolute top-0 start-0 m-4 p-3 rounded font-monospace z-3">
                  <div className="text-info fs-8 mb-1"><Activity size={14} className="me-1" /> TELEMETRY</div>
                  <div className="text-white fs-7 mb-1">SIG: <span className="text-success">{signalStrength}%</span></div>
                  <div className="text-white fs-7 mb-1">TGT: {humanDetected ? '1 ACQUIRED' : '0 SEARCHING'}</div>
                  <div className="text-white fs-7">RNG: {detectionRange}m</div>
                </div>
              )}

              {/* Background Grids */}
              <div className="hs-radar-grid-bg position-absolute w-100 h-100 z-0"></div>
              <div className="hs-radar-crosshairs position-absolute w-100 h-100 z-1">
                <div className="hs-vline"></div>
                <div className="hs-hline"></div>
              </div>

              {/* Radar Display Container */}
              <div className="hs-radar-container position-relative d-flex justify-content-center align-items-center z-2">
                
                {/* Distance Rings */}
                <div className="hs-ring hs-ring-max border border-secondary border-opacity-25 rounded-circle position-absolute d-flex justify-content-center">
                  <span className="hs-ring-label bg-dark text-secondary px-1">15m Max</span>
                </div>
                <div className="hs-ring hs-ring-mid border border-secondary border-opacity-25 rounded-circle position-absolute d-flex justify-content-center">
                  <span className="hs-ring-label bg-dark text-secondary px-1">10m</span>
                </div>
                <div className="hs-ring hs-ring-min border border-secondary border-opacity-25 rounded-circle position-absolute d-flex justify-content-center">
                  <span className="hs-ring-label bg-dark text-secondary px-1">5m</span>
                </div>

                {/* Dynamic Configured Range */}
                <div 
                  className={`hs-ring-dynamic rounded-circle position-absolute transition-all duration-500 ${sensorEnabled ? 'active' : ''}`}
                  style={{
                    width: `${(detectionRange / 15) * 450}px`,
                    height: `${(detectionRange / 15) * 450}px`,
                  }}
                ></div>

                {/* Radar Sweep Effect */}
                {sensorEnabled && (
                  <div className="hs-radar-sweep rounded-circle position-absolute" style={{
                    width: `${(detectionRange / 15) * 450}px`,
                    height: `${(detectionRange / 15) * 450}px`,
                  }}></div>
                )}

                {/* Center Hardware Icon */}
                <div className="hs-center-node rounded-circle position-absolute d-flex justify-content-center align-items-center z-3">
                  <div className={`hs-center-core rounded-circle ${sensorEnabled ? 'active' : ''}`}></div>
                </div>

                {/* Detected Human Target Blip */}
                {sensorEnabled && humanDetected && (
                  <div 
                    className="hs-target-blip position-absolute d-flex flex-column align-items-center z-3"
                    style={{
                      transform: `translate(${blipPos.x * 1.125}px, ${blipPos.y * 1.125}px)`,
                      transition: 'transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div className="hs-blip-dot position-relative">
                      <div className="hs-blip-ping position-absolute w-100 h-100 rounded-circle border border-success"></div>
                      <User size={24} className="text-success hs-blip-icon" />
                    </div>
                    <div className="hs-target-info mt-1 px-2 py-1 rounded d-flex align-items-center gap-1 font-monospace">
                      <MapPin size={10} className="text-info" />
                      <span>ID:TGT-01</span>
                    </div>
                  </div>
                )}
              </div>

            </Card.Body>
            
            {/* Bottom Status Bar */}
            <Card.Footer className="bg-transparent border-top border-secondary border-opacity-25 p-0 z-3 position-relative" style={{ background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(10px)' }}>
              <Row className="g-0">
                <Col md={4} className="p-3 border-end border-secondary border-opacity-25 d-flex flex-column justify-content-center align-items-center">
                  <span className="text-secondary fs-8 fw-bold text-uppercase tracking-wider mb-1">Detection Status</span>
                  {sensorEnabled ? (
                    humanDetected ? 
                      <span className="text-success fw-bold fs-6 hs-glow-text-success"><Activity size={16} className="me-1 mb-1" /> OCCUPIED</span> :
                      <span className="text-warning fw-bold fs-6"><Clock size={16} className="me-1 mb-1" /> SEARCHING...</span>
                  ) : (
                    <span className="text-secondary fw-bold fs-6">OFFLINE</span>
                  )}
                </Col>
                <Col md={4} className="p-3 border-end border-secondary border-opacity-25 d-flex flex-column justify-content-center align-items-center">
                  <span className="text-secondary fs-8 fw-bold text-uppercase tracking-wider mb-1">Power Control</span>
                  {autoPowerLink ? (
                    <span className="text-info fw-bold fs-6"><Zap size={16} className="me-1 mb-1" /> LINKED (AUTO)</span>
                  ) : (
                    <span className="text-secondary fw-bold fs-6">UNLINKED (MANUAL)</span>
                  )}
                </Col>
                <Col md={4} className="p-3 d-flex flex-column justify-content-center align-items-center">
                  <span className="text-secondary fs-8 fw-bold text-uppercase tracking-wider mb-1">System Delay</span>
                  {sensorEnabled && humanDetected ? (
                    <span className="text-white fw-bold fs-6 opacity-75">STANDBY (00:00)</span>
                  ) : sensorEnabled && !humanDetected ? (
                    <span className="text-warning fw-bold fs-6 hs-pulse-text">COUNTDOWN ({offDelayTime}:00)</span>
                  ) : (
                    <span className="text-secondary fw-bold fs-6">--:--</span>
                  )}
                </Col>
              </Row>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Embedded Component Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Typography & Colors */
        :root {
          --hs-cyan: #06b6d4;
          --hs-cyan-glow: rgba(6, 182, 212, 0.4);
          --hs-blue: #3b82f6;
          --hs-dark: #0f172a;
          --hs-panel: rgba(15, 23, 42, 0.6);
          --hs-panel-border: rgba(255, 255, 255, 0.08);
          --hs-success: #10b981;
          --hs-warning: #f59e0b;
        }

        .tracking-wider { letter-spacing: 0.05em; }
        
        .hs-title {
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.02em;
          text-shadow: 0 0 20px rgba(255,255,255,0.1);
        }

        /* Glassmorphic Cards */
        .hs-glass-card {
          background: var(--hs-panel) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--hs-panel-border) !important;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .hs-card-glow {
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--hs-cyan), transparent);
          opacity: 0.5;
        }

        /* Input Controls */
        .hs-select {
          background-color: rgba(0,0,0,0.3) !important;
          color: white !important;
          border: 1px solid var(--hs-panel-border) !important;
          border-radius: 8px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .hs-select:focus {
          border-color: var(--hs-cyan) !important;
          box-shadow: 0 0 0 3px var(--hs-cyan-glow) !important;
        }

        .hs-stat-box {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--hs-panel-border);
          transition: all 0.3s ease;
        }
        .hs-stat-box:hover {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.1);
        }

        .hs-number-input {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px;
          color: white !important;
          font-size: 1.8rem !important;
          font-weight: 800 !important;
          padding: 4px !important;
          text-align: center;
          width: 85px;
          line-height: 1;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .hs-number-input:focus {
          box-shadow: none !important;
          text-shadow: 0 0 15px rgba(255,255,255,0.5);
        }

        .hs-small-select {
          background-color: rgba(0,0,0,0.4) !important;
          color: white !important;
          border: 1px solid var(--hs-panel-border) !important;
          border-radius: 6px;
          font-weight: 600;
          text-align: center;
          padding: 6px;
          cursor: pointer;
        }

        .hs-btn-execute {
          background: transparent;
          border: 1px solid var(--hs-cyan);
          color: var(--hs-cyan);
          border-radius: 6px;
          transition: all 0.3s ease;
        }
        .hs-btn-execute.active {
          background: rgba(6, 182, 212, 0.15);
          box-shadow: 0 0 15px var(--hs-cyan-glow);
        }
        .hs-btn-execute:hover {
          background: var(--hs-cyan);
          color: #000;
          box-shadow: 0 0 20px var(--hs-cyan-glow);
        }

        /* Switches & Segmented Controls */
        .hs-setting-row {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--hs-panel-border);
        }
        
        .hs-custom-switch .form-check-input {
          width: 3em;
          height: 1.5em;
          background-color: rgba(255,255,255,0.1);
          border-color: transparent;
          cursor: pointer;
        }
        .hs-custom-switch .form-check-input:checked {
          background-color: var(--hs-cyan);
          border-color: var(--hs-cyan);
          box-shadow: 0 0 20px var(--hs-cyan-glow);
        }

        .hs-segmented-control {
          display: flex;
          background: rgba(0,0,0,0.4);
          border-radius: 10px;
          padding: 4px;
          border: 1px solid var(--hs-panel-border);
        }
        .hs-segment {
          flex: 1;
          text-align: center;
          padding: 10px;
          border-radius: 8px;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .hs-segment.active {
          background: rgba(255,255,255,0.1);
          color: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        /* Value Display & Sliders */
        .hs-value-display {
          font-size: 1.25rem;
          font-weight: 800;
          background: rgba(0,0,0,0.3);
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid var(--hs-panel-border);
        }

        .hs-range {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.1);
          outline: none;
          -webkit-appearance: none;
          width: 100%;
        }
        
        .hs-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid #0f172a;
          box-shadow: 0 0 15px currentColor;
          transition: transform 0.1s;
        }
        .hs-range::-webkit-slider-thumb:active {
          transform: scale(1.2);
        }

        .hs-range-info::-webkit-slider-thumb { background: var(--hs-cyan); color: var(--hs-cyan); }
        .hs-range-warning::-webkit-slider-thumb { background: var(--hs-warning); color: var(--hs-warning); }

        .hs-range-labels {
          display: flex;
          justify-content: space-between;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 700;
          margin-top: 8px;
        }

        .hs-apply-btn {
          background: linear-gradient(135deg, var(--hs-cyan), var(--hs-blue)) !important;
          border: none !important;
          color: white !important;
          border-radius: 10px;
          box-shadow: 0 10px 20px rgba(6, 182, 212, 0.3);
          transition: all 0.3s ease;
        }
        .hs-apply-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(6, 182, 212, 0.4);
        }

        /* Radar Card & Visualization */
        .hs-radar-card {
          background: rgba(10, 15, 30, 0.7) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--hs-panel-border) !important;
          border-radius: 16px;
          box-shadow: inset 0 0 80px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.4);
        }

        .hs-status-indicator {
          background: rgba(0,0,0,0.4);
          border: 1px solid var(--hs-panel-border);
        }
        .hs-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #475569;
        }
        .hs-status-dot.active {
          background: var(--hs-success);
          box-shadow: 0 0 10px var(--hs-success);
          animation: blink 2s infinite;
        }

        .hs-telemetry-overlay {
          background: rgba(0,0,0,0.6);
          border: 1px solid var(--hs-panel-border);
          backdrop-filter: blur(4px);
        }

        .hs-radar-grid-bg {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          background-position: center center;
        }

        .hs-radar-crosshairs .hs-vline, .hs-radar-crosshairs .hs-hline {
          position: absolute;
          background: rgba(6, 182, 212, 0.2);
        }
        .hs-radar-crosshairs .hs-vline { width: 1px; height: 100%; left: 50%; top: 0; }
        .hs-radar-crosshairs .hs-hline { height: 1px; width: 100%; top: 50%; left: 0; }

        .hs-ring {
          border-color: rgba(6, 182, 212, 0.2) !important;
        }
        .hs-ring-max { width: 450px; height: 450px; }
        .hs-ring-mid { width: 300px; height: 300px; }
        .hs-ring-min { width: 150px; height: 150px; }

        .hs-ring-label {
          position: absolute;
          top: -10px;
          font-size: 0.7rem;
          color: rgba(6, 182, 212, 0.6) !important;
          font-weight: 700;
        }

        .hs-ring-dynamic {
          border: 2px dashed rgba(255,255,255,0.1);
        }
        .hs-ring-dynamic.active {
          border: 2px solid rgba(6, 182, 212, 0.4);
          background: radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, rgba(6, 182, 212, 0.0) 100%);
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.1) inset;
        }

        .hs-radar-sweep {
          background: conic-gradient(from 0deg, transparent 70%, rgba(6, 182, 212, 0.4) 100%);
          animation: hs-sweep 4s linear infinite;
        }

        .hs-center-node {
          width: 48px;
          height: 48px;
          background: rgba(0,0,0,0.8);
          border: 2px solid rgba(6, 182, 212, 0.4);
          box-shadow: 0 0 20px rgba(0,0,0,1);
        }
        .hs-center-core {
          width: 12px; height: 12px;
          background: #475569;
        }
        .hs-center-core.active {
          background: var(--hs-cyan);
          box-shadow: 0 0 15px var(--hs-cyan), 0 0 30px var(--hs-cyan);
        }

        .hs-target-blip {
          z-index: 10;
        }
        .hs-blip-dot {
          width: 24px; height: 24px;
        }
        .hs-blip-ping {
          animation: hs-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.8;
        }
        .hs-blip-icon {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8));
        }
        
        .hs-target-info {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          backdrop-filter: blur(4px);
          font-size: 0.7rem;
          color: white;
          white-space: nowrap;
        }

        /* Animations */
        @keyframes hs-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes hs-ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .hs-pulse-icon {
          animation: blink 2s infinite;
        }
        .hs-pulse-text {
          animation: blink 1.5s infinite;
        }
        
        .hs-glow-text {
          text-shadow: 0 0 15px rgba(255,255,255,0.2);
        }
        .hs-glow-text-success {
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
        }
      `}} />
    </div>
  );
};

export default HumanSensor;

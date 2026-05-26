import React, { useState } from 'react';
import { Row, Col, Card, Modal, Button, Badge, Form } from 'react-bootstrap';
import { Thermometer, Wind, Power, Settings, AlertTriangle, Activity, User, Snowflake, Sun, Droplets, Fan, Target, Clock, ShieldCheck, Maximize } from 'lucide-react';
import './VRVOverview.css';

// Mock data for initial UI presentation
const initialRooms = [
  { id: 1, name: 'Common', currentTemp: 26.0, setTemp: 26.0, state: 'ON', mode: 'Cool', fanSpeed: 'Auto', faultCode: null, occupied: true, sensorEnabled: true, autoPowerLink: true, detectionRange: 5, offDelayTime: 15 },
  { id: 2, name: 'Lobby', currentTemp: 20.0, setTemp: 29.5, state: 'ON', mode: 'Cool', fanSpeed: 'High', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: true, detectionRange: 8, offDelayTime: 10 },
  { id: 3, name: 'Office', currentTemp: 20.0, setTemp: 29.5, state: 'ON', mode: 'Heat', fanSpeed: 'Middle', faultCode: null, occupied: true, sensorEnabled: false, autoPowerLink: false, detectionRange: 3, offDelayTime: 30 },
  { id: 4, name: 'Conference', currentTemp: null, setTemp: 24.0, state: 'OFF', mode: 'Cool', fanSpeed: 'Auto', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: true, detectionRange: 10, offDelayTime: 5 },
  { id: 5, name: 'Warehouse', currentTemp: 15.5, setTemp: 26.0, state: 'ON', mode: 'Cool', fanSpeed: 'Low', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: false, detectionRange: 15, offDelayTime: 60 },
  { id: 6, name: 'Laboratory', currentTemp: 15.5, setTemp: 26.0, state: 'ON', mode: 'Heat', fanSpeed: 'Auto', faultCode: 'E11', occupied: true, sensorEnabled: true, autoPowerLink: true, detectionRange: 6, offDelayTime: 20 },
];

const getModeIcon = (mode, size = 16) => {
  switch (mode) {
    case 'Cool': return <Snowflake size={size} className="text-info" />;
    case 'Heat': return <Sun size={size} className="text-danger" />;
    case 'Dry': return <Droplets size={size} className="text-primary" />;
    case 'Fan': return <Fan size={size} className="text-secondary" />;
    default: return <Wind size={size} />;
  }
};

const getFanSpeedBars = (speed) => {
  const levels = { 'Auto': 0, 'Low': 1, 'Mid-Low': 2, 'Middle': 3, 'Mid-High': 4, 'High': 5 };
  const level = levels[speed] || 0;
  return (
    <div className="d-flex align-items-end gap-1 h-100 pb-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          width: '4px',
          height: `${i * 3 + 4}px`,
          backgroundColor: i <= level ? '#38bdf8' : 'rgba(255,255,255,0.1)',
          borderRadius: '2px'
        }} />
      ))}
      {speed === 'Auto' && <span className="ms-1 text-info" style={{ fontSize: '10px', fontWeight: 'bold' }}>A</span>}
    </div>
  );
};

const CircularDial = ({ currentTemp, setTemp, state, mode, fault }) => {
  if (state === 'OFF') {
    return (
      <div className="VRV-dial off-state">
        <span>OFF</span>
      </div>
    );
  }

  const isHeat = mode === 'Heat';

  let strokeColor = '#38bdf8';
  if (isHeat) strokeColor = '#f87171';
  if (fault) strokeColor = '#facc15';

  const r = 40;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  const maxArcLength = circumference * 0.75;
  const minTemp = 15;
  const maxTemp = 35;
  const clampedTemp = Math.max(minTemp, Math.min(maxTemp, currentTemp || 25));
  const tempPercent = (clampedTemp - minTemp) / (maxTemp - minTemp);
  const currentArcLength = maxArcLength * tempPercent;

  return (
    <div className="VRV-dial-wrapper">
      <svg viewBox="0 0 100 100" className="VRV-dial-svg">
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - maxArcLength}
          strokeLinecap="round"
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - currentArcLength}
          strokeLinecap="round"
        />
      </svg>
      <div className="VRV-dial-content">
        <div className="current-temp" style={{ color: strokeColor }}>
          {fault ? <AlertTriangle size={24} /> : (currentTemp ? `${currentTemp.toFixed(1)}°C` : '--')}
        </div>
        <div className="set-temp">
          {setTemp ? `${setTemp.toFixed(1)}°C` : '--'}
        </div>
      </div>
    </div>
  );
};

const VRVOverview = () => {
  const [rooms, setRoomsState] = useState(() => {
    const saved = localStorage.getItem('VRVRoomsState');
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const setRooms = (newRooms) => {
    setRoomsState(newRooms);
    localStorage.setItem('VRVRoomsState', JSON.stringify(newRooms));
  };
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [activeTab, setActiveTab] = useState('VRV'); // 'VRV' or 'SENSOR'

  const handleCardClick = (room, e) => {
    if (e.target.closest('.quick-control')) return;

    // Check if clicked exactly on the human sensor icon, open directly to SENSOR tab
    if (e.target.closest('.sensor-icon-btn')) {
      setActiveTab('SENSOR');
    } else {
      setActiveTab('VRV');
    }

    setSelectedRoom(room);
    setTempSettings({ ...room });
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleSave = () => {
    setRooms(rooms.map(r => r.id === tempSettings.id ? { ...tempSettings } : r));
    setShowModal(false);
  };

  const updateSetting = (key, value) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  const quickUpdate = (id, key, value) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, [key]: value } : r));
  };

  const cycleMode = (id, currentMode) => {
    const modes = ['Cool', 'Dry', 'Fan', 'Heat'];
    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
    quickUpdate(id, 'mode', modes[nextIndex]);
  };

  const cycleFan = (id, currentFan) => {
    const speeds = ['Auto', 'High', 'Middle', 'Mid-High', 'Low', 'Mid-Low'];
    const nextIndex = (speeds.indexOf(currentFan) + 1) % speeds.length;
    quickUpdate(id, 'fanSpeed', speeds[nextIndex]);
  };

  return (
    <div className="fade-in p-2">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white d-flex align-items-center"><Wind className="me-2 text-info" /> VRV Management</h2>
          <p className="text-secondary fs-7">Air conditioning and human occupancy detection overview</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-info" size="sm" className="d-flex align-items-center rounded-pill px-3 py-2 fw-bold" style={{ borderColor: '#38bdf8' }}>
            <Activity size={16} className="me-2" /> All ON
          </Button>
          <Button variant="outline-secondary" size="sm" className="d-flex align-items-center rounded-pill px-3 py-2 fw-bold">
            <Power size={16} className="me-2" /> All OFF
          </Button>
        </div>
      </div>

      <Row className="g-4 mb-5">
        {rooms.map(room => (
          <Col xs={12} sm={6} md={4} lg={3} key={room.id}>
            <Card
              className={`VRV-room-card position-relative ${room.faultCode ? 'fault' : ''}`}
              onClick={(e) => handleCardClick(room, e)}
            >
              <Card.Body className="d-flex flex-column p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="room-title text-muted m-0">{room.name}</h5>
                  <div className="quick-control" onClick={() => quickUpdate(room.id, 'state', room.state === 'ON' ? 'OFF' : 'ON')}>
                    <Power size={20} className={room.state === 'ON' ? 'text-info' : 'text-secondary'} style={{ cursor: 'pointer', transition: '0.2s' }} />
                  </div>
                </div>

                <div className="d-flex justify-content-center align-items-center position-relative my-2">
                  <div
                    className="quick-control position-absolute start-0 d-flex justify-content-center align-items-center rounded-circle"
                    style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    onClick={() => room.state === 'ON' && quickUpdate(room.id, 'setTemp', Math.max(17, room.setTemp - 0.5))}
                  >
                    <span className="text-white fw-bold">-</span>
                  </div>

                  <CircularDial
                    currentTemp={room.currentTemp}
                    setTemp={room.setTemp}
                    state={room.state}
                    mode={room.mode}
                    fault={room.faultCode}
                  />

                  <div
                    className="quick-control position-absolute end-0 d-flex justify-content-center align-items-center rounded-circle"
                    style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    onClick={() => room.state === 'ON' && quickUpdate(room.id, 'setTemp', Math.min(30, room.setTemp + 0.5))}
                  >
                    <span className="text-white fw-bold">+</span>
                  </div>
                </div>

                {/* Bottom Quick Controls & Sensors */}
                <div className="d-flex justify-content-between align-items-end mt-auto pt-4">
                  {/* Left: Settings Panel */}
                  <div className="d-flex gap-3">
                    <div
                      className="quick-control d-flex flex-column align-items-center gap-1"
                      onClick={() => room.state === 'ON' && cycleMode(room.id, room.mode)}
                      style={{ cursor: room.state === 'ON' ? 'pointer' : 'default', opacity: room.state === 'ON' ? 1 : 0.3 }}
                      title={`Mode: ${room.mode}`}
                    >
                      {getModeIcon(room.mode, 18)}
                    </div>

                    <div
                      className="quick-control d-flex flex-column align-items-center gap-1"
                      onClick={() => room.state === 'ON' && cycleFan(room.id, room.fanSpeed)}
                      style={{ cursor: room.state === 'ON' ? 'pointer' : 'default', opacity: room.state === 'ON' ? 1 : 0.3, height: '18px' }}
                      title={`Fan: ${room.fanSpeed}`}
                    >
                      {getFanSpeedBars(room.fanSpeed)}
                    </div>
                  </div>

                  {/* Right: Human Presence Sensor */}
                  <div className="d-flex align-items-center gap-2" title={!room.sensorEnabled ? 'Sensor Disabled' : (room.occupied ? 'Human Detected' : 'Room Empty')}>
                    {room.faultCode && (
                      <Badge bg="warning" text="dark" className="d-flex align-items-center py-1 me-1">
                        <AlertTriangle size={10} className="me-1" /> {room.faultCode}
                      </Badge>
                    )}

                    {/* Realistic Mini Radar for Human Presence */}
                    {!room.sensorEnabled ? (
                      <div className="sensor-icon-btn p-1 rounded-circle quick-control bg-danger bg-opacity-25" style={{ cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} className="text-danger" />
                      </div>
                    ) : (
                      <div
                        className="sensor-icon-btn quick-control position-relative rounded-circle overflow-hidden d-flex align-items-center justify-content-center shadow-sm"
                        style={{
                          cursor: 'pointer', width: '36px', height: '36px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: room.occupied ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.3)',
                          boxShadow: room.occupied ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                        }}
                      >
                        <div className="position-absolute w-100 h-100 mini-radar-sweep" />
                        {room.occupied && <div className="position-absolute w-100 h-100 rounded-circle mini-radar-pulse" />}
                        <User size={16} className={`position-relative z-1 ${room.occupied ? 'text-success' : 'text-info'}`} style={{ filter: room.occupied ? 'drop-shadow(0 0 4px #10b981)' : 'none' }} />
                      </div>
                    )}
                  </div>
                </div>

              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Settings Modal with Tabs */}
      <Modal show={showModal} onHide={handleClose} centered size="lg" dialogClassName="scada-glass-modal" contentClassName="border-0 text-white">
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25" style={{ background: 'rgba(15, 23, 42, 0.55)' }}>
          <Modal.Title className="d-flex align-items-center text-white fw-bold">
            <Settings className="me-2 text-info" size={20} /> Room Setup: {selectedRoom?.name}
          </Modal.Title>
        </Modal.Header>

        {/* Custom Tabs */}
        <div className="d-flex border-bottom border-secondary border-opacity-25 px-4 pt-3" style={{ background: 'rgba(15, 23, 42, 0.94)' }}>
          <div
            className={`pb-2 px-3 me-3 fw-bold ${activeTab === 'VRV' ? 'text-info border-bottom border-info border-3' : 'text-secondary cursor-pointer'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('VRV')}
          >
            <Wind size={16} className="me-2" /> VRV Controls
          </div>
          <div
            className={`pb-2 px-3 fw-bold ${activeTab === 'SENSOR' ? 'text-success border-bottom border-success border-3' : 'text-secondary cursor-pointer'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('SENSOR')}
          >
            <User size={16} className="me-2" /> Human Sensor Automation
          </div>
        </div>

        <Modal.Body className="p-4" style={{ background: 'rgba(15, 23, 42, 0.94)' }}>
          {selectedRoom && tempSettings && (
            <div className="VRV-control-panel">

              {/* VRV Tab */}
              {activeTab === 'VRV' && (
                <>
                  <Row className="g-4 mb-4">
                    <Col md={3}>
                      <div className="control-box">
                        <label className="text-secondary fw-bold text-uppercase fs-7 d-block mb-3">Power</label>
                        <div className="d-flex gap-2">
                          <Button
                            variant={tempSettings.state === 'ON' ? 'info' : 'outline-secondary'}
                            className="flex-grow-1 fw-bold"
                            onClick={() => updateSetting('state', 'ON')}
                          >
                            ON
                          </Button>
                          <Button
                            variant={tempSettings.state === 'OFF' ? 'danger' : 'outline-secondary'}
                            className="flex-grow-1 fw-bold"
                            onClick={() => updateSetting('state', 'OFF')}
                          >
                            OFF
                          </Button>
                        </div>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="control-box">
                        <label className="text-secondary fw-bold text-uppercase fs-7 d-block mb-3">Mode</label>
                        <div className="d-flex gap-2 mode-selector flex-wrap">
                          {['Cool', 'Dry', 'Fan', 'Heat'].map(m => (
                            <Button
                              key={m}
                              variant={tempSettings.mode === m ? (m === 'Heat' ? 'danger' : 'info') : 'outline-secondary'}
                              className="flex-grow-1 mode-btn"
                              onClick={() => updateSetting('mode', m)}
                              disabled={tempSettings.state === 'OFF'}
                            >
                              {m}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </Col>

                    <Col md={3}>
                      <div className="control-box text-center">
                        <label className="text-secondary fw-bold text-uppercase fs-7 d-block mb-3">Set Temp</label>
                        <div className="temp-stepper d-flex align-items-center justify-content-center gap-3">
                          <Button
                            variant="outline-secondary"
                            className="rounded-circle temp-btn"
                            onClick={() => updateSetting('setTemp', Math.max(17, (tempSettings.setTemp || 24) - 0.5))}
                            disabled={tempSettings.state === 'OFF'}
                          >-</Button>
                          <span className="fs-3 text-white font-monospace fw-bold">{tempSettings.setTemp ? tempSettings.setTemp.toFixed(1) : '--'}</span>
                          <Button
                            variant="outline-secondary"
                            className="rounded-circle temp-btn"
                            onClick={() => updateSetting('setTemp', Math.min(30, (tempSettings.setTemp || 24) + 0.5))}
                            disabled={tempSettings.state === 'OFF'}
                          >+</Button>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <Row className="g-4">
                    <Col md={6}>
                      <div className="control-box">
                        <label className="text-secondary fw-bold text-uppercase fs-7 d-block mb-3">Fan Speed</label>
                        <Form.Select
                          className="scada-select fw-bold"
                          value={tempSettings.fanSpeed || 'Auto'}
                          onChange={(e) => updateSetting('fanSpeed', e.target.value)}
                          disabled={tempSettings.state === 'OFF'}
                        >
                          <option value="Auto">Auto</option>
                          <option value="High">High</option>
                          <option value="Middle">Middle</option>
                          <option value="Mid-High">Mid-High</option>
                          <option value="Low">Low</option>
                          <option value="Mid-Low">Mid-Low</option>
                        </Form.Select>
                      </div>
                    </Col>

                    <Col md={6}>
                      <div className="control-box sensor-box d-flex flex-column justify-content-center gap-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-info fw-bold text-uppercase fs-7 d-block mb-1">Ambient Temp (Read)</span>
                            <span className="fs-2 text-white font-monospace fw-black">{tempSettings.currentTemp ? `${tempSettings.currentTemp.toFixed(1)}°C` : '--'}</span>
                          </div>
                          <div className="p-2 bg-info bg-opacity-10 rounded-circle text-info">
                            <Thermometer size={28} />
                          </div>
                        </div>

                        {/* Custom Override Block */}
                        <div className="p-3 mt-3 rounded border border-secondary border-opacity-50" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
                          <div className="d-flex gap-3">
                            <div className="flex-grow-1">
                              <span className="text-warning fw-bold text-uppercase mb-1 d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Fault Code</span>
                              <Form.Select
                                size="sm"
                                className="bg-dark text-white border-warning border-opacity-50 fw-bold"
                                style={{ fontSize: '0.85rem' }}
                                value={tempSettings.faultCodeOverride || (tempSettings.mode === 'Heat' ? 'HEATING' : 'COOLING')}
                                onChange={(e) => updateSetting('faultCodeOverride', e.target.value)}
                              >
                                <option value="COOLING">COOLING</option>
                                <option value="HEATING">HEATING</option>
                              </Form.Select>
                            </div>
                            <div className="flex-grow-1">
                              <span className="text-success fw-bold text-uppercase mb-1 d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>State</span>
                              <Form.Select
                                size="sm"
                                className="bg-dark text-white border-success border-opacity-50 fw-bold"
                                style={{ fontSize: '0.85rem' }}
                                value={tempSettings.stateOverride || tempSettings.state}
                                onChange={(e) => updateSetting('stateOverride', e.target.value)}
                              >
                                <option value="ON">ON</option>
                                <option value="OFF">OFF</option>
                              </Form.Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </>
              )}

              {/* HUMAN SENSOR Tab */}
              {activeTab === 'SENSOR' && (
                <div className="fade-in">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded mb-4" style={{ background: 'rgba(25, 135, 84, 0.05)', border: '1px solid rgba(25, 135, 84, 0.2)' }}>
                    <div>
                      <h5 className="text-white fw-bold m-0 d-flex align-items-center"><ShieldCheck className="me-2 text-success" size={20} /> Enable Sensor Integration</h5>
                      <p className="text-secondary fs-8 m-0 mt-1">Turn on/off all human sensor automation rules for this unit.</p>
                    </div>
                    <Form.Check
                      type="switch"
                      id="modal-sensor-enable"
                      checked={tempSettings.sensorEnabled}
                      onChange={(e) => updateSetting('sensorEnabled', e.target.checked)}
                      className="fs-4 custom-switch-success"
                    />
                  </div>

                  <div style={{ opacity: tempSettings.sensorEnabled ? 1 : 0.4, pointerEvents: tempSettings.sensorEnabled ? 'auto' : 'none', transition: 'all 0.3s' }}>
                    <Row className="g-4">
                      <Col md={12}>
                        <div className="control-box">
                          <label className="text-secondary fw-bold text-uppercase fs-7 d-block mb-3">Auto ON/OFF (Power Link)</label>
                          <div className="d-flex gap-2">
                            <Button
                              variant={tempSettings.autoPowerLink ? 'success' : 'outline-secondary'}
                              className="flex-grow-1 fw-bold"
                              onClick={() => updateSetting('autoPowerLink', true)}
                            >
                              Auto Mode Enabled
                            </Button>
                            <Button
                              variant={!tempSettings.autoPowerLink ? 'warning' : 'outline-secondary'}
                              className="flex-grow-1 fw-bold"
                              onClick={() => updateSetting('autoPowerLink', false)}
                            >
                              Manual Control Only
                            </Button>
                          </div>
                          <p className="text-secondary fs-8 mt-2 mb-0">If Auto Mode is enabled, the AC powers ON/OFF automatically depending on human presence input.</p>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="control-box text-center">
                          <label className="text-secondary fw-bold text-uppercase fs-7 d-block mb-3"><Maximize className="me-1" size={14} /> Auto Save Range</label>
                          <div className="fs-3 text-white font-monospace fw-bold mb-2">{tempSettings.detectionRange}m</div>
                          <Form.Range
                            min={1} max={15}
                            value={tempSettings.detectionRange}
                            onChange={(e) => updateSetting('detectionRange', Number(e.target.value))}
                            className="custom-range"
                          />
                          <p className="text-secondary fs-8 mt-2 mb-0">Detection zone radius for human presence.</p>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="control-box text-center">
                          <label className="text-secondary fw-bold text-uppercase fs-7 d-block mb-3"><Clock className="me-1" size={14} /> Auto-OFF Delay Time</label>
                          <div className="fs-3 text-white font-monospace fw-bold mb-2">{tempSettings.offDelayTime} min</div>
                          <Form.Range
                            min={1} max={60}
                            value={tempSettings.offDelayTime}
                            onChange={(e) => updateSetting('offDelayTime', Number(e.target.value))}
                            className="custom-range"
                          />
                          <p className="text-secondary fs-8 mt-2 mb-0">Time before AC shuts off after room is empty.</p>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              )}

            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary border-opacity-25" style={{ background: 'rgba(15, 23, 42, 0.94)' }}>
          <Button variant="outline-secondary" className="px-4 rounded-pill" onClick={handleClose}>
            Discard
          </Button>
          <Button variant="info" className="px-4 rounded-pill fw-bold text-dark" onClick={handleSave}>
            Apply Settings
          </Button>
        </Modal.Footer>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-switch-success .form-check-input:checked {
          background-color: #198754;
          border-color: #198754;
          box-shadow: 0 0 15px rgba(25, 135, 84, 0.5);
        }
        
        /* Mini Radar Animations for Cards */
        .mini-radar-sweep {
          background: conic-gradient(from 0deg, transparent 70%, rgba(56, 189, 248, 0.5) 100%);
          animation: sweep 3s linear infinite;
          border-radius: 50%;
        }
        
        .mini-radar-pulse {
          border: 2px solid #10b981;
          animation: pulse-out 1.5s ease-out infinite;
        }
        
        @keyframes sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse-out {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default VRVOverview;

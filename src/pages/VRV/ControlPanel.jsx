import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Badge, ProgressBar } from 'react-bootstrap';
import { Settings, Power, Thermometer, Wind, Droplets, Fan, Activity, Zap, ShieldAlert, CheckCircle2, RotateCw, Gauge, Snowflake, Sun } from 'lucide-react';
import './VRVOverview.css';

const units = ['Common', 'Lobby', 'Office', 'Conference', 'Warehouse', 'Laboratory'];

const getModeIcon = (mode) => {
  switch (mode) {
    case 'Cool': return <Snowflake size={18} />;
    case 'Heat': return <Sun size={18} />;
    case 'Dry': return <Droplets size={18} />;
    case 'Fan': return <Fan size={18} />;
    default: return <Wind size={18} />;
  }
};

const defaultRooms = [
  { id: 1, name: 'Common', currentTemp: 26.0, setTemp: 26.0, state: 'ON', mode: 'Cool', fanSpeed: 'Auto', faultCode: null, occupied: true, sensorEnabled: true, autoPowerLink: true, detectionRange: 5, offDelayTime: 15 },
  { id: 2, name: 'Lobby', currentTemp: 20.0, setTemp: 29.5, state: 'ON', mode: 'Cool', fanSpeed: 'High', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: true, detectionRange: 8, offDelayTime: 10 },
  { id: 3, name: 'Office', currentTemp: 20.0, setTemp: 29.5, state: 'ON', mode: 'Heat', fanSpeed: 'Middle', faultCode: null, occupied: true, sensorEnabled: false, autoPowerLink: false, detectionRange: 3, offDelayTime: 30 },
  { id: 4, name: 'Conference', currentTemp: null, setTemp: 24.0, state: 'OFF', mode: 'Cool', fanSpeed: 'Auto', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: true, detectionRange: 10, offDelayTime: 5 },
  { id: 5, name: 'Warehouse', currentTemp: 15.5, setTemp: 26.0, state: 'ON', mode: 'Cool', fanSpeed: 'Low', faultCode: null, occupied: false, sensorEnabled: true, autoPowerLink: false, detectionRange: 15, offDelayTime: 60 },
  { id: 6, name: 'Laboratory', currentTemp: 15.5, setTemp: 26.0, state: 'ON', mode: 'Heat', fanSpeed: 'Auto', faultCode: 'E11', occupied: true, sensorEnabled: true, autoPowerLink: true, detectionRange: 6, offDelayTime: 20 },
];

const ControlPanel = () => {
  const [selectedUnit, setSelectedUnit] = useState('Common');

  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('VRVRoomsState');
    return saved ? JSON.parse(saved) : defaultRooms;
  });

  const settings = rooms.find(r => r.name === selectedUnit) || rooms[0];

  const updateSetting = (key, val) => {
    const actualKey = key === 'power' ? 'state' : key;
    const updatedRooms = rooms.map(r => r.name === selectedUnit ? { ...r, [actualKey]: val } : r);
    setRooms(updatedRooms);
    localStorage.setItem('VRVRoomsState', JSON.stringify(updatedRooms));
  };

  // Simulated live telemetry based on settings
  const isOff = settings.state === 'OFF';
  const ambientTemp = isOff ? 26.5 : (settings.mode === 'Cool' ? 24.2 : 23.8);
  const humidity = isOff ? 55 : 45;
  const powerDraw = isOff ? 0 : (settings.mode === 'Cool' || settings.mode === 'Heat' ? 1.8 : 0.3);
  const airflow = isOff ? 0 : (settings.fanSpeed === 'High' ? 1200 : settings.fanSpeed === 'Low' ? 400 : 850);
  const compressor = isOff || settings.mode === 'Fan' ? 'OFF' : 'RUNNING';
  const compressorLoad = isOff || settings.mode === 'Fan' ? 0 : 75;
  const valvePosition = isOff || settings.mode === 'Fan' ? 0 : 60;



  return (
    <div className="fade-in p-2 VRV-full-panel">
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white d-flex align-items-center"><Settings className="me-2 text-info" /> Detailed Control Panel</h2>
          <p className="text-secondary fs-7">Advanced monitoring and telemetry for individual VRV units</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary fw-bold text-uppercase fs-8">Select Unit:</span>
          <Form.Select
            className="scada-select fw-bold py-2 border-info"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            {units.map(u => <option key={u} value={u}>{u} Unit</option>)}
          </Form.Select>
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column: Core Controls */}
        <Col lg={7}>
          <Row className="g-4">

            {/* Top Left: Power & Temperature */}
            <Col md={12}>
              <Card className="scada-card border-0 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                <Card.Body className="p-4">
                  <Row className="align-items-center">
                    <Col sm={5} className="text-center border-end border-secondary border-opacity-25">
                      <h6 className="text-secondary fw-bold text-uppercase fs-8 mb-4">Master Power</h6>
                      <div className="d-flex justify-content-center gap-3">
                        <Button
                          variant={settings.state === 'ON' ? 'info' : 'outline-secondary'}
                          className="rounded-pill px-4 py-2 fw-bold d-flex align-items-center"
                          onClick={() => updateSetting('state', 'ON')}
                          style={{ minWidth: '100px', boxShadow: settings.state === 'ON' ? '0 0 15px rgba(56,189,248,0.4)' : 'none' }}
                        >
                          <Power size={18} className="me-2" /> ON
                        </Button>
                        <Button
                          variant={settings.state === 'OFF' ? 'danger' : 'outline-secondary'}
                          className="rounded-pill px-4 py-2 fw-bold d-flex align-items-center"
                          onClick={() => updateSetting('state', 'OFF')}
                          style={{ minWidth: '100px' }}
                        >
                          OFF
                        </Button>
                      </div>
                    </Col>

                    <Col sm={7} className="text-center">
                      <h6 className="text-secondary fw-bold text-uppercase fs-8 mb-3">Temperature Setpoint</h6>
                      <div className="d-flex align-items-center justify-content-center gap-4">
                        <Button
                          variant="outline-info"
                          className="rounded-circle d-flex justify-content-center align-items-center p-0 flex-shrink-0"
                          style={{ width: '45px', height: '45px', borderWidth: '2px' }}
                          onClick={() => updateSetting('setTemp', Math.max(17, settings.setTemp - 0.5))}
                          disabled={isOff}
                        >
                          <span className="fs-4 fw-bold mb-1">-</span>
                        </Button>

                        <div className="position-relative d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: '120px', height: '120px' }}>
                          <svg viewBox="0 0 100 100" className="position-absolute w-100 h-100" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                            <circle
                              cx="50" cy="50" r="45" fill="none"
                              stroke={isOff ? 'rgba(255,255,255,0.1)' : (settings.mode === 'Heat' ? '#f87171' : '#38bdf8')}
                              strokeWidth="4"
                              strokeDasharray={2 * Math.PI * 45}
                              strokeDashoffset={(2 * Math.PI * 45) * (1 - ((settings.setTemp - 17) / 13))}
                              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                          </svg>
                          <div className="d-flex flex-column align-items-center mt-1">
                            <span className="text-white fw-bold" style={{ fontSize: '2.2rem', lineHeight: '1' }}>{settings.setTemp.toFixed(1)}</span>
                            <span className="text-info fw-bold text-uppercase mt-1" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Target °C</span>
                          </div>
                        </div>

                        <Button
                          variant="outline-info"
                          className="rounded-circle d-flex justify-content-center align-items-center p-0 flex-shrink-0"
                          style={{ width: '45px', height: '45px', borderWidth: '2px' }}
                          onClick={() => updateSetting('setTemp', Math.min(30, settings.setTemp + 0.5))}
                          disabled={isOff}
                        >
                          <span className="fs-4 fw-bold mb-1">+</span>
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Bottom Left: Mode & Fan Speed */}
            <Col md={12}>
              <Card className="scada-card border-0 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <h6 className="text-secondary fw-bold text-uppercase fs-8 mb-3">Operation Mode</h6>
                    <div className="d-flex gap-2">
                      {['Cool', 'Dry', 'Fan', 'Heat'].map(m => (
                        <Button
                          key={m}
                          variant={settings.mode === m ? (m === 'Heat' ? 'danger' : 'info') : 'outline-secondary'}
                          className="flex-grow-1 py-2 fw-bold d-flex flex-column align-items-center gap-1"
                          onClick={() => updateSetting('mode', m)}
                          disabled={isOff}
                          style={{ opacity: isOff ? 0.3 : 1 }}
                        >
                          {getModeIcon(m)}
                          <span style={{ fontSize: '0.75rem' }}>{m}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h6 className="text-secondary fw-bold text-uppercase fs-8 mb-3">Fan Speed</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {['Auto', 'High', 'Middle', 'Mid-High', 'Low', 'Mid-Low'].map(f => (
                        <Button
                          key={f}
                          variant={settings.fanSpeed === f ? 'info' : 'outline-secondary'}
                          className="flex-grow-1 py-2 fw-bold"
                          onClick={() => updateSetting('fanSpeed', f)}
                          disabled={isOff}
                          style={{ opacity: isOff ? 0.3 : 1, fontSize: '0.8rem', minWidth: '80px' }}
                        >
                          {f}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

          </Row>
        </Col>

        {/* Right Column: Telemetry & Live Data */}
        <Col lg={5}>
          <Card className="scada-card border-0 h-100 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-4 d-flex justify-content-between align-items-center">
              <h5 className="text-white fw-bold m-0 d-flex align-items-center"><Activity size={18} className="me-2 text-info" /> System Telemetry</h5>
              <Badge bg={isOff ? 'secondary' : 'success'} className="px-3 py-2 fs-8 text-uppercase tracking-widest rounded-pill">
                {isOff ? 'System Offline' : 'System Online'}
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">

              {/* Primary Environment Reading */}
              <div className="p-4 border-bottom border-secondary border-opacity-25 text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="d-flex justify-content-center gap-5">
                  <div>
                    <span className="text-secondary fw-bold text-uppercase fs-8 d-block mb-1">Ambient Temp</span>
                    <span className="text-white font-monospace fw-bold" style={{ fontSize: '2.5rem' }}>{ambientTemp.toFixed(1)}<span className="fs-5 text-info">°C</span></span>
                  </div>
                  <div>
                    <span className="text-secondary fw-bold text-uppercase fs-8 d-block mb-1">Humidity</span>
                    <span className="text-white font-monospace fw-bold" style={{ fontSize: '2.5rem' }}>{humidity}<span className="fs-5 text-info">%</span></span>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics List */}
              <div className="p-4 d-flex flex-column gap-4">

                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="p-2 bg-warning bg-opacity-10 rounded text-warning me-3"><Zap size={18} /></div>
                    <div>
                      <span className="text-white fw-bold d-block">Power Draw</span>
                      <span className="text-secondary fs-8">Current electrical load</span>
                    </div>
                  </div>
                  <span className="text-white font-monospace fw-bold fs-5">{powerDraw.toFixed(1)} <span className="fs-7 text-secondary">kW</span></span>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="p-2 bg-info bg-opacity-10 rounded text-info me-3"><Wind size={18} /></div>
                    <div>
                      <span className="text-white fw-bold d-block">Airflow Rate</span>
                      <span className="text-secondary fs-8">Supply air volume</span>
                    </div>
                  </div>
                  <span className="text-white font-monospace fw-bold fs-5">{airflow} <span className="fs-7 text-secondary">CFM</span></span>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="p-2 bg-success bg-opacity-10 rounded text-success me-3"><RotateCw size={18} /></div>
                    <div>
                      <span className="text-white fw-bold d-block">Compressor</span>
                      <span className="text-secondary fs-8">State and load capacity</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`fw-bold d-block ${compressor === 'RUNNING' ? 'text-success' : 'text-secondary'}`}>{compressor}</span>
                    <span className="text-secondary font-monospace fs-8">{compressorLoad}% Load</span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-secondary fs-8 fw-bold text-uppercase"><Gauge size={14} className="me-1" /> Cool/Heat Valve Position</span>
                    <span className="text-info fs-8 fw-bold">{valvePosition}% OPEN</span>
                  </div>
                  <ProgressBar variant="info" now={valvePosition} style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                </div>

              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Bottom Full Width row: Faults & Maintenance */}
        <Col lg={12}>
          <Card className="scada-card border-0 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
            <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-4">

              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-circle bg-success bg-opacity-10 border border-success border-opacity-25">
                  <CheckCircle2 className="text-success" size={24} />
                </div>
                <div>
                  <span className="text-secondary fw-bold text-uppercase fs-8 d-block mb-1">System Fault Code</span>
                  <span className="text-white fw-bold fs-5">No Fault (0)</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 border-start border-secondary border-opacity-25 ps-4">
                <div className="p-3 rounded-circle bg-info bg-opacity-10 border border-info border-opacity-25">
                  <Thermometer className="text-info" size={24} />
                </div>
                <div>
                  <span className="text-secondary fw-bold text-uppercase fs-8 d-block mb-1">Return Air Temp</span>
                  <span className="text-white fw-bold fs-5 font-monospace">{isOff ? '--' : '24.5'} <span className="fs-7 text-secondary">°C</span></span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 border-start border-secondary border-opacity-25 ps-4">
                <div className="p-3 rounded-circle bg-primary bg-opacity-10 border border-primary border-opacity-25">
                  <Wind className="text-primary" size={24} />
                </div>
                <div>
                  <span className="text-secondary fw-bold text-uppercase fs-8 d-block mb-1">Filter Status</span>
                  <span className="text-white fw-bold fs-5">CLEAN (85%)</span>
                </div>
              </div>

              <Button variant="outline-info" className="ms-auto fw-bold px-4 rounded-pill">
                Export Diagnostics Log
              </Button>

            </Card.Body>
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default ControlPanel;

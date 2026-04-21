import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Badge } from 'react-bootstrap';
import { Settings as SettingsIcon, Users, Lock, Shield, Eye, Save, RotateCcw } from 'lucide-react';
import PdfButton from '../../components/PdfButton';

const Settings = () => {
  const defaultModules = {
    "Dashboard": true,
    "Water Management": true,
    "Motors": true,
    "DG Monitoring": true,
    "Alarm System": true,
    "LT Panel": true,
    "Transformer": true,
    "Fire Pumps": true,
    "Ticketing": true,
    "Maintenance": true,
    "Service History": true,
    "Daily DPR": true
  };

  const [modules, setModules] = useState(() => {
    const saved = localStorage.getItem('scada_modules_config');
    const parsed = saved ? JSON.parse(saved) : {};
    return { ...defaultModules, ...parsed };
  });

  const [saveStatus, setSaveStatus] = useState(null);

  const toggleModule = (name) => {
    const newModules = { ...modules, [name]: !modules[name] };
    setModules(newModules);
    localStorage.setItem('scada_modules_config', JSON.stringify(newModules));
    
    setSaveStatus('Config Updated');
    setTimeout(() => setSaveStatus(null), 2000);
    window.dispatchEvent(new Event('storage-update'));
  };

  const resetConfig = () => {
    setModules(defaultModules);
    localStorage.setItem('scada_modules_config', JSON.stringify(defaultModules));
    window.dispatchEvent(new Event('storage-update'));
    setSaveStatus('Reset Success');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  return (
    <div className="fade-in p-2">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold">System Configuration</h2>
          <p className="text-secondary fs-7">Global control center for module visibility and access protocols.</p>
        </div>
        <div className="d-flex gap-2">
            {saveStatus && <Badge bg="success" className="d-flex align-items-center px-3 mb-2">{saveStatus}</Badge>}
            <button onClick={resetConfig} className="btn-scada-outline d-flex align-items-center gap-2">
                <RotateCcw size={16} /> RESET
            </button>
            <PdfButton label="EXPORT CONFIG" />
        </div>
      </div>

      <Row className="g-4">
        <Col lg={5}>
          <Card className="scada-card border-0 shadow-lg h-100" style={{ background: '#0f172a' }}>
            <Card.Body className="p-4">
              <h6 className="mb-4 d-flex align-items-center text-info fw-black uppercase tracking-widest fs-12">
                <Shield size={18} className="me-2" /> Application Module Control
              </h6>
              
              <div className="module-list-container custom-scrollbar pe-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {Object.keys(modules).map((name) => (
                    <div key={name} className={`d-flex justify-content-between align-items-center mb-2 p-3 rounded-4 border transition-all ${modules[name] ? 'border-info border-opacity-10 bg-black bg-opacity-40' : 'border-secondary border-opacity-5 bg-dark bg-opacity-10 opacity-40'}`}>
                    <div className="d-flex align-items-center gap-3">
                        <div className={`p-2 rounded-circle ${modules[name] ? 'bg-info text-dark' : 'bg-secondary text-white opacity-10'}`}>
                            <SettingsIcon size={14} />
                        </div>
                        <span className={`fw-bold ${modules[name] ? 'text-white' : 'text-muted'}`}>{name}</span>
                    </div>
                    <Form.Check 
                        type="switch"
                        id={`switch-${name}`}
                        checked={modules[name]}
                        onChange={() => toggleModule(name)}
                        className="scada-switch custom-switch-large"
                    />
                    </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
            <Row className="g-4">
                <Col md={12}>
                    <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a' }}>
                        <Card.Body className="p-4">
                            <h6 className="mb-4 d-flex align-items-center text-warning fw-black uppercase tracking-widest fs-12">
                                <Users size={18} className="me-2" /> Role Management
                            </h6>
                            <Row className="g-4">
                                <Col md={6}>
                                    <label className="text-secondary fs-11 fw-bold uppercase mb-2 d-block">System Roles</label>
                                    <Form.Select className="scada-select p-2 rounded-3">
                                        <option className="bg-dark text-white">Admin</option>
                                        <option className="bg-dark text-white">User</option>
                                    </Form.Select>
                                </Col>
                                <Col md={6}>
                                    <label className="text-secondary fs-11 fw-bold uppercase mb-2 d-block">Auth Protocol</label>
                                    <div className="d-flex flex-column gap-2">
                                        <div className="d-flex justify-content-between align-items-center p-2 bg-black bg-opacity-30 rounded-3 border border-white border-opacity-5">
                                            <span className="text-muted fs-11 fw-bold">Multi-Factor (MFA)</span>
                                            <Form.Check type="switch" defaultChecked className="scada-switch" />
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center p-2 bg-black bg-opacity-30 rounded-3 border border-white border-opacity-5">
                                            <span className="text-muted fs-11 fw-bold">Auto-Lock Idle</span>
                                            <Form.Check type="switch" defaultChecked className="scada-switch" />
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={12}>
                    <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a' }}>
                        <Card.Body className="p-4 text-center py-5">
                            <Eye size={40} className="text-info opacity-25 mb-3" />
                            <h5 className="text-white fw-black uppercase tracking-tight">Advanced System HUD</h5>
                            <p className="text-muted fs-11 mx-auto max-w-sm">HUD overlays and real-time telemetry visualization settings are managed remotely by the master supervisor node.</p>
                            <button className="btn-scada-primary px-5 py-2 mt-2">CONFIGURE VISUALS</button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Col>
      </Row>

      <style dangerouslySetInnerHTML={{ __html: `
        .scada-card { transition: all 0.3s; }
        .scada-switch .form-check-input { width: 45px; height: 22px; cursor: pointer; }
        .scada-switch .form-check-input:checked { background-color: #0ea5e9; border-color: #0ea5e9; box-shadow: 0 0 10px rgba(14, 165, 233, 0.5); }
        
        .scada-select {
            background-color: #020617 !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: white !important;
            appearance: none;
            cursor: pointer;
        }
        .scada-select option {
            background-color: #0f172a;
            color: white;
            padding: 10px;
        }

        .btn-scada-outline {
            background: rgba(255,255,255,0.02);
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
        
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-11 { font-size: 0.75rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .tracking-widest { letter-spacing: 2px !important; }
        .max-w-sm { max-width: 400px; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default Settings;

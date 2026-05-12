import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Badge } from 'react-bootstrap';
import { Settings as SettingsIcon, Shield, Save, RotateCcw } from 'lucide-react';

const Settings = () => {
  const defaultModules = {
    "Dashboard": true,
    "Water Management": true,
    "Motors": true,
    "DG Set": true,
    "Setting Templates": true,
    "Alarm System": true,
    "LT Panel": true,
    "Transformer": true,
    "Fire Pumps": true,
    "Ticketing": true,
    "Maintenance": true,
    "Service History": true,
    "Daily DPR": true
  };

  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState(defaultModules);
  const [saveStatus, setSaveStatus] = useState(null);

  const fetchGlobalConfig = async () => {
    try {
      const response = await fetch('/api/super-admin/config');
      if (response.ok) {
        const data = await response.json();
        
        // Map backend keys to sidebar labels
        const moduleMap = {
          showDashboard: 'Dashboard',
          showWaterManagement: 'Water Management',
          showMotors: 'Motors',
          showDGSet: 'DG Set',
          showSettingTemplates: 'Setting Templates',
          showAlarms: 'Alarm System',
          showLTPanel: 'LT Panel',
          showTransformers: 'Transformer',
          showFirePumps: 'Fire Pumps',
          showTicketing: 'Ticketing',
          showMaintenance: 'Maintenance',
          showServiceHistory: 'Service History',
          showDailyDPR: 'Daily DPR'
        };

        const sidebarModules = {};
        Object.entries(moduleMap).forEach(([key, label]) => {
          sidebarModules[label] = data[key] ?? true;
        });

        setModules(sidebarModules);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  useEffect(() => {
    fetchGlobalConfig();
  }, []);

  const toggleModule = (name) => {
    const newModules = { ...modules, [name]: !modules[name] };
    setModules(newModules);
  };

  const toggleAll = (enabled) => {
    const newModules = {};
    Object.keys(modules).forEach(key => { newModules[key] = enabled; });
    setModules(newModules);
  };

  const handleSaveToBackend = async () => {
    setSaving(true);
    try {
      const reverseMap = {
        'Dashboard': 'showDashboard',
        'Water Management': 'showWaterManagement',
        'Motors': 'showMotors',
        'DG Set': 'showDGSet',
        'Setting Templates': 'showSettingTemplates',
        'Alarm System': 'showAlarms',
        'LT Panel': 'showLTPanel',
        'Transformer': 'showTransformers',
        'Fire Pumps': 'showFirePumps',
        'Ticketing': 'showTicketing',
        'Maintenance': 'showMaintenance',
        'Service History': 'showServiceHistory',
        'Daily DPR': 'showDailyDPR'
      };

      const backendConfig = {};
      Object.entries(reverseMap).forEach(([label, key]) => {
        backendConfig[key] = modules[label];
      });

      const response = await fetch('/api/super-admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: backendConfig })
      });

      if (response.ok) {
        localStorage.setItem('scada_modules_config', JSON.stringify(modules));
        window.dispatchEvent(new Event('storage-update'));
        setSaveStatus('System Updated Successfully ✨');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('Error saving to system');
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = () => {
    setModules(defaultModules);
    setSaveStatus('Values Reset (Click Save to Persist)');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="fade-in p-2">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold">System Configuration</h2>
          <p className="text-secondary fs-7">Global control center for module visibility and access protocols.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
            {saveStatus && <Badge bg="success" className="d-flex align-items-center px-3 py-2 me-2 fade-in">{saveStatus}</Badge>}
            <button onClick={() => toggleAll(true)} className="btn-scada-outline text-success border-success border-opacity-25">ENABLE ALL</button>
            <button onClick={() => toggleAll(false)} className="btn-scada-outline text-danger border-danger border-opacity-25">DISABLE ALL</button>
            <button onClick={resetConfig} className="btn-scada-outline d-flex align-items-center gap-2">
                <RotateCcw size={16} /> RESET
            </button>
            <button onClick={handleSaveToBackend} disabled={saving} className="btn btn-info rounded-pill px-4 fw-bold fs-11 shadow-lg d-flex align-items-center gap-2">
                {saving ? <div className="spinner-border spinner-border-sm" /> : <Save size={16} />}
                SAVE & SYNC SYSTEM
            </button>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={12}>
          <Card className="scada-card border-0 shadow-lg h-100" style={{ background: '#0f172a' }}>
            <Card.Body className="p-4">
              <h6 className="mb-4 d-flex align-items-center text-info fw-black uppercase tracking-widest fs-12">
                <Shield size={18} className="me-2" /> Application Module Control
              </h6>
              
              <div className="module-list-container pe-2">
                <Row className="g-3">
                  {Object.keys(modules).map((name) => (
                    <Col key={name} md={6} lg={4} xl={3}>
                      <div className={`d-flex justify-content-between align-items-center h-100 p-3 rounded-4 border transition-all ${modules[name] ? 'border-info border-opacity-10 bg-black bg-opacity-40' : 'border-secondary border-opacity-5 bg-dark bg-opacity-10 opacity-40'}`}>
                        <div className="d-flex align-items-center gap-3">
                          <div className={`p-2 rounded-circle ${modules[name] ? 'bg-info text-dark' : 'bg-secondary text-white opacity-10'}`}>
                            <SettingsIcon size={14} />
                          </div>
                          <span className={`fw-bold fs-11 ${modules[name] ? 'text-white' : 'text-muted'}`}>{name}</span>
                        </div>
                        <Form.Check 
                          type="switch"
                          id={`switch-${name}`}
                          checked={modules[name]}
                          onChange={() => toggleModule(name)}
                          className="scada-switch custom-switch-large"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style dangerouslySetInnerHTML={{ __html: `
        .scada-card { transition: all 0.3s; }
        .scada-switch .form-check-input { width: 45px; height: 22px; cursor: pointer; }
        .scada-switch .form-check-input:checked { background-color: #0ea5e9; border-color: #0ea5e9; box-shadow: 0 0 10px rgba(14, 165, 233, 0.5); }
        
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
      `}} />
    </div>
  );
};

export default Settings;

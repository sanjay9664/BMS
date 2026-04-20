import React from 'react';
import { Row, Col, Card, Form } from 'react-bootstrap';
import { Settings as SettingsIcon, Users, Lock, Shield, Eye } from 'lucide-react';
import PdfButton from '../../components/PdfButton';

const Settings = () => {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="mb-1 text-white">System Settings</h2>
          <p className="text-muted">Configure modules, user access, and dashboard visibility.</p>
        </div>
        <PdfButton label="Download Config Report" />
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="scada-card">
            <Card.Body>
              <h6 className="mb-4 d-flex align-items-center">
                <Shield size={18} className="me-2 text-info" /> Module Control
              </h6>
              {[
                'Water Management', 'Motor Control', 'DG Monitoring', 
                'Alarm System', 'Ticketing', 'Maintenance'
              ].map((module, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center mb-3 p-2 rounded border border-secondary border-opacity-10">
                  <span className="fs-7">{module}</span>
                  <Form.Check 
                    type="switch"
                    id={`module-switch-${idx}`}
                    defaultChecked
                    className="scada-switch"
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="scada-card">
            <Card.Body>
              <h6 className="mb-4 d-flex align-items-center">
                <Users size={18} className="me-2 text-info" /> Access Control
              </h6>
              <div className="mb-4">
                <label className="text-muted fs-8 mb-2">Role Management</label>
                <Form.Select className="bg-dark border-secondary text-white fs-7 mb-3">
                  <option>System Admin</option>
                  <option>Maintenance Engineer</option>
                  <option>Operator</option>
                  <option>Viewer</option>
                </Form.Select>
              </div>
              <div className="mb-4">
                <label className="text-muted fs-8 mb-2">Password Policy</label>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Require MFA</small>
                  <Form.Check type="switch" defaultChecked />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Auto Logout (30m)</small>
                  <Form.Check type="switch" defaultChecked />
                </div>
              </div>
              <button className="btn btn-outline-info btn-sm w-100">Manage All Users</button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
           <Card className="scada-card">
            <Card.Body>
              <h6 className="mb-4 d-flex align-items-center">
                <Eye size={18} className="me-2 text-info" /> Display Preferences
              </h6>
               <div className="mb-4">
                <label className="text-muted fs-8 mb-2">Theme Selection</label>
                <div className="d-flex gap-2">
                    <div className="p-3 border border-info rounded flex-grow-1 text-center bg-dark text-info">Dark Industrial</div>
                    <div className="p-3 border border-secondary rounded flex-grow-1 text-center bg-light text-dark">Light Standard</div>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-muted fs-8 mb-2">Refresh Interval</label>
                <Form.Range defaultValue={5} min={1} max={60} />
                <div className="d-flex justify-content-between fs-8 text-muted">
                    <span>1s</span>
                    <span>Current: 5s</span>
                    <span>60s</span>
                </div>
              </div>
               <div className="d-flex justify-content-between align-items-center">
                  <span className="fs-7">Animations</span>
                  <Form.Check type="switch" defaultChecked />
                </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-4 p-4 scada-card bg-info bg-opacity-5 border-info border-opacity-25 rounded d-flex justify-content-between align-items-center">
        <div>
            <h5 className="mb-1 text-info fw-bold">Cloud Synchronization</h5>
            <p className="mb-0 text-muted fs-7">Last sync: 2026-04-20 12:00:00 (Success)</p>
        </div>
        <button className="btn btn-info px-4">Sync Now</button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scada-switch .form-check-input {
            background-color: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.2);
        }
        .scada-switch .form-check-input:checked {
            background-color: var(--scada-accent);
            border-color: var(--scada-accent);
        }
      `}} />
    </div>
  );
};

export default Settings;

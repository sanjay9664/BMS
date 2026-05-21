import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, Tabs, Tab, InputGroup } from 'react-bootstrap';
import { 
  UserPlus, Shield, Settings, Trash2, Eye, EyeOff, Save, 
  Search, Edit, ShieldCheck, Mail, Lock, User, 
  LayoutDashboard, Droplets, Activity, Database, Bell, Zap, 
  ShieldAlert, ClipboardList, PenTool, History, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultSubmoduleVisibility = {
  showWaterManagement: { Overview: true, 'AG TANK': true, 'UG TANK': true },
  showMotors: { Overview: true, 'Pump Room 1': true, 'Pump Room 2': true, 'VFD / DOL Status': true, 'PDF Report': true },
  showDGSet: { Overview: true, 'DG Set-1': true, 'DG Set-2': true, 'DG Set-3': true },
  showAlarms: { Overview: true, 'Active Alarms': true, 'Inactive Alarms': true, 'ACK (Acknowledge)': true, 'Alarm History': true, 'PDF Report': true },
  showLTPanel: { Overview: true, 'LT Room-1': true, 'LT Room-2': true, 'LT Room-3': true, 'Incoming / Outgoing': true, 'Breaker Status': true, 'PDF Report': true },
  showTransformers: { Overview: true, 'Transformer-1': true, 'Transformer-2': true, 'Load / Temp': true, 'PDF Report': true },
  showFirePumps: { Overview: true, 'Pump Status': true, 'Header Pressure': true, 'Jockey / Main': true, 'PDF Report': true },
  showMaintenance: { Scheduled: true, 'Pending Tasks': true, 'PDF Report': true },
  showServiceHistory: { 'Equipment-wise': true, 'Service Records': true, 'PDF Report': true },
  showDailyDPR: { 'Data Aggregation': true, 'Daily Logs': true, 'PDF Report': true },
  showEnergyMetering: { Overview: true, 'Main Meter': true, 'Sub Meters': true, 'PDF Report': true }
};

const moduleDetails = {
  showDashboard: { label: 'Dashboard', icon: <LayoutDashboard size={18} />, subItems: [] },
  showWaterManagement: { label: 'Water Management', icon: <Droplets size={18} />, subItems: ['Overview', 'AG TANK', 'UG TANK'] },
  showMotors: { label: 'Motors Module', icon: <Activity size={18} />, subItems: ['Overview', 'Pump Room 1', 'Pump Room 2', 'VFD / DOL Status', 'PDF Report'] },
  showDGSet: { label: 'DG Set Module', icon: <Database size={18} />, subItems: ['Overview', 'DG Set-1', 'DG Set-2', 'DG Set-3'] },
  showSettingTemplates: { label: 'Setting Templates', icon: <Settings size={18} />, subItems: [] },
  showAlarms: { label: 'Alarm System', icon: <Bell size={18} />, subItems: ['Overview', 'Active Alarms', 'Inactive Alarms', 'ACK (Acknowledge)', 'Alarm History', 'PDF Report'] },
  showLTPanel: { label: 'LT Panel', icon: <LayoutDashboard size={18} />, subItems: ['Overview', 'LT Room-1', 'LT Room-2', 'LT Room-3', 'Incoming / Outgoing', 'Breaker Status', 'PDF Report'] },
  showTransformers: { label: 'Transformer', icon: <Zap size={18} />, subItems: ['Overview', 'Transformer-1', 'Transformer-2', 'Load / Temp', 'PDF Report'] },
  showFirePumps: { label: 'Fire Pumps', icon: <ShieldAlert size={18} />, subItems: ['Overview', 'Pump Status', 'Header Pressure', 'Jockey / Main', 'PDF Report'] },
  showTicketing: { label: 'Ticketing System', icon: <ClipboardList size={18} />, subItems: [] },
  showMaintenance: { label: 'Maintenance', icon: <PenTool size={18} />, subItems: ['Scheduled', 'Pending Tasks', 'PDF Report'] },
  showServiceHistory: { label: 'Service History', icon: <History size={18} />, subItems: ['Equipment-wise', 'Service Records', 'PDF Report'] },
  showDailyDPR: { label: 'Daily DPR', icon: <Gauge size={18} />, subItems: ['Data Aggregation', 'Daily Logs', 'PDF Report'] },
  showEnergyMetering: { label: 'Energy Metering', icon: <Zap size={18} />, subItems: ['Overview', 'Main Meter', 'Sub Meters', 'PDF Report'] }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [tenantId] = useState(() => JSON.parse(localStorage.getItem('userData'))?.tenantId);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });

  useEffect(() => {
    if (tenantId) fetchUsers();
  }, [tenantId]);

  const fetchUsers = async () => {
    try {
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/admin/users/${tenantId}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (user, action) => {
    if (action === 'configure') {
      setSelectedUser(user);
      const userConfig = user.config?.features || { submoduleVisibility: defaultSubmoduleVisibility };
      setConfig({ ...userConfig, submoduleVisibility: { ...defaultSubmoduleVisibility, ...(userConfig.submoduleVisibility || {}) } });
      setActiveTab('config');
    } else if (action === 'view') {
        // Only backup if we are not already impersonating
        if (!localStorage.getItem('impersonator_backup_role')) {
            localStorage.setItem('impersonator_backup_user', localStorage.getItem('userData'));
            localStorage.setItem('impersonator_backup_role', localStorage.getItem('userRole'));
        }
        
        const mockUserData = { id: user.id, name: `Preview: ${user.name}`, email: user.email, role: 'USER', tenantId: user.tenantId };
        localStorage.setItem('userData', JSON.stringify(mockUserData));
        localStorage.setItem('userRole', 'USER');
        
        const userConfig = user.config?.features || {};
        const sidebarMapping = Object.fromEntries(Object.keys(moduleDetails).map(k => [moduleDetails[k].label, userConfig[k] ?? true]));
        localStorage.setItem('scada_modules_config', JSON.stringify(sidebarMapping));
        localStorage.setItem('scada_submodules_config', JSON.stringify(userConfig.submoduleVisibility || defaultSubmoduleVisibility));
        
        window.dispatchEvent(new Event('storage-update'));
        window.location.href = '/dashboard';
    } else if (action === 'edit') {
        setFormData({ id: user.id, name: user.name, email: user.email, role: user.role, password: '' });
        setShowModal(true);
    } else if (action === 'delete') {
        if(window.confirm(`Delete user ${user.name}?`)) {
            const apiUrl = '/api';
            await fetch(`${apiUrl}/admin/users/${user.id}`, { method: 'DELETE' });
            fetchUsers();
        }
    }
  };

  const handleSavePermissions = async () => {
    try {
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/admin/users/${selectedUser.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: config })
      });
      if (response.ok) {
        setActiveTab('list');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  };

  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);

  return (
    <Container fluid className="py-4 user-mgmt-premium">
      <div className="mgmt-header mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center gap-3">
              <div className="mgmt-icon-glow"><ShieldCheck size={32} /></div>
              <div>
                <h2 className="header-title mb-1">Personnel Management</h2>
                <p className="text-muted mb-0">Control access levels and module visibility for building operators.</p>
              </div>
            </div>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <Button variant="info" className="rounded-pill px-4 shadow-sm" onClick={() => { setFormData({ name: '', email: '', password: '', role: 'USER' }); setShowModal(true); }}>
              <UserPlus size={18} className="me-2" /> Add New Operator
            </Button>
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="scada-tabs mb-4">
        <Tab eventKey="list" title={<><User size={16} className="me-2"/> Operator List</>}>
          <Card className="glass-card border-0">
            <Card.Header className="bg-transparent border-bottom border-light border-opacity-10 p-3">
               <InputGroup className="glass-search w-25">
                 <InputGroup.Text className="bg-transparent border-0 text-muted"><Search size={16} /></InputGroup.Text>
                 <Form.Control placeholder="Filter users..." className="bg-transparent border-0 text-white shadow-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               </InputGroup>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="scada-table mb-0">
                <thead>
                  <tr>
                    <th>OPERATOR</th>
                    <th>CONTACT</th>
                    <th>ROLE</th>
                    <th>PERMISSION STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td><div className="fw-bold text-white">{user.name}</div></td>
                      <td><div className="text-muted small">{user.email}</div></td>
                      <td><Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 px-3 uppercase">{user.role}</Badge></td>
                      <td>
                        <Badge bg={user.config?.features ? "success" : "secondary"} className="bg-opacity-10 border border-opacity-25 px-3">
                          {user.config?.features ? "Custom Access" : "Standard Access"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button variant="outline-info" size="sm" onClick={() => handleAction(user, 'configure')} title="Set Permissions"><Settings size={14} /></Button>
                          <Button variant="outline-success" size="sm" onClick={() => handleAction(user, 'view')} title="View as User"><Eye size={14} /></Button>
                          <Button variant="outline-light" size="sm" onClick={() => handleAction(user, 'edit')} title="Edit User"><Edit size={14} /></Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleAction(user, 'delete')} title="Delete User"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="config" title={<><Shield size={16} className="me-2"/> {selectedUser ? `Access: ${selectedUser.name}` : 'Permission Config'}</>} disabled={!selectedUser}>
           {selectedUser && (
             <Card className="glass-card border-0">
               <Card.Body className="p-4">
                  <h5 className="text-info mb-4 d-flex align-items-center gap-2"><Lock size={20}/> Toggle Visible Modules for {selectedUser.name}</h5>
                  <div className="permission-grid">
                    {Object.entries(moduleDetails).map(([key, module]) => (
                      <div key={key} className="permission-item p-3 mb-2 rounded border border-light border-opacity-10 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`p-2 rounded ${config[key] ? 'bg-info bg-opacity-10 text-info' : 'bg-secondary bg-opacity-10 text-muted'}`}>{module.icon}</div>
                          <span className={config[key] ? 'text-white fw-bold' : 'text-muted'}>{module.label}</span>
                        </div>
                        <button className={`modern-toggle ${config[key] ? 'on' : 'off'}`} onClick={() => setConfig({...config, [key]: !config[key]})}>
                          <span className="toggle-slider"></span>
                          <span className="toggle-label">{config[key] ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-end mt-4">
                    <Button variant="secondary" className="me-2 rounded-pill" onClick={() => setActiveTab('list')}>Cancel</Button>
                    <Button variant="info" className="rounded-pill px-5" onClick={handleSavePermissions}><Save size={18} className="me-2"/> Save Access Rules</Button>
                  </div>
               </Card.Body>
             </Card>
           )}
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="scada-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25"><Modal.Title className="text-white">{formData.id ? 'Modify Operator' : 'Register New Operator'}</Modal.Title></Modal.Header>
        <Form onSubmit={async (e) => {
            e.preventDefault();
            const apiUrl = '/api';
            const method = formData.id ? 'PUT' : 'POST';
            const endpoint = formData.id ? `${apiUrl}/admin/users/${formData.id}` : `${apiUrl}/admin/users`;
            await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...formData, tenantId}) });
            setShowModal(false);
            fetchUsers();
        }}>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" className="scada-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email Address</Form.Label><Form.Control type="email" className="scada-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>{formData.id ? 'New Password (Optional)' : 'Default Password'}</Form.Label><Form.Control type="password" className="scada-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!formData.id} /></Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="info" type="submit">Complete Registration</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .user-mgmt-premium { color: var(--scada-text); }
        .mgmt-header { background: linear-gradient(135deg, var(--scada-sidebar), var(--scada-bg)); border: 1px solid var(--scada-border); border-radius: 20px; padding: 1.5rem; }
        .mgmt-icon-glow { width: 56px; height: 56px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--scada-accent); }
        .header-title { font-weight: 700; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass-card { background: var(--scada-card) !important; border: 1px solid var(--scada-border); border-radius: 16px; overflow: hidden; }
        .scada-table { background: transparent !important; color: var(--scada-text) !important; }
        .scada-table th { background: rgba(255,255,255,0.02) !important; color: var(--scada-text-muted) !important; font-size: 0.7rem; letter-spacing: 0.1rem; text-transform: uppercase; border-bottom: 1px solid var(--scada-border) !important; padding: 1rem !important; }
        .scada-table td { border-color: var(--scada-border) !important; padding: 1rem !important; vertical-align: middle; background: transparent !important; color: var(--scada-text) !important; }
        .scada-table tr:hover { background: rgba(255,255,255,0.02) !important; }
        .scada-tabs .nav-link { color: var(--scada-text-muted); border: 0; padding: 1rem 1.5rem; font-weight: 600; transition: 0.3s; }
        .scada-tabs .nav-link.active { background: rgba(56, 189, 248, 0.1); color: var(--scada-accent); border-bottom: 2px solid var(--scada-accent); }
        .permission-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .modern-toggle { width: 80px; height: 32px; background: var(--scada-bg); border: 1px solid var(--scada-border); border-radius: 100px; position: relative; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; overflow: hidden; }
        .modern-toggle.on { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); }
        .toggle-slider { position: absolute; width: 24px; height: 24px; background: var(--scada-text-muted); border-radius: 50%; left: 4px; transition: 0.3s; z-index: 2; }
        .on .toggle-slider { left: 52px; background: var(--scada-accent); box-shadow: 0 0 10px rgba(56, 189, 248, 0.5); }
        .toggle-label { width: 100%; font-size: 0.6rem; font-weight: 800; text-align: center; padding-left: 24px; color: var(--scada-text-muted); transition: 0.3s; }
        .on .toggle-label { padding-left: 0; padding-right: 24px; color: var(--scada-accent); }
        .scada-modal .modal-content { background: var(--scada-bg); border: 1px solid var(--scada-border); border-radius: 16px; }
        .scada-input { background: rgba(255,255,255,0.05); border: 1px solid var(--scada-border); color: var(--scada-text); }
        .scada-input:focus { background: rgba(255,255,255,0.08); border-color: var(--scada-accent); color: var(--scada-text); box-shadow: 0 0 0 0.25rem rgba(56, 189, 248, 0.15); }
      `}} />
    </Container>
  );
};

export default UserManagement;

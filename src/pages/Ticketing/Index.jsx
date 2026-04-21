import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Form, Table, Badge, Modal } from 'react-bootstrap';
import { 
  Ticket, Plus, CheckCircle, Clock, Search, Edit3, Trash2, 
  User, Filter, FileText, AlertCircle
} from 'lucide-react';

const TicketingSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([
    { id: '1001', subject: 'DG Set-1 Oil Leak', priority: 'High', status: 'Open', category: 'Maintenance', date: '21 Apr', staff: 'John D.', desc: 'Minor oil leak near filter.' },
    { id: '1002', subject: 'Low Water Pressure', priority: 'Medium', status: 'Open', category: 'Plumbing', date: '21 Apr', staff: 'Mike S.', desc: 'Pressure drop in Block B.' },
    { id: '1003', subject: 'Inverter Battery', priority: 'Low', status: 'Closed', category: 'Electrical', date: '20 Apr', staff: 'Sarah J.', desc: 'Battery replaced.' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTicket, setCurrentTicket] = useState({ subject: '', priority: 'Medium', category: 'Maintenance', staff: '', desc: '' });

  // FILTER LOGIC
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.staff.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const stats = {
    open: tickets.filter(t => t.status === 'Open').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    total: tickets.length
  };

  const toggleStatus = (id) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: t.status === 'Open' ? 'Closed' : 'Open' } : t));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isEditing) {
      setTickets(tickets.map(t => t.id === currentTicket.id ? currentTicket : t));
    } else {
      const newTkt = { ...currentTicket, id: (1001 + tickets.length).toString(), status: 'Open', date: 'Today' };
      setTickets([newTkt, ...tickets]);
    }
    setShowModal(false);
    setIsEditing(false);
    setCurrentTicket({ subject: '', priority: 'Medium', category: 'Maintenance', staff: '', desc: '' });
  };

  const openEdit = (t) => {
    setCurrentTicket(t);
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="fade-in p-2">
      <div className="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-0 text-white fw-bold">Support Tickets</h4>
          <small className="text-secondary fw-bold">Issue tracking & resolution pipeline</small>
        </div>
        <Button variant="info" size="sm" className="fw-bold px-3 py-2" onClick={() => setShowModal(true)}>
          <Plus size={16} className="me-1" /> Raise Ticket
        </Button>
      </div>

      <Row className="g-2 mb-3">
        {[
          { label: 'Open', value: stats.open, color: 'info' },
          { label: 'Closed', value: stats.closed, color: 'success' },
          { label: 'Total', value: stats.total, color: 'secondary' }
        ].map((s, i) => (
          <Col md={4} key={i}>
            <div className="p-3 rounded-4 bg-dark bg-opacity-25 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center h-100">
              <div>
                <small className="text-muted d-block fw-bold text-uppercase" style={{fontSize: '0.6rem'}}>{s.label} Tickets</small>
                <h3 className={`mb-0 fw-black text-${s.color}`}>{s.value}</h3>
              </div>
              <div className={`p-2 rounded bg-${s.color} bg-opacity-10 text-${s.color}`}>
                {s.label === 'Open' ? <Clock size={16} /> : s.label === 'Closed' ? <CheckCircle size={16} /> : <FileText size={16} />}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Card className="bg-dark bg-opacity-10 border-secondary border-opacity-10 rounded-4 overflow-hidden">
        <div className="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
            <span className="text-white fw-bold fs-10 text-uppercase">Ticket History</span>
            <div className="d-flex gap-2">
                <div className="position-relative">
                   <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                   <Form.Control 
                    type="text" 
                    placeholder="Search ID/Issue..." 
                    className="bg-dark bg-opacity-50 border-secondary border-opacity-10 text-white shadow-none ps-4 fs-11 tkt-input" 
                    style={{width: 180, height: 32}} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                <Button variant="outline-secondary" size="sm" className="px-2 py-0 border-opacity-25"><Filter size={14} /></Button>
            </div>
        </div>
        <div className="table-responsive">
          <Table hover variant="dark" className="bg-transparent mb-0 fs-10">
            <thead className="bg-black bg-opacity-30">
              <tr className="text-muted">
                <th className="ps-3 py-3 border-0">ID</th>
                <th className="py-3 border-0">Issue</th>
                <th className="py-3 border-0">Category</th>
                <th className="py-3 border-0">Priority</th>
                <th className="py-3 border-0 text-center">Status</th>
                <th className="pe-3 py-3 border-0 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} className="border-secondary border-opacity-5 align-middle">
                  <td className="ps-3 py-3 fw-bold text-info">#{t.id}</td>
                  <td className="py-3">
                    <div className="text-white fw-bold mb-1 fs-10">{t.subject}</div>
                    <small className="text-muted opacity-75 fs-12">{t.date} • {t.desc}</small>
                  </td>
                  <td className="py-3 text-secondary fs-11">{t.category}</td>
                  <td className="py-3">
                     <span className={`fw-black fs-12 text-uppercase text-${t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'info'}`}>
                        {t.priority}
                     </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`fw-bold fs-11 ${t.status === 'Open' ? 'text-info' : 'text-success'}`}>
                        {t.status}
                    </span>
                  </td>
                  <td className="pe-3 py-3 text-end">
                    <div className="d-flex justify-content-end gap-1">
                        <Button 
                            variant={t.status === 'Closed' ? 'success' : 'outline-success'} 
                            size="sm" 
                            className="btn-square" 
                            onClick={() => toggleStatus(t.id)} 
                            title={t.status === 'Closed' ? 'Re-open Ticket' : 'Resolve Ticket'}
                        >
                            <CheckCircle size={12} fill={t.status === 'Closed' ? 'currentColor' : 'none'} />
                        </Button>
                        <Button variant="outline-info" size="sm" className="btn-square" onClick={() => openEdit(t)} title="Edit Ticket"><Edit3 size={12} /></Button>
                        <Button variant="outline-danger" size="sm" className="btn-square" onClick={() => setTickets(tickets.filter(x => x.id !== t.id))} title="Delete Ticket"><Trash2 size={12} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr><td colSpan="6" className="text-center py-5 text-muted">No tickets found for "{searchTerm}"</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal show={showModal} onHide={() => {setShowModal(false); setIsEditing(false);}} centered contentClassName="bg-dark border-secondary border-opacity-20 rounded-4">
        <Modal.Header closeButton closeVariant="white" className="border-0 bg-black bg-opacity-20 p-3">
            <Modal.Title className="text-white fw-bold fs-9">{isEditing ? 'Update Ticket' : 'Raise New Incident'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
            <Form onSubmit={handleSave}>
                <Form.Group className="mb-3">
                    <Form.Label className="fs-12 text-muted fw-bold">ISSUE SUBJECT</Form.Label>
                    <Form.Control type="text" className="tkt-input fs-11 p-2 shadow-none" required
                        value={currentTicket.subject} onChange={e => setCurrentTicket({...currentTicket, subject: e.target.value})} />
                </Form.Group>
                <Row className="g-2">
                    <Col xs={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fs-12 text-muted fw-bold">PRIORITY</Form.Label>
                            <Form.Select className="tkt-input fs-11 p-2 shadow-none"
                                value={currentTicket.priority} onChange={e => setCurrentTicket({...currentTicket, priority: e.target.value})}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col xs={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fs-12 text-muted fw-bold">ASSIGN TO</Form.Label>
                            <Form.Control type="text" className="tkt-input fs-11 p-2 shadow-none" required
                                value={currentTicket.staff} onChange={e => setCurrentTicket({...currentTicket, staff: e.target.value})} />
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group className="mb-4">
                    <Form.Label className="fs-12 text-muted fw-bold">DESCRIPTION</Form.Label>
                    <Form.Control as="textarea" rows={2} className="tkt-input fs-11 p-2 shadow-none"
                        value={currentTicket.desc} onChange={e => setCurrentTicket({...currentTicket, desc: e.target.value})} />
                </Form.Group>
                <Button variant="info" type="submit" className="w-100 fw-black py-2 fs-11 uppercase mt-2 shadow-sm border-0">
                    {isEditing ? 'UPDATE MASTER RECORD' : 'CREATE OFFICIAL TICKET'}
                </Button>
            </Form>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-11 { font-size: 0.75rem !important; }
        .fs-10 { font-size: 0.85rem !important; }
        .uppercase { text-transform: uppercase !important; }
        
        .tkt-input {
          background-color: #0c121e !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: white !important;
        }
        .tkt-input:focus {
           border-color: #0dcaf0 !important;
           background-color: #020617 !important;
        }
        
        /* Select Dropdown Option Colors */
        select.tkt-input option {
          background-color: #0c121e !important;
          color: white !important;
        }
        
        .btn-square { width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
      `}} />
    </div>
  );
};

export default TicketingSystem;

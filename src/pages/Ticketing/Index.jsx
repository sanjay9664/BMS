import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Form, Table, Badge, Modal } from 'react-bootstrap';
import { 
  Ticket, Plus, CheckCircle, Clock, Search, Edit3, Trash2, 
  User, Filter, FileText, AlertCircle, XCircle, ArrowRight
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
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="fade-in p-4" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #080c15 100%)', minHeight: '100vh' }}>
      {/* PAGE HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="text-white fw-black tracking-tighter mb-0" style={{ fontSize: '2.2rem' }}>
            SUPPORT <span className="text-info">TICKETS</span>
          </h2>
          <small className="text-secondary fw-bold uppercase tracking-widest opacity-40 fs-12">
            ISSUE TRACKING & RESOLUTION PIPELINE
          </small>
        </div>
        <Button 
          variant="info" 
          className="fw-black px-4 py-2 shadow-glow fs-11 uppercase letter-spacing-1 border-0" 
          style={{ background: '#38bdf8', color: '#000' }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} className="me-2" /> RAISE TICKET
        </Button>
      </div>

      {/* STATS ROW */}
      <Row className="g-4 mb-5">
        {[
          { label: 'OPEN TICKETS', value: stats.open, color: '#38bdf8', icon: Clock },
          { label: 'CLOSED TICKETS', value: stats.closed, color: '#10b981', icon: CheckCircle },
          { label: 'TOTAL TICKETS', value: stats.total, color: '#94a3b8', icon: FileText }
        ].map((s, i) => (
          <Col md={4} key={i}>
            <div className="premium-figma-card rounded-4 p-4 d-flex justify-content-between align-items-center">
              <div className="card-inner-glow" style={{ background: `linear-gradient(90deg, transparent, ${s.color}66, transparent)` }}></div>
              <div>
                <small className="text-secondary fw-black uppercase tracking-widest opacity-40 mb-2 d-block" style={{ fontSize: '0.7rem' }}>{s.label}</small>
                <h1 className="mb-0 fw-black text-white" style={{ fontSize: '3rem', lineHeight: '1' }}>{s.value}</h1>
              </div>
              <div className="p-3 rounded-circle" style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
                <s.icon size={28} style={{ color: s.color }} />
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* TICKET MANIFEST TABLE */}
      <div className="premium-figma-card rounded-4 overflow-hidden shadow-2xl">
        <div className="card-inner-glow"></div>
        <div className="p-4 border-bottom border-white border-opacity-5 d-flex justify-content-between align-items-center bg-black bg-opacity-20">
            <span className="text-white fw-black fs-11 uppercase tracking-widest opacity-60">TICKET MANIFEST</span>
            <div className="d-flex gap-3 align-items-center">
                <div className="position-relative">
                   <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-info opacity-40" />
                   <Form.Control 
                    type="text" 
                    placeholder="Quick Filter..." 
                    className="premium-input ps-5 fs-11" 
                    style={{ width: 280, height: 42, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56,189,248,0.1)' }} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                <Button variant="outline-info" className="p-2 border-info border-opacity-20 text-info hover-glow">
                   <Filter size={18} />
                </Button>
            </div>
        </div>

        <div className="table-responsive">
          <Table hover variant="dark" className="bg-transparent mb-0">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.4)' }}>
                <th className="ps-4 py-4 border-0 text-secondary uppercase tracking-widest fs-12 fw-bold opacity-50">TICKET ID</th>
                <th className="py-4 border-0 text-secondary uppercase tracking-widest fs-12 fw-bold opacity-50">ISSUE DESCRIPTION</th>
                <th className="py-4 border-0 text-secondary uppercase tracking-widest fs-12 fw-bold opacity-50">CATEGORY</th>
                <th className="py-4 border-0 text-secondary uppercase tracking-widest fs-12 fw-bold opacity-50">PRIORITY</th>
                <th className="py-4 border-0 text-secondary uppercase tracking-widest fs-12 fw-bold opacity-50">STATUS</th>
                <th className="pe-4 py-4 border-0 text-secondary uppercase tracking-widest fs-12 fw-bold opacity-50 text-end">ACTION CONTROL</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} className="border-bottom border-white border-opacity-5 align-middle transition-all hover-bg-blue">
                  <td className="ps-4 py-4 fw-black text-info text-glow-blue fs-11">#{t.id}</td>
                  <td className="py-4">
                    <div className="text-white fw-bold mb-1 fs-11">{t.subject}</div>
                    <div className="d-flex align-items-center gap-2 fs-13 fw-bold">
                       <span className="text-secondary opacity-60">{t.date}</span>
                       <span className="text-secondary opacity-20">|</span>
                       <span className="text-secondary opacity-40">{t.desc}</span>
                    </div>
                  </td>
                  <td className="py-4">
                     <span className="px-3 py-1 rounded border border-white border-opacity-10 text-white text-opacity-75 fs-12 fw-black tracking-widest bg-black bg-opacity-20 uppercase">
                        {t.category}
                     </span>
                  </td>
                  <td className="py-4">
                     <div className={`priority-indicator ${t.priority.toLowerCase()}`}>
                        <AlertCircle size={12} className="me-2" />
                        {t.priority.toUpperCase()}
                     </div>
                  </td>
                  <td className="py-4">
                    <div className={`status-capsule ${t.status.toLowerCase()}`}>
                        {t.status.toUpperCase()}
                    </div>
                  </td>
                  <td className="pe-4 py-4 text-end">
                    <div className="d-flex justify-content-end gap-2">
                        <button className={`action-btn ${t.status === 'Closed' ? 'active-success' : 'default'}`} onClick={() => toggleStatus(t.id)}>
                            <CheckCircle size={16} />
                        </button>
                        <button className="action-btn edit" onClick={() => openEdit(t)}>
                            <Edit3 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => setTickets(tickets.filter(x => x.id !== t.id))}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      <Modal show={showModal} onHide={() => {setShowModal(false); setIsEditing(false);}} centered size="lg" className="premium-modal">
        <Modal.Body className="rounded-4 border-0 p-0 premium-figma-card overflow-hidden">
          <div className="card-inner-glow"></div>
          <div className="p-4 border-bottom border-white border-opacity-5 bg-black bg-opacity-20 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info border border-info border-opacity-10">
                  <Ticket size={24} />
                </div>
                <div>
                  <h5 className="mb-0 text-white fw-black uppercase tracking-tighter">{isEditing ? 'UPDATE' : 'RAISE NEW'} <span className="text-info">TICKET</span></h5>
                  <small className="text-secondary fw-bold uppercase tracking-widest opacity-40 fs-12">Official System Incident Record</small>
                </div>
              </div>
              <Button variant="link" className="text-secondary p-0 hover-text-white transition-all" onClick={() => setShowModal(false)}>
                <XCircle size={24} />
              </Button>
          </div>
          
          <div className="p-5">
              <Form onSubmit={handleSave}>
                  <Form.Group className="mb-4">
                      <Form.Label className="fs-12 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2">ISSUE SUBJECT</Form.Label>
                      <Form.Control type="text" className="premium-input p-3 fs-11 fw-bold" required placeholder="e.g. Pump Station 1 Failure"
                          value={currentTicket.subject} onChange={e => setCurrentTicket({...currentTicket, subject: e.target.value})} />
                  </Form.Group>
                  <Row className="g-4">
                      <Col xs={6}>
                          <Form.Group className="mb-4">
                              <Form.Label className="fs-12 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2">PRIORITY LEVEL</Form.Label>
                              <Form.Select className="premium-input p-3 fs-11 fw-bold"
                                  value={currentTicket.priority} onChange={e => setCurrentTicket({...currentTicket, priority: e.target.value})}>
                                  <option value="Low">LOW PRIORITY</option>
                                  <option value="Medium">MEDIUM PRIORITY</option>
                                  <option value="High">HIGH PRIORITY</option>
                              </Form.Select>
                          </Form.Group>
                      </Col>
                      <Col xs={6}>
                          <Form.Group className="mb-4">
                              <Form.Label className="fs-12 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2">ASSIGNED STAFF</Form.Label>
                              <Form.Control type="text" className="premium-input p-3 fs-11 fw-bold" required placeholder="Enter Name"
                                  value={currentTicket.staff} onChange={e => setCurrentTicket({...currentTicket, staff: e.target.value})} />
                          </Form.Group>
                      </Col>
                  </Row>
                  <Form.Group className="mb-5">
                      <Form.Label className="fs-12 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2">DETAILED INCIDENT DESCRIPTION</Form.Label>
                      <Form.Control as="textarea" rows={3} className="premium-input p-3 fs-11 fw-bold" required placeholder="Describe the issue in detail..."
                          value={currentTicket.desc} onChange={e => setCurrentTicket({...currentTicket, desc: e.target.value})} />
                  </Form.Group>
                  
                  <div className="d-flex gap-3">
                     <Button variant="outline-secondary" className="w-100 fw-black py-3 fs-11 uppercase tracking-widest border-white border-opacity-10" onClick={() => setShowModal(false)}>
                        ABORT ACTION
                     </Button>
                     <Button variant="info" type="submit" className="w-100 fw-black py-3 fs-11 uppercase tracking-widest border-0" style={{ background: '#38bdf8', color: '#000' }}>
                        {isEditing ? 'COMMIT UPDATES' : 'INITIALIZE TICKET'}
                     </Button>
                  </div>
              </Form>
          </div>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .fw-black { font-weight: 900 !important; }
        .fs-13 { font-size: 0.7rem !important; }
        .fs-12 { font-size: 0.75rem !important; }
        .fs-11 { font-size: 0.85rem !important; }
        .fs-10 { font-size: 1rem !important; }
        .uppercase { text-transform: uppercase !important; }
        .letter-spacing-1 { letter-spacing: 1px !important; }
        .tracking-widest { letter-spacing: 0.15em !important; }
        
        .premium-figma-card {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(12, 18, 30, 0.9) 100%);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(56, 189, 248, 0.1) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .card-inner-glow {
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3), transparent);
          z-index: 2;
        }

        .text-glow-blue { text-shadow: 0 0 15px rgba(56, 189, 248, 0.5); }
        .shadow-glow { box-shadow: 0 0 20px rgba(56, 189, 248, 0.2); }
        
        .premium-input {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          color: white !important;
          transition: all 0.3s ease;
        }
        .premium-input:focus {
           border-color: #38bdf8 !important;
           box-shadow: 0 0 15px rgba(56, 189, 248, 0.1) !important;
           background: rgba(15, 23, 42, 0.9) !important;
        }

        .hover-bg-blue:hover {
           background: rgba(56, 189, 248, 0.03) !important;
        }

        .priority-indicator {
          display: inline-flex;
          align-items: center;
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .priority-indicator.high { color: #ef4444; }
        .priority-indicator.medium { color: #f59e0b; }
        .priority-indicator.low { color: #38bdf8; }

        .status-capsule {
           display: inline-block;
           padding: 4px 16px;
           border-radius: 100px;
           font-size: 0.7rem;
           font-weight: 900;
           letter-spacing: 1.5px;
           border: 1px solid transparent;
        }
        .status-capsule.open {
           background: rgba(56, 189, 248, 0.1);
           color: #38bdf8;
           border-color: rgba(56, 189, 248, 0.3);
           box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }
        .status-capsule.closed {
           background: rgba(16, 185, 129, 0.1);
           color: #10b981;
           border-color: rgba(16, 185, 129, 0.3);
        }

        .action-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.03);
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .action-btn:hover { transform: scale(1.15); color: white; border-color: rgba(255, 255, 255, 0.2); }
        .action-btn.active-success { background: rgba(16, 185, 129, 0.2); color: #10b981; border-color: #10b981; }
        .action-btn.edit:hover { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border-color: #38bdf8; }
        .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444; }

        .fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default TicketingSystem;

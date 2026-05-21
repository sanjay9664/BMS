import React, { useState } from 'react';
import { Row, Col, Card, Form, Table, Button, Badge } from 'react-bootstrap';
import { FileText, Download, Calendar, ClipboardList, RefreshCw, Zap } from 'lucide-react';
import PdfButton from '../../components/PdfButton';

const EnergyPDFReport = () => {
  const [filter, setFilter] = useState({
    dateRange: 'today',
    meter: 'all'
  });
  
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState([
    { id: 'REP-EM-1025', date: '2026-05-19', meter: 'Main Grid Incomer', consumption: '11,480 kWh', peakDemand: '620 kW', avgPf: '0.97', cost: '₹1,03,320' },
    { id: 'REP-EM-1024', date: '2026-05-18', meter: 'Main Grid Incomer', consumption: '11,350 kWh', peakDemand: '615 kW', avgPf: '0.98', cost: '₹1,02,150' },
    { id: 'REP-EM-1023', date: '2026-05-17', meter: 'Main Grid Incomer', consumption: '10,920 kWh', peakDemand: '598 kW', avgPf: '0.96', cost: '₹98,280' },
    { id: 'REP-EM-1022', date: '2026-05-16', meter: 'Main Grid Incomer', consumption: '11,100 kWh', peakDemand: '608 kW', avgPf: '0.97', cost: '₹99,900' },
    { id: 'REP-EM-1021', date: '2026-05-15', meter: 'Main Grid Incomer', consumption: '11,250 kWh', peakDemand: '610 kW', avgPf: '0.97', cost: '₹1,01,250' }
  ]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      // Simulating filtered report change
      if (filter.meter === 'wing-a') {
        setReportData([
          { id: 'REP-EM-1025', date: '2026-05-19', meter: 'Wing A Commercial Hub', consumption: '4,440 kWh', peakDemand: '240 kW', avgPf: '0.98', cost: '₹39,960' },
          { id: 'REP-EM-1024', date: '2026-05-18', meter: 'Wing A Commercial Hub', consumption: '4,380 kWh', peakDemand: '235 kW', avgPf: '0.98', cost: '₹39,420' }
        ]);
      } else {
        setReportData([
          { id: 'REP-EM-1025', date: '2026-05-19', meter: 'Main Grid Incomer', consumption: '11,480 kWh', peakDemand: '620 kW', avgPf: '0.97', cost: '₹1,03,320' },
          { id: 'REP-EM-1024', date: '2026-05-18', meter: 'Main Grid Incomer', consumption: '11,350 kWh', peakDemand: '615 kW', avgPf: '0.98', cost: '₹1,02,150' },
          { id: 'REP-EM-1023', date: '2026-05-17', meter: 'Main Grid Incomer', consumption: '10,920 kWh', peakDemand: '598 kW', avgPf: '0.96', cost: '₹98,280' }
        ]);
      }
    }, 1200);
  };

  return (
    <div className="fade-in">
      {/* HEADER SECTION */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold d-flex align-items-center gap-2">
            <FileText className="text-info" size={26} /> Energy Metering Reports
          </h2>
          <p className="text-secondary fs-7">Generate, preview, and download billing reports, load charts, and historical power logs.</p>
        </div>
      </div>

      {/* FILTER CONTROL CARD */}
      <Card className="scada-card border-0 text-white mb-4" style={{ background: '#0f172a' }}>
        <Card.Body className="p-4">
          <h5 className="mb-4 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
            <Calendar className="text-info" size={18} /> Report Configuration
          </h5>

          <Row className="g-4 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="text-secondary fw-bold fs-12 uppercase tracking-wider mb-2">Select Target Meter</Form.Label>
                <Form.Select 
                  className="scada-input" 
                  value={filter.meter} 
                  onChange={(e) => setFilter({...filter, meter: e.target.value})}
                >
                  <option value="all">Main Incomer Feed Grid</option>
                  <option value="wing-a">Sub-Meter: Commercial Wing A</option>
                  <option value="server">Sub-Meter: Server & UPS Rooms</option>
                  <option value="utility">Sub-Meter: Utility Motors Room</option>
                  <option value="hvac">Sub-Meter: HVAC Chiller Main</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="text-secondary fw-bold fs-12 uppercase tracking-wider mb-2">Reporting Interval</Form.Label>
                <Form.Select 
                  className="scada-input" 
                  value={filter.dateRange} 
                  onChange={(e) => setFilter({...filter, dateRange: e.target.value})}
                >
                  <option value="today">Today (Real-time logs)</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="custom">Custom Date Range</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={4} className="d-grid">
              <Button 
                onClick={handleGenerate} 
                disabled={generating} 
                className="btn btn-info rounded-pill py-2.5 fw-black fs-11 tracking-wider uppercase shadow-lg d-flex align-items-center justify-content-center gap-2"
              >
                {generating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {generating ? 'COMPILING DATA...' : 'GENERATE ENERGY REPORT'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* GENERATED REPORT DATA TABLE */}
      <Card className="scada-card border-0 text-white mt-4" style={{ background: '#0f172a' }}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11 mb-0">
              <ClipboardList className="text-info" size={18} /> Available Reports History
            </h5>
            <PdfButton />
          </div>

          <div className="table-responsive">
            <Table hover borderless className="align-middle scada-table text-white mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                  <th className="py-3">Report Reference</th>
                  <th className="py-3">Generated Date</th>
                  <th className="py-3">Target Feed Node</th>
                  <th className="py-3 text-center">Consumption (kWh)</th>
                  <th className="py-3 text-center">Peak Load demand</th>
                  <th className="py-3 text-center">Avg cos φ</th>
                  <th className="py-3 text-center">Estimated cost</th>
                  <th className="py-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx} className="border-bottom border-secondary border-opacity-5">
                    <td className="py-3 font-monospace text-info fs-13">{row.id}</td>
                    <td className="py-3 text-white fw-bold">{row.date}</td>
                    <td className="py-3 text-white">{row.meter}</td>
                    <td className="py-3 text-center text-white fw-bold">{row.consumption}</td>
                    <td className="py-3 text-center text-secondary">{row.peakDemand}</td>
                    <td className="py-3 text-center text-secondary font-monospace">{row.avgPf}</td>
                    <td className="py-3 text-center text-success fw-bold">{row.cost}</td>
                    <td className="py-3 text-end">
                      <Button variant="outline-info" size="sm" className="rounded-pill px-3 py-1 font-bold text-uppercase fs-12 d-flex align-items-center gap-2 float-end">
                        <Download size={12} /> Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        .scada-card { background: #0f172a; border-radius: 20px; transition: all 0.3s ease; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4); }
        .scada-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -4px rgba(0,0,0,0.5); }
        
        .scada-input { 
          background-color: #030712 !important; 
          border: 1px solid rgba(255, 255, 255, 0.08) !important; 
          color: white !important; 
          border-radius: 12px !important;
          padding: 12px 16px !important;
          font-weight: 500 !important;
          font-size: 0.9rem !important;
        }
        .scada-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 12px rgba(14, 165, 233, 0.15) !important; outline: none; }
        .scada-table tbody tr { transition: all 0.2s; cursor: pointer; }
        .scada-table tbody tr:hover { background: rgba(255, 255, 255, 0.02); }
        .animate-spin { animation: spin 1.5s linear infinite; }
        
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-13 { font-size: 0.8rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .tracking-widest { letter-spacing: 2px !important; }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default EnergyPDFReport;

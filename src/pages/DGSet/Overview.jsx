import React from 'react';
import { Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import { Database, Zap, Droplets, Clock, Battery } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';

const DGSetOverview = () => {
  const dgSets = [
    { id: 1, name: 'DG Set-1', status: 'Running', load: '65%', fuel: '78%', runtime: '1254h', temp: '82°C' },
    { id: 2, name: 'DG Set-2', status: 'Stopped', load: '0%', fuel: '12%', runtime: '1120h', temp: '25°C' },
    { id: 3, name: 'DG Set-3', status: 'Warning', load: '12%', fuel: '92%', runtime: '850h', temp: '45°C' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="mb-1 text-white">DG Set Monitoring</h2>
          <p className="text-muted">Diesel Generator health, fuel, and load distribution analysis.</p>
        </div>
        <PdfButton />
      </div>

      <Row className="g-4 mb-4">
        {dgSets.map((dg) => (
          <Col lg={4} key={dg.id}>
            <Card className="scada-card border-0">
               <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                        <Database className="text-info" size={24} />
                    </div>
                    <StatusBadge status={dg.status} />
                  </div>
                  <h4 className="fw-bold mb-1">{dg.name}</h4>
                  <p className="text-muted fs-8 mb-4">Prime Power Unit #00{dg.id}</p>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between fs-8 mb-1">
                      <span className="text-muted">Fuel Level</span>
                      <span className={dg.fuel.replace('%','') < 20 ? 'text-danger' : 'text-info'}>{dg.fuel}</span>
                    </div>
                    <ProgressBar 
                      now={parseInt(dg.fuel)} 
                      variant={parseInt(dg.fuel) < 20 ? 'danger' : 'info'} 
                      style={{ height: 6 }} 
                      className="bg-secondary bg-opacity-25 shadow-sm"
                    />
                  </div>

                  <Row className="g-3">
                    <Col xs={6}>
                       <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 text-center">
                          <small className="text-muted d-block mb-1">Load</small>
                          <span className="fw-bold fs-6">{dg.load}</span>
                       </div>
                    </Col>
                    <Col xs={6}>
                       <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 text-center">
                          <small className="text-muted d-block mb-1">Runtime</small>
                          <span className="fw-bold fs-6">{dg.runtime}</span>
                       </div>
                    </Col>
                    <Col xs={6}>
                       <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 text-center">
                          <small className="text-muted d-block mb-1">Temp</small>
                          <span className="fw-bold fs-6 text-warning">{dg.temp}</span>
                       </div>
                    </Col>
                    <Col xs={6}>
                       <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 text-center text-info">
                          <small className="text-muted d-block mb-1">Output</small>
                          <span className="fw-bold fs-6">415V</span>
                       </div>
                    </Col>
                  </Row>

                  <div className="mt-4 border-top border-secondary border-opacity-10 pt-3">
                    <button className="btn btn-outline-info w-100 btn-sm">View Full Diagnostics</button>
                  </div>
               </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col lg={8}>
            <Card className="scada-card">
                <Card.Body>
                    <h6 className="mb-4">Fuel Consumption (Last 7 Days)</h6>
                    <div className="p-4 bg-dark rounded border border-secondary border-opacity-10 text-center overflow-hidden">
                        {/* Dummy bar visualization */}
                        <div className="d-flex align-items-end justify-content-between h-100" style={{ minHeight: 150 }}>
                            {[40, 65, 80, 30, 45, 90, 50].map((h, i) => (
                                <div key={i} className="bg-info bg-opacity-50 rounded-top" style={{ width: '10%', height: `${h}%` }}></div>
                            ))}
                        </div>
                        <div className="d-flex justify-content-between mt-2 fs-8 text-muted">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col lg={4}>
            <Card className="scada-card">
                <Card.Body>
                    <h6 className="mb-4">Recent Service Events</h6>
                    {[
                      { event: 'Fuel Refill (200L)', time: '2h ago', dg: 'DG-1' },
                      { event: 'Maintenance Due', time: 'In 5d', dg: 'DG-2' },
                      { event: 'Filter Replaced', time: 'Yesterday', dg: 'DG-3' },
                    ].map((event, idx) => (
                        <div key={idx} className="mb-3 d-flex align-items-start gap-3">
                            <div className="p-2 bg-info bg-opacity-10 rounded">
                                <Clock size={16} className="text-info" />
                            </div>
                            <div>
                                <p className="mb-0 fs-8 fw-bold">{event.event}</p>
                                <p className="mb-0 fs-9 text-muted">{event.dg} • {event.time}</p>
                            </div>
                        </div>
                    ))}
                </Card.Body>
            </Card>
        </Col>
      </Row>
      <style dangerouslySetInnerHTML={{ __html: `
        .fs-9 { font-size: 0.65rem; }
      `}} />
    </div>
  );
};

export default DGSetOverview;

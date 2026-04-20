import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Zap, Thermometer, Gauge, Activity } from 'lucide-react';
import ScadaCard from '../../components/ScadaCard';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';

const TransformerOverview = () => {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="mb-1 text-white">Transformer Monitoring</h2>
          <p className="text-muted">High-voltage incoming and distribution transformer metrics.</p>
        </div>
        <PdfButton />
      </div>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="scada-card border-0">
             <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">Transformer #1</h4>
                  <StatusBadge status="Running" />
                </div>
                
                <Row className="text-center g-3">
                  <Col xs={4}>
                    <div className="p-3 bg-dark rounded border border-secondary border-opacity-10">
                      <Zap className="text-info mb-2" size={24} />
                      <h5 className="mb-0">11.2</h5>
                      <small className="text-muted">Incoming kV</small>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="p-3 bg-dark rounded border border-secondary border-opacity-10">
                      <Thermometer className="text-warning mb-2" size={24} />
                      <h5 className="mb-0">62°C</h5>
                      <small className="text-muted">Oil Temp</small>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="p-3 bg-dark rounded border border-secondary border-opacity-10">
                      <Activity className="text-success mb-2" size={24} />
                      <h5 className="mb-0">84%</h5>
                      <small className="text-muted">Efficiency</small>
                    </div>
                  </Col>
                </Row>

                <div className="mt-4 p-3 bg-dark rounded border border-secondary border-opacity-10">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted fs-8">Load Distribution</span>
                    <span className="text-info fs-8 fw-bold">1240 kVA</span>
                  </div>
                  <div className="progress bg-secondary bg-opacity-25" style={{ height: 10 }}>
                    <div className="progress-bar bg-info" style={{ width: '72%' }}></div>
                  </div>
                </div>
             </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="scada-card border-0">
             <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">Transformer #2</h4>
                  <StatusBadge status="Stopped" />
                </div>
                
                <Row className="text-center g-3">
                  <Col xs={4}>
                    <div className="p-3 bg-dark rounded border border-secondary border-opacity-10">
                      <Zap className="text-muted mb-2" size={24} />
                      <h5 className="mb-0 text-muted">0.0</h5>
                      <small className="text-muted">Incoming kV</small>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="p-3 bg-dark rounded border border-secondary border-opacity-10">
                      <Thermometer className="text-muted mb-2" size={24} />
                      <h5 className="mb-0 text-muted">28°C</h5>
                      <small className="text-muted">Oil Temp</small>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="p-3 bg-dark rounded border border-secondary border-opacity-10">
                      <Activity className="text-muted mb-2" size={24} />
                      <h5 className="mb-0 text-muted">--%</h5>
                      <small className="text-muted">Efficiency</small>
                    </div>
                  </Col>
                </Row>

                <div className="mt-4 p-3 bg-dark rounded border border-secondary border-opacity-10">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted fs-8">Load Distribution</span>
                    <span className="text-muted fs-8">Standby Mode</span>
                  </div>
                  <div className="progress bg-secondary bg-opacity-25" style={{ height: 10 }}>
                    <div className="progress-bar bg-secondary" style={{ width: '0%' }}></div>
                  </div>
                </div>
             </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="scada-card mt-4">
        <h6 className="mb-4">Power Quality Monitoring</h6>
        <Row className="g-4">
            {[
                { label: 'Harmonic Distortion (THD)', value: '2.4%', status: 'Normal' },
                { label: 'Power Factor (PF)', value: '0.98', status: 'Optimal' },
                { label: 'Phase Balance', value: '1.2%', status: 'Normal' },
                { label: 'Neutral Current', value: '0.8A', status: 'Normal' }
            ].map((item, idx) => (
                <Col md={3} key={idx}>
                    <div className="p-3 rounded border border-secondary border-opacity-10 bg-dark bg-opacity-50">
                        <small className="text-muted d-block mb-1">{item.label}</small>
                        <div className="d-flex justify-content-between align-items-end">
                            <span className="fw-bold fs-5">{item.value}</span>
                            <Badge bg="success" className="fs-9" style={{ marginBottom: 4 }}>{item.status}</Badge>
                        </div>
                    </div>
                </Col>
            ))}
        </Row>
      </div>
    </div>
  );
};

export default TransformerOverview;

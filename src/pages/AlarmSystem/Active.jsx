import React from 'react';
import { Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { ShieldAlert, CheckCircle, Clock, Filter } from 'lucide-react';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';

const ActiveAlarms = () => {
  const alarms = [
    {
      id: "ALM-092",
      time: "2026-04-20 12:05:42",
      source: "UG Pump 2",
      description: "Motor Overheat Detected (T > 95°C)",
      severity: "Critical",
      status: "Active"
    },
    {
      id: "ALM-091",
      time: "2026-04-20 11:58:12",
      source: "DG Set 1",
      description: "Low Fuel Warning (Level < 15%)",
      severity: "Warning",
      status: "Active"
    },
    {
      id: "ALM-089",
      time: "2026-04-20 11:42:00",
      source: "LT Panel 3",
      description: "Voltage Fluctuation Phase B (380V)",
      severity: "Warning",
      status: "Active"
    },
    {
      id: "ALM-085",
      time: "2026-04-20 10:15:22",
      source: "Water System",
      description: "OHT Level Low Communication Fault",
      severity: "Fault",
      status: "Active"
    }
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="mb-1 text-white">Active Alarms</h2>
          <p className="text-muted">Real-time system faults and warnings requiring attention.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" className="d-flex align-items-center">
            <Filter size={16} className="me-2" /> Filter
          </Button>
          <PdfButton />
          <Button variant="info" size="sm">ACK All Alarms</Button>
        </div>
      </div>

      <Card className="scada-card border-0 mb-4">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="scada-table mb-0" hover>
              <thead>
                <tr>
                  <th className="ps-4">Alarm ID</th>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alarms.map((alarm, idx) => (
                  <tr key={idx}>
                    <td className="ps-4">
                      <span className="font-monospace text-info">{alarm.id}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Clock size={14} className="me-2 text-muted" />
                        {alarm.time}
                      </div>
                    </td>
                    <td className="fw-bold">{alarm.source}</td>
                    <td style={{ maxWidth: '300px' }}>{alarm.description}</td>
                    <td>
                      <Badge 
                        bg={alarm.severity === 'Critical' ? 'danger' : alarm.severity === 'Warning' ? 'warning' : 'info'}
                        className="rounded-pill px-3 py-2 text-dark fw-bold"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {alarm.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="link" size="sm" className="text-info text-decoration-none p-0">
                        Acknowledge
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col md={6}>
            <Card className="scada-card">
                <Card.Body className="d-flex align-items-center">
                    <div className="p-3 bg-danger bg-opacity-10 rounded-circle text-danger me-4">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h4 className="mb-0 fw-bold">1</h4>
                        <p className="text-muted mb-0">Critical Alarm Unacknowledged</p>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6}>
            <Card className="scada-card">
                <Card.Body className="d-flex align-items-center">
                    <div className="p-3 bg-info bg-opacity-10 rounded-circle text-info me-4">
                        <CheckCircle size={32} />
                    </div>
                    <div>
                        <h4 className="mb-0 fw-bold">128</h4>
                        <p className="text-muted mb-0">Alarms Resolved (Last 24h)</p>
                    </div>
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ActiveAlarms;

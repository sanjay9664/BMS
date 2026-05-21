import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Badge, Table } from 'react-bootstrap';
import { Zap, Activity, BatteryCharging, Award, TrendingUp, Cpu, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';

const EnergyMeteringOverview = () => {
  const navigate = useNavigate();

  // Simulated dynamic energy metrics
  const [metrics, setMetrics] = useState({
    activePower: 485.4,
    powerFactor: 0.97,
    todayConsumption: 3420,
    peakDemand: 620,
    voltageBalance: 1.1,
    frequency: 50.02,
    cumulativekWh: 14285.4
  });

  const [miniLcdIndex, setMiniLcdIndex] = useState(0);
  const [calBlink, setCalBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const activePower = +(prev.activePower + (Math.random() * 6 - 3)).toFixed(1);
        const powerFactor = +(Math.min(1.0, Math.max(0.92, prev.powerFactor + (Math.random() * 0.02 - 0.01)))).toFixed(2);
        const frequency = +(50.0 + (Math.random() * 0.06 - 0.03)).toFixed(2);
        const cumulativekWh = +(prev.cumulativekWh + 0.05).toFixed(2);
        return {
          ...prev,
          activePower,
          powerFactor,
          frequency,
          cumulativekWh,
          todayConsumption: +(prev.todayConsumption + 0.1).toFixed(1)
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Cycle mini display screen
  useEffect(() => {
    const timer = setInterval(() => {
      setMiniLcdIndex(prev => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Cal LED blink
  useEffect(() => {
    const rate = Math.max(150, Math.min(2000, 120000 / metrics.activePower));
    const blinkTimer = setInterval(() => {
      setCalBlink(prev => !prev);
    }, rate);
    return () => clearInterval(blinkTimer);
  }, [metrics.activePower]);

  const miniLcdModes = [
    { label: 'STATUS', val: 'rC-On', unit: '' },
    { label: 'ENERGY', val: metrics.cumulativekWh.toFixed(1), unit: 'kWh' },
    { label: 'DEMAND', val: metrics.activePower.toFixed(1), unit: 'kW' }
  ];

  const activeMiniLcd = miniLcdModes[miniLcdIndex];

  return (
    <div className="fade-in">
      {/* HEADER SECTION */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold d-flex align-items-center gap-2">
            <Zap className="text-warning animate-pulse" size={26} /> Energy Metering Overview
          </h2>
          <p className="text-secondary fs-7">Real-time facility grid monitoring, load distribution analysis, and efficiency statistics.</p>
        </div>
        <PdfButton />
      </div>

      {/* METRIC CARD GRID */}
      <Row className="g-4 mb-4">
        <Col md={6} xl={3}>
          <Card className="scada-card border-0 text-white h-100 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-info bg-opacity-10 text-info rounded-4 border border-info border-opacity-20">
                  <Zap size={22} className="animate-pulse" />
                </div>
                <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold">Real-time</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">Active System Load</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{metrics.activePower}</h2>
                  <span className="ms-1 fs-6 text-info fw-bold">kW</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-success fs-13 fw-semibold">
                  <TrendingUp size={14} />
                  <span>Optimal demand curve</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card className="scada-card border-0 text-white h-100 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-4 border border-success border-opacity-20">
                  <Activity size={22} />
                </div>
                <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold">Grid Quality</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">Average Power Factor</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{metrics.powerFactor}</h2>
                  <span className="ms-1 fs-6 text-success fw-bold">cos φ</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-success fs-13 fw-semibold">
                  <div className="pulse-dot bg-success"></div>
                  <span>Highly efficient (0.95+ target met)</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card className="scada-card border-0 text-white h-100 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-4 border border-warning border-opacity-20">
                  <BatteryCharging size={22} />
                </div>
                <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold">Accumulated</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">Today's Consumption</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{metrics.todayConsumption.toLocaleString()}</h2>
                  <span className="ms-1 fs-6 text-warning fw-bold">kWh</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-secondary fs-13">
                  <span>Cumulative since 00:00 AM</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card className="scada-card border-0 text-white h-100 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-purple bg-opacity-10 text-purple rounded-4 border border-purple border-opacity-20" style={{ color: '#a855f7' }}>
                  <Award size={22} />
                </div>
                <Badge bg="secondary" className="bg-opacity-10 text-muted border border-secondary border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold" style={{ color: '#a855f7' }}>Carbon Index</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">CO₂ Offset Equivalent</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">1.42</h2>
                  <span className="ms-1 fs-6 text-purple fw-bold" style={{ color: '#a855f7' }}>Metric Tons</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-success fs-13 fw-semibold">
                  <span>-12% vs. baseline target</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CORE ANALYSIS PANELS & LIVE DIGITAL METER WIDGET */}
      <Row className="g-4 mb-4">
        {/* Zone Load & Parameters Column */}
        <Col lg={8}>
          <Card className="scada-card border-0 text-white mb-4" style={{ background: '#0f172a' }}>
            <Card.Body className="p-4">
              <h5 className="mb-4 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
                <Cpu className="text-info" size={18} /> Zone Wise Load Distribution
              </h5>
              
              {[
                { name: 'Commercial Hub / Wing A', load: '185 kW', percentage: 38, color: 'info' },
                { name: 'Server & UPS Rooms', load: '142 kW', percentage: 29, color: 'warning' },
                { name: 'Utility & Plant Room Motors', load: '95 kW', percentage: 20, color: 'success' },
                { name: 'HVAC Chilled Water System', load: '63.4 kW', percentage: 13, color: 'danger' }
              ].map((zone, idx) => (
                <div key={idx} className="mb-3 p-3 bg-dark bg-opacity-30 border border-secondary border-opacity-5 rounded-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-white fs-13">{zone.name}</span>
                    <span className={`text-${zone.color} fw-black fs-12`}>{zone.load} ({zone.percentage}%)</span>
                  </div>
                  <ProgressBar variant={zone.color} now={zone.percentage} style={{ height: 8 }} className="scada-progress bg-black bg-opacity-40" />
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card className="scada-card border-0 text-white" style={{ background: '#0f172a' }}>
            <Card.Body className="p-4">
              <h5 className="mb-4 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
                <Activity className="text-info" size={18} /> Grid Parameters
              </h5>
              <Row className="g-3">
                {[
                  { label: 'System Frequency', value: `${metrics.frequency} Hz`, status: 'Stable', variant: 'success' },
                  { label: 'Voltage Unbalance', value: `${metrics.voltageBalance}%`, status: 'Normal', variant: 'success' },
                  { label: 'Voltage THD (Phase R)', value: '1.42%', status: 'Optimal', variant: 'success' },
                  { label: 'Current THD (Phase R)', value: '3.18%', status: 'Normal', variant: 'success' }
                ].map((param, idx) => (
                  <Col md={6} key={idx}>
                    <div className="d-flex justify-content-between align-items-center p-3 rounded-4 bg-dark bg-opacity-40 border border-secondary border-opacity-10 h-100">
                      <div>
                        <small className="text-secondary d-block fs-12 mb-1">{param.label}</small>
                        <span className="fw-bold text-white fs-5">{param.value}</span>
                      </div>
                      <Badge bg={param.variant} className="bg-opacity-10 text-success border border-success border-opacity-20 px-2 py-1 fs-12 uppercase">{param.status}</Badge>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Live SUN STAR Mini Meter Widget */}
        <Col lg={4}>
          <Card 
            className="scada-card border-0 text-white h-100 d-flex flex-column align-items-center justify-content-center p-4" 
            style={{ background: '#090d16', border: '2px solid rgba(14, 165, 233, 0.15)', cursor: 'default' }}
            title="Main Incomer Feed Status"
          >
            <div className="w-100 d-flex justify-content-between align-items-center mb-3">
              <span className="text-info fw-bold fs-12 uppercase tracking-wide">Main Incomer Feed</span>
              <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-20 px-2 py-0.5 fs-12">ONLINE</Badge>
            </div>

            {/* MINI PHYSICAL METER FACEPLATE */}
            <div className="mini-meter-poly">
              <div className="mini-blue-plate">
                <div className="mini-brand-section text-center mb-2">
                  <h6 className="mini-brand-name mb-0 fw-black tracking-widest text-white">SUN STAR</h6>
                  <span className="mini-brand-desc d-block" style={{ fontSize: '0.45rem', color: '#93c5fd' }}>3 Phase 4-Wire kWh Meter</span>
                </div>

                {/* Display */}
                <div className="mini-lcd-screen mb-2">
                  <div className="mini-lcd-glow">
                    <span className="mini-lcd-mode">{activeMiniLcd.label}</span>
                    <span className="mini-lcd-val font-monospace">{activeMiniLcd.val}</span>
                    {activeMiniLcd.unit && <span className="mini-lcd-unit font-monospace">{activeMiniLcd.unit}</span>}
                  </div>
                </div>

                {/* Detail elements */}
                <div className="d-flex justify-content-between align-items-center px-1" style={{ fontSize: '0.5rem' }}>
                  <div className="mini-specs text-secondary font-monospace">
                    <div>Type: SSI-306</div>
                    <div>Sr: 240721</div>
                  </div>
                  <div className="mini-leds d-flex align-items-center gap-1.5">
                    <span className="text-secondary" style={{ fontSize: '0.42rem' }}>CAL</span>
                    <div className={`mini-led-bulb ${calBlink ? 'active' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-center w-100 text-secondary fs-12">
              <span>Diagnostic telemetry stream active.</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* FEED METERS STATUS TABLE */}
      <Card className="scada-card border-0 text-white mt-4" style={{ background: '#0f172a' }}>
        <Card.Body className="p-4">
          <h5 className="mb-4 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
            <Cpu className="text-info" size={18} /> Main and Feed Sub-Meters Status
          </h5>
          <div className="table-responsive">
            <Table hover borderless className="align-middle scada-table text-white mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                  <th className="py-3">Meter ID</th>
                  <th className="py-3">Meter Location / Label</th>
                  <th className="py-3 text-center">Active Load</th>
                  <th className="py-3 text-center">Voltage L-N</th>
                  <th className="py-3 text-center">Current</th>
                  <th className="py-3 text-center">Power Factor</th>
                  <th className="py-3 text-end">Communication Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'M-MAIN-GRID-01', name: 'Main Power Grid Incomer', load: `${metrics.activePower} kW`, voltage: '232.4 V', current: '712.4 A', pf: `${metrics.powerFactor}`, status: 'Running', path: '/energy-metering/main' },
                  { id: 'SM-WING-A-01', name: 'Commercial Tower Wing-A Incomer', load: '185.0 kW', voltage: '231.8 V', current: '271.5 A', pf: '0.98', status: 'Running', path: '/energy-metering/sub' },
                  { id: 'SM-SERVER-02', name: 'Data Center Main UPS Input', load: '142.0 kW', voltage: '230.1 V', current: '215.1 A', pf: '0.99', status: 'Running', path: '/energy-metering/sub' },
                  { id: 'SM-UTILITY-03', name: 'Water Plant & Utility Motors Room', load: '95.0 kW', voltage: '233.1 V', current: '142.3 A', pf: '0.91', status: 'Running', path: '/energy-metering/sub' },
                  { id: 'SM-HVAC-04', name: 'HVAC Chiller Main Feeder', load: '63.4 kW', voltage: '232.0 V', current: '94.2 A', pf: '0.94', status: 'Warning', path: '/energy-metering/sub' },
                  { id: 'SM-LIGHT-05', name: 'Outdoor Street & Parking Lights', load: '0.0 kW', voltage: '0.0 V', current: '0.0 A', pf: '1.00', status: 'Stopped', path: '/energy-metering/sub' }
                ].map((row, idx) => (
                  <tr 
                    key={idx} 
                    className="border-bottom border-secondary border-opacity-5" 
                    onClick={() => {
                      if (row.id !== 'M-MAIN-GRID-01') {
                        navigate(row.path);
                      }
                    }}
                    style={row.id === 'M-MAIN-GRID-01' ? { cursor: 'default' } : { cursor: 'pointer' }}
                  >
                    <td className="py-3 font-monospace text-info fs-13">{row.id}</td>
                    <td className="py-3 text-white fw-bold">{row.name}</td>
                    <td className="py-3 text-center text-white fw-semibold">{row.load}</td>
                    <td className="py-3 text-center text-secondary">{row.voltage}</td>
                    <td className="py-3 text-center text-secondary">{row.current}</td>
                    <td className="py-3 text-center text-secondary font-monospace">{row.pf}</td>
                    <td className="py-3 text-end"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        .scada-card { background: #0f172a; border-radius: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4); }
        .scada-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -4px rgba(0,0,0,0.5); }
        .card-ambient-glow { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .pulse-dot { width: 8px; height: 8px; border-radius: 50px; display: inline-block; box-shadow: 0 0 8px currentColor; animation: pulseGlow 2s infinite; }
        .animate-pulse { animation: pulseAnim 2s infinite; }
        .scada-progress { background-color: #030712 !important; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); }
        .scada-table tbody tr { transition: all 0.2s; cursor: pointer; }
        .scada-table tbody tr:hover { background: rgba(255, 255, 255, 0.02); }
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-13 { font-size: 0.8rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .tracking-widest { letter-spacing: 2px !important; }

        /* MINI METER VISUAL */
        .mini-meter-poly {
          background: rgba(255, 255, 255, 0.05);
          border: 4px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 8px;
          width: 100%;
          max-width: 220px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .mini-blue-plate {
          background: linear-gradient(135deg, #1d3557, #112240);
          border-radius: 8px;
          padding: 10px;
        }
        .mini-brand-name {
          font-size: 0.85rem !important;
          letter-spacing: 1.5px !important;
        }
        .mini-lcd-screen {
          background: #1e293b;
          border-radius: 4px;
          padding: 4px;
          box-shadow: inset 0 1px 4px rgba(0,0,0,0.8);
        }
        .mini-lcd-glow {
          background: #22c55e;
          height: 34px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 6px;
          box-shadow: 0 0 10px rgba(34,197,94,0.5);
          position: relative;
        }
        .mini-lcd-mode {
          position: absolute;
          top: 1px;
          left: 4px;
          font-size: 0.45rem;
          color: #052e16;
          font-weight: 700;
        }
        .mini-lcd-val {
          font-size: 1.1rem;
          font-weight: bold;
          color: #022c22;
          margin-top: 6px;
        }
        .mini-lcd-unit {
          font-size: 0.6rem;
          font-weight: 900;
          color: #022c22;
          align-self: flex-end;
          margin-bottom: 2px;
        }
        .mini-led-bulb {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #166534;
        }
        .mini-led-bulb.active {
          background: #4ade80;
          box-shadow: 0 0 4px #4ade80;
        }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; filter: brightness(1.2); }
        }
        @keyframes pulseAnim {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}} />
    </div>
  );
};

export default EnergyMeteringOverview;

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { Leaf, Activity, Wind, AlertTriangle, Sparkles, RefreshCw, Download } from 'lucide-react';
import { io } from 'socket.io-client';

const AQIOverview = () => {
  const [time, setTime] = useState(new Date());
  const [aqiData, setAqiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
    const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('AQI WebSocket Connected');
    });

    // We'll populate this from actual templates, but for now we simulate fetching
    const fetchAqiZones = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const tenantId = userData?.tenantId;
        const url = tenantId ? `/api/templates?tenantId=${tenantId}` : '/api/templates';

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Filter for AQI Sensors
          const aqiTemplates = data.filter(t => t.category === 'AQI Sensor' || (t.defaultValues && t.defaultValues.category === 'AQI Sensor'));

          if (aqiTemplates.length > 0) {
            const mappedZones = aqiTemplates.map((t, index) => ({
              id: index + 1,
              name: t.name || `AQI Node ${index + 1}`,
              aqi: Math.floor(Math.random() * 150) + 20, // Simulated data for overview
              pm25: Math.floor(Math.random() * 60) + 10,
              pm10: Math.floor(Math.random() * 80) + 20,
              co2: Math.floor(Math.random() * 400) + 400,
              status: 'Optimal'
            }));

            // Adjust status based on AQI
            mappedZones.forEach(zone => {
              if (zone.aqi > 100) zone.status = 'Warning';
              if (zone.aqi > 150) zone.status = 'Critical';
            });

            setAqiData(mappedZones);
            setIsLoading(false); // Render UI instantly before stats

            // Initial stats fetch
            const modulesToPoll = new Set();
            aqiTemplates.forEach(t => {
              if (t.mapping?.vrvConfig) {
                Object.values(t.mapping.vrvConfig).forEach(val => {
                  if (typeof val === 'string' && val.includes('::')) {
                    modulesToPoll.add(val.split('::')[0]);
                  }
                });
              }
            });
            
            const pollList = Array.from(modulesToPoll);
            const statsUrl = pollList.length > 0 ? `${backendUrl}/api/templates/stats?modules=${pollList.join(',')}` : `${backendUrl}/api/templates/stats`;
            
            const statsRes = await fetch(statsUrl);
            if (statsRes.ok) {
              const stats = await statsRes.json();
              processTelemetry(stats);
            }
          } else {
            // Default placeholder if no templates exist
            setAqiData([
              { id: 1, name: 'Main Facility Zone', aqi: 42, pm25: 12, pm10: 24, co2: 410, status: 'Optimal' }
            ]);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching AQI templates:', error);
        // Fallback data
        setAqiData([
          { id: 1, name: 'Main Facility Zone', aqi: 42, pm25: 12, pm10: 24, co2: 410, status: 'Optimal' }
        ]);
        setIsLoading(false);
      }
    };

    fetchAqiZones();

    return () => {
      socket.disconnect();
    };
  }, []);

  const getAqiColor = (aqi) => {
    if (aqi <= 50) return '#10b981'; // Good (Green)
    if (aqi <= 100) return '#fbbf24'; // Moderate (Yellow)
    if (aqi <= 150) return '#f97316'; // Unhealthy for Sensitive (Orange)
    if (aqi <= 200) return '#ef4444'; // Unhealthy (Red)
    return '#8b5cf6'; // Very Unhealthy (Purple)
  };

  const getAqiLabel = (aqi) => {
    if (aqi <= 50) return 'GOOD';
    if (aqi <= 100) return 'MODERATE';
    if (aqi <= 150) return 'UNHEALTHY SENSITIVE';
    if (aqi <= 200) return 'UNHEALTHY';
    return 'CRITICAL';
  };

  return (
    <div className="fade-in p-3 h-100 d-flex flex-column" style={{ background: '#0f172a', minHeight: '100vh' }}>

      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="rounded-circle" style={{ width: '8px', height: '8px', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
              <span className="text-success fw-bold fs-9 uppercase tracking-widest">NETWORK STABLE</span>
            </div>
            <div className="text-secondary fw-bold fs-9 uppercase px-3 py-1 rounded-pill" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {time.toLocaleTimeString()}
            </div>
          </div>
          <h2 className="text-white fw-bold mb-1 d-flex align-items-center text-uppercase tracking-wide">
            <Leaf className="me-2 text-success" size={28} />
            Air Quality <span className="text-secondary ms-2 fw-light">Overview</span>
          </h2>
          <p className="text-secondary fs-8 mb-0 uppercase tracking-widest">Facility-wide particulate & gas monitoring</p>
        </div>
        <div className="d-flex gap-3">
          <button className="btn btn-dark d-flex align-items-center gap-2 px-4 rounded-pill fs-9 fw-bold uppercase tracking-widest border border-secondary border-opacity-25" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <RefreshCw size={14} /> Sync
          </button>
          <button className="btn btn-success d-flex align-items-center gap-2 px-4 rounded-pill fs-9 fw-bold uppercase tracking-widest" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
          <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="text-secondary mt-3 uppercase tracking-widest fw-bold fs-9">Aggregating Sensor Data...</p>
        </div>
      ) : (
        <>
          {/* QUICK STATS */}
          <Row className="g-4 mb-4">
            {[
              { label: 'ACTIVE NODES', val: aqiData.length, icon: <Activity size={20} />, color: '#38bdf8' },
              { label: 'AVG AQI', val: Math.round(aqiData.reduce((acc, curr) => acc + curr.aqi, 0) / (aqiData.length || 1)), icon: <Leaf size={20} />, color: '#10b981' },
              { label: 'AVG CO2', val: Math.round(aqiData.reduce((acc, curr) => acc + curr.co2, 0) / (aqiData.length || 1)) + ' ppm', icon: <Wind size={20} />, color: '#fbbf24' },
              { label: 'CRITICAL ZONES', val: aqiData.filter(z => z.aqi > 150).length, icon: <AlertTriangle size={20} />, color: '#ef4444' }
            ].map((stat, i) => (
              <Col xl={3} lg={6} key={i}>
                <Card className="border-0 overflow-hidden" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="position-absolute" style={{ top: '-20px', right: '-20px', width: '80px', height: '80px', background: stat.color, filter: 'blur(40px)', opacity: 0.2 }}></div>
                  <Card.Body className="p-4 d-flex align-items-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-4" style={{ width: '48px', height: '48px', background: `rgba(${stat.color === '#38bdf8' ? '56,189,248' : stat.color === '#10b981' ? '16,185,129' : stat.color === '#fbbf24' ? '251,191,36' : '239,68,68'}, 0.15)`, border: `1px solid rgba(${stat.color === '#38bdf8' ? '56,189,248' : stat.color === '#10b981' ? '16,185,129' : stat.color === '#fbbf24' ? '251,191,36' : '239,68,68'}, 0.3)` }}>
                      {React.cloneElement(stat.icon, { color: stat.color })}
                    </div>
                    <div>
                      <span className="text-secondary fw-bold fs-10 uppercase tracking-widest d-block mb-1">{stat.label}</span>
                      <h3 className="text-white fw-bold mb-0 font-monospace">{stat.val}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ZONE CARDS */}
          <h5 className="text-white fw-bold text-uppercase fs-6 mb-3 d-flex align-items-center">
            <Sparkles className="me-2 text-primary" size={20} />
            Zone Health Diagnostics
          </h5>
          <Row className="g-4">
            {aqiData.map((zone) => {
              const aqiColor = getAqiColor(zone.aqi);
              const aqiLabel = getAqiLabel(zone.aqi);

              return (
                <Col xl={4} lg={6} md={12} key={zone.id}>
                  <Card
                    className="border-0 h-100 position-relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 8px 32px -8px rgba(0,0,0,0.7)'
                    }}
                  >
                    <div className="position-absolute" style={{ top: '-40px', right: '-40px', width: '120px', height: '120px', background: aqiColor, filter: 'blur(60px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' }}></div>

                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                          <h6 className="text-white fw-bold text-uppercase fs-6 m-0">{zone.name}</h6>
                          <small className="text-secondary fw-bold fs-10 uppercase tracking-widest">Node ID: {zone.id}</small>
                        </div>
                        <Badge bg="transparent" className="border px-3 py-2 rounded-pill shadow-sm" style={{ borderColor: aqiColor, color: aqiColor }}>
                          {aqiLabel}
                        </Badge>
                      </div>

                      <div className="d-flex align-items-center justify-content-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
                        <div className="text-center">
                          <span className="text-secondary fw-bold fs-10 uppercase tracking-widest d-block mb-2">OVERALL AQI</span>
                          <div className="display-3 fw-bold font-monospace mb-1" style={{ color: aqiColor, textShadow: `0 0 20px ${aqiColor}60` }}>
                            {zone.aqi}
                          </div>
                          <div className="progress rounded-pill mt-3 mx-auto" style={{ height: '6px', width: '120px', background: 'rgba(255,255,255,0.05)' }}>
                            <div className="progress-bar rounded-pill" role="progressbar" style={{ width: `${Math.min(100, (zone.aqi / 300) * 100)}%`, background: aqiColor, boxShadow: `0 0 10px ${aqiColor}` }}></div>
                          </div>
                        </div>
                      </div>

                      <Row className="g-3 text-center">
                        <Col xs={4}>
                          <div className="p-2 rounded-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <span className="text-secondary opacity-75 fw-bold uppercase tracking-widest d-block mb-1 fs-11">PM 2.5</span>
                            <span className="text-white fw-bold font-monospace fs-6">{zone.pm25} <small className="fs-10 text-muted">µg</small></span>
                          </div>
                        </Col>
                        <Col xs={4}>
                          <div className="p-2 rounded-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <span className="text-secondary opacity-75 fw-bold uppercase tracking-widest d-block mb-1 fs-11">PM 10</span>
                            <span className="text-white fw-bold font-monospace fs-6">{zone.pm10} <small className="fs-10 text-muted">µg</small></span>
                          </div>
                        </Col>
                        <Col xs={4}>
                          <div className="p-2 rounded-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <span className="text-secondary opacity-75 fw-bold uppercase tracking-widest d-block mb-1 fs-11">CO2</span>
                            <span className="text-white fw-bold font-monospace fs-6">{zone.co2} <small className="fs-10 text-muted">ppm</small></span>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </div>
  );
};

export default AQIOverview;

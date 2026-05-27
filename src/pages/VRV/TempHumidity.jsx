import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { Thermometer, Droplets, Activity, Wind, Leaf, History, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './VRVOverview.css';



const metricsConfig = {
  TEMP: { label: 'Temperature', shortLabel: 'Temp', unit: 'Deg.C', color: '#fbbf24', icon: Thermometer, min: 0, max: 50 },
  HUMIDITY: { label: 'Humidity', shortLabel: 'Humidity', unit: '%', color: '#38bdf8', icon: Droplets, min: 0, max: 100 },
  CO2: { label: 'CO2', shortLabel: 'CO2', unit: 'PPM', color: '#ec4899', icon: Wind, min: 300, max: 2000 },
  TVOC: { label: 'TVOC', shortLabel: 'TVOC', unit: 'PPM', color: '#a855f7', icon: Activity, min: 0, max: 500 },
  AQI: { label: 'AQI', shortLabel: 'AQI', unit: 'IV', color: '#10b981', icon: Leaf, min: 0, max: 200 }
};

const generateHistory = (baseValue, variance, min, max) => {
  const times = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  return times.map(time => {
    let val = baseValue + (Math.random() * variance * 2 - variance);
    val = Math.max(min, Math.min(max, val));
    return {
      time,
      value: parseFloat(val.toFixed(2))
    };
  });
};

const Gauge = ({ value, min, max, unit, color }) => {
  const radius = 65;
  const cx = 100;
  const cy = 90;
  const circumference = Math.PI * radius;
  const percent = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const offset = circumference - (percent * circumference);
  
  // -90deg is far left, +90deg is far right
  const rotation = -90 + (percent * 180);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ height: '160px' }}>
      <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Background Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* Value Arc (Colored) */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          filter="url(#glow)"
        />
        
        {/* Central Pivot Needle */}
        <g 
          transform={`rotate(${rotation}, ${cx}, ${cy})`}
          style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* Needle pointer */}
          <polygon points={`${cx - 3},${cy} ${cx + 3},${cy} ${cx},${cy - radius - 2}`} fill="#ffffff" filter="url(#shadow)" />
          {/* Inner circle pivot */}
          <circle cx={cx} cy={cy} r="6" fill="#ffffff" filter="url(#shadow)" />
          <circle cx={cx} cy={cy} r="2" fill={color} />
        </g>
        
        {/* Min / Max Text Labels */}
        <text x={cx - radius - 15} y={cy} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end" alignmentBaseline="middle">{min}</text>
        <text x={cx + radius + 15} y={cy} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="start" alignmentBaseline="middle">{max}</text>

        {/* Big Value Text (Positioned safely below the needle pivot) */}
        <text x={cx} y={cy + 35} fill="#ffffff" fontSize="28" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          {Number.isInteger(value) ? value : value.toFixed(2)}
        </text>
        <text x={cx} y={cy + 55} fill={color} fontSize="13" fontWeight="bold" textAnchor="middle" letterSpacing="1">
          {unit}
        </text>
      </svg>
    </div>
  );
};

import { io } from 'socket.io-client';

let globalCachedZones = null;
let globalCachedSelectedUnit = 'Common';

const EnvDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState(globalCachedSelectedUnit);
  const [savedZones, setSavedZones] = useState(globalCachedZones || []);
  const [isLoading, setIsLoading] = useState(!globalCachedZones);

  React.useEffect(() => {
    if (savedZones.length > 0) {
      globalCachedZones = savedZones;
    }
  }, [savedZones]);

  React.useEffect(() => {
    if (selectedUnit) {
      globalCachedSelectedUnit = selectedUnit;
    }
  }, [selectedUnit]);

  React.useEffect(() => {
    const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
    const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('VRV WebSocket Connected - Listening for Telemetry');
    });

    let currentTemplates = [];

    const processTelemetry = (stats) => {
      if (!Array.isArray(stats)) return;
      
      setSavedZones(prev => {
        let updated = false;
        const next = prev.map(zone => {
          if (!zone.mapping || !zone.mapping.vrvConfig) return zone;
          
          let newZone = { ...zone };
          const config = zone.mapping.vrvConfig;

          // Helper to extract value from stats
          const getValue = (configField) => {
            if (!configField || !configField.includes('::')) return null;
            const [moduleId, fieldId] = configField.split('::');
            const stat = stats.find(s => String(s.moduleId) === String(moduleId) || String(s.meta?.module_id) === String(moduleId));
            if (stat && stat.meta && stat.meta[fieldId] !== undefined) {
              return parseFloat(stat.meta[fieldId]);
            }
            return null;
          };

          const temp = getValue(config.temperature);
          if (temp !== null && newZone.TEMP !== temp) { newZone.TEMP = temp; updated = true; }

          const hum = getValue(config.humidity);
          if (hum !== null && newZone.HUMIDITY !== hum) { newZone.HUMIDITY = hum; updated = true; }

          const co2 = getValue(config.co2);
          if (co2 !== null && newZone.CO2 !== co2) { newZone.CO2 = co2; updated = true; }

          const tvoc = getValue(config.tvoc);
          if (tvoc !== null && newZone.TVOC !== tvoc) { newZone.TVOC = tvoc; updated = true; }

          const aqi = getValue(config.aqi);
          if (aqi !== null && newZone.AQI !== aqi) { newZone.AQI = aqi; updated = true; }

          return newZone;
        });

        return updated ? next : prev;
      });
    };

    socket.on('telemetry_update', processTelemetry);

    const fetchTemplatesAndStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const tenantId = userData?.tenantId;
        const url = tenantId ? `/api/templates?tenantId=${tenantId}` : '/api/templates';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const mappedData = data.map(t => {
            const hasDefaultValues = t.defaultValues && typeof t.defaultValues === 'object' && Object.keys(t.defaultValues).length > 0;
            const defValues = hasDefaultValues ? t.defaultValues : null;
            const mappingSource = defValues || (t.settings && t.settings[0]?.meta) || {};
            return {
              id: t.id,
              name: t.name,
              category: (defValues && defValues.category) || t.category || 'Water Management',
              module: (defValues && defValues.module) || (t.settings && t.settings[0]?.eventKey) || 'AG Tank',
              mapping: mappingSource,
              template_name: t.name
            };
          });
          const vrvTemplates = mappedData.filter(t => t.category === 'VRV' && t.module === 'Temp & Humidity');
          currentTemplates = vrvTemplates;
          
          if (vrvTemplates.length > 0) {
            setSavedZones(prev => {
              if (prev.length > 0) return prev; // already initialized
              
              const mappedZones = vrvTemplates.map((t, index) => ({
                id: index + 1,
                name: t.mapping?.vrvConfig?.vrvZone || t.template_name || `Zone ${index + 1}`,
                TEMP: 0,
                HUMIDITY: 0,
                CO2: 0,
                TVOC: 0,
                AQI: 0,
                status: 'Optimal',
                mapping: t.mapping
              }));
              
              if (mappedZones.length > 0 && selectedUnit === 'Common' && globalCachedSelectedUnit === 'Common') {
                setSelectedUnit(mappedZones[0].name);
              }
              return mappedZones;
            });
            
            // Initial stats fetch
            const modulesToPoll = new Set();
            vrvTemplates.forEach(t => {
              if (t.mapping?.vrvConfig) {
                Object.values(t.mapping.vrvConfig).forEach(val => {
                  if (typeof val === 'string' && val.includes('::')) {
                    modulesToPoll.add(val.split('::')[0]);
                  }
                });
              }
            });
            
            const pollList = Array.from(modulesToPoll);
            const apiBase = backendUrl;
            const url = pollList.length > 0 ? `${apiBase}/api/templates/stats?modules=${pollList.join(',')}` : `${apiBase}/api/templates/stats`;
            
            const statsRes = await fetch(url);
            if (statsRes.ok) {
              const stats = await statsRes.json();
              processTelemetry(stats);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching VRV templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplatesAndStats();
    
    const pollInterval = setInterval(async () => {
      if (currentTemplates.length === 0) return;
      const modulesToPoll = new Set();
      currentTemplates.forEach(t => {
        if (t.mapping?.vrvConfig) {
          Object.values(t.mapping.vrvConfig).forEach(val => {
            if (typeof val === 'string' && val.includes('::')) {
              modulesToPoll.add(val.split('::')[0]);
            }
          });
        }
      });
      const pollList = Array.from(modulesToPoll);
      const url = pollList.length > 0 ? `${backendUrl}/api/templates/stats?modules=${pollList.join(',')}` : `${backendUrl}/api/templates/stats`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const stats = await res.json();
          processTelemetry(stats);
        }
      } catch (e) {}
    }, 2000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  const activeZones = savedZones;
  const unitData = activeZones.find(u => u.name === selectedUnit) || activeZones[0] || null;

  const getVariance = (metric) => {
    switch (metric) {
      case 'TEMP': return 2;
      case 'HUMIDITY': return 5;
      case 'CO2': return 30;
      case 'TVOC': return 8;
      case 'AQI': return 3;
      default: return 5;
    }
  };

  const histories = useMemo(() => {
    const h = {};
    if (!unitData) return h;
    Object.keys(metricsConfig).forEach(key => {
      h[key] = generateHistory(unitData[key], getVariance(key), metricsConfig[key].min, metricsConfig[key].max);
    });
    return h;
  }, [unitData]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
  };

  return (
    <div className="fade-in p-3 VRV-full-panel h-100 d-flex flex-column" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white d-flex align-items-center fw-bold">
            <Sparkles className="me-2 text-warning" size={28} /> Environmental Analytics
          </h2>
          <p className="text-secondary fs-7 mb-0">High-precision zone telemetry and historical tracking</p>
        </div>
      </div>

      {isLoading ? (
        <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 bg-dark bg-opacity-20 rounded-4 border border-white border-opacity-5" style={{ minHeight: '500px' }}>
          <div className="position-relative mb-4">
            <div className="spinner-border text-info" role="status" style={{ width: '5rem', height: '5rem', borderWidth: '0.25em' }}></div>
            <div className="position-absolute top-50 start-50 translate-middle shadow-lg glow-icon">
              <Sparkles className="text-warning" size={24} />
            </div>
          </div>
          <h4 className="text-white fw-bold mb-2 text-uppercase" style={{ letterSpacing: '2px' }}>Connecting to Workspace</h4>
          <p className="text-secondary mb-0 text-center fs-7" style={{ maxWidth: '450px' }}>
            Syncing live environmental telemetry and loading zone mappings...
          </p>
        </div>
      ) : (
        <Row className="g-4 flex-grow-1">
          {/* Zone Sidebar */}
          <Col xl={3} lg={4}>
            <Card className="scada-card border-0 h-100 shadow-lg" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px' }}>
              <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-4">
                <h6 className="text-white fw-bold m-0 text-uppercase fs-8 text-secondary tracking-wide">Select Zone</h6>
              </Card.Header>
              <Card.Body className="p-2 overflow-auto scada-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div className="p-1">
                  {activeZones.map((zone) => {
                    const isSelected = selectedUnit === zone.name;
                    return (
                      <div 
                        key={zone.id} 
                        className="p-3 mb-2 rounded-4 d-flex justify-content-between align-items-center"
                        style={{ 
                          cursor: 'pointer',
                          background: isSelected ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 100%)' : 'transparent',
                          borderLeft: isSelected ? '4px solid #38bdf8' : '4px solid transparent',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => setSelectedUnit(zone.name)}
                      >
                        <div>
                          <span className={`fw-bold d-block fs-6 ${isSelected ? 'text-white' : 'text-secondary'}`}>{zone.name}</span>
                          <span className="text-muted fs-8">Zone {zone.id}</span>
                        </div>
                        <div className="text-end">
                          <span className={`font-monospace fw-bold fs-5 ${isSelected ? 'text-info' : 'text-white'}`}>
                            {zone.TEMP.toFixed(1)}<span style={{fontSize:'0.6em'}}>°C</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Dashboard Grid */}
          <Col xl={9} lg={8}>
            {!unitData ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 bg-dark bg-opacity-20 rounded-4 border border-white border-opacity-5 p-5" style={{ minHeight: '600px' }}>
                <div className="p-4 rounded-circle bg-dark bg-opacity-40 border border-secondary border-opacity-25 mb-4 shadow-sm">
                  <Activity size={48} className="text-secondary opacity-50" />
                </div>
                <h4 className="text-white fw-bold mb-2 tracking-wide text-uppercase">No Configurations Found</h4>
                <p className="text-secondary mb-0 text-center" style={{ maxWidth: '400px' }}>
                  Map a VRV target device in the settings configuration module to start receiving live environment telemetry.
                </p>
              </div>
            ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                <h5 className="text-white fw-bold text-uppercase fs-5 m-0 d-flex align-items-center">
                  <Activity className="me-2 text-primary" size={24}/> 
                  {selectedUnit} Diagnostics
                </h5>
                <Badge bg="dark" className="text-white fw-bold px-4 py-2 rounded-pill border border-secondary border-opacity-25 shadow-sm" style={{ letterSpacing: '1px' }}>
                  STATUS: <span className={unitData.status === 'Optimal' ? 'text-success' : 'text-warning'}>{unitData.status.toUpperCase()}</span>
                </Badge>
              </div>

              <div className="overflow-auto scada-scrollbar pe-3" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                <Row className="g-4">
                  {Object.entries(metricsConfig).map(([key, config]) => {
                    const IconComponent = config.icon;
                    const value = unitData[key];
                    const history = histories[key];
                    
                    return (
                      <Col xl={6} lg={12} key={key}>
                        <Card 
                          className="scada-card border-0 h-100 shadow-lg position-relative overflow-hidden" 
                          style={{ 
                            background: 'rgba(30, 41, 59, 0.4)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.03)'
                          }}
                        >
                          {/* Subtle background glow based on metric color */}
                          <div className="position-absolute" style={{ top: '-50px', right: '-50px', width: '150px', height: '150px', background: config.color, filter: 'blur(80px)', opacity: 0.1, borderRadius: '50%' }}></div>
                          
                          <Card.Body className="p-4">
                            {/* Card Header */}
                            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10 pb-3 mb-4">
                              <h6 className="text-white fw-bold text-uppercase fs-7 m-0 d-flex align-items-center" style={{ letterSpacing: '1px' }}>
                                <div className="p-2 rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ background: `rgba(${hexToRgb(config.color)}, 0.15)` }}>
                                  <IconComponent size={18} style={{ color: config.color }} /> 
                                </div>
                                {config.label}
                              </h6>
                              <Badge bg="transparent" className="text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1 fw-normal">Past 24h</Badge>
                            </div>

                            <Row className="align-items-center">
                              {/* Left: Professional Classic Gauge */}
                              <Col xs={5} className="pe-4 border-end border-secondary border-opacity-10">
                                <Gauge 
                                  value={value} 
                                  min={config.min} 
                                  max={config.max} 
                                  unit={config.unit} 
                                  color={config.color}
                                />
                              </Col>

                              {/* Right: Modern Area Chart */}
                              <Col xs={7} className="ps-4" style={{ height: '160px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={history} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={config.color} stopOpacity={0.4}/>
                                        <stop offset="100%" stopColor={config.color} stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.1)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis 
                                      domain={['dataMin', 'dataMax']} 
                                      stroke="rgba(255,255,255,0.1)" 
                                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                      axisLine={false} tickLine={false}
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', fontSize: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                      itemStyle={{ color: config.color, fontWeight: 'bold' }}
                                      formatter={(val) => [`${val} ${config.unit}`, config.shortLabel]}
                                      labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={3} fillOpacity={1} fill={`url(#gradient-${key})`} activeDot={{ r: 6, strokeWidth: 0, fill: config.color }} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </>
          )}
        </Col>
      </Row>
      )}
    </div>
  );
};

export default EnvDashboard;

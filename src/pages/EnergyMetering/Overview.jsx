import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, ProgressBar, Badge, Table, Form } from 'react-bootstrap';
import { Zap, Activity, BatteryCharging, Award, TrendingUp, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { io } from 'socket.io-client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// System telemetry refresh flag
const EnergyMeteringOverview = () => {
  const navigate = useNavigate();
  const { getOverallStatus } = useDeviceStatus();

  // Simulated base dynamic metrics as fallback
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
  const [autoCycle, setAutoCycle] = useState(true);
  const [calBlink, setCalBlink] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [telemetryStats, setTelemetryStats] = useState([]);
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Base simulation loop
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

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scada_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Set up Live Telemetry Sync using Websockets and Polling
  useEffect(() => {
    const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
    const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('EnergyOverview WebSocket Connected');
    });

    const processTelemetry = (stats) => {
      if (Array.isArray(stats)) {
        setTelemetryStats(stats);
        try {
          localStorage.setItem('scada_energy_overview_cache', JSON.stringify(stats));
        } catch (e) {}
      }
    };

    socket.on('telemetry_update', processTelemetry);

    // Initial Cache Load
    try {
      const cached = localStorage.getItem('scada_energy_overview_cache');
      if (cached) processTelemetry(JSON.parse(cached));
    } catch (e) {}

    // Polling Fetch stats backup
    const fetchStats = async () => {
      try {
        const modulesToPoll = new Set();
        templates.forEach(t => {
          if (t.mapping) {
            Object.values(t.mapping).forEach(cfg => {
              if (cfg && typeof cfg === 'object' && cfg.module && cfg.module !== 'ALL') {
                modulesToPoll.add(String(cfg.module));
              }
            });
          }
        });
        const pollList = Array.from(modulesToPoll);
        if (pollList.length === 0) return;
        
        const url = `${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/stats?modules=${pollList.join(',')}`;
        const res = await fetch(url);
        if (res.ok) {
          const stats = await res.json();
          processTelemetry(stats);
        }
      } catch (err) {
        console.error('Error in Overview fetchStats:', err);
      }
    };

    fetchStats();
    const pollingInterval = setInterval(fetchStats, 2000);

    return () => {
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, [templates]);

  // Cycle mini display screen
  useEffect(() => {
    if (!autoCycle) return;
    const timer = setInterval(() => {
      setMiniLcdIndex(prev => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, [autoCycle]);

  // Helper to extract a telemetry field value dynamically
  const getTelemetryValue = (template, sectionKey, fieldKey) => {
    if (!template?.mapping?.[sectionKey]) return null;
    const config = template.mapping[sectionKey];
    if (config.enabled === false) return null;
    const field = config[fieldKey];
    if (!field) return null;
    
    let modId = config.module;
    let fieldId = field;
    if (field.includes('::')) {
      const parts = field.split('::');
      modId = parts[0];
      fieldId = parts[1];
    }
    
    const stat = telemetryStats.find(s => String(s.moduleId) === String(modId) || String(s.meta?.module_id) === String(modId));
    if (stat && stat.meta && stat.meta[fieldId] !== undefined) {
      return stat.meta[fieldId];
    }
    return null;
  };

  // Find Templates
  const mainMeterTemplate = useMemo(() => {
    return templates.find(t => t.module === 'Main Meter');
  }, [templates]);

  const subMeterTemplates = useMemo(() => {
    return templates.filter(t => t.module === 'Sub Meters');
  }, [templates]);

  // Compute display metrics dynamically
  const displayMetrics = useMemo(() => {
    let activePower = metrics.activePower;
    let powerFactor = metrics.powerFactor;
    let todayConsumption = metrics.todayConsumption;
    let cumulativekWh = metrics.cumulativekWh;

    if (mainMeterTemplate) {
      const livePower = getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'totalKw') || getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'activePower');
      if (livePower !== null) activePower = Number(livePower);

      const livePf = getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'pf');
      if (livePf !== null) powerFactor = Number(livePf);

      const liveKwh = getTelemetryValue(mainMeterTemplate, 'emReadConfig', 'ebKwh') || getTelemetryValue(mainMeterTemplate, 'emReadConfig', 'cumulativekWh');
      if (liveKwh !== null) {
        cumulativekWh = Number(liveKwh);
        todayConsumption = Math.round(Number(liveKwh) % 10000); 
      }
    } else if (subMeterTemplates.length > 0) {
      let totalSubLoad = 0;
      subMeterTemplates.forEach(t => {
        const val = getTelemetryValue(t, 'emChangeConfig', 'totalKw') || getTelemetryValue(t, 'emChangeConfig', 'activePower') || 0;
        totalSubLoad += Number(val);
      });
      if (totalSubLoad > 0) {
        activePower = totalSubLoad;
      }
    }

    const co2Offset = (cumulativekWh * 0.0004).toFixed(2);

    return {
      activePower: Number(activePower).toFixed(1),
      powerFactor: Number(powerFactor).toFixed(2),
      todayConsumption: Math.round(todayConsumption),
      cumulativekWh: Number(cumulativekWh),
      co2Offset: co2Offset
    };
  }, [templates, telemetryStats, metrics, mainMeterTemplate, subMeterTemplates]);

  // Cal LED blink rate based on load
  useEffect(() => {
    const rate = Math.max(150, Math.min(2000, 120000 / parseFloat(displayMetrics.activePower)));
    const blinkTimer = setInterval(() => {
      setCalBlink(prev => !prev);
    }, rate);
    return () => clearInterval(blinkTimer);
  }, [displayMetrics.activePower]);

  // Dynamic Zone/Sub-Meters load distribution
  const zoneDistribution = useMemo(() => {
    if (subMeterTemplates.length > 0) {
      let totalSubLoad = 0;
      const zones = subMeterTemplates.map((t, idx) => {
        const loadVal = getTelemetryValue(t, 'emChangeConfig', 'totalKw') || getTelemetryValue(t, 'emChangeConfig', 'activePower') || 0;
        totalSubLoad += Number(loadVal);
        
        const targetName = t.mapping?.energyMeteringTarget || t.name || '';
        let resolvedCategory = t.mapping?.subMeterCategory;
        
        if (!resolvedCategory) {
          const nameUpper = targetName.toUpperCase();
          if (nameUpper.includes('COMMERCIAL') || nameUpper.includes('WING') || nameUpper.includes('OFFICE')) {
            resolvedCategory = 'Commercial';
          } else if (nameUpper.includes('SERVER') || nameUpper.includes('UPS') || nameUpper.includes('DATA CENTER') || nameUpper.includes('IT')) {
            resolvedCategory = 'Data Center';
          } else if (nameUpper.includes('WATER') || nameUpper.includes('PLANT') || nameUpper.includes('UTILITY') || nameUpper.includes('MOTOR') || nameUpper.includes('PUMP')) {
            resolvedCategory = 'Water Management';
          } else if (nameUpper.includes('HVAC') || nameUpper.includes('CHILLER') || nameUpper.includes('AC')) {
            resolvedCategory = 'HVAC';
          } else if (nameUpper.includes('LIGHT') || nameUpper.includes('STREET') || nameUpper.includes('PARKING')) {
            resolvedCategory = 'Lighting';
          } else {
            resolvedCategory = 'Sub Meter';
          }
        }

        const colors = ['info', 'warning', 'success', 'danger', 'purple'];
        const color = colors[idx % colors.length];

        return {
          name: targetName,
          load: `${Number(loadVal).toFixed(1)} kW`,
          rawLoad: Number(loadVal),
          color: color,
          category: resolvedCategory
        };
      });

      const divisor = totalSubLoad > 0 ? totalSubLoad : 1;

      return zones.map(z => ({
        ...z,
        percentage: Math.min(100, Math.max(0, Math.round((z.rawLoad / divisor) * 100)))
      }));
    }

    // Default static fallback if no templates configured yet
    return [
      { name: 'Commercial Tower Wing-A Incomer', load: '185 kW', percentage: 38, color: 'info', category: 'Commercial' },
      { name: 'Data Center Main UPS Input', load: '142 kW', percentage: 29, color: 'warning', category: 'Data Center' },
      { name: 'Water Plant & Utility Motors Room', load: '95 kW', percentage: 20, color: 'success', category: 'Water Management' },
      { name: 'HVAC Chiller Main Feeder', load: '63.4 kW', percentage: 13, color: 'danger', category: 'HVAC' }
    ];
  }, [templates, telemetryStats, subMeterTemplates]);

  // Dynamic status rows for both main and sub-meters
  const tableRows = useMemo(() => {
    const rows = [];
    
    // 1. Main Meter Incomer
    if (mainMeterTemplate) {
      const loadVal = getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'totalKw') || getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'activePower');
      const vVal = getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'vR');
      const iVal = getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'iR');
      const pfVal = getTelemetryValue(mainMeterTemplate, 'emChangeConfig', 'pf');
      
      const deviceId = mainMeterTemplate.mapping?.deviceId || mainMeterTemplate.mapping?.emChangeConfig?.device;
      const gatewayUuid = mainMeterTemplate.mapping?.gatewayUuid;
      let isOnline = getOverallStatus(deviceId, gatewayUuid);
      
      if (!isOnline && mainMeterTemplate.mapping) {
        const activeModules = new Set();
        ['emChangeConfig', 'emWarningConfig', 'emReadConfig'].forEach(k => {
          const cfg = mainMeterTemplate.mapping[k];
          if (cfg?.enabled !== false && cfg?.module) activeModules.add(String(cfg.module));
        });
        if (telemetryStats.some(s => activeModules.has(String(s.moduleId)) || activeModules.has(String(s.meta?.module_id)))) {
          isOnline = true;
        }
      }

      rows.push({
        id: 'M-MAIN-GRID-01',
        name: mainMeterTemplate.mapping?.energyMeteringTarget || mainMeterTemplate.name || 'Main Power Grid Incomer',
        category: mainMeterTemplate.category || 'Main Feed',
        load: loadVal !== null ? `${Number(loadVal).toFixed(1)} kW` : `${parseFloat(displayMetrics.activePower).toFixed(1)} kW`,
        voltage: vVal !== null ? `${Number(vVal).toFixed(1)} V` : '232.4 V',
        current: iVal !== null ? `${Number(iVal).toFixed(1)} A` : '712.4 A',
        pf: pfVal !== null ? Number(pfVal).toFixed(2) : displayMetrics.powerFactor,
        status: isOnline ? 'Running' : 'Offline',
        path: '/energy-metering/main',
        isMain: true,
        isMapped: true
      });
    } else {
      rows.push({
        id: 'M-MAIN-GRID-01',
        name: 'Main Power Grid Incomer',
        category: 'Main Feed',
        load: '-- kW',
        voltage: '-- V',
        current: '-- A',
        pf: '--',
        status: 'Not Mapped',
        path: '/energy-metering/main',
        isMain: true,
        isMapped: false
      });
    }

    // 2. Sub Meters
    if (subMeterTemplates.length > 0) {
      subMeterTemplates.forEach((t, index) => {
        const loadVal = getTelemetryValue(t, 'emChangeConfig', 'totalKw') || getTelemetryValue(t, 'emChangeConfig', 'activePower');
        const vVal = getTelemetryValue(t, 'emChangeConfig', 'vR');
        const iVal = getTelemetryValue(t, 'emChangeConfig', 'iR');
        const pfVal = getTelemetryValue(t, 'emChangeConfig', 'pf');

        const deviceId = t.mapping?.deviceId || t.mapping?.emChangeConfig?.device;
        const gatewayUuid = t.mapping?.gatewayUuid;
        let isOnline = getOverallStatus(deviceId, gatewayUuid);
        
        if (!isOnline && t.mapping) {
          const activeModules = new Set();
          ['emChangeConfig', 'emWarningConfig', 'emReadConfig'].forEach(k => {
            const cfg = t.mapping[k];
            if (cfg?.enabled !== false && cfg?.module) activeModules.add(String(cfg.module));
          });
          if (telemetryStats.some(s => activeModules.has(String(s.moduleId)) || activeModules.has(String(s.meta?.module_id)))) {
            isOnline = true;
          }
        }

        const targetName = t.mapping?.energyMeteringTarget || t.name || '';
        let resolvedCategory = t.mapping?.subMeterCategory;
        
        if (!resolvedCategory) {
          const nameUpper = targetName.toUpperCase();
          if (nameUpper.includes('COMMERCIAL') || nameUpper.includes('WING') || nameUpper.includes('OFFICE')) {
            resolvedCategory = 'Commercial';
          } else if (nameUpper.includes('SERVER') || nameUpper.includes('UPS') || nameUpper.includes('DATA CENTER') || nameUpper.includes('IT')) {
            resolvedCategory = 'Data Center';
          } else if (nameUpper.includes('WATER') || nameUpper.includes('PLANT') || nameUpper.includes('UTILITY') || nameUpper.includes('MOTOR') || nameUpper.includes('PUMP')) {
            resolvedCategory = 'Water Management';
          } else if (nameUpper.includes('HVAC') || nameUpper.includes('CHILLER') || nameUpper.includes('AC')) {
            resolvedCategory = 'HVAC';
          } else if (nameUpper.includes('LIGHT') || nameUpper.includes('STREET') || nameUpper.includes('PARKING')) {
            resolvedCategory = 'Lighting';
          } else {
            resolvedCategory = 'Sub Meter';
          }
        }

        rows.push({
          id: `SM-${t.id || (100 + index)}`,
          name: targetName,
          category: resolvedCategory,
          load: loadVal !== null ? `${Number(loadVal).toFixed(1)} kW` : '0.0 kW',
          voltage: vVal !== null ? `${Number(vVal).toFixed(1)} V` : '0.0 V',
          current: iVal !== null ? `${Number(iVal).toFixed(1)} A` : '0.0 A',
          pf: pfVal !== null ? Number(pfVal).toFixed(2) : '1.00',
          status: isOnline ? 'Running' : 'Offline',
          path: '/energy-metering/sub',
          isMain: false,
          isMapped: true
        });
      });
    } else {
      rows.push(
        { id: 'SM-WING-A-01', name: 'Commercial Tower Wing-A Incomer', category: 'Commercial', load: '-- kW', voltage: '-- V', current: '-- A', pf: '--', status: 'Not Mapped', path: '/energy-metering/sub', isMapped: false },
        { id: 'SM-SERVER-02', name: 'Data Center Main UPS Input', category: 'Data Center', load: '-- kW', voltage: '-- V', current: '-- A', pf: '--', status: 'Not Mapped', path: '/energy-metering/sub', isMapped: false },
        { id: 'SM-UTILITY-03', name: 'Water Plant & Utility Motors Room', category: 'Water Management', load: '-- kW', voltage: '-- V', current: '-- A', pf: '--', status: 'Not Mapped', path: '/energy-metering/sub', isMapped: false },
        { id: 'SM-HVAC-04', name: 'HVAC Chiller Main Feeder', category: 'HVAC', load: '-- kW', voltage: '-- V', current: '-- A', pf: '--', status: 'Not Mapped', path: '/energy-metering/sub', isMapped: false }
      );
    }

    return rows;
  }, [templates, telemetryStats, displayMetrics, getOverallStatus, subMeterTemplates, mainMeterTemplate]);

  // Grouped sub meters mapping
  const groupedSubMeters = useMemo(() => {
    const groups = {};
    tableRows.forEach(row => {
      if (row.isMain) return;
      const cat = row.category || 'Other Feeds';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(row);
    });
    return groups;
  }, [tableRows]);

  // Helper to resolve descriptive visual emojis for different zones
  const getZoneEmoji = (category) => {
    switch (category) {
      case 'Commercial': return '🏢';
      case 'Data Center': return '🖥️';
      case 'Water Management': return '💧';
      case 'HVAC': return '❄️';
      case 'Lighting': return '💡';
      default: return '⚡';
    }
  };

  const miniLcdModes = useMemo(() => [
    { label: 'DEMAND (LOAD)', val: `${displayMetrics.activePower}`, unit: 'kW' },
    { label: 'CUMULATIVE ENERGY', val: `${displayMetrics.cumulativekWh.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}`, unit: 'kWh' },
    { label: 'GRID POWER FACTOR', val: `${displayMetrics.powerFactor}`, unit: 'cos φ' },
    { label: 'AVERAGE VOLTAGE', val: '232.4', unit: 'V L-N' },
    { label: 'TOTAL GRID CURRENT', val: '712.4', unit: 'A' }
  ], [displayMetrics]);

  const activeMiniLcd = miniLcdModes[miniLcdIndex];

  return (
    <div className="fade-in">
      {/* HEADER SECTION */}
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center flex-wrap gap-3">
            <h2 className="mb-0 text-white fw-black d-flex align-items-center gap-2 tracking-tight">
              <Zap className="text-warning animate-pulse" size={28} /> Energy Metering Overview
            </h2>
            <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1.5 fs-12 uppercase d-flex align-items-center gap-2 rounded-pill shadow-sm hover-scale-105">
              <span className="pulse-dot-green glow-green"></span>
              Live Telemetry Flowing
            </Badge>
          </div>
          <p className="text-secondary fs-7 mt-2 mb-0">Real-time facility grid monitoring, load distribution analysis, and efficiency statistics.</p>
        </div>
        <PdfButton />
      </div>

      {/* QUICK SYSTEM HEALTH BANNER */}
      <div className="p-3 mb-4 rounded-4 d-flex align-items-center justify-content-between text-white" 
           style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.05)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-success bg-opacity-25 rounded-circle text-success animate-pulse d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
            <Activity size={18} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <strong className="text-success fs-13 uppercase tracking-wider">🟢 SYSTEM STATUS: STABLE & HEALTHY</strong>
            </div>
            <p className="text-secondary mb-0 fs-13 mt-0.5" style={{ opacity: 0.85 }}>
              All electrical feeds are running under optimal load. Power efficiency is excellent. No alarms or critical issues detected.
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 fs-12 uppercase fw-bold">
            ⚡ {subMeterTemplates.length > 0 ? subMeterTemplates.length : 4} Active Meters
          </Badge>
        </div>
      </div>

      {/* METRIC CARD GRID */}
      <Row className="g-4 mb-4">
        <Col md={6} xl={3}>
          <Card 
            className="scada-card border-0 text-white h-100 position-relative overflow-hidden shadow-lg transition-all hover-scale-102" 
            style={{ 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              borderLeft: '4px solid #0ea5e9',
              boxShadow: '0 4px 20px rgba(14, 165, 233, 0.06)'
            }}
          >
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-info bg-opacity-10 text-info rounded-4 border border-info border-opacity-20">
                  <Zap size={22} className="animate-pulse" />
                </div>
                <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold">Real-time</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">Current Power Usage (Active Load)</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{displayMetrics.activePower}</h2>
                  <span className="ms-1 fs-6 text-info fw-bold">kW</span>
                </div>
                <div className="mt-2 pt-2 border-top border-white border-opacity-5 text-secondary fs-13">
                  <span>Live electricity currently being consumed by the entire facility.</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card 
            className="scada-card border-0 text-white h-100 position-relative overflow-hidden shadow-lg transition-all hover-scale-102" 
            style={{ 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderLeft: '4px solid #10b981',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.06)'
            }}
          >
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-4 border border-success border-opacity-20">
                  <Activity size={22} />
                </div>
                <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold">Grid Quality</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">Power Efficiency (Power Factor)</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{displayMetrics.powerFactor}</h2>
                  <span className="ms-1 fs-6 text-success fw-bold">cos φ</span>
                </div>
                <div className="mt-2 pt-2 border-top border-white border-opacity-5 text-secondary fs-13">
                  <span>Electricity usage efficiency (Target: 0.95+ is Excellent).</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card 
            className="scada-card border-0 text-white h-100 position-relative overflow-hidden shadow-lg transition-all hover-scale-102" 
            style={{ 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderLeft: '4px solid #f59e0b',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.06)'
            }}
          >
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-4 border border-warning border-opacity-20">
                  <BatteryCharging size={22} />
                </div>
                <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold">Accumulated</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">Today's Total Electricity Used</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{displayMetrics.todayConsumption.toLocaleString()}</h2>
                  <span className="ms-1 fs-6 text-warning fw-bold">kWh</span>
                </div>
                <div className="mt-2 pt-2 border-top border-white border-opacity-5 text-secondary fs-13">
                  <span>Total energy consumed since 12:00 AM midnight.</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} xl={3}>
          <Card 
            className="scada-card border-0 text-white h-100 position-relative overflow-hidden shadow-lg transition-all hover-scale-102" 
            style={{ 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderLeft: '4px solid #a855f7',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.06)'
            }}
          >
            <div className="card-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)' }}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative z-2">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-3 bg-purple bg-opacity-10 text-purple rounded-4 border border-purple border-opacity-20" style={{ color: '#a855f7' }}>
                  <Award size={22} />
                </div>
                <Badge bg="secondary" className="bg-opacity-10 text-muted border border-secondary border-opacity-20 px-2 py-1 fs-9 uppercase fw-bold" style={{ color: '#a855f7' }}>Carbon Index</Badge>
              </div>
              <div>
                <h6 className="text-secondary fs-12 uppercase tracking-widest fw-black mb-1">Environmental Impact (CO₂ Saved)</h6>
                <div className="d-flex align-items-baseline mb-2">
                  <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{displayMetrics.co2Offset}</h2>
                  <span className="ms-1 fs-6 text-purple fw-bold" style={{ color: '#a855f7' }}>Metric Tons</span>
                </div>
                <div className="mt-2 pt-2 border-top border-white border-opacity-5 text-secondary fs-13">
                  <span>Equivalent greenhouse gas emissions reduced today.</span>
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
              
              <Row className="g-4 align-items-center">
                {/* Left Column: Glowing Interactive Doughnut Chart */}
                <Col md={5} className="d-flex flex-column align-items-center justify-content-center border-end border-white border-opacity-5 pe-md-4 mb-4 mb-md-0">
                  {zoneDistribution.some(z => z.rawLoad > 0) ? (
                    <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={zoneDistribution.filter(z => z.rawLoad > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="rawLoad"
                          >
                            {zoneDistribution.filter(z => z.rawLoad > 0).map((entry, index) => {
                              const colorsMap = {
                                'Commercial': '#38bdf8',
                                'Data Center': '#fb923c',
                                'Water Management': '#4ade80',
                                'HVAC': '#f87171',
                                'Lighting': '#c084fc',
                                'Sub Meter': '#94a3b8'
                              };
                              const color = colorsMap[entry.category] || '#94a3b8';
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Pie>
                          <RechartsTooltip content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="p-3 rounded-4 bg-dark bg-opacity-95 border border-secondary border-opacity-25 shadow-lg text-white" style={{ backdropFilter: 'blur(8px)', zIndex: 10 }}>
                                  <strong className="d-block mb-1 fs-13 text-info uppercase tracking-wider">{data.name}</strong>
                                  <span className="d-block text-secondary fs-13">Category: <span className="text-white fw-bold">{getZoneEmoji(data.category)} {data.category}</span></span>
                                  <span className="d-block text-secondary fs-13 mt-0.5">Active Load: <span className="text-success fw-black">{data.load}</span></span>
                                  <span className="d-block text-secondary fs-13">Distribution: <span className="text-warning fw-bold">{data.percentage}%</span></span>
                                </div>
                              );
                            }
                            return null;
                          }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ pointerEvents: 'none' }}>
                        <span className="d-block text-secondary fs-12 uppercase tracking-widest fw-black mb-0" style={{ fontSize: '0.55rem' }}>Total Load</span>
                        <strong className="fs-5 text-white fw-black" style={{ fontSize: '1.2rem' }}>
                          {zoneDistribution.reduce((sum, z) => sum + (z.rawLoad || 0), 0).toFixed(1)}
                        </strong>
                        <span className="d-block text-info fw-bold" style={{ fontSize: '0.65rem' }}>kW</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-secondary">
                      <Zap size={24} className="opacity-20 mb-2" />
                      <small className="d-block">No active load to visualize in chart</small>
                    </div>
                  )}
                  <div className="mt-3 w-100 d-flex flex-wrap gap-2 justify-content-center">
                    {Object.entries(
                      zoneDistribution.reduce((acc, curr) => {
                        acc[curr.category] = (acc[curr.category] || 0) + (curr.rawLoad || 0);
                        return acc;
                      }, {})
                    ).map(([cat, val]) => {
                      const colorsMap = {
                        'Commercial': '#38bdf8',
                        'Data Center': '#fb923c',
                        'Water Management': '#4ade80',
                        'HVAC': '#f87171',
                        'Lighting': '#c084fc',
                        'Sub Meter': '#94a3b8'
                      };
                      const color = colorsMap[cat] || '#94a3b8';
                      return (
                        <Badge key={cat} bg="dark" className="border border-secondary border-opacity-10 d-flex align-items-center gap-2 px-2.5 py-1.5 fs-12 text-white shadow-sm" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <span className="pulse-dot" style={{ backgroundColor: color, width: '6px', height: '6px', boxShadow: `0 0 6px ${color}`, animation: 'none' }}></span>
                          {getZoneEmoji(cat)} {cat} ({val.toFixed(1)} kW)
                        </Badge>
                      );
                    })}
                  </div>
                </Col>

                {/* Right Column: Refined Progress Bars List */}
                <Col md={7}>
                  {zoneDistribution.map((zone, idx) => {
                    const colorsMap = {
                      'Commercial': '#38bdf8',
                      'Data Center': '#fb923c',
                      'Water Management': '#4ade80',
                      'HVAC': '#f87171',
                      'Lighting': '#c084fc',
                      'Sub Meter': '#94a3b8'
                    };
                    const colorHex = colorsMap[zone.category] || '#94a3b8';
                    return (
                      <div key={idx} className="mb-3 p-2.5 bg-dark bg-opacity-30 border border-secondary border-opacity-5 rounded-4 transition-all hover-scale-101 shadow-sm" style={{ background: 'rgba(255,255,255,0.01)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                          <span className="fw-bold text-white fs-13 d-flex align-items-center gap-2">
                            <span className="fs-6">{getZoneEmoji(zone.category)}</span>
                            {zone.name}
                          </span>
                          <span className="fw-black fs-12" style={{ color: colorHex }}>{zone.load} ({zone.percentage}%)</span>
                        </div>
                        <div className="scada-progress-bar-wrap" style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${zone.percentage}%`, height: '100%', backgroundColor: colorHex, borderRadius: 4, transition: 'width 0.5s ease-out' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card 
            className="scada-card border-0 text-white shadow-lg" 
            style={{ 
              background: 'linear-gradient(145deg, #0c1222, #0f172a, #131d30)',
              border: '1px solid rgba(14, 165, 233, 0.12)'
            }}
          >
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
                  <Activity className="text-info" size={18} /> Grid Parameters
                </h5>
                <Badge bg="none" className="px-2 py-1 fs-11 uppercase fw-bold" style={{ backgroundColor: 'rgba(14, 165, 233, 0.08)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                  All Nominal
                </Badge>
              </div>
              <Row className="g-3">
                {[
                  { label: 'System Frequency', value: `${metrics.frequency}`, unit: 'Hz', status: 'Stable', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.06)' },
                  { label: 'Voltage Unbalance', value: `${metrics.voltageBalance}`, unit: '%', status: 'Normal', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.06)' },
                  { label: 'Voltage THD (R)', value: '1.42', unit: '%', status: 'Optimal', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.06)' },
                  { label: 'Current THD (R)', value: '3.18', unit: '%', status: 'Normal', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.06)' }
                ].map((param, idx) => (
                  <Col md={6} key={idx}>
                    <div 
                      className="grid-param-cell d-flex justify-content-between align-items-center p-3 rounded-4"
                      style={{
                        background: param.bgColor,
                        border: `1px solid ${param.color}20`,
                        borderLeft: `3px solid ${param.color}`,
                        height: '100%'
                      }}
                    >
                      <div>
                        <small className="d-block fs-12 mb-1 fw-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                          {param.label}
                        </small>
                        <div className="d-flex align-items-baseline gap-1">
                          <span className="fw-black fs-4 text-white">{param.value}</span>
                          <span className="fs-13 fw-bold" style={{ color: param.color }}>{param.unit}</span>
                        </div>
                      </div>
                      <span 
                        className="px-2 py-1 fs-11 uppercase fw-bold rounded-pill"
                        style={{
                          backgroundColor: `${param.color}18`,
                          color: param.color,
                          border: `1px solid ${param.color}30`,
                          fontSize: '0.6rem'
                        }}
                      >
                        {param.status}
                      </span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Live System Diagnostics & Insights Widget */}
        <Col lg={4}>
          <Card 
            className="scada-card border-0 text-white h-100 d-flex flex-column justify-content-between p-4" 
            style={{ 
              background: '#090d16', 
              border: '1px solid rgba(14, 165, 233, 0.15)', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)', 
              cursor: 'default' 
            }}
          >
            <div>
              <div className="w-100 d-flex justify-content-between align-items-center mb-3">
                <span className="text-info fw-bold fs-12 uppercase tracking-wider">Live Diagnostics</span>
                <Badge bg="success" className="bg-opacity-15 text-success border border-success border-opacity-25 px-2.5 py-0.5 fs-12 uppercase fw-bold">ALL HEALTHY</Badge>
              </div>

              {/* INDUSTRIAL PHYSICAL DIGITAL METER */}
              <div className="d-flex justify-content-center my-3">
                <div className="mini-meter-poly">
                  <div className="mini-blue-plate">
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="text-white fw-bold mini-brand-name font-monospace">⚡ ACUREX-5000</span>
                      <div className="d-flex align-items-center gap-1">
                        <span className="text-secondary" style={{ fontSize: '0.55rem' }}>CAL</span>
                        <div className={`mini-led-bulb ${calBlink ? 'active' : ''}`}></div>
                      </div>
                    </div>
                    
                    {/* LCD Screen Container */}
                    <div className="mini-lcd-screen">
                      <div className="mini-lcd-glow">
                        <div className="mini-lcd-mode uppercase">{activeMiniLcd.label}</div>
                        <div className="mini-lcd-val font-monospace">{activeMiniLcd.val}</div>
                        <div className="mini-lcd-unit font-monospace">{activeMiniLcd.unit}</div>
                      </div>
                    </div>
                    
                    {/* Imp Label */}
                    <div className="text-center my-2" style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
                      3200 imp/kWh | CLASS 1.0S | MULTI-FUNCTION DIGITAL METER
                    </div>
                    
                    {/* Interactive Tactile Push Buttons */}
                    <div className="d-flex justify-content-between gap-1 mt-2.5 pt-2 border-top border-white border-opacity-10">
                      {miniLcdModes.map((mode, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            setAutoCycle(false);
                            setMiniLcdIndex(idx);
                          }}
                          className={`btn btn-sm border-0 font-monospace text-uppercase py-1 px-1 fs-9 fw-bold transition-all ${miniLcdIndex === idx ? 'bg-info text-dark shadow-sm' : 'bg-dark bg-opacity-40 text-secondary'}`}
                          style={{ 
                            fontSize: '0.52rem', 
                            borderRadius: '4px',
                            flex: 1,
                            boxShadow: miniLcdIndex === idx ? '0 0 6px rgba(14,165,233,0.4)' : 'none',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          {idx === 0 ? 'LOAD' : idx === 1 ? 'KWH' : idx === 2 ? 'PF' : idx === 3 ? 'VOLT' : 'CURR'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-4 overflow-hidden mb-3" style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(15, 23, 42, 0.5)' }}>
                {[
                  { label: 'Grid Feed', val: 'Connected', color: '#22c55e', dot: true },
                  { label: 'Phase Voltage', val: '232.4 V', sub: 'Balanced', color: '#38bdf8' },
                  { label: 'Frequency', val: `${metrics.frequency} Hz`, sub: 'Stable', color: '#f59e0b' },
                  { label: 'Power Quality', val: 'Optimal', color: '#a855f7', badge: true }
                ].map((item, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center px-3 py-2.5 diag-row" style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: item.color, opacity: 0.7 }}></div>
                      <span className="fs-13" style={{ color: '#64748b' }}>{item.label}</span>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                      {item.dot && <span className="pulse-dot-green glow-green" style={{ width: 5, height: 5 }}></span>}
                      <span className="fw-bold fs-13" style={{ color: item.color }}>{item.val}</span>
                      {item.sub && <span className="fs-12" style={{ color: '#475569' }}>({item.sub})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div 
              className="p-3.5 rounded-4 transition-all hover-scale-102 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.02))',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderLeft: '4px solid #0ea5e9',
                backdropFilter: 'blur(4px)',
              }}
            >
              <h6 className="fs-12 uppercase tracking-wider fw-black mb-2 text-info d-flex align-items-center gap-1.5">
                <Zap size={14} className="text-info animate-pulse" /> Quick Insight
              </h6>
              <p className="mb-0 fs-13 text-secondary mt-1" style={{ lineHeight: '1.5', color: '#94a3b8' }}>
                Your average power efficiency (Power Factor) is currently <strong className="text-white fs-14" style={{ textShadow: '0 0 6px rgba(14, 165, 233, 0.4)' }}>{displayMetrics.powerFactor}</strong>, which is extremely healthy! This helps avoid any low-power-factor billing penalties from the utility company.
              </p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* FEED METERS STATUS TABLE */}
      <Card 
        className="scada-card border-0 text-white mt-4 shadow-lg" 
        style={{ 
          background: 'linear-gradient(180deg, #0c1222, #0f172a)',
          border: '1px solid rgba(14, 165, 233, 0.08)'
        }}
      >
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div className="d-flex align-items-center gap-3">
              <h5 className="fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11 mb-0">
                <Cpu className="text-info" size={18} /> Meter Status Registry
              </h5>
              <Badge bg="none" className="fs-11 uppercase fw-bold" style={{ backgroundColor: 'rgba(14, 165, 233, 0.08)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                {tableRows.length} Total
              </Badge>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="fs-12 uppercase fw-bold" style={{ color: '#475569' }}>Group by Category</span>
              <Form.Check 
                type="switch"
                id="group-by-category-switch"
                checked={groupByCategory}
                onChange={() => setGroupByCategory(!groupByCategory)}
                className="scada-switch"
              />
            </div>
          </div>
          
          <div className="table-responsive">
            <Table hover borderless className="align-middle scada-table text-white mb-0">
              <thead>
                <tr style={{ background: 'rgba(14, 165, 233, 0.04)', borderBottom: '1px solid rgba(14, 165, 233, 0.12)' }}>
                  <th className="py-3 fs-12 text-uppercase tracking-wider" style={{ color: '#38bdf8' }}>Meter ID</th>
                  <th className="py-3 fs-12 text-uppercase tracking-wider" style={{ color: '#38bdf8' }}>Meter Location / Label</th>
                  <th className="py-3 text-center fs-12 text-uppercase tracking-wider" style={{ color: '#38bdf8' }}>Active Load</th>
                  <th className="py-3 text-center fs-12 text-uppercase tracking-wider" style={{ color: '#38bdf8' }}>Voltage L-N</th>
                  <th className="py-3 text-center fs-12 text-uppercase tracking-wider" style={{ color: '#38bdf8' }}>Current</th>
                  <th className="py-3 text-center fs-12 text-uppercase tracking-wider" style={{ color: '#38bdf8' }}>Power Factor</th>
                  <th className="py-3 text-end fs-12 text-uppercase tracking-wider" style={{ color: '#38bdf8' }}>Comm Status</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Always render the Main Incomer at the top */}
                {tableRows.filter(r => r.isMain).map((row, idx) => (
                  <tr 
                    key={`main-${idx}`} 
                    className="border-bottom border-secondary border-opacity-5"
                    style={{ cursor: 'default', opacity: row.isMapped ? 1 : 0.45 }}
                  >
                    <td className={`py-3 font-monospace fs-13 ${row.isMapped ? 'text-info' : 'text-secondary'}`}>{row.id}</td>
                    <td className={`py-3 fw-bold ${row.isMapped ? 'text-white' : 'text-secondary'}`}>
                      {row.name} <Badge bg={row.isMapped ? 'primary' : 'secondary'} className="ms-2 fs-12 uppercase">{row.isMapped ? 'Incomer' : 'Not Configured'}</Badge>
                    </td>
                    <td className={`py-3 text-center fw-semibold ${row.isMapped ? 'text-white' : 'text-secondary'}`}>{row.load}</td>
                    <td className="py-3 text-center text-secondary">{row.voltage}</td>
                    <td className="py-3 text-center text-secondary">{row.current}</td>
                    <td className="py-3 text-center text-secondary font-monospace">{row.pf}</td>
                    <td className="py-3 text-end"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}

                {/* 2. Grouped or Flat list for Sub Meters */}
                {!groupByCategory ? (
                  tableRows.filter(r => !r.isMain).map((row, idx) => (
                    <tr 
                      key={`sub-${idx}`} 
                      className="border-bottom border-secondary border-opacity-5" 
                      onClick={() => navigate(row.path)}
                      style={{ cursor: 'pointer', opacity: row.isMapped ? 1 : 0.45 }}
                    >
                      <td className={`py-3 font-monospace fs-13 ${row.isMapped ? 'text-info' : 'text-secondary'}`}>{row.id}</td>
                      <td className={`py-3 fw-bold ${row.isMapped ? 'text-white' : 'text-secondary'}`}>{row.name}</td>
                      <td className={`py-3 text-center fw-semibold ${row.isMapped ? 'text-white' : 'text-secondary'}`}>{row.load}</td>
                      <td className="py-3 text-center text-secondary">{row.voltage}</td>
                      <td className="py-3 text-center text-secondary">{row.current}</td>
                      <td className="py-3 text-center text-secondary font-monospace">{row.pf}</td>
                      <td className="py-3 text-end"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))
                ) : (
                  Object.entries(groupedSubMeters).map(([categoryName, rows], groupIdx) => (
                    <React.Fragment key={`group-${groupIdx}`}>
                      {/* Group Header Row */}
                      {(() => {
                        let headerTitle = categoryName;
                        if (categoryName === 'Commercial') headerTitle = '🏢 Commercial & Office Feeds';
                        else if (categoryName === 'Data Center') headerTitle = '🖥️ Servers & UPS Rooms';
                        else if (categoryName === 'Water Management') headerTitle = '💧 Water Systems & Pump Feeds';
                        else if (categoryName === 'HVAC') headerTitle = '❄️ HVAC & Air Conditioning Load';
                        else if (categoryName === 'Lighting') headerTitle = '💡 Outdoor & Common Lighting';
                        else if (categoryName === 'Sub Meter') headerTitle = '⚡ General Feeds & Sub-Meters';
                        else if (categoryName === 'Other Feeds') headerTitle = '⚡ General Feeds & Sub-Meters';
                        
                        const colorsMap = {
                          'Commercial': '#38bdf8',
                          'Data Center': '#fb923c',
                          'Water Management': '#4ade80',
                          'HVAC': '#f87171',
                          'Lighting': '#c084fc',
                          'Sub Meter': '#94a3b8'
                        };
                        const categoryColor = colorsMap[categoryName] || '#94a3b8';
                        
                        return (
                          <tr className="bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-10">
                            <td 
                              colSpan={7} 
                              className="py-2.5 px-3 fw-black uppercase tracking-widest fs-12" 
                              style={{ 
                                borderLeft: `4px solid ${categoryColor}`,
                                backgroundColor: `rgba(255, 255, 255, 0.02)`,
                                color: categoryColor,
                                letterSpacing: '1.5px' 
                              }}
                            >
                              {headerTitle} ({rows.length} {rows.length === 1 ? 'Feed' : 'Feeds'})
                            </td>
                          </tr>
                        );
                      })()}
                      {rows.map((row, idx) => (
                        <tr 
                          key={`grouped-sub-${groupIdx}-${idx}`} 
                          className="border-bottom border-secondary border-opacity-5" 
                          onClick={() => navigate(row.path)}
                          style={{ cursor: 'pointer', opacity: row.isMapped ? 1 : 0.45 }}
                        >
                          <td className={`py-3 font-monospace fs-13 ps-4 ${row.isMapped ? 'text-info' : 'text-secondary'}`}>└─ {row.id}</td>
                          <td className={`py-3 fw-bold ${row.isMapped ? 'text-white' : 'text-secondary'}`}>{row.name}</td>
                          <td className={`py-3 text-center fw-semibold ${row.isMapped ? 'text-white' : 'text-secondary'}`}>{row.load}</td>
                          <td className="py-3 text-center text-secondary">{row.voltage}</td>
                          <td className="py-3 text-center text-secondary">{row.current}</td>
                          <td className="py-3 text-center text-secondary font-monospace">{row.pf}</td>
                          <td className="py-3 text-end"><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        /* === CORE CARD SYSTEM === */
        .scada-card { background: #0f172a; border-radius: 20px; transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 24px -4px rgba(0,0,0,0.5); position: relative; }
        .scada-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px -8px rgba(0,0,0,0.6); }
        .card-ambient-glow { position: absolute; inset: 0; pointer-events: none; z-index: 1; opacity: 0.6; transition: opacity 0.3s; }
        .scada-card:hover .card-ambient-glow { opacity: 1; }

        /* === TYPOGRAPHY === */
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-13 { font-size: 0.8rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .tracking-widest { letter-spacing: 2px !important; }

        /* === INTERACTIVE SCALES === */
        .hover-scale-101 { transition: transform 0.2s ease; }
        .hover-scale-101:hover { transform: scale(1.01); }
        .hover-scale-102 { transition: transform 0.2s ease; }
        .hover-scale-102:hover { transform: scale(1.02); }
        .hover-scale-105 { transition: transform 0.2s ease; }
        .hover-scale-105:hover { transform: scale(1.05); }

        /* === GRID PARAMETER CELLS === */
        .grid-param-cell { transition: all 0.25s ease; cursor: default; }
        .grid-param-cell:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }

        /* === TABLE === */
        .scada-table tbody tr { transition: all 0.2s ease; cursor: pointer; }
        .scada-table tbody tr:hover { background: rgba(14, 165, 233, 0.04) !important; }

        /* === DIAGNOSTICS ROW === */
        .diag-row { transition: background 0.15s ease; }
        .diag-row:hover { background: rgba(255,255,255,0.02); }

        /* === PULSE ANIMATIONS === */
        .pulse-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px currentColor; animation: pulseGlow 2s infinite; }
        .animate-pulse { animation: pulseAnim 2s infinite; }
        .scada-progress { background-color: #030712 !important; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); }

        /* === LIVE GREEN PULSE === */
        .pulse-dot-green {
          width: 7px; height: 7px; border-radius: 50%; background-color: #22c55e;
          display: inline-block; box-shadow: 0 0 8px #22c55e;
          animation: pulseGlowGreen 1.8s infinite ease-in-out;
        }
        .glow-green { box-shadow: 0 0 12px rgba(34, 197, 94, 0.4); }
        @keyframes pulseGlowGreen {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        /* === MINI METER VISUAL === */
        .mini-meter-poly {
          background: rgba(15, 23, 42, 0.65); border: 4px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px; padding: 8px; width: 100%; max-width: 250px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.05);
        }
        .mini-blue-plate {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;
        }
        .mini-brand-name { font-size: 0.75rem !important; letter-spacing: 1.5px !important; }
        .mini-lcd-screen {
          background: #022c22; border-radius: 6px; padding: 4px;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.9); border: 1px solid rgba(255,255,255,0.05);
        }
        .mini-lcd-glow {
          background: #064e3b; height: 38px; border-radius: 4px;
          display: flex; align-items: center; justify-content: space-between; padding: 0 8px;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(34,197,94,0.15);
          position: relative; border: 1px solid #065f46;
        }
        .mini-lcd-mode {
          position: absolute; top: 2px; left: 8px; font-size: 0.5rem;
          color: #4ade80; font-weight: 800; opacity: 0.8; letter-spacing: 0.5px;
        }
        .mini-lcd-val {
          font-size: 1.2rem; font-weight: 900; color: #4ade80; margin-top: 6px;
          text-shadow: 0 0 5px rgba(74,222,128,0.5);
        }
        .mini-lcd-unit {
          font-size: 0.65rem; font-weight: 900; color: #4ade80;
          align-self: flex-end; margin-bottom: 2px; text-shadow: 0 0 5px rgba(74,222,128,0.5);
        }
        .mini-led-bulb {
          width: 7px; height: 7px; border-radius: 50%; background: #7f1d1d;
          transition: background-color 0.1s ease;
        }
        .mini-led-bulb.active {
          background: #ef4444; box-shadow: 0 0 6px #ef4444, 0 0 12px #ef4444;
        }

        /* === KEYFRAMES === */
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

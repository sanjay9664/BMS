import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Badge, Table, Tab, Tabs } from 'react-bootstrap';
import { Zap, Activity, Cpu, ShieldCheck, RefreshCcw } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';
import { io } from 'socket.io-client';

const SubMeters = () => {
  // Mock data for multiple sub-meters
  const [meters, setMeters] = useState([
    { id: 'SM-WING-A-01', label: 'Commercial Wing A Incomer', type: 'Commercial', load: 185.0, voltage: 231.8, current: 271.5, pf: 0.98, status: 'Running' },
    { id: 'SM-SERVER-02', label: 'Data Center Main UPS Input', type: 'Server Room', load: 142.0, voltage: 230.1, current: 215.1, pf: 0.99, status: 'Running' },
    { id: 'SM-UTILITY-03', label: 'Water Plant & Utility Motors Room', type: 'Utility', load: 95.0, voltage: 233.1, current: 142.3, pf: 0.91, status: 'Running' },
    { id: 'SM-HVAC-04', label: 'HVAC Chiller Main Feeder', type: 'HVAC', load: 63.4, voltage: 232.0, current: 94.2, pf: 0.94, status: 'Warning' },
    { id: 'SM-LIGHT-05', label: 'Outdoor Street & Parking Lights', type: 'Lighting', load: 0.0, voltage: 0.0, current: 0.0, pf: 1.00, status: 'Stopped' }
  ]);

  const [templates, setTemplates] = useState([]);

  // Load templates on mount & API fetch sync
  useEffect(() => {
    const saved = localStorage.getItem('scada_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse templates from local storage:', e);
      }
    }
    
    fetch('/api/templates')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const mapped = data.map(t => {
          const hasDef = t.defaultValues && typeof t.defaultValues === 'object' && Object.keys(t.defaultValues).length > 0;
          const defValues = hasDef ? t.defaultValues : null;
          const mappingSource = defValues || t.settings?.[0]?.meta || {};
          return {
            id: t.id,
            name: t.name,
            category: (defValues && defValues.category) || t.category || 'Water Management',
            module: (defValues && defValues.module) || t.settings?.[0]?.eventKey || 'AG Tank',
            mapping: mappingSource
          };
        });
        setTemplates(mapped);
        localStorage.setItem('scada_templates', JSON.stringify(mapped));
      })
      .catch(err => console.error('Error fetching templates in SubMeters:', err));
  }, []);

  // Helper to find template for a specific meter
  const getTemplateForMeter = (meterLabel) => {
    return templates.find(t => 
      t.module === 'Sub Meters' && 
      String(t.mapping?.energyMeteringTarget || '').trim().toUpperCase() === String(meterLabel || '').trim().toUpperCase()
    );
  };

  // Helper to check mapped fields for a meter
  const getMappedFieldsForMeter = (meterLabel) => {
    const template = getTemplateForMeter(meterLabel);
    if (!template || !template.mapping) return {};
    const mapping = template.mapping;
    const mapped = {};
    
    if (mapping.emPowerConfig?.enabled !== false && mapping.emPowerConfig?.module && mapping.emPowerConfig?.activePower) {
      mapped.load = true;
    }
    if (mapping.emVoltageConfig?.enabled !== false && mapping.emVoltageConfig?.module && mapping.emVoltageConfig?.vR) {
      mapped.voltage = true;
    }
    if (mapping.emCurrentConfig?.enabled !== false && mapping.emCurrentConfig?.module && mapping.emCurrentConfig?.iR) {
      mapped.current = true;
    }
    if (mapping.emSystemConfig?.enabled !== false && mapping.emSystemConfig?.module && mapping.emSystemConfig?.pf) {
      mapped.pf = true;
    }
    return mapped;
  };

  // Mock simulation for unmapped fields
  useEffect(() => {
    const interval = setInterval(() => {
      setMeters(prev =>
        prev.map(meter => {
          if (meter.status === 'Stopped') return meter;
          const mapped = getMappedFieldsForMeter(meter.label);

          const fluctuation = Math.random() * 4 - 2;
          const newLoad = mapped.load ? meter.load : +(Math.max(10, meter.load + fluctuation)).toFixed(1);
          const newVoltage = mapped.voltage ? meter.voltage : meter.voltage;
          const newCurrent = mapped.current ? meter.current : +((newLoad * 1000) / (newVoltage * 0.95)).toFixed(1);
          const newPf = mapped.pf ? meter.pf : +(Math.min(1.0, Math.max(0.85, meter.pf + (Math.random() * 0.02 - 0.01)))).toFixed(2);

          return {
            ...meter,
            load: newLoad,
            voltage: newVoltage,
            current: newCurrent,
            pf: newPf
          };
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [templates]);

  // Live Telemetry Sync using Websockets and Polling
  useEffect(() => {
    const socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      console.log('SubMeters WebSocket Connected - Listening for Telemetry');
    });

    const processTelemetry = (stats) => {
      if (!Array.isArray(stats)) return;
      
      setMeters(prev => {
        let updated = false;
        const nextMeters = prev.map(meter => {
          const template = getTemplateForMeter(meter.label);
          if (!template || !template.mapping) return meter;

          const mapping = template.mapping;
          const updatedMeter = { ...meter };
          let meterUpdated = false;

            const getValueForField = (config, fieldKey) => {
            if (config && config.enabled !== false && config[fieldKey]) {
              const fieldVal = config[fieldKey];
              let cleanKey = fieldVal;
              let targetModuleId = config.module;
              
              if (typeof fieldVal === 'string' && fieldVal.includes(':')) {
                const parts = fieldVal.split(':');
                targetModuleId = parts[0];
                cleanKey = parts.pop();
              }
              
              const stat = stats.find(s => String(s.moduleId) === String(targetModuleId) || String(s.meta?.module_id) === String(targetModuleId));
              if (stat && stat.meta) {
                if (stat.meta[cleanKey] !== undefined) {
                  return Number(stat.meta[cleanKey]);
                }
                if (stat.meta[fieldVal] !== undefined) {
                  return Number(stat.meta[fieldVal]);
                }
              }
            }
            return null;
          };

          const loadVal = getValueForField(mapping.emPowerConfig, 'activePower');
          const voltVal = getValueForField(mapping.emVoltageConfig, 'vR');
          const currVal = getValueForField(mapping.emCurrentConfig, 'iR');
          const pfVal = getValueForField(mapping.emSystemConfig, 'pf');

          if (loadVal !== null) { updatedMeter.load = loadVal; meterUpdated = true; }
          if (voltVal !== null) { updatedMeter.voltage = voltVal; meterUpdated = true; }
          if (currVal !== null) { updatedMeter.current = currVal; meterUpdated = true; }
          if (pfVal !== null) { updatedMeter.pf = pfVal; meterUpdated = true; }

          if (meterUpdated) {
            updatedMeter.status = updatedMeter.load > 1 ? 'Running' : 'Stopped';
            updated = true;
          }

          return updatedMeter;
        });

        return updated ? nextMeters : prev;
      });
    };

    socket.on('telemetry_update', processTelemetry);

    const fetchStats = async () => {
      try {
        const modulesToPoll = new Set();
        
        const extractModuleId = (config, keys) => {
          if (!config) return null;
          if (config.module && config.module !== 'ALL') return config.module;
          for (const k of keys) {
            if (config[k] && typeof config[k] === 'string' && config[k].includes(':')) {
              const parts = config[k].split(':');
              if (parts[0]) return parts[0];
            }
          }
          return config.module || null;
        };

        meters.forEach(meter => {
          const template = getTemplateForMeter(meter.label);
          if (template?.mapping) {
            const mapping = template.mapping;
            const configFieldsMap = [
              { config: mapping.emVoltageConfig, fields: ['vR', 'vY', 'vB'] },
              { config: mapping.emCurrentConfig, fields: ['iR', 'iY', 'iB'] },
              { config: mapping.emPowerConfig, fields: ['activePower', 'reactivePower', 'apparentPower'] },
              { config: mapping.emSystemConfig, fields: ['pf', 'freq'] },
              { config: mapping.emConsumptionConfig, fields: ['cumulativekWh'] }
            ];

            configFieldsMap.forEach(({ config, fields }) => {
              if (config && config.enabled !== false) {
                const modId = extractModuleId(config, fields);
                if (modId) {
                  modulesToPoll.add(String(modId));
                }
              }
            });
          }
        });

        const pollList = Array.from(modulesToPoll);
        if (pollList.length === 0) return;
        
        const url = `/api/templates/stats?modules=${pollList.join(',')}`;
        const res = await fetch(url);
        if (res.ok) {
          const stats = await res.json();
          processTelemetry(stats);
        }
      } catch (err) {
        console.error('Error fetching sub meters stats:', err);
      }
    };

    fetchStats();
    const pollingInterval = setInterval(fetchStats, 2000);

    return () => {
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, [templates, meters.length]);

  return (
    <div className="fade-in">
      {/* HEADER SECTION */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold d-flex align-items-center gap-2">
            <Cpu className="text-info" size={26} /> Facility Sub-Meters Dashboard
          </h2>
          <p className="text-secondary fs-7">Granular power metrics, current loading, and status indicators across individual feeds.</p>
        </div>
        <PdfButton />
      </div>

      {/* METERS CARD GRID */}
      <Row className="g-4 mb-4">
        {meters.map((meter, index) => (
          <Col lg={4} md={6} key={index}>
            <Card className="scada-card border-0 text-white h-100 position-relative overflow-hidden" style={{ background: '#0f172a' }}>
              {/* Dynamic light bar depending on status */}
              <div className={`status-top-bar status-bar-${meter.status.toLowerCase()}`}></div>
              
              <Card.Body className="p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="font-monospace text-info fs-13 fw-semibold">{meter.id}</span>
                    <StatusBadge status={meter.status} />
                  </div>
                  
                  <h5 className="fw-bold text-white mb-1">{meter.label}</h5>
                  <Badge bg="secondary" className="bg-opacity-10 border border-secondary border-opacity-10 px-2 py-1 fs-12 uppercase text-muted mb-4">{meter.type}</Badge>
                  
                  <div className="d-flex align-items-baseline mb-4">
                    <h2 className="display-6 fw-black text-white tracking-tighter mb-0">{meter.load}</h2>
                    <span className="ms-1 fs-6 text-info fw-bold">kW</span>
                  </div>
                </div>

                <div className="border-top border-secondary border-opacity-10 pt-3 mt-2">
                  <Row className="g-2 text-center" style={{ fontSize: '0.72rem' }}>
                    <Col xs={4}>
                      <span className="text-secondary d-block uppercase fw-bold mb-1">Voltage</span>
                      <span className="text-white fw-black">{meter.voltage} V</span>
                    </Col>
                    <Col xs={4} className="border-start border-end border-secondary border-opacity-10">
                      <span className="text-secondary d-block uppercase fw-bold mb-1">Current</span>
                      <span className="text-white fw-black">{meter.current} A</span>
                    </Col>
                    <Col xs={4}>
                      <span className="text-secondary d-block uppercase fw-bold mb-1">Power Factor</span>
                      <span className="text-white fw-black font-monospace">{meter.pf}</span>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* FILTER TABS & LOAD ANALYSIS */}
      <Card className="scada-card border-0 text-white mt-4" style={{ background: '#0f172a' }}>
        <Card.Body className="p-4">
          <h5 className="mb-4 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
            <Activity className="text-info" size={18} /> Sub-Meters Performance Diagnostics
          </h5>

          <Tabs defaultActiveKey="all" className="scada-tabs border-bottom border-secondary border-opacity-15 mb-4">
            <Tab eventKey="all" title="ALL FEEDS">
              <div className="table-responsive mt-3">
                <Table hover borderless className="align-middle scada-table text-white mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                      <th className="py-3">Meter ID</th>
                      <th className="py-3">Feed Description</th>
                      <th className="py-3 text-center">Operational Load</th>
                      <th className="py-3 text-center">Avg. Volts</th>
                      <th className="py-3 text-center">Phase Amps</th>
                      <th className="py-3 text-center">cos φ</th>
                      <th className="py-3 text-end">Health Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meters.map((meter, idx) => (
                      <tr key={idx} className="border-bottom border-secondary border-opacity-5">
                        <td className="py-3 font-monospace text-info fs-13">{meter.id}</td>
                        <td className="py-3 text-white fw-bold">{meter.label}</td>
                        <td className="py-3 text-center text-white fw-bold">{meter.load} kW</td>
                        <td className="py-3 text-center text-secondary">{meter.voltage} V</td>
                        <td className="py-3 text-center text-secondary">{meter.current} A</td>
                        <td className="py-3 text-center text-secondary font-monospace">{meter.pf}</td>
                        <td className="py-3 text-end"><StatusBadge status={meter.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>
            <Tab eventKey="critical" title="CRITICAL LOADS">
              <div className="table-responsive mt-3">
                <Table hover borderless className="align-middle scada-table text-white mb-0">
                  <thead>
                    <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                      <th className="py-3">Meter ID</th>
                      <th className="py-3">Feed Description</th>
                      <th className="py-3 text-center">Operational Load</th>
                      <th className="py-3 text-center">Avg. Volts</th>
                      <th className="py-3 text-center">cos φ</th>
                      <th className="py-3 text-end">Health Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meters.filter(m => m.type === 'Server Room' || m.type === 'Utility').map((meter, idx) => (
                      <tr key={idx} className="border-bottom border-secondary border-opacity-5">
                        <td className="py-3 font-monospace text-info fs-13">{meter.id}</td>
                        <td className="py-3 text-white fw-bold">{meter.label}</td>
                        <td className="py-3 text-center text-white fw-bold">{meter.load} kW</td>
                        <td className="py-3 text-center text-secondary">{meter.voltage} V</td>
                        <td className="py-3 text-center text-secondary font-monospace">{meter.pf}</td>
                        <td className="py-3 text-end"><StatusBadge status={meter.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        .scada-card { background: #0f172a; border-radius: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4); }
        .scada-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -4px rgba(0,0,0,0.5); }
        .status-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; }
        .status-bar-running { background: linear-gradient(90deg, #10b981, #059669); }
        .status-bar-warning { background: linear-gradient(90deg, #f59e0b, #d97706); }
        .status-bar-stopped { background: linear-gradient(90deg, #64748b, #475569); }
        .scada-tabs .nav-link { color: #64748b; font-weight: bold; border: 0; background: transparent; padding: 12px 24px; font-size: 0.72rem; letter-spacing: 1px; }
        .scada-tabs .nav-link.active { color: #0ea5e9 !important; background: transparent !important; border-bottom: 2px solid #0ea5e9; }
        .scada-table tbody tr { transition: all 0.2s; cursor: pointer; }
        .scada-table tbody tr:hover { background: rgba(255, 255, 255, 0.02); }
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-13 { font-size: 0.8rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .tracking-widest { letter-spacing: 2px !important; }
      `}} />
    </div>
  );
};

export default SubMeters;

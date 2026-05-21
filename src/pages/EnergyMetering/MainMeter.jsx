import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Badge, Table, Button, Form } from 'react-bootstrap';
import { Zap, Activity, ShieldCheck, HelpCircle, ChevronLeft, ChevronRight, Play, Pause, Settings, RefreshCw, Info, AlertTriangle, Cpu, Sliders, ShieldAlert, Coins, Clock, Gauge, Flame, Lock } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';
import { io } from 'socket.io-client';

const PARAMETER_SYNONYMS = {
  ebKwh: ['3,151', '3,152', '4,91F', 'EB KWH', 'EB_KWH', 'EB ACTIVE ENERGY', 'CONSUMPTION', 'ACTIVE ENERGY', 'CUMULATIVE KWH', 'CUMULATIVE_KWH'],
  ebKvah: ['3,152', '3,157', '4,93F', 'EB KVAH', 'EB_KVAH', 'APPARENT ENERGY'],
  balance: ['3,162', '3,168', 'BALANCE', 'PREPAID BALANCE', 'AMT', 'AMOUNT', 'CREDIT', 'PREPAID_BALANCE'],
  totalKw: ['3,190', '3,151', 'TOTAL KW', 'TOTAL_KW', 'ACTIVE POWER', 'DEMAND', 'LOAD KW', 'ACTIVE_POWER'],
  totalKva: ['3,191', 'TOTAL KVA', 'TOTAL_KVA', 'APPARENT POWER', 'LOAD KVA', 'APPARENT_POWER'],
  vR: ['3,168', '3,163', 'VOLTAGE R', 'VOLTAGE_R', 'VR', 'V_R', 'UA', 'U1', 'LINE VOLTS (R)', 'VOLTAGE R-PHASE'],
  vY: ['3,169', '3,164', 'VOLTAGE Y', 'VOLTAGE_Y', 'VY', 'V_Y', 'UB', 'U2', 'LINE VOLTS (Y)', 'VOLTAGE Y-PHASE'],
  vB: ['3,170', '3,165', 'VOLTAGE B', 'VOLTAGE_B', 'VB', 'V_B', 'UC', 'U3', 'LINE VOLTS (B)', 'VOLTAGE B-PHASE'],
  iR: ['3,171', '3,166', 'CURRENT R', 'CURRENT_R', 'IR', 'I_R', 'IA', 'A1', 'LINE AMPS (R)', 'R-CURRENT'],
  iY: ['3,172', '3,167', 'CURRENT Y', 'CURRENT_Y', 'IY', 'I_Y', 'IB', 'A2', 'LINE AMPS (Y)', 'Y-CURRENT'],
  iB: ['3,173', '3,168', 'CURRENT B', 'CURRENT_B', 'IB', 'I_B', 'IC', 'A3', 'LINE AMPS (B)', 'B-CURRENT'],
  pf: ['3,174', 'POWER FACTOR', 'PF', 'SYSTEM PF', 'POWER_FACTOR'],
  dgKwh: ['3,180', '3,181', 'DG KWH', 'DG_KWH', 'DG ACTIVE', 'DG ENERGY', 'GENERATOR ENERGY'],
  fixedCharge: ['3,163', 'FIXED CHARGE', 'FIXED_CHARGE', 'CHARGES'],
  lowBalanceCut: ['3,164', 'LOW BALANCE', 'BALANCE CUT', 'LOW_BAL', 'LOW_BALANCE_CUT'],
  overloadTrip: ['3,165', 'OVERLOAD TRIP', 'OL TRIP', 'OVERLOAD_TRIP', 'OVERLOAD TRIP STATUS'],
  overloadLimitReached: ['3,166', 'OVERLOAD LIMIT', 'OL LIMIT', 'OVERLOAD_WARN', 'OVERLOAD LIMIT REACHED'],
  connectedStatus: ['3,167', 'CONNECTED STATUS', 'RELAY STATUS', 'BREAKER STATUS', 'CONNECTED', 'CONNECTED_STATUS'],
  forceOff: ['3,168', 'FORCE OFF', 'REMOTE TRIP', 'FORCE_OFF', 'FORCE_OFF_STATUS'],
  meterSrno: ['3,150', 'METER SERIAL', 'SERIAL NUMBER', 'SR NO', 'METER SR', 'METER_NO', 'METERSRNO'],
  noOfOverloadCheck: ['3,169', 'OVERLOAD CHECK', 'OL CHECK', 'OVERLOAD_COUNT', 'NOOFOVERLOADCHECK'],
  ebDgStatus: ['3,170', 'EB DG STATUS', 'EB/DG STATUS', 'SOURCE STATUS', 'EB_DG', 'EBDGSTATUS'],
  ebTariff: ['3,171', 'EB TARIFF', 'GRID TARIFF', 'EB_RATE', 'EBTARIFF'],
  dgTariff: ['3,172', 'DG TARIFF', 'GEN RATE', 'DG_RATE', 'DGTARIFF'],
  ebRLoadSet: ['3,173', 'EB R LOAD', 'EB_R_LOAD', 'EB_R_LIMIT', 'EBRLOADSET'],
  ebYLoadSet: ['3,174', 'EB Y LOAD', 'EB_Y_LOAD', 'EB_Y_LIMIT', 'EBYLOADSET'],
  ebBLoadSet: ['3,175', 'EB B LOAD', 'EB_B_LOAD', 'EB_B_LIMIT', 'EBBLOADSET'],
  dgRLoadSet: ['3,176', 'DG R LOAD', 'DG_R_LOAD', 'DG_R_LIMIT', 'DGRLOADSET'],
  dgYLoadSet: ['3,177', 'DG Y LOAD', 'DG_Y_LOAD', 'DG_Y_LIMIT', 'DGYLOADSET'],
  dgBLoadSet: ['3,178', 'DG B LOAD', 'DG_B_LOAD', 'DG_B_LIMIT', 'DGBLOADSET'],
  activePower: ['3,190', '3,151', 'TOTAL KW', 'TOTAL_KW', 'ACTIVE POWER', 'DEMAND', 'LOAD KW', 'ACTIVE_POWER'],
  reactivePower: ['3,192', 'REACTIVE POWER', 'REACTIVE_POWER'],
  apparentPower: ['3,191', 'TOTAL KVA', 'TOTAL_KVA', 'APPARENT POWER', 'LOAD KVA', 'APPARENT_POWER'],
  cumulativekWh: ['3,151', '3,152', '4,91F', 'EB KWH', 'EB_KWH', 'EB ACTIVE ENERGY', 'CONSUMPTION', 'ACTIVE ENERGY', 'CUMULATIVE KWH', 'CUMULATIVE_KWH'],
  freq: ['3,153', 'FREQUENCY', 'FREQ', '50HZ', 'F', 'HZ']
};

const MainMeter = () => {
  // 1. Live Telemetry Data States
  const [data, setData] = useState({
    // CHANGE
    ebKvah: 0, ebKwh: 0, balance: 0, totalKw: 0,
    vR: 0, vY: 0, vB: 0,
    iR: 0, iY: 0, iB: 0,
    pf: 0, totalKva: 0, dgKwh: 0, fixedCharge: 0,
    // WARNING
    lowBalanceCut: 0, overloadTrip: 0, overloadLimitReached: 0, connectedStatus: 0, forceOff: 0,
    // READ
    meterSrno: 0, noOfOverloadCheck: 0, ebDgStatus: 0, ebTariff: 0, dgTariff: 0,
    ebRLoadSet: 0, ebYLoadSet: 0, ebBLoadSet: 0,
    dgRLoadSet: 0, dgYLoadSet: 0, dgBLoadSet: 0,

    // Legacy metrics
    activePower: 0, reactivePower: 0, apparentPower: 0, freq: 0, cumulativekWh: 0
  });

  const [templates, setTemplates] = useState([]);
  const [activeRightTab, setActiveRightTab] = useState('telemetry');
  const [selectedMeterId, setSelectedMeterId] = useState(() => {
    return localStorage.getItem('selected_main_meter_id') || '';
  });
  // Live history ring buffer — stores last 10 real readings
  const [historyLog, setHistoryLog] = useState([]);

  // 2. MFM Custom Display Page States
  const [mfmPageIndex, setMfmPageIndex] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const [calBlink, setCalBlink] = useState(false);
  const autoCycleTimer = useRef(null);
  const userInteractionTimeout = useRef(null);

  // Ref so processTelemetry always reads latest template without stale closure
  const mainMeterTemplateRef = useRef(null);
  // Ref to the latest fetchStats function so we can call it immediately on template change
  const fetchStatsRef = useRef(null);

  // Load templates on mount & API fetch sync
  useEffect(() => {
    const saved = localStorage.getItem('scada_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTemplates(parsed);
        const meters = parsed.filter(t => t.module === 'Main Meter' || t.category === 'Energy Metering');
        if (meters.length > 0) {
          const stored = localStorage.getItem('selected_main_meter_id');
          if (stored && meters.some(m => String(m.id) === String(stored))) {
            setSelectedMeterId(stored);
          } else {
            setSelectedMeterId(meters[0].id);
          }
        }
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

        const meters = mapped.filter(t => t.module === 'Main Meter' || t.category === 'Energy Metering');
        if (meters.length > 0) {
          const stored = localStorage.getItem('selected_main_meter_id');
          if (stored && meters.some(m => String(m.id) === String(stored))) {
            setSelectedMeterId(stored);
          } else if (!selectedMeterId) {
            setSelectedMeterId(meters[0].id);
          }
        }
      })
      .catch(err => console.error('Error fetching templates in MainMeter:', err));
  }, []);

  // Save selected meter ID to localStorage when changed
  useEffect(() => {
    if (selectedMeterId) {
      localStorage.setItem('selected_main_meter_id', String(selectedMeterId));
    }
  }, [selectedMeterId]);

  const energyMeters = useMemo(() => {
    return templates.filter(t => t.module === 'Main Meter' || t.category === 'Energy Metering');
  }, [templates]);

  const mainMeterTemplate = useMemo(() => {
    const tpl = selectedMeterId
      ? templates.find(t => String(t.id) === String(selectedMeterId))
      : (energyMeters[0] || null);
    // Keep ref in sync for use inside socket/poll closures
    mainMeterTemplateRef.current = tpl;
    return tpl;
  }, [templates, selectedMeterId, energyMeters]);

  // --- Reset live data, history & page index when the selected meter changes ---
  useEffect(() => {
    setData({
      ebKvah: 0, ebKwh: 0, balance: 0, totalKw: 0,
      vR: 0, vY: 0, vB: 0,
      iR: 0, iY: 0, iB: 0,
      pf: 0, totalKva: 0, dgKwh: 0, fixedCharge: 0,
      lowBalanceCut: 0, overloadTrip: 0, overloadLimitReached: 0, connectedStatus: 0, forceOff: 0,
      meterSrno: 0, noOfOverloadCheck: 0, ebDgStatus: 0, ebTariff: 0, dgTariff: 0,
      ebRLoadSet: 0, ebYLoadSet: 0, ebBLoadSet: 0,
      dgRLoadSet: 0, dgYLoadSet: 0, dgBLoadSet: 0,
      activePower: 0, reactivePower: 0, apparentPower: 0, freq: 0, cumulativekWh: 0
    });
    setHistoryLog([]);
    setMfmPageIndex(0);
    // Immediately poll the new template's modules after a tick (so the ref updates first)
    const t = setTimeout(() => {
      if (fetchStatsRef.current) fetchStatsRef.current();
    }, 50);
    return () => clearTimeout(t);
  }, [selectedMeterId]);



  const mappedFields = useMemo(() => {
    if (!mainMeterTemplate || !mainMeterTemplate.mapping) return {};
    const mapping = mainMeterTemplate.mapping;
    const mapped = {};

    const checkField = (config, key) => {
      if (config && config.enabled !== false && config[key]) {
        mapped[key] = true;
      }
    };

    // Legacy support
    checkField(mapping.emVoltageConfig, 'vR');
    checkField(mapping.emVoltageConfig, 'vY');
    checkField(mapping.emVoltageConfig, 'vB');
    checkField(mapping.emCurrentConfig, 'iR');
    checkField(mapping.emCurrentConfig, 'iY');
    checkField(mapping.emCurrentConfig, 'iB');
    checkField(mapping.emPowerConfig, 'activePower');
    checkField(mapping.emPowerConfig, 'reactivePower');
    checkField(mapping.emPowerConfig, 'apparentPower');
    checkField(mapping.emSystemConfig, 'pf');
    checkField(mapping.emSystemConfig, 'freq');
    checkField(mapping.emConsumptionConfig, 'cumulativekWh');

    // New parameters mapping
    const changeFields = ['ebKvah', 'ebKwh', 'balance', 'totalKw', 'vR', 'vY', 'vB', 'iR', 'iY', 'iB', 'pf', 'totalKva', 'dgKwh', 'fixedCharge'];
    const warningFields = ['lowBalanceCut', 'overloadTrip', 'overloadLimitReached', 'connectedStatus', 'forceOff'];
    const readFields = ['meterSrno', 'noOfOverloadCheck', 'ebDgStatus', 'ebTariff', 'dgTariff', 'ebRLoadSet', 'ebYLoadSet', 'ebBLoadSet', 'dgRLoadSet', 'dgYLoadSet', 'dgBLoadSet'];

    changeFields.forEach(k => checkField(mapping.emChangeConfig, k));
    warningFields.forEach(k => checkField(mapping.emWarningConfig, k));
    readFields.forEach(k => checkField(mapping.emReadConfig, k));

    return mapped;
  }, [mainMeterTemplate]);

  const isTemplateMapped = useMemo(() => {
    return Object.keys(mappedFields).length > 0;
  }, [mappedFields]);

  // Live Telemetry Sync using Websockets and Polling
  useEffect(() => {
    const socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      console.log('MainMeter WebSocket Connected - Listening for Telemetry');
    });

    const processTelemetry = (stats) => {
      if (!Array.isArray(stats)) return;
      // Use ref so we always read the latest template even if the closure is stale
      const currentTemplate = mainMeterTemplateRef.current;
      if (!currentTemplate || !currentTemplate.mapping) return;

      const mapping = currentTemplate.mapping;

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
            // 1. Try matching cleanKey exactly
            if (stat.meta[cleanKey] !== undefined) {
              return Number(stat.meta[cleanKey]);
            }
            // 2. Try matching fieldVal exactly
            if (stat.meta[fieldVal] !== undefined) {
              return Number(stat.meta[fieldVal]);
            }
            // 3. Fallback: Search using the robust PARAMETER_SYNONYMS map
            const synonyms = PARAMETER_SYNONYMS[fieldKey] || [];
            for (const sym of synonyms) {
              if (stat.meta[sym] !== undefined) {
                return Number(stat.meta[sym]);
              }
              // Try normalized matching within stat.meta keys
              const matchedKey = Object.keys(stat.meta).find(k =>
                k.toUpperCase() === sym.toUpperCase() ||
                k.toUpperCase().replace(/[^A-Z0-9]/g, '') === sym.toUpperCase().replace(/[^A-Z0-9]/g, '')
              );
              if (matchedKey && stat.meta[matchedKey] !== undefined) {
                return Number(stat.meta[matchedKey]);
              }
            }
          }
        }
        return null;
      };

      setData(prev => {
        const newData = { ...prev };
        let updated = false;

        // Helper to update field
        const updateField = (config, key) => {
          const val = getValueForField(config, key);
          if (val !== null) {
            newData[key] = val;
            updated = true;
          }
        };

        // Legacy configs
        updateField(mapping.emVoltageConfig, 'vR');
        updateField(mapping.emVoltageConfig, 'vY');
        updateField(mapping.emVoltageConfig, 'vB');
        updateField(mapping.emCurrentConfig, 'iR');
        updateField(mapping.emCurrentConfig, 'iY');
        updateField(mapping.emCurrentConfig, 'iB');
        updateField(mapping.emPowerConfig, 'activePower');
        updateField(mapping.emPowerConfig, 'reactivePower');
        updateField(mapping.emPowerConfig, 'apparentPower');
        updateField(mapping.emSystemConfig, 'pf');
        updateField(mapping.emSystemConfig, 'freq');
        updateField(mapping.emConsumptionConfig, 'cumulativekWh');

        // New emChangeConfig keys
        const changeFields = ['ebKvah', 'ebKwh', 'balance', 'totalKw', 'vR', 'vY', 'vB', 'iR', 'iY', 'iB', 'pf', 'totalKva', 'dgKwh', 'fixedCharge'];
        changeFields.forEach(k => updateField(mapping.emChangeConfig, k));

        // New emWarningConfig keys
        const warningFields = ['lowBalanceCut', 'overloadTrip', 'overloadLimitReached', 'connectedStatus', 'forceOff'];
        warningFields.forEach(k => updateField(mapping.emWarningConfig, k));

        // New emReadConfig keys
        const readFields = ['meterSrno', 'noOfOverloadCheck', 'ebDgStatus', 'ebTariff', 'dgTariff', 'ebRLoadSet', 'ebYLoadSet', 'ebBLoadSet', 'dgRLoadSet', 'dgYLoadSet', 'dgBLoadSet'];
        readFields.forEach(k => updateField(mapping.emReadConfig, k));

        return updated ? newData : prev;
      });

      // Append real snapshot to live history ring buffer (cap at 10 entries)
      setHistoryLog(prev => {
        const snap = {
          time: new Date().toLocaleTimeString(),
          // Extract values directly from the already-resolved stats array
          vR: (() => { const val = getValueForField(mapping.emChangeConfig || mapping.emVoltageConfig, 'vR'); return val; })(),
          vY: (() => { const val = getValueForField(mapping.emChangeConfig || mapping.emVoltageConfig, 'vY'); return val; })(),
          vB: (() => { const val = getValueForField(mapping.emChangeConfig || mapping.emVoltageConfig, 'vB'); return val; })(),
          iR: (() => { const val = getValueForField(mapping.emChangeConfig || mapping.emCurrentConfig, 'iR'); return val; })(),
          iY: (() => { const val = getValueForField(mapping.emChangeConfig || mapping.emCurrentConfig, 'iY'); return val; })(),
          iB: (() => { const val = getValueForField(mapping.emChangeConfig || mapping.emCurrentConfig, 'iB'); return val; })(),
          totalKw: (() => { const val = getValueForField(mapping.emChangeConfig, 'totalKw'); return val; })(),
          freq: (() => { const val = getValueForField(mapping.emSystemConfig, 'freq'); return val; })(),
          pf: (() => { const val = getValueForField(mapping.emChangeConfig || mapping.emSystemConfig, 'pf'); return val; })(),
          connectedStatus: (() => { const val = getValueForField(mapping.emWarningConfig, 'connectedStatus'); return val; })(),
        };
        // Only record if at least one field has live data
        const hasData = snap.vR !== null || snap.iR !== null || snap.totalKw !== null;
        if (!hasData) return prev;
        const next = [snap, ...prev];
        return next.length > 10 ? next.slice(0, 10) : next;
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

        if (mainMeterTemplateRef.current?.mapping) {
          const mapping = mainMeterTemplateRef.current.mapping;
          const configFieldsMap = [
            { config: mapping.emVoltageConfig, fields: ['vR', 'vY', 'vB'] },
            { config: mapping.emCurrentConfig, fields: ['iR', 'iY', 'iB'] },
            { config: mapping.emPowerConfig, fields: ['activePower', 'reactivePower', 'apparentPower'] },
            { config: mapping.emSystemConfig, fields: ['pf', 'freq'] },
            { config: mapping.emConsumptionConfig, fields: ['cumulativekWh'] },
            {
              config: mapping.emChangeConfig,
              fields: ['ebKvah', 'ebKwh', 'balance', 'totalKw', 'vR', 'vY', 'vB', 'iR', 'iY', 'iB', 'pf', 'totalKva', 'dgKwh', 'fixedCharge']
            },
            {
              config: mapping.emWarningConfig,
              fields: ['lowBalanceCut', 'overloadTrip', 'overloadLimitReached', 'connectedStatus', 'forceOff']
            },
            {
              config: mapping.emReadConfig,
              fields: ['meterSrno', 'noOfOverloadCheck', 'ebDgStatus', 'ebTariff', 'dgTariff', 'ebRLoadSet', 'ebYLoadSet', 'ebBLoadSet', 'dgRLoadSet', 'dgYLoadSet', 'dgBLoadSet']
            }
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

        const pollList = Array.from(modulesToPoll);
        if (pollList.length === 0) return;

        const url = `/api/templates/stats?modules=${pollList.join(',')}`;
        const res = await fetch(url);
        if (res.ok) {
          const stats = await res.json();
          processTelemetry(stats);
        }
      } catch (err) {
        console.error('Error fetching main meter stats:', err);
      }
    };

    // Store in ref so the selectedMeterId reset effect can trigger an immediate poll
    fetchStatsRef.current = fetchStats;
    fetchStats();
    const pollingInterval = setInterval(fetchStats, 2000);

    return () => {
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, [mainMeterTemplate]);


  // Cal LED Blinking frequency based on active power load
  useEffect(() => {
    // 1600 imp/kWh. If load is higher, Cal LED flashes faster.
    const blinkRate = Math.max(120, Math.min(2500, 120000 / Math.max(1, data.activePower || data.totalKw)));
    const blinkTimer = setInterval(() => {
      setCalBlink(prev => !prev);
    }, blinkRate);

    return () => clearInterval(blinkTimer);
  }, [data.activePower, data.totalKw]);

  // MFM Pages Definition
  const mfmPages = useMemo(() => {
    const formatNum = (val, dec = 1) => {
      return typeof val === 'number' && !isNaN(val) ? val.toFixed(dec) : '0.0';
    };

    return [
      {
        title: "PHASE-NEUTRAL VOLTAGE",
        lines: [
          { label: "Ua", value: formatNum(data.vR, 1), unit: "V" },
          { label: "Ub", value: formatNum(data.vY, 1), unit: "V" },
          { label: "Uc", value: formatNum(data.vB, 1), unit: "V" },
          { label: "F", value: formatNum(data.freq || 50.00, 3), unit: "Hz" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      },
      {
        title: "PHASE CURRENTS & LOAD",
        lines: [
          { label: "Ia", value: formatNum(data.iR, 2), unit: "A" },
          { label: "Ib", value: formatNum(data.iY, 2), unit: "A" },
          { label: "Ic", value: formatNum(data.iB, 2), unit: "A" },
          { label: "kW", value: formatNum(data.totalKw || data.activePower, 2), unit: "kW" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      },
      {
        title: "POWER & ENERGY",
        lines: [
          { label: "EP", value: formatNum(data.ebKwh || data.cumulativekWh, 1), unit: "kWh" },
          { label: "Eq", value: formatNum(data.ebKvah, 1), unit: "kVAh" },
          { label: "PF", value: formatNum(data.pf, 2), unit: "" },
          { label: "S", value: formatNum(data.totalKva || data.apparentPower, 2), unit: "kVA" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      },
      {
        title: "PREPAID DIAGNOSTICS",
        lines: [
          { label: "Bal", value: `₹${formatNum(data.balance, 2)}`, unit: "" },
          { label: "DG", value: formatNum(data.dgKwh, 1), unit: "kWh" },
          { label: "Src", value: data.ebDgStatus === 0 ? "EB GRID" : "DG SET", unit: "" },
          { label: "Ry", value: data.connectedStatus > 0 ? "ON" : "OFF", unit: "" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      }
    ];
  }, [data]);

  // Auto cycling logic for MFM pages
  useEffect(() => {
    if (autoCycle) {
      autoCycleTimer.current = setInterval(() => {
        setMfmPageIndex(prev => (prev + 1) % mfmPages.length);
      }, 4000);
    }
    return () => {
      if (autoCycleTimer.current) clearInterval(autoCycleTimer.current);
    };
  }, [autoCycle, mfmPages.length]);

  // Handle user manual button presses
  const pauseAutoCycleAndResetTimeout = () => {
    setAutoCycle(false);
    if (autoCycleTimer.current) clearInterval(autoCycleTimer.current);
    if (userInteractionTimeout.current) clearTimeout(userInteractionTimeout.current);

    // Auto-resume cycling after 15 seconds of no button presses
    userInteractionTimeout.current = setTimeout(() => {
      setAutoCycle(true);
    }, 15000);
  };

  const handleSW1 = () => {
    pauseAutoCycleAndResetTimeout();
    setMfmPageIndex(prev => (prev + 1) % mfmPages.length);
  };

  const handleSW2 = () => {
    pauseAutoCycleAndResetTimeout();
    setMfmPageIndex(prev => (prev - 1 + mfmPages.length) % mfmPages.length);
  };

  const activeMode = mfmPages[mfmPageIndex];

  return (
    <div className="fade-in">
      {/* HEADER SECTION */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold d-flex align-items-center gap-2 flex-wrap">
            <Zap className="text-warning text-shrink-0" size={26} /> {mainMeterTemplate ? mainMeterTemplate.name : 'Main Grid Incomer Meter'}
          </h2>
          <p className="text-secondary fs-7 mb-0">High-fidelity smart grid visualizer, phase parameters, and historical grid diagnostics.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3">
          {energyMeters.length > 0 && (
            <Form.Select
              size="sm"
              className="bg-dark text-info border-info border-opacity-25 shadow-none"
              value={selectedMeterId}
              onChange={(e) => setSelectedMeterId(e.target.value)}
              style={{ width: 'auto', minWidth: '220px' }}
            >
              {energyMeters.map(meter => (
                <option key={meter.id} value={meter.id} className="bg-dark text-white">
                  {meter.name || meter.mapping?.energyMeteringTarget || 'Unnamed Meter'}
                </option>
              ))}
            </Form.Select>
          )}
          <Badge bg="success" className="px-3 py-2 bg-opacity-10 text-success border border-success border-opacity-20 d-flex align-items-center gap-2">
            <span className="pulse-dot-green"></span> GRID STABLE - ON
          </Badge>
          <PdfButton />
        </div>
      </div>

      <Row className="g-4 mb-4">
        {/* LEFT COLUMN: INTERACTIVE DIGITAL TWIN OF THE SUN STAR METER */}
        {/* LEFT COLUMN: INTERACTIVE DIGITAL TWIN OF THE SUN STAR METER */}
        <Col lg={5} xl={5}>
          <Card className="scada-glass-card position-relative border-0 text-white h-100 p-3 overflow-hidden d-flex flex-column align-items-center justify-content-center">
            {/* Holographic grid and wave animation backdrops */}
            <div className="telemetry-wave-visualizer">
              <svg viewBox="0 0 400 100" className="hud-wave-svg" preserveAspectRatio="none">
                <path d="M 0,50 Q 50,20 100,50 T 200,50 T 300,50 T 400,50" fill="none" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1.5" className="wave-line-1" />
                <path d="M 0,50 Q 50,80 100,50 T 200,50 T 300,50 T 400,50" fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1.5" className="wave-line-2" />
                <path d="M 0,50 Q 50,50 100,50 T 200,50 T 300,50 T 400,50" fill="none" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1" className="wave-line-3" />
              </svg>
              <div className="grid-overlay"></div>
            </div>

            <div className="w-100 d-flex justify-content-between align-items-center px-2 mb-3" style={{ zIndex: 10 }}>
              <span className="fs-12 text-secondary uppercase tracking-widest fw-black d-flex align-items-center gap-2">
                <Cpu size={12} className="text-info animate-pulse" /> Smart Meter Digital Twin
              </span>
              <div className="d-flex align-items-center gap-2">
                <Button
                  size="sm"
                  variant={autoCycle ? "outline-info" : "info"}
                  className="rounded-pill fs-12 px-2 py-0.5"
                  onClick={() => setAutoCycle(prev => !prev)}
                >
                  {autoCycle ? <Pause size={10} className="me-1" /> : <Play size={10} className="me-1" />}
                  {autoCycle ? "Auto Cycle" : "Paused"}
                </Button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-center w-100 position-relative gap-3 flex-wrap flex-md-nowrap" style={{ zIndex: 5 }}>
              {/* HUD Panel Left — dynamic from template */}
              <div className="hud-panel hud-left d-none d-md-flex flex-column gap-3">
                <div className="hud-metric">
                  <span className="hud-label">METER TARGET</span>
                  <span className="hud-value text-info font-monospace" style={{fontSize:'0.6rem', wordBreak:'break-word'}}>
                    {mainMeterTemplate?.mapping?.energyMeteringTarget || mainMeterTemplate?.name || '—'}
                  </span>
                </div>
                <div className="hud-metric">
                  <span className="hud-label">EB TARIFF</span>
                  <span className="hud-value text-success font-monospace">
                    {data.ebTariff > 0 ? `₹${data.ebTariff}/Unit` : '—'}
                  </span>
                </div>
                <div className="hud-metric">
                  <span className="hud-label">DG TARIFF</span>
                  <span className="hud-value text-warning font-monospace">
                    {data.dgTariff > 0 ? `₹${data.dgTariff}/Unit` : '—'}
                  </span>
                </div>
              </div>

              {/* THE MULTI-FUNCTION METER (MFM) HOUSING */}
              <div className="mfm-polycarbonate-case shadow-2xl">
                {/* Bezel Screws */}
                <div className="screw top-left"></div>
                <div className="screw top-right"></div>
                <div className="screw bottom-left"></div>
                <div className="screw bottom-right"></div>

                <div className="mfm-metallic-bezel">
                  {/* Brand Header */}
                  <div className="mfm-brand-header d-flex justify-content-between align-items-center mb-2 px-2">
                    <span className="mfm-brand-logo">SOCHIOT</span>
                    <span className="mfm-model-no">APM Series</span>
                  </div>

                  {/* Grid LCD Screen Window */}
                  <div className="mfm-lcd-window mb-3">
                    <div className="mfm-lcd-glass">
                      <div className="mfm-lcd-screen">
                        {/* Top status bar */}
                        <div className="mfm-lcd-top-bar d-flex justify-content-between px-1">
                          <span className="mfm-lcd-title font-monospace">{activeMode.title}</span>
                          <span className="mfm-lcd-page-num font-monospace">P0{mfmPageIndex + 1}</span>
                        </div>

                        {/* LCD Screen Grid Rows */}
                        <div className="mfm-lcd-grid d-flex flex-column gap-1">
                          {activeMode.lines.map((line, lIdx) => (
                            <div key={lIdx} className="mfm-lcd-row d-flex align-items-center justify-content-between px-2 font-monospace">
                              <div className="mfm-lcd-row-left d-flex align-items-center">
                                <span className="mfm-lcd-label text-start me-1">{line.label}</span>
                              </div>
                              <div className="mfm-lcd-row-right d-flex align-items-baseline justify-content-end">
                                <span className="mfm-lcd-value text-end fw-black">{line.value}</span>
                                {line.unit && <span className="mfm-lcd-unit text-start ms-1">{line.unit}</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Bottom menu bar */}
                        <div className="mfm-lcd-bottom-bar d-flex justify-content-between px-2 font-monospace mt-1">
                          {activeMode.footerLabels.map((lbl, idx) => (
                            <span key={idx} className="mfm-lcd-btn-label">{lbl}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic lights and push buttons row */}
                  <div className="mfm-bezel-bottom px-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      {/* LED Indicators */}
                      <div className="mfm-leds-rack d-flex gap-3 align-items-center">
                        <div className="mfm-led-group">
                          <div className={`mfm-led-bulb bulb-red ${calBlink ? 'glow-active' : ''}`}></div>
                          <span className="mfm-led-label font-monospace">CAL</span>
                        </div>
                        <div className="mfm-led-group">
                          <div className="mfm-led-bulb bulb-green glow-active"></div>
                          <span className="mfm-led-label font-monospace">COM</span>
                        </div>
                        <div className="mfm-led-group">
                          <div className={`mfm-led-bulb bulb-orange ${data.overloadTrip > 0 || data.overloadLimitReached > 0 ? 'glow-active' : ''}`}></div>
                          <span className="mfm-led-label font-monospace">ALM</span>
                        </div>
                      </div>

                      {/* Standards markings — dynamic */}
                      <div className="mfm-spec-labels font-monospace text-secondary text-end">
                        <div>Sr No: {data.meterSrno > 0 ? data.meterSrno : '—'}</div>
                        <div>{data.freq > 0 ? `${data.freq.toFixed(1)}Hz` : '—'} · SOCHIOT</div>
                      </div>
                    </div>

                    {/* Glossy tact plastic buttons */}
                    <div className="mfm-button-deck d-flex justify-content-between gap-2 px-1 mt-3">
                      <button className="mfm-tactile-btn prev-btn" onClick={handleSW2} title="Page UP (<)">
                        <span className="btn-glyph">&lt;</span>
                      </button>
                      <button className="mfm-tactile-btn next-btn" onClick={handleSW1} title="Page DOWN (>)">
                        <span className="btn-glyph">&gt;</span>
                      </button>
                      <button className="mfm-tactile-btn menu-btn" disabled title="System Mapping Information">
                        <span className="btn-glyph">⚙</span>
                      </button>
                      <button className="mfm-tactile-btn enter-btn" onClick={() => { pauseAutoCycleAndResetTimeout(); setAutoCycle(prev => !prev); }} title="Toggle Page Auto-Cycle">
                        <span className="btn-glyph">↵</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* HUD Panel Right */}
              <div className="hud-panel hud-right d-none d-md-flex flex-column gap-3">
                <div className="hud-metric">
                  <span className="hud-label">R-PHASE LOAD</span>
                  <span className="hud-value text-danger font-monospace">{data.vR}V / {data.iR}A</span>
                </div>
                <div className="hud-metric">
                  <span className="hud-label">Y-PHASE LOAD</span>
                  <span className="hud-value text-warning font-monospace">{data.vY}V / {data.iY}A</span>
                </div>
                <div className="hud-metric">
                  <span className="hud-label">B-PHASE LOAD</span>
                  <span className="hud-value text-primary font-monospace">{data.vB}V / {data.iB}A</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* RIGHT COLUMN: TECHNICAL METRICS, WAVE DIAGRAMS, DIALS */}
        <Col lg={7} xl={7}>
          <Card className="scada-glass-card border-0 text-white h-100 p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3" style={{ zIndex: 5 }}>
              <h5 className="mb-0 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
                <Activity className="text-info animate-pulse" size={18} /> SCADA Control Panel
              </h5>
              <div className="d-flex align-items-center gap-1 scada-tabs-container p-1 rounded-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Button
                  size="sm"
                  variant="link"
                  className={`scada-tab-btn px-3 py-1.5 fs-11 uppercase fw-bold rounded-2 text-decoration-none border-0 transition-all ${activeRightTab === 'telemetry' ? 'text-info active-tab' : 'text-secondary'}`}
                  onClick={() => setActiveRightTab('telemetry')}
                >
                  Live Telemetry
                </Button>
                <Button
                  size="sm"
                  variant="link"
                  className={`scada-tab-btn px-3 py-1.5 fs-11 uppercase fw-bold rounded-2 text-decoration-none border-0 transition-all ${activeRightTab === 'config' ? 'text-info active-tab' : 'text-secondary'}`}
                  onClick={() => setActiveRightTab('config')}
                >
                  Config & Limits
                </Button>
                <Button
                  size="sm"
                  variant="link"
                  className={`scada-tab-btn px-3 py-1.5 fs-11 uppercase fw-bold rounded-2 text-decoration-none border-0 transition-all ${activeRightTab === 'alarms' ? 'text-warning active-tab' : 'text-secondary'}`}
                  onClick={() => setActiveRightTab('alarms')}
                >
                  Alarms & Relays
                </Button>
              </div>
            </div>
            {/* Helper inside render to query field visibility */}
            {(() => {
              const mapping = mainMeterTemplate?.mapping;
              const isFieldVisible = (key) => {
                if (!isTemplateMapped) return true;
                return !!mappedFields[key];
              };

              const getFieldMetadata = (config, fieldKey, defaultLabel, defaultUnit, rawValue) => {
                if (config && config.enabled !== false && config[fieldKey]) {
                  const fieldVal = config[fieldKey];
                  let cleanKey = fieldVal;
                  if (typeof fieldVal === 'string') {
                    if (fieldVal.includes(':')) {
                      cleanKey = fieldVal.split(':').pop();
                    }
                    const cleanUpper = cleanKey.trim().toUpperCase();

                    // Prioritize defaultLabel (the parameter's configuration name)
                    let label = defaultLabel ? defaultLabel.toUpperCase() : cleanUpper;
                    if (!defaultLabel) {
                      if (cleanUpper === 'EBKVAH' || cleanUpper === 'KVAH') label = 'EB KVAH';
                      else if (cleanUpper === 'EBKWH' || cleanUpper === 'KWH') label = 'EB KWH';
                      else if (cleanUpper === 'VR') label = 'VOLTAGE R-PHASE';
                      else if (cleanUpper === 'VY') label = 'VOLTAGE Y-PHASE';
                      else if (cleanUpper === 'VB') label = 'VOLTAGE B-PHASE';
                      else if (cleanUpper === 'IR') label = 'R-CURRENT';
                      else if (cleanUpper === 'IY') label = 'Y-CURRENT';
                      else if (cleanUpper === 'IB') label = 'B-CURRENT';
                      else if (cleanUpper === 'PF') label = 'POWER FACTOR';
                      else if (cleanUpper === 'TOTALKW') label = 'TOTAL KW';
                      else if (cleanUpper === 'TOTALKVA') label = 'TOTAL KVA';
                      else if (cleanUpper === 'DGKWH') label = 'DG KWH';
                      else if (cleanUpper === 'FIXEDCHARGE') label = 'FIXED CHARGE';
                    }

                    let unit = defaultUnit;
                    if (!unit) {
                      if (cleanUpper.includes('KVAH')) {
                        unit = 'kVAh';
                      } else if (cleanUpper.includes('KWH')) {
                        unit = 'kWh';
                      } else if (cleanUpper.includes('KVAR')) {
                        unit = 'kVAR';
                      } else if (cleanUpper.includes('KW')) {
                        unit = 'kW';
                      } else if (cleanUpper.includes('KVA')) {
                        unit = 'kVA';
                      } else if (cleanUpper.includes('V')) {
                        unit = 'V';
                      } else if (cleanUpper.includes('A')) {
                        unit = 'A';
                      }
                    }

                    // Format value with unit or prefix
                    let val = rawValue;
                    if (label === 'BALANCE' || label === 'FIXED CHARGE') {
                      val = `₹${rawValue}`;
                    } else if (unit) {
                      val = `${rawValue} ${unit}`;
                    }

                    return { label, val };
                  }
                }

                // Default formatting
                let val = rawValue;
                if (defaultLabel === 'BALANCE' || defaultLabel === 'FIXED CHARGE') {
                  val = `₹${rawValue}`;
                } else if (defaultUnit) {
                  val = `${rawValue} ${defaultUnit}`;
                }
                return { label: defaultLabel, val };
              };

              const hasChangeParams =
                isFieldVisible('ebKvah') || isFieldVisible('ebKwh') ||
                isFieldVisible('balance') || isFieldVisible('totalKw') ||
                isFieldVisible('vR') || isFieldVisible('vY') ||
                isFieldVisible('vB') || isFieldVisible('iR') ||
                isFieldVisible('iY') || isFieldVisible('iB') ||
                isFieldVisible('pf') || isFieldVisible('totalKva') ||
                isFieldVisible('dgKwh') || isFieldVisible('fixedCharge') ||
                isFieldVisible('activePower') || isFieldVisible('reactivePower') ||
                isFieldVisible('apparentPower') || isFieldVisible('cumulativekWh') ||
                isFieldVisible('freq');

              const hasWarningParams =
                isFieldVisible('lowBalanceCut') || isFieldVisible('overloadTrip') ||
                isFieldVisible('overloadLimitReached') || isFieldVisible('connectedStatus') ||
                isFieldVisible('forceOff');

              const hasReadParams =
                isFieldVisible('meterSrno') || isFieldVisible('noOfOverloadCheck') ||
                isFieldVisible('ebDgStatus') || isFieldVisible('ebTariff') ||
                isFieldVisible('dgTariff') || isFieldVisible('ebRLoadSet') ||
                isFieldVisible('ebYLoadSet') || isFieldVisible('ebBLoadSet') ||
                isFieldVisible('dgRLoadSet') || isFieldVisible('dgYLoadSet') ||
                isFieldVisible('dgBLoadSet');

              return (
                <div className="d-flex flex-column gap-4 w-100" style={{ zIndex: 5 }}>
                  {/* CHANGE Parameters Group */}
                  {activeRightTab === 'telemetry' && hasChangeParams && (
                    <div className="p-3 scada-section-box rounded-4">
                      <h6 className="text-info fw-black uppercase tracking-widest fs-12 mb-3 d-flex align-items-center gap-2">
                        <Activity size={14} /> Mapped Change Parameters
                      </h6>
                      <Row className="g-3">
                        {/* Voltages subgroup */}
                        {(isFieldVisible('vR') || isFieldVisible('vY') || isFieldVisible('vB')) && (
                          <Col md={12} className="mb-2">
                            <div className="p-3 bg-dark bg-opacity-40 rounded-4 border border-secondary border-opacity-10">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-secondary fs-11 uppercase fw-bold tracking-wider">Line-to-Neutral Voltages</small>
                                <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 fs-10 font-monospace">
                                  {data.ebRLoadSet > 0 ? `R-LIMIT: ${data.ebRLoadSet}kW` : 'VOLTAGE — 3Φ'}
                                </Badge>
                              </div>
                              <Row className="g-3">
                                {isFieldVisible('vR') && (
                                  <Col md={4} className="border-bottom border-md-bottom-0 border-md-end border-secondary border-opacity-10 pb-3 pb-md-0 pr-md-3 text-start">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-11 text-danger fw-black uppercase">R-Phase</span>
                                      <span className="fs-6 text-white font-monospace fw-bold">{data.vR} V</span>
                                    </div>
                                    <div className="phase-bar-track">
                                      <div className="phase-bar-fill bg-danger shadow-glow-red" style={{ width: `${Math.min(100, (data.vR / 300) * 100)}%` }}></div>
                                    </div>
                                  </Col>
                                )}
                                {isFieldVisible('vY') && (
                                  <Col md={4} className="border-bottom border-md-bottom-0 border-md-end border-secondary border-opacity-10 pb-3 pb-md-0 px-md-3 text-start">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-11 text-warning fw-black uppercase">Y-Phase</span>
                                      <span className="fs-6 text-white font-monospace fw-bold">{data.vY} V</span>
                                    </div>
                                    <div className="phase-bar-track">
                                      <div className="phase-bar-fill bg-warning shadow-glow-yellow" style={{ width: `${Math.min(100, (data.vY / 300) * 100)}%` }}></div>
                                    </div>
                                  </Col>
                                )}
                                {isFieldVisible('vB') && (
                                  <Col md={4} className="pt-3 pt-md-0 pl-md-3 text-start">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-11 text-primary fw-black uppercase">B-Phase</span>
                                      <span className="fs-6 text-white font-monospace fw-bold">{data.vB} V</span>
                                    </div>
                                    <div className="phase-bar-track">
                                      <div className="phase-bar-fill bg-primary shadow-glow-blue" style={{ width: `${Math.min(100, (data.vB / 300) * 100)}%` }}></div>
                                    </div>
                                  </Col>
                                )}
                              </Row>
                            </div>
                          </Col>
                        )}

                        {/* Currents subgroup */}
                        {(isFieldVisible('iR') || isFieldVisible('iY') || isFieldVisible('iB')) && (
                          <Col md={12} className="mb-2">
                            <div className="p-3 bg-dark bg-opacity-40 rounded-4 border border-secondary border-opacity-10">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-secondary fs-11 uppercase fw-bold tracking-wider">Line Currents</small>
                                <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 fs-10 font-monospace">
                                  {data.ebRLoadSet > 0 ? `LOAD LIMIT: ${data.ebRLoadSet}kW` : 'CURRENT — 3Φ'}
                                </Badge>
                              </div>
                              <Row className="g-3">
                                {isFieldVisible('iR') && (
                                  <Col md={4} className="border-bottom border-md-bottom-0 border-md-end border-secondary border-opacity-10 pb-3 pb-md-0 pr-md-3 text-start">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-11 text-danger fw-black uppercase">R-Current</span>
                                      <span className="fs-6 text-white font-monospace fw-bold">{data.iR} A</span>
                                    </div>
                                    <div className="phase-bar-track">
                                      <div className="phase-bar-fill bg-danger shadow-glow-red" style={{ width: `${Math.min(100, data.ebRLoadSet > 0 ? (data.iR / (data.ebRLoadSet * 4.35)) * 100 : (data.iR / 60) * 100)}%` }}></div>
                                    </div>
                                  </Col>
                                )}
                                {isFieldVisible('iY') && (
                                  <Col md={4} className="border-bottom border-md-bottom-0 border-md-end border-secondary border-opacity-10 pb-3 pb-md-0 px-md-3 text-start">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-11 text-warning fw-black uppercase">Y-Current</span>
                                      <span className="fs-6 text-white font-monospace fw-bold">{data.iY} A</span>
                                    </div>
                                    <div className="phase-bar-track">
                                      <div className="phase-bar-fill bg-warning shadow-glow-yellow" style={{ width: `${Math.min(100, data.ebYLoadSet > 0 ? (data.iY / (data.ebYLoadSet * 4.35)) * 100 : (data.iY / 60) * 100)}%` }}></div>
                                    </div>
                                  </Col>
                                )}
                                {isFieldVisible('iB') && (
                                  <Col md={4} className="pt-3 pt-md-0 pl-md-3 text-start">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-11 text-primary fw-black uppercase">B-Current</span>
                                      <span className="fs-6 text-white font-monospace fw-bold">{data.iB} A</span>
                                    </div>
                                    <div className="phase-bar-track">
                                      <div className="phase-bar-fill bg-primary shadow-glow-blue" style={{ width: `${Math.min(100, (data.iB / 60) * 100)}%` }}></div>
                                    </div>
                                  </Col>
                                )}
                              </Row>
                            </div>
                          </Col>
                        )}

                        {/* Grid Change Parameters */}
                        {[
                          { defaultLabel: 'EB KVAH', defaultUnit: 'kVAh', key: 'ebKvah', config: mapping?.emChangeConfig, rawValue: data.ebKvah, icon: <Gauge size={14} className="text-info" /> },
                          { defaultLabel: 'EB KWH', defaultUnit: 'kWh', key: 'ebKwh', config: mapping?.emChangeConfig, rawValue: data.ebKwh, icon: <Zap size={14} className="text-warning animate-pulse" /> },
                          { defaultLabel: 'BALANCE', defaultUnit: '', key: 'balance', isImportant: true, config: mapping?.emChangeConfig, rawValue: data.balance, icon: <Coins size={14} className="text-warning" /> },
                          { defaultLabel: 'TOTAL KW', defaultUnit: 'kW', key: 'totalKw', config: mapping?.emChangeConfig, rawValue: data.totalKw, icon: <Sliders size={14} className="text-danger" /> },
                          { defaultLabel: 'POWER FACTOR', defaultUnit: '', key: 'pf', config: mapping?.emChangeConfig, rawValue: data.pf, icon: <Cpu size={14} className="text-success" /> },
                          { defaultLabel: 'TOTAL KVA', defaultUnit: 'kVA', key: 'totalKva', config: mapping?.emChangeConfig, rawValue: data.totalKva, icon: <Gauge size={14} className="text-primary" /> },
                          { defaultLabel: 'DG KWH', defaultUnit: 'kWh', key: 'dgKwh', config: mapping?.emChangeConfig, rawValue: data.dgKwh, icon: <Flame size={14} className="text-orange" /> },
                          { defaultLabel: 'FIXED CHARGE', defaultUnit: '', key: 'fixedCharge', config: mapping?.emChangeConfig, rawValue: data.fixedCharge, icon: <Coins size={14} className="text-secondary" /> },
                          { defaultLabel: 'ACTIVE POWER', defaultUnit: 'kW', key: 'activePower', config: mapping?.emPowerConfig, rawValue: data.activePower, icon: <Zap size={14} className="text-info" /> },
                          { defaultLabel: 'REACTIVE POWER', defaultUnit: 'kVAR', key: 'reactivePower', config: mapping?.emPowerConfig, rawValue: data.reactivePower, icon: <Activity size={14} className="text-warning" /> },
                          { defaultLabel: 'APPARENT POWER', defaultUnit: 'kVA', key: 'apparentPower', config: mapping?.emPowerConfig, rawValue: data.apparentPower, icon: <Gauge size={14} className="text-primary" /> },
                          { defaultLabel: 'CUMULATIVE ENERGY', defaultUnit: 'kWh', key: 'cumulativekWh', config: mapping?.emConsumptionConfig, rawValue: data.cumulativekWh, icon: <Zap size={14} className="text-success" /> },
                          { defaultLabel: 'FREQUENCY', defaultUnit: 'Hz', key: 'freq', config: mapping?.emSystemConfig, rawValue: data.freq, icon: <Activity size={14} className="text-info" /> }
                        ].map((item, idx) => {
                          if (!isFieldVisible(item.key)) return null;
                          const { label, val } = getFieldMetadata(item.config, item.key, item.defaultLabel, item.defaultUnit, item.rawValue);
                          return (
                            <Col xs={6} md={6} lg={4} key={idx}>
                              <div className={`parameter-glass-card p-3 rounded-4 h-100 d-flex flex-column justify-content-between text-start ${item.isImportant ? 'important-glow-card' : ''}`}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <small className="text-secondary fs-10 uppercase fw-bold tracking-wider">{label}</small>
                                  {item.icon}
                                </div>
                                <h4 className={`mb-0 fw-black font-monospace tracking-wide ${item.isImportant ? 'text-warning' : 'text-white'}`}>{val}</h4>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* WARNING / Alarm Panel */}
                  {activeRightTab === 'alarms' && hasWarningParams && (
                    <div className="p-3 scada-section-box rounded-4">
                      <h6 className="text-warning fw-black uppercase tracking-widest fs-12 mb-3 d-flex align-items-center gap-2">
                        <ShieldCheck size={14} /> Warnings & Relays
                      </h6>
                      <Row className="g-3">
                        {[
                          { label: 'Low Balance Cut', val: data.lowBalanceCut, key: 'lowBalanceCut', icon: <AlertTriangle size={14} className="text-danger" /> },
                          { label: 'Overload Trip', val: data.overloadTrip, key: 'overloadTrip', icon: <ShieldAlert size={14} className="text-danger" /> },
                          { label: 'Overload Limit Reached', val: data.overloadLimitReached, key: 'overloadLimitReached', icon: <Info size={14} className="text-warning" /> },
                          { label: 'Connected Status', val: data.connectedStatus, key: 'connectedStatus', isConnected: true, icon: <Cpu size={14} className="text-success" /> },
                          { label: 'Force Off', val: data.forceOff, key: 'forceOff', icon: <AlertTriangle size={14} className="text-secondary" /> }
                        ].map((item, idx) => {
                          if (!isFieldVisible(item.key)) return null;
                          const isActive = Number(item.val) > 0;
                          return (
                            <Col xs={6} md={6} key={idx}>
                              <div
                                className="p-3 parameter-glass-card rounded-4 d-flex align-items-center justify-content-between h-100"
                                style={{
                                  backgroundColor: isActive
                                    ? (item.isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')
                                    : 'rgba(255, 255, 255, 0.02)',
                                  borderColor: isActive
                                    ? (item.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)')
                                    : 'rgba(255, 255, 255, 0.05)',
                                  borderWidth: '1px',
                                  borderStyle: 'solid'
                                }}
                              >
                                <div className="d-flex align-items-center gap-3 text-start">
                                  <div className="p-2 bg-dark bg-opacity-40 rounded-3 border border-secondary border-opacity-10">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <small className={`${isActive ? 'text-white' : 'text-secondary'} d-block fs-11 uppercase fw-bold`}>{item.label}</small>
                                    <span className={`fw-black fs-13 ${isActive ? (item.isConnected ? 'text-success' : 'text-danger') : 'text-white text-opacity-40'}`}>
                                      {item.isConnected ? (isActive ? 'CONNECTED' : 'DISCONNECTED') : (isActive ? 'ACTIVE' : 'INACTIVE')}
                                    </span>
                                  </div>
                                </div>
                                <span className={`pulse-dot-${isActive ? (item.isConnected ? 'green' : 'red') : 'grey'}`}></span>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* READ Parameters */}
                  {activeRightTab === 'config' && hasReadParams && (
                    <div className="p-3 scada-section-box rounded-4">
                      <h6 className="text-success fw-black uppercase tracking-widest fs-12 mb-3 d-flex align-items-center gap-2">
                        <Activity size={14} /> Mapped Configuration & Limits
                      </h6>
                      <Row className="g-3">
                        {[
                          { label: 'Meter Serial No', val: data.meterSrno, key: 'meterSrno', icon: <Info size={13} className="text-info" /> },
                          { label: 'No of Overload Check', val: data.noOfOverloadCheck, key: 'noOfOverloadCheck', icon: <Sliders size={13} className="text-info" /> },
                          { label: 'EB/DG Status', val: data.ebDgStatus === 0 ? 'EB GRID' : 'DG SET', key: 'ebDgStatus', icon: <Cpu size={13} className="text-success" /> },
                          { label: 'EB Tariff', val: `₹${data.ebTariff}/Unit`, key: 'ebTariff', icon: <Coins size={13} className="text-warning" /> },
                          { label: 'DG Tariff', val: `₹${data.dgTariff}/Unit`, key: 'dgTariff', icon: <Coins size={13} className="text-warning" /> },
                          { label: 'EB R Load Set', val: `${data.ebRLoadSet} kW`, key: 'ebRLoadSet', icon: <Sliders size={13} className="text-danger" /> },
                          { label: 'EB Y Load Set', val: `${data.ebYLoadSet} kW`, key: 'ebYLoadSet', icon: <Sliders size={13} className="text-warning" /> },
                          { label: 'EB B Load Set', val: `${data.ebBLoadSet} kW`, key: 'ebBLoadSet', icon: <Sliders size={13} className="text-primary" /> },
                          { label: 'DG R Load Set', val: `${data.dgRLoadSet} kW`, key: 'dgRLoadSet', icon: <Sliders size={13} className="text-danger" /> },
                          { label: 'DG Y Load Set', val: `${data.dgYLoadSet} kW`, key: 'dgYLoadSet', icon: <Sliders size={13} className="text-warning" /> },
                          { label: 'DG B Load Set', val: `${data.dgBLoadSet} kW`, key: 'dgBLoadSet', icon: <Sliders size={13} className="text-primary" /> }
                        ].map((item, idx) => {
                          if (!isFieldVisible(item.key)) return null;
                          return (
                            <Col xs={6} md={6} lg={4} key={idx}>
                              <div className="p-3 parameter-glass-card rounded-4 h-100 d-flex align-items-center gap-3 text-start">
                                <div className="p-2 bg-dark bg-opacity-40 rounded-3 border border-secondary border-opacity-10">
                                  {item.icon}
                                </div>
                                <div>
                                  <small className="text-secondary d-block fs-11 mb-1 uppercase fw-bold">{item.label}</small>
                                  <h5 className="mb-0 fw-black text-white font-monospace">{item.val}</h5>
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>
        </Col>
      </Row>

      {/* HISTORICAL LOG TABLE */}
      <Card className="scada-glass-card border-0 text-white mt-4">
        <Card.Body className="p-4">
          <h5 className="mb-4 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
            <Activity className="text-info animate-pulse" size={18} /> Main Incomer Log History
          </h5>
          <div className="table-responsive">
            <Table hover borderless className="align-middle scada-table text-white mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                  <th className="py-3">Timestamp</th>
                  <th className="py-3 text-center">Voltage R-Y-B</th>
                  <th className="py-3 text-center">Current R-Y-B</th>
                  <th className="py-3 text-center">Active Load</th>
                  <th className="py-3 text-center">Frequency</th>
                  <th className="py-3 text-center">Power Factor</th>
                  <th className="py-3 text-end">Grid Condition</th>
                </tr>
              </thead>
              <tbody>
                {historyLog.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-5 text-center text-secondary font-monospace fs-13">
                      <div className="d-flex flex-column align-items-center gap-2" style={{opacity:0.5}}>
                        <Activity size={20} className="text-info" />
                        <span>Waiting for live telemetry from {mainMeterTemplate?.name || 'meter'}...</span>
                        <small>Data will populate automatically every 4 seconds.</small>
                      </div>
                    </td>
                  </tr>
                ) : historyLog.map((row, idx) => {
                  const fmt = (v, d=1) => v !== null && v !== undefined ? Number(v).toFixed(d) : '—';
                  const isNormal = !row.connectedStatus || row.connectedStatus > 0;
                  return (
                    <tr key={idx} className="border-bottom border-secondary border-opacity-5">
                      <td className="py-3 font-monospace text-info fs-13">{row.time}</td>
                      <td className="py-3 text-center font-monospace">
                        <span className="text-danger">{fmt(row.vR)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-warning">{fmt(row.vY)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-info">{fmt(row.vB)}</span>
                        <span className="text-secondary ms-1">V</span>
                      </td>
                      <td className="py-3 text-center font-monospace">
                        <span className="text-danger">{fmt(row.iR, 2)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-warning">{fmt(row.iY, 2)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-info">{fmt(row.iB, 2)}</span>
                        <span className="text-secondary ms-1">A</span>
                      </td>
                      <td className="py-3 text-center text-white fw-bold font-monospace">{fmt(row.totalKw, 2)} kW</td>
                      <td className="py-3 text-center text-secondary font-monospace">{fmt(row.freq, 2)} Hz</td>
                      <td className="py-3 text-center text-secondary font-monospace">{fmt(row.pf, 2)}</td>
                      <td className="py-3 text-end">
                        <Badge bg={isNormal ? 'success' : 'danger'} className={`bg-opacity-10 ${isNormal ? 'text-success border-success' : 'text-danger border-danger'} border border-opacity-20 px-2 py-1`}>
                          {isNormal ? 'Normal' : 'Alarm'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* DETAILED REAL-TIME CSS STYLING FOR DIGITAL TWIN METER */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* SCADA Common styles & Glassmorphism */
        .scada-glass-card {
          background: linear-gradient(135deg, rgba(13, 20, 38, 0.8) 0%, rgba(8, 12, 24, 0.95) 100%) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 20px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scada-glass-card:hover {
          border-color: rgba(6, 182, 212, 0.3) !important;
          box-shadow: 0 12px 40px 0 rgba(6, 182, 212, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }
        .scada-card { background: #0f172a; border-radius: 20px; transition: all 0.3s ease; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4); }
        .scada-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -4px rgba(0,0,0,0.5); }
        .pulse-dot-green { width: 8px; height: 8px; border-radius: 50px; background-color: #10b981; display: inline-block; box-shadow: 0 0 8px #10b981; animation: pulseGlow 1.8s infinite; }
        .pulse-dot-red { width: 8px; height: 8px; border-radius: 50px; background-color: #ef4444; display: inline-block; box-shadow: 0 0 8px #ef4444; animation: pulseGlow 1.8s infinite; }
        .pulse-dot-grey { width: 8px; height: 8px; border-radius: 50px; background-color: #4b5563; display: inline-block; }
        .phase-indicator-accent { width: 4px; height: 100%; position: absolute; left: 0; top: 0; bottom: 0; }
        .scada-table tbody tr { transition: all 0.2s; cursor: pointer; }
        .scada-table tbody tr:hover { background: rgba(255, 255, 255, 0.03); }
        .fw-black { font-weight: 900 !important; }
        .fs-10 { font-size: 0.6rem !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-13 { font-size: 0.8rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .scada-tabs-container {
          display: flex;
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 8px;
          padding: 2px;
        }
        .scada-tab-btn {
          font-size: 0.68rem !important;
          letter-spacing: 0.5px;
          color: #94a3b8 !important;
          border-radius: 6px;
          border: 1px solid transparent !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scada-tab-btn:hover {
          color: #f8fafc !important;
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .scada-tab-btn.active-tab {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1) !important;
        }
        .scada-tab-btn.active-tab.text-info {
          border-left: 2px solid #06b6d4 !important;
          color: #06b6d4 !important;
        }
        .scada-tab-btn.active-tab.text-warning {
          border-left: 2px solid #f59e0b !important;
          color: #f59e0b !important;
        }
        .scada-tab-btn.active-tab.text-success {
          border-left: 2px solid #10b981 !important;
          color: #10b981 !important;
        }

        /* Oscilloscope Live Telemetry Backdrop */
        .telemetry-wave-visualizer {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.15;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }
        .hud-wave-svg {
          width: 100%;
          height: 100%;
        }
        .wave-line-1 {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawWave 12s linear infinite;
        }
        .wave-line-2 {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawWave 16s linear infinite reverse;
        }
        .wave-line-3 {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawWave 20s linear infinite;
        }
        @keyframes drawWave {
          to { stroke-dashoffset: 0; }
        }
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* Floating Laboratory HUD Panel */
        .hud-panel {
          display: flex;
          flex-direction: column;
          width: 130px;
          gap: 12px;
          z-index: 10;
        }
        .hud-metric {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px 10px;
          transition: all 0.3s;
          text-align: left;
        }
        .hud-metric:hover {
          background: rgba(6, 182, 212, 0.06);
          border-color: rgba(6, 182, 212, 0.2);
        }
        .hud-label {
          font-size: 0.52rem;
          color: #64748b;
          font-weight: 700;
          display: block;
          margin-bottom: 2px;
          letter-spacing: 0.5px;
        }
        .hud-value {
          font-size: 0.72rem;
          font-weight: bold;
        }

        /* Horizontal Phase Gauges styling */
        .phase-bar-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 5px;
          overflow: hidden;
          width: 100%;
          margin-top: 5px;
        }
        .phase-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .shadow-glow-red {
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.7);
        }
        .shadow-glow-yellow {
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.7);
        }
        .shadow-glow-blue {
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.7);
        }

        /* Parameter Glass Cards styling */
        .scada-section-box {
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .parameter-glass-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .parameter-glass-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .important-glow-card {
          border-color: rgba(245, 158, 11, 0.3) !important;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.05);
        }
        .important-glow-card:hover {
          border-color: rgba(245, 158, 11, 0.6) !important;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15) !important;
        }
        .text-orange {
          color: #f97316 !important;
        }

        /* MFM DIGITAL TWIN PREMIUM STYLING */
        .mfm-polycarbonate-case {
          width: 100%;
          max-width: 350px;
          background: linear-gradient(135deg, #2d3548 0%, #151a24 100%);
          border: 8px solid #3d4659;
          border-radius: 24px;
          padding: 20px;
          position: relative;
          box-shadow: inset 0 0 25px rgba(255,255,255,0.06), 
                      0 15px 35px rgba(0,0,0,0.8),
                      0 0 0 1px rgba(0,0,0,0.4);
          overflow: visible;
        }

        /* Bezel Corner Hex Screws */
        .mfm-polycarbonate-case .screw {
          width: 14px;
          height: 14px;
          background: radial-gradient(circle, #8a95a5 30%, #3e4856 80%);
          border-radius: 50%;
          position: absolute;
          box-shadow: 1px 1px 3px rgba(0,0,0,0.6);
          border: 1px solid #1a222e;
        }
        .mfm-polycarbonate-case .screw::after {
          content: '';
          position: absolute;
          top: 5px;
          left: 1px;
          width: 10px;
          height: 2px;
          background: #11151c;
          transform: rotate(45deg);
        }
        .mfm-polycarbonate-case .screw.top-left { top: 12px; left: 12px; }
        .mfm-polycarbonate-case .screw.top-right { top: 12px; right: 12px; }
        .mfm-polycarbonate-case .screw.bottom-left { bottom: 12px; left: 12px; }
        .mfm-polycarbonate-case .screw.bottom-right { bottom: 12px; right: 12px; }

        .mfm-metallic-bezel {
          background: linear-gradient(145deg, #1f2533 0%, #0d1017 100%);
          border-radius: 16px;
          padding: 16px 12px;
          border: 2px solid rgba(255,255,255,0.03);
          box-shadow: inset 0 0 20px rgba(0,0,0,0.6);
          position: relative;
        }

        .mfm-brand-header {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 6px;
        }
        .mfm-brand-logo {
          font-size: 1.1rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .mfm-model-no {
          font-size: 0.65rem;
          color: #38bdf8;
          font-weight: bold;
          letter-spacing: 1px;
          background: rgba(56, 189, 248, 0.1);
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.15);
        }

        /* Premium LCD Window */
        .mfm-lcd-window {
          background: #0f131a;
          border: 5px solid #222936;
          border-radius: 12px;
          padding: 10px;
          position: relative;
          box-shadow: inset 0 3px 12px rgba(0,0,0,0.85);
        }
        .mfm-lcd-glass {
          background: #022c22;
          border-radius: 6px;
          padding: 6px;
          box-shadow: inset 0 0 16px rgba(0,0,0,0.95);
          position: relative;
        }
        .mfm-lcd-screen {
          background: #052e16;
          background-image: radial-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px);
          background-size: 3px 3px;
          border-radius: 4px;
          padding: 8px 4px;
          height: 160px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 0 20px rgba(16,185,129,0.25);
          position: relative;
          overflow: hidden;
        }
        .mfm-lcd-screen::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
          pointer-events: none;
          z-index: 2;
        }

        .mfm-lcd-top-bar {
          font-size: 0.65rem;
          color: #10b981;
          font-weight: 800;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.15);
          padding-bottom: 3px;
          margin-bottom: 6px;
          opacity: 0.85;
        }
        .mfm-lcd-page-num {
          background: rgba(16, 185, 129, 0.1);
          padding: 0 4px;
          border-radius: 2px;
        }

        .mfm-lcd-grid {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }
        .mfm-lcd-row {
          font-size: 0.95rem;
          font-weight: 700;
          color: #10b981;
          text-shadow: 0 0 3px rgba(16, 185, 129, 0.7);
          line-height: 1.2;
          display: flex;
          align-items: center;
        }
        .mfm-lcd-label {
          width: 28px;
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 900;
          opacity: 0.7;
        }
        .mfm-lcd-value {
          font-size: 1.2rem;
          color: #34d399;
          letter-spacing: 1px;
          font-family: 'Consolas', 'Courier New', Courier, monospace !important;
        }
        .mfm-lcd-unit {
          font-size: 0.7rem;
          color: #10b981;
          opacity: 0.8;
          width: 32px;
        }

        .mfm-lcd-bottom-bar {
          font-size: 0.52rem;
          color: #10b981;
          opacity: 0.6;
          border-top: 1px solid rgba(16, 185, 129, 0.15);
          padding-top: 4px;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }

        /* LED bulbs under display */
        .mfm-bezel-bottom {
          margin-top: 10px;
        }
        .mfm-leds-rack {
          display: flex;
          gap: 12px;
        }
        .mfm-led-group {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .mfm-led-bulb {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #1e293b;
          border: 1px solid #0f172a;
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.8);
          transition: all 0.15s ease;
        }
        .mfm-led-bulb.bulb-red.glow-active {
          background-color: #ef4444;
          box-shadow: 0 0 10px #ef4444, inset 0 0 2px white;
        }
        .mfm-led-bulb.bulb-green.glow-active {
          background-color: #22c55e;
          box-shadow: 0 0 10px #22c55e, inset 0 0 2px white;
        }
        .mfm-led-bulb.bulb-orange {
          background-color: #b45309;
        }
        .mfm-led-bulb.bulb-orange.glow-active {
          background-color: #f59e0b;
          box-shadow: 0 0 10px #f59e0b, inset 0 0 2px white;
        }
        .mfm-led-label {
          font-size: 0.5rem;
          color: #94a3b8;
          margin-top: 3px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        .mfm-spec-labels {
          font-size: 0.52rem;
          line-height: 1.3;
          opacity: 0.55;
        }

        /* Glossy industrial rounded navigation buttons */
        .mfm-button-deck {
          border-top: 1px solid rgba(255,255,255,0.04);
          padding-top: 12px;
        }
        .mfm-tactile-btn {
          flex: 1;
          height: 32px;
          background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
          border: 1px solid #111827;
          border-radius: 6px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.5), 
                      inset 0 1px 2px rgba(255,255,255,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.1s ease;
        }
        .mfm-tactile-btn:hover {
          background: linear-gradient(180deg, #4b5563 0%, #374151 100%);
          border-color: #1f2937;
        }
        .mfm-tactile-btn:active {
          transform: translateY(1.5px);
          box-shadow: 0 1px 2px rgba(0,0,0,0.6), 
                      inset 0 1px 4px rgba(0,0,0,0.5);
          background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
        }
        .mfm-tactile-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
          transform: none !important;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3) !important;
        }
        .mfm-tactile-btn .btn-glyph {
          color: #d1d5db;
          font-size: 0.85rem;
          font-weight: 800;
          text-shadow: 0 -1px 1px rgba(0,0,0,0.6);
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; filter: brightness(1.2); }
        }

        @media (max-width: 375px) {
          .mfm-polycarbonate-case {
            padding: 10px !important;
            border-width: 4px !important;
            border-radius: 16px !important;
          }
          .mfm-metallic-bezel {
            padding: 10px 8px !important;
            border-radius: 12px !important;
          }
          .mfm-lcd-window {
            border-width: 3px !important;
            border-radius: 8px !important;
            padding: 6px !important;
          }
          .mfm-lcd-screen {
            height: 140px !important;
            padding: 4px 2px !important;
          }
          .mfm-lcd-value {
            font-size: 1.0rem !important;
          }
          .mfm-lcd-label {
            font-size: 0.65rem !important;
          }
          .mfm-lcd-unit {
            font-size: 0.6rem !important;
            width: 24px !important;
          }
        }
      `}} />
    </div>
  );
};

export default MainMeter;

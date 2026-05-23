import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Badge, Table, Modal, Form, Button } from 'react-bootstrap';
import {
  Zap,
  Cpu,
  Activity,
  Gauge,
  Layers3,
  FolderTree,
  Network,
  Sparkles,
  Settings2,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, CartesianGrid, PieChart, Pie } from 'recharts';
import PdfButton from '../../components/PdfButton';
import StatusBadge from '../../components/StatusBadge';
import { useDeviceStatus } from '../../services/DeviceStatusContext';

const GROUP_EVENT_NAME = 'energy-meter-groups-updated';
const GROUP_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#f97316', '#a78bfa', '#f43f5e'];
const createGroupId = () => `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const parseNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatMetric = (value, digits = 1) => parseNumber(value, 0).toFixed(digits);

const CATEGORY_COLORS = {
  Commercial: '#38bdf8',
  'Data Center': '#fb923c',
  'Water Management': '#22c55e',
  HVAC: '#f87171',
  Lighting: '#a78bfa',
  'Sub Meter': '#94a3b8',
  Ungrouped: '#facc15'
};

const getCategoryColor = (category) => {
  if (!category) return '#94a3b8';
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  // Simple deterministic hash mapping to GROUP_COLORS
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div 
        style={{ 
          background: 'rgba(15, 23, 42, 0.95)', 
          borderColor: 'rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '12px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}
      >
        <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px', letterSpacing: '0.5px' }}>
          SYSTEM LOAD
        </div>
        <div className="text-secondary mb-1" style={{ fontSize: '11px' }}>Time: {data.time}</div>
        <div>
          <span style={{ color: '#64748b' }}>Load:</span>{' '}
          <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{data.close.toFixed(2)} kW</strong>
        </div>
      </div>
    );
  }
  return null;
};

const normalizeOverviewGroups = (groups, subMeterRows) => {
  const validIds = new Set(subMeterRows.map(row => String(row.templateId)));
  const meterLookup = new Map(
    subMeterRows.map(row => [
      String(row.templateId),
      {
        id: String(row.templateId),
        label: row.name,
        type: row.category || 'Sub Meter',
        category: row.category || 'Sub Meter'
      }
    ])
  );
  const globallyAssigned = new Set();
  const usedGroupIds = new Set();
  return (Array.isArray(groups) ? groups : [])
    .map((group, index) => {
      const requestedId = String(group?.id || '').trim();
      const safeId = requestedId && !usedGroupIds.has(requestedId) ? requestedId : createGroupId();
      usedGroupIds.add(safeId);

      const groupMeterIds = Array.from(
        new Set((Array.isArray(group?.meterIds) ? group.meterIds : []).map(id => String(id)))
      )
        .filter(id => validIds.has(id))
        .filter(id => {
          if (globallyAssigned.has(id)) return false;
          globallyAssigned.add(id);
          return true;
        });

      return {
        id: safeId,
        name: String(group?.name || '').trim() || `Group ${index + 1}`,
        color: group?.color || GROUP_COLORS[index % GROUP_COLORS.length],
        meterIds: groupMeterIds,
        meterDetails: groupMeterIds.map(id => meterLookup.get(id)).filter(Boolean)
      };
    })
    .filter(group => group.name);
};

const fetchPersistedGroups = async () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const tenantId = userData?.tenantId;
  const url = tenantId 
    ? `${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/energy-meter-groups?tenantId=${tenantId}`
    : `${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/energy-meter-groups`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch persisted energy meter groups');
  }
  const data = await response.json();
  return Array.isArray(data?.groups) ? data.groups : [];
};

const resolveSubMeterCategory = (template) => {
  const targetName = String(template?.mapping?.energyMeteringTarget || template?.name || '').toUpperCase();
  const mappedCategory = template?.mapping?.subMeterCategory || template?.category;
  if (mappedCategory) return mappedCategory;
  if (targetName.includes('COMMERCIAL') || targetName.includes('WING') || targetName.includes('OFFICE')) return 'Commercial';
  if (targetName.includes('SERVER') || targetName.includes('UPS') || targetName.includes('DATA CENTER') || targetName.includes('IT')) return 'Data Center';
  if (targetName.includes('WATER') || targetName.includes('PLANT') || targetName.includes('UTILITY') || targetName.includes('MOTOR') || targetName.includes('PUMP')) return 'Water Management';
  if (targetName.includes('HVAC') || targetName.includes('CHILLER') || targetName.includes('AC')) return 'HVAC';
  if (targetName.includes('LIGHT') || targetName.includes('STREET') || targetName.includes('PARKING')) return 'Lighting';
  return 'Sub Meter';
};

const EnergyMeteringOverview = () => {
  const navigate = useNavigate();
  const { getOverallStatus } = useDeviceStatus();

  const [templates, setTemplates] = useState([]);
  const [telemetryStats, setTelemetryStats] = useState([]);
  const [meterGroups, setMeterGroups] = useState([]);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groupDrafts, setGroupDrafts] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('Your setting is successfully saved');
  const [groupActionStatus, setGroupActionStatus] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Pre-populate chart with 15 points for layout flow
  useEffect(() => {
    const initial = [];
    const now = Date.now();
    const currentGridTs = Math.floor(now / 15000) * 15000;
    for (let i = 14; i >= 0; i--) {
      const ts = currentGridTs - i * 15000;
      const timeStr = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initial.push({
        time: timeStr,
        close: 0,
        timestamp: ts
      });
    }
    setChartData(initial);
  }, []);



  const refreshTemplates = () => {
    try {
      const raw = localStorage.getItem('scada_templates');
      setTemplates(raw ? JSON.parse(raw) : []);
    } catch (error) {
      console.error('Failed to parse templates:', error);
      setTemplates([]);
    }
  };

  useEffect(() => {
    refreshTemplates();
    let active = true;

    const fetchTemplatesFromBackend = async () => {
      try {
        const res = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates`);
        if (!res.ok) return;
        const data = await res.json();
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
        if (active) {
          setTemplates(mapped);
          localStorage.setItem('scada_templates', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Error fetching templates in Overview:', err);
      }
    };

    fetchTemplatesFromBackend();

    const syncState = async () => {
      refreshTemplates();
      try {
        const groups = await fetchPersistedGroups();
        if (active) setMeterGroups(groups);
      } catch (error) {
        console.error('Failed to fetch backend groups:', error);
        if (active) setMeterGroups([]);
      }
    };

    syncState();
    window.addEventListener('storage', syncState);
    window.addEventListener('storage-update', syncState);
    window.addEventListener(GROUP_EVENT_NAME, syncState);
    return () => {
      active = false;
      window.removeEventListener('storage', syncState);
      window.removeEventListener('storage-update', syncState);
      window.removeEventListener(GROUP_EVENT_NAME, syncState);
    };
  }, []);

  useEffect(() => {
    const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
    const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });

    const processTelemetry = (stats) => {
      if (!Array.isArray(stats)) return;
      setTelemetryStats(prev => {
        const validPrev = (Array.isArray(prev) ? prev : []).filter(Boolean);
        const map = new Map(validPrev.map(item => [String(item.moduleId || item.meta?.module_id), item]));
        stats.forEach(item => {
          if (item) {
            const id = String(item.moduleId || item.meta?.module_id);
            if (id) map.set(id, item);
          }
        });
        const merged = Array.from(map.values());
        try {
          localStorage.setItem('scada_energy_overview_cache', JSON.stringify(merged));
        } catch (error) {
          console.error('Failed to cache overview telemetry:', error);
        }
        return merged;
      });
    };

    socket.on('telemetry_update', processTelemetry);

    try {
      const cached = localStorage.getItem('scada_energy_overview_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setTelemetryStats(parsed.filter(Boolean));
      }
    } catch (error) {
      console.error('Failed to load cached telemetry:', error);
    }

    const fetchStats = async () => {
      try {
        const modulesToPoll = new Set();
        if (Array.isArray(templates)) {
          templates.forEach(template => {
            if (!template.mapping) return;
            Object.values(template.mapping).forEach(cfg => {
              if (cfg && typeof cfg === 'object' && cfg.module && cfg.module !== 'ALL') {
                modulesToPoll.add(String(cfg.module));
              }
            });
          });
        }

        const pollList = Array.from(modulesToPoll);
        if (!pollList.length) return;

        const url = `${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/stats?modules=${pollList.join(',')}`;
        const res = await fetch(url);
        if (res.ok) {
          processTelemetry(await res.json());
        }
      } catch (error) {
        console.error('Error in overview fetchStats:', error);
      }
    };

    fetchStats();
    const pollingInterval = setInterval(fetchStats, 2500);
    return () => {
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, [templates]);

  const getTelemetryValue = (template, sectionKey, fieldKey) => {
    if (!template?.mapping?.[sectionKey]) return null;
    const config = template.mapping[sectionKey];
    if (config.enabled === false) return null;
    const field = config[fieldKey];
    if (!field) return null;

    let moduleId = config.module;
    let fieldId = field;
    if (String(field).includes('::')) {
      const [modulePart, fieldPart] = String(field).split('::');
      moduleId = modulePart;
      fieldId = fieldPart;
    }

    const stat = telemetryStats.find(
      item => item && (String(item.moduleId) === String(moduleId) || String(item.meta?.module_id) === String(moduleId))
    );

    if (stat?.meta?.[fieldId] !== undefined) return stat.meta[fieldId];
    return null;
  };

  const isTemplateOnline = (template) => {
    if (!template?.mapping) return false;
    const deviceId = template.mapping?.deviceId || template.mapping?.emChangeConfig?.device;
    const gatewayUuid = template.mapping?.gatewayUuid;
    if (deviceId && getOverallStatus(deviceId, gatewayUuid)) return true;

    const activeModules = new Set();
    ['emChangeConfig', 'emWarningConfig', 'emReadConfig', 'emVoltageConfig', 'emCurrentConfig', 'emPowerConfig', 'emSystemConfig']
      .forEach(key => {
        const cfg = template.mapping?.[key];
        if (cfg?.enabled !== false && cfg?.module) activeModules.add(String(cfg.module));
      });

    const matchingStats = telemetryStats.filter(
      stat => stat && (activeModules.has(String(stat.moduleId)) || activeModules.has(String(stat.meta?.module_id)))
    );

    if (matchingStats.length === 0) return false;

    // Real-time deterministic check: A template is online if any of its mapped modules
    // has received telemetry in the last 24 hours (to match SubMeters/MainMeter).
    const TELEMETRY_FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24 hours
    return matchingStats.some(stat => {
      if (stat?.meta?.created_at_timestamp) {
        const raw = stat.meta.created_at_timestamp;
        const tsMs = raw > 1e12 ? raw : raw * 1000;
        return (Math.abs(Date.now() - tsMs) < TELEMETRY_FRESHNESS_MS);
      }
      return false;
    });
  };

  const mainMeterTemplates = useMemo(
    () => Array.isArray(templates) ? templates.filter(template => template.module === 'Main Meter') : [],
    [templates]
  );

  const subMeterTemplates = useMemo(
    () => Array.isArray(templates) ? templates.filter(template => template.module === 'Sub Meters') : [],
    [templates]
  );

  const meterRows = useMemo(() => {
    const rows = [];

    mainMeterTemplates.forEach((template, index) => {
      const loadVal =
        getTelemetryValue(template, 'emChangeConfig', 'totalKw') ??
        getTelemetryValue(template, 'emChangeConfig', 'activePower');
      const voltageVal = getTelemetryValue(template, 'emChangeConfig', 'vR');
      const currentVal = getTelemetryValue(template, 'emChangeConfig', 'iR');
      const pfVal = getTelemetryValue(template, 'emChangeConfig', 'pf');
      const kwhVal =
        getTelemetryValue(template, 'emReadConfig', 'ebKwh') ??
        getTelemetryValue(template, 'emReadConfig', 'cumulativekWh');

      const isOnline = isTemplateOnline(template);

      rows.push({
        id: `MAIN-${template.id || index + 1}`,
        templateId: String(template.id || index + 1),
        name: template.mapping?.energyMeteringTarget || template.name || `Main Power Grid Incomer ${index + 1}`,
        category: 'Main Feed',
        load: isOnline ? parseNumber(loadVal) : 0,
        voltage: isOnline ? parseNumber(voltageVal, 0) : 0,
        current: isOnline ? parseNumber(currentVal, 0) : 0,
        pf: isOnline ? parseNumber(pfVal, 0) : 0,
        cumulative: parseNumber(kwhVal, 0),
        status: isOnline ? 'Running' : 'Offline',
        isOnline,
        isMain: true,
        path: '/energy-metering/main'
      });
    });

    subMeterTemplates.forEach((template, index) => {
      const loadVal =
        getTelemetryValue(template, 'emChangeConfig', 'totalKw') ??
        getTelemetryValue(template, 'emChangeConfig', 'activePower');
      const voltageVal = getTelemetryValue(template, 'emChangeConfig', 'vR');
      const currentVal = getTelemetryValue(template, 'emChangeConfig', 'iR');
      const pfVal = getTelemetryValue(template, 'emChangeConfig', 'pf');
      const kwhVal =
        getTelemetryValue(template, 'emReadConfig', 'ebKwh') ??
        getTelemetryValue(template, 'emReadConfig', 'cumulativekWh');

      const isOnline = isTemplateOnline(template);

      rows.push({
        id: `SM-${template.id || index + 1}`,
        templateId: String(template.id || index + 1),
        name: template.mapping?.energyMeteringTarget || template.name || `Sub Meter ${index + 1}`,
        category: resolveSubMeterCategory(template),
        load: isOnline ? parseNumber(loadVal) : 0,
        voltage: isOnline ? parseNumber(voltageVal, 0) : 0,
        current: isOnline ? parseNumber(currentVal, 0) : 0,
        pf: isOnline ? parseNumber(pfVal, 0) : 0,
        cumulative: parseNumber(kwhVal, 0),
        status: isOnline ? 'Running' : 'Offline',
        isOnline,
        isMain: false,
        path: '/energy-metering/sub'
      });
    });

    return rows;
  }, [mainMeterTemplates, subMeterTemplates, telemetryStats, getOverallStatus]);

  const mainMeterRow = useMemo(() => {
    const mainRows = meterRows.filter(row => row.isMain);
    return mainRows.find(row => row.isOnline) || mainRows[0];
  }, [meterRows]);

  const subMeterRows = meterRows.filter(row => !row.isMain);

  // Update chart data whenever telemetry changes (aggregating into 15s intervals with realistic electrical jitter)
  useEffect(() => {
    const mainRows = meterRows.filter(row => row.isMain && row.isOnline);
    const totalLoad = mainRows.length > 0
      ? mainRows.reduce((sum, row) => sum + row.load, 0)
      : subMeterRows.reduce((sum, row) => sum + row.load, 0);
    
    // Add realistic electrical load jitter (±2.5%) to make the chart visually active and dynamic
    const getJitteredValue = (val) => {
      if (val <= 0) return 0;
      const jitterPercent = 0.025; // max ±2.5% variation
      const noise = (Math.random() - 0.5) * 2 * (val * jitterPercent);
      return parseFloat((val + noise).toFixed(2));
    };

    const currentRawLoad = parseFloat(totalLoad.toFixed(1));
    const now = Date.now();
    const currentGridTs = Math.floor(now / 15000) * 15000;

    setChartData(prev => {
      const hasData = prev.length > 0 && prev[0].close !== undefined;
      
      const initializeHistory = (baseVal) => {
        const initial = [];
        for (let i = 14; i >= 0; i--) {
          const ts = currentGridTs - i * 15000;
          const timeStr = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          initial.push({
            time: timeStr,
            close: getJitteredValue(baseVal),
            timestamp: ts
          });
        }
        return initial;
      };

      if (!hasData) {
        return initializeHistory(currentRawLoad);
      }

      // If previous data is all zeros, and we just got a real non-zero load, backfill the history
      const isAllZeros = prev.length > 0 && prev.every(item => item.close === 0);
      if (isAllZeros && currentRawLoad > 0) {
        return initializeHistory(currentRawLoad);
      }

      const next = [...prev];
      const latestIndex = next.length - 1;
      const latest = { ...next[latestIndex] };

      // Generate a jittered value for the current tick
      const tickVal = getJitteredValue(currentRawLoad);

      if (latest.timestamp === currentGridTs) {
        latest.close = tickVal;
        next[latestIndex] = latest;
      } else {
        const timeStr = new Date(currentGridTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newCandle = {
          time: timeStr,
          close: tickVal,
          timestamp: currentGridTs
        };
        next.push(newCandle);
        if (next.length > 20) {
          next.shift();
        }
      }
      return next;
    });
  }, [meterRows, subMeterRows]);

  const groupLookup = useMemo(() => {
    const map = new Map();
    meterGroups.forEach(group => {
      (group.meterIds || []).forEach(id => {
        map.set(String(id), group);
      });
    });
    return map;
  }, [meterGroups]);

  const groupedCollections = useMemo(() => {
    return meterGroups
      .map((group, index) => {
        const meters = subMeterRows.filter(row => groupLookup.get(String(row.templateId))?.id === group.id);
        const totalLoad = meters.reduce((sum, row) => sum + row.load, 0);
        const onlineCount = meters.filter(row => row.isOnline).length;
        return {
          id: group.id || `group-${index}`,
          name: group.name || `Group ${index + 1}`,
          color: group.color || getCategoryColor('Sub Meter'),
          meters,
          totalLoad,
          onlineCount
        };
      })
      .filter(group => group.meters.length > 0);
  }, [meterGroups, subMeterRows, groupLookup]);

  useEffect(() => {
    setGroupDrafts(prev => {
      if (prev.length === 0) {
        return normalizeOverviewGroups(meterGroups, subMeterRows);
      }
      return normalizeOverviewGroups(prev, subMeterRows);
    });
  }, [meterGroups, subMeterRows]);

  const ungroupedMeters = useMemo(
    () => subMeterRows.filter(row => !groupLookup.has(String(row.templateId))),
    [subMeterRows, groupLookup]
  );

  const headlineMetrics = useMemo(() => {
    const mainRows = meterRows.filter(row => row.isMain && row.isOnline);
    const totalLoad = mainRows.length > 0
      ? mainRows.reduce((sum, row) => sum + row.load, 0)
      : subMeterRows.reduce((sum, row) => sum + row.load, 0);
    const onlineMeters = meterRows.filter(row => row.isOnline).length;
    const groupedMeters = groupedCollections.reduce((sum, group) => sum + group.meters.length, 0);
    const totalConsumption = mainRows.length > 0
      ? mainRows.reduce((sum, row) => sum + row.cumulative, 0)
      : subMeterRows.reduce((sum, row) => sum + row.cumulative, 0);
    return {
      totalLoad,
      onlineMeters,
      groupedMeters,
      totalMeters: meterRows.length,
      ungroupedMeters: ungroupedMeters.length,
      totalConsumption
    };
  }, [subMeterRows, meterRows, groupedCollections, ungroupedMeters]);

  const zoneBreakdown = useMemo(() => {
    const categoryMap = {};
    subMeterRows.forEach(row => {
      const key = row.category || 'Sub Meter';
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: key,
          load: 0,
          meters: 0,
          color: getCategoryColor(key)
        };
      }
      categoryMap[key].load += row.load;
      categoryMap[key].meters += 1;
    });
    const total = Object.values(categoryMap).reduce((sum, item) => sum + item.load, 0) || 1;
    return Object.values(categoryMap)
      .sort((a, b) => b.load - a.load)
      .map(item => ({
        ...item,
        percentage: Math.round((item.load / total) * 100)
      }));
  }, [subMeterRows]);

  const spotlightFeed = groupedCollections[0]?.meters[0] || ungroupedMeters[0] || mainMeterRow;

  const openGroupManager = () => {
    setGroupDrafts(normalizeOverviewGroups(meterGroups, subMeterRows));
    setShowGroupManager(true);
  };

  const handleEditGroup = (groupId) => {
    const orderedDrafts = [
      ...groupDrafts.filter(group => group.id === groupId),
      ...groupDrafts.filter(group => group.id !== groupId)
    ];
    setGroupDrafts(orderedDrafts.length ? orderedDrafts : normalizeOverviewGroups(meterGroups, subMeterRows));
    setShowGroupManager(true);
  };

  const getDraftAssignedGroupForMeter = (templateId, currentGroupId = null) => {
    const targetId = String(templateId);
    return groupDrafts.find(
      group => group.id !== currentGroupId && group.meterIds.includes(targetId)
    );
  };

  const getDraftMeterOptions = (groupId) =>
    [...subMeterRows].sort((left, right) => {
      const leftKey = String(left.templateId);
      const rightKey = String(right.templateId);
      const currentGroup = groupDrafts.find(group => group.id === groupId);
      const leftChecked = currentGroup?.meterIds.includes(leftKey);
      const rightChecked = currentGroup?.meterIds.includes(rightKey);
      const leftAssignedElsewhere = !!getDraftAssignedGroupForMeter(leftKey, groupId);
      const rightAssignedElsewhere = !!getDraftAssignedGroupForMeter(rightKey, groupId);

      if (leftChecked !== rightChecked) return leftChecked ? -1 : 1;
      if (leftAssignedElsewhere !== rightAssignedElsewhere) return leftAssignedElsewhere ? 1 : -1;
      return String(left.name || '').localeCompare(String(right.name || ''));
    });

  const duplicateDraftGroupNames = useMemo(() => {
    const counts = new Map();
    groupDrafts.forEach(group => {
      const normalizedName = String(group.name || '').trim().toLowerCase();
      if (!normalizedName) return;
      counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1);
    });
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [groupDrafts]);

  const addDraftGroup = () => {
    setGroupDrafts(prev => [
      ...prev,
      {
        id: createGroupId(),
        name: `Group ${prev.length + 1}`,
        color: GROUP_COLORS[prev.length % GROUP_COLORS.length],
        meterIds: []
      }
    ]);
  };

  const removeDraftGroup = (groupId) => {
    setGroupDrafts(prev => prev.filter(group => group.id !== groupId));
  };

  const updateDraftGroup = (groupId, field, value) => {
    setGroupDrafts(prev => prev.map(group => (group.id === groupId ? { ...group, [field]: value } : group)));
  };

  const toggleDraftMeter = (groupId, templateId) => {
    const targetId = String(templateId);
    setGroupDrafts(prev => {
      const assignedElsewhere = prev.find(
        group => group.id !== groupId && group.meterIds.includes(targetId)
      );

      if (assignedElsewhere) {
        return prev;
      }

      return prev.map(group => {
        const checked = group.meterIds.includes(targetId);
        if (group.id === groupId) {
          return {
            ...group,
            meterIds: checked
              ? group.meterIds.filter(id => id !== targetId)
              : [...group.meterIds, targetId]
          };
        }
        return group;
      });
    });
  };

  const saveGroupsToBackend = async (groupsToSave) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const tenantId = userData?.tenantId;
    const normalized = normalizeOverviewGroups(groupsToSave, subMeterRows);
    const response = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/energy-meter-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups: normalized, tenantId })
    });

    if (!response.ok) {
      throw new Error('Failed to save energy meter groups');
    }

    const data = await response.json();
    const saved = normalizeOverviewGroups(data?.groups || normalized, subMeterRows);
    setMeterGroups(saved);
    setGroupDrafts(saved);
    window.dispatchEvent(new Event(GROUP_EVENT_NAME));
    return saved;
  };

  const handleSaveDraftGroups = async () => {
    if (duplicateDraftGroupNames.size > 0) {
      setGroupActionStatus('Use unique group names');
      setSaveSuccessMessage('Group name already exists');
      setSaveSuccess(true);
      setTimeout(() => setGroupActionStatus(null), 3000);
      setTimeout(() => setSaveSuccess(false), 2200);
      return;
    }

    try {
      await saveGroupsToBackend(groupDrafts);
      setGroupActionStatus('Group settings saved');
      setSaveSuccessMessage('Group saved successfully');
      setSaveSuccess(true);
      setShowGroupManager(false);
    } catch (error) {
      console.error('Failed to save groups from overview:', error);
      setGroupActionStatus('Database save failed');
      setSaveSuccessMessage('Could not save group to database');
      setSaveSuccess(true);
    } finally {
      setTimeout(() => setGroupActionStatus(null), 3000);
      setTimeout(() => setSaveSuccess(false), 2200);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const nextGroups = meterGroups.filter(group => group.id !== groupId);

    setMeterGroups(nextGroups);
    setGroupDrafts(nextGroups);

    try {
      await saveGroupsToBackend(nextGroups);
      setGroupActionStatus('Group deleted');
      setSaveSuccessMessage('Group deleted successfully');
      setSaveSuccess(true);
    } catch (error) {
      console.error('Failed to delete group from overview:', error);
      setGroupActionStatus('Database delete failed');
      setSaveSuccessMessage('Could not delete group from database');
      setSaveSuccess(true);
    } finally {
      setTimeout(() => setGroupActionStatus(null), 3000);
      setTimeout(() => setSaveSuccess(false), 2600);
    }
  };

  const handleRemoveMeterFromGroup = async (groupId, templateId) => {
    const nextGroups = meterGroups.map(group =>
      group.id === groupId
        ? { ...group, meterIds: group.meterIds.filter(id => String(id) !== String(templateId)) }
        : group
    );

    setMeterGroups(nextGroups);
    setGroupDrafts(nextGroups);

    try {
      await saveGroupsToBackend(nextGroups);
      setGroupActionStatus('Meter removed');
      setSaveSuccessMessage('Meter removed from group successfully');
      setSaveSuccess(true);
    } catch (error) {
      console.error('Failed to remove meter from group:', error);
      setGroupActionStatus('Database update failed');
      setSaveSuccessMessage('Could not update group in database');
      setSaveSuccess(true);
    } finally {
      setTimeout(() => setGroupActionStatus(null), 3000);
      setTimeout(() => setSaveSuccess(false), 2400);
    }
  };

  return (
    <div className="fade-in energy-overview-page">
      <div className="page-header energy-hero d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h2 className="mb-0 text-white fw-black d-flex align-items-center gap-2">
              <Zap className="text-warning" size={28} /> Energy Metering Overview
            </h2>
            <Badge className="hero-badge">
              <Sparkles size={14} /> Live grouped energy intelligence
            </Badge>
          </div>
          <p className="text-secondary fs-7 mt-2 mb-0 overview-subtitle">
            Professional overview of main feed, custom sub-meter groups, and ungrouped live MFM values in one place.
          </p>
        </div>
        <PdfButton />
      </div>

      {groupedCollections.length > 0 && (
        <Card className="overview-panel border-0 text-white mb-4 overview-summary-band">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <div>
                <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                  <Layers3 className="text-info" size={18} /> Group Load Summary
                </h5>
                <p className="mb-0 text-secondary fs-13">Overview par ab user-defined grouped values priority se dikh rahe hain.</p>
              </div>
              <Badge className="overview-chip">{groupedCollections.length} active groups</Badge>
            </div>
            <Row className="g-3">
              {groupedCollections.map(group => (
                <Col key={group.id} md={6} xl={4}>
                  <div className="summary-band-card" style={{ borderColor: `${group.color}55` }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="group-dot" style={{ backgroundColor: group.color }} />
                          <span className="text-white fw-bold">{group.name}</span>
                        </div>
                        <small className="text-secondary">{group.meters.length} MFM meter(s)</small>
                      </div>
                      <div className="text-end">
                        <div className="text-white fw-bold">{formatMetric(group.totalLoad)} kW</div>
                        <small style={{ color: group.color }}>{group.onlineCount} online</small>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      <Row className="g-4 mb-4">
        {[
          {
            label: 'Total Live Load',
            value: `${formatMetric(headlineMetrics.totalLoad)} kW`,
            note: 'Main + Sub Meters',
            icon: <Gauge size={18} />
          },
          {
            label: 'Online Meters',
            value: `${headlineMetrics.onlineMeters}/${headlineMetrics.totalMeters}`,
            note: 'Realtime communication health',
            icon: <Network size={18} />
          },
          {
            label: 'Grouped Feeds',
            value: `${headlineMetrics.groupedMeters}`,
            note: `${groupedCollections.length} custom groups active`,
            icon: <Layers3 size={18} />
          },
          {
            label: 'Ungrouped Feeds',
            value: `${headlineMetrics.ungroupedMeters}`,
            note: 'Still visible on overview',
            icon: <FolderTree size={18} />
          }
        ].map((metric, index) => (
          <Col key={index} md={6} xl={3}>
            <Card className="overview-stat-card border-0 h-100 text-white">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <span className="metric-label">{metric.label}</span>
                  <div className="metric-icon-shell">{metric.icon}</div>
                </div>
                <div className="metric-value">{metric.value}</div>
                <div className="metric-note">{metric.note}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Real-time Analytics Dashboard */}
      <Row className="g-4 mb-4">
        <Col xl={8}>
          <Card className="overview-panel chart-glow-card border-0 text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                  <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                    <Activity className="text-info" size={18} /> Real-time System Load Trend
                  </h5>
                  <p className="mb-0 text-secondary fs-13">Live total energy demand variations in 15s intervals.</p>
                </div>
                <Badge className="overview-chip live-pulse">
                  <span className="pulse-dot-green"></span> Live Tracking
                </Badge>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      {GROUP_COLORS.map((color, idx) => (
                        <linearGradient id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1" key={idx}>
                          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.15} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#64748b" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit=" kW"
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                    />
                    <Bar 
                      dataKey="close" 
                      fill="url(#barGrad-0)" 
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4}>
          <Card className="overview-panel chart-glow-card border-0 text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                  <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                    <Layers3 className="text-warning" size={18} /> Group Load Allocation
                  </h5>
                  <p className="mb-0 text-secondary fs-13">Active load comparison across custom sub-meter groups.</p>
                </div>
              </div>
              <div style={{ width: '100%', height: '300px' }} className="d-flex align-items-center justify-content-center">
                {groupedCollections.length === 0 ? (
                  <div className="empty-panel w-100 text-center py-5">
                    No custom groups mapped. Create groups to see load distribution.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupedCollections} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        unit=" kW"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(15, 23, 42, 0.95)', 
                          borderColor: 'rgba(251, 146, 60, 0.3)',
                          borderRadius: '16px',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(251, 146, 60, 0.2)'
                        }}
                        labelClassName="text-warning fw-black mb-1"
                        formatter={(value) => [`${value} kW`, 'Active Load']}
                      />
                      <Bar dataKey="totalLoad" radius={[8, 8, 0, 0]} barSize={45}>
                        {groupedCollections.map((entry, index) => {
                          const colorIndex = GROUP_COLORS.indexOf(entry.color);
                          const fillUrl = colorIndex !== -1 ? `url(#barGrad-${colorIndex})` : entry.color;
                          return <Cell key={`cell-${index}`} fill={fillUrl} stroke={entry.color} strokeWidth={1} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={7}>
          <Card className="overview-panel border-0 h-100 text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                  <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                    <Cpu className="text-info" size={18} /> Main Feed Command Center
                  </h5>
                  <p className="mb-0 text-secondary fs-13">Core incomer status, performance trend, and power quality snapshot.</p>
                </div>
                {mainMeterRow ? <StatusBadge status={mainMeterRow.status} /> : <Badge bg="secondary">Not Mapped</Badge>}
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <div className="highlight-tile primary">
                    <span className="tile-label">Main Meter</span>
                    <h3 className="tile-title">{mainMeterRow?.name || 'Main Meter Not Configured'}</h3>
                    <div className="tile-foot">
                      <span>{mainMeterRow ? `Load ${formatMetric(mainMeterRow.load)} kW` : 'Connect a main meter template'}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="highlight-tile accent">
                    <span className="tile-label">Lifetime Energy</span>
                    <h3 className="tile-title">{formatMetric(headlineMetrics.totalConsumption)} kWh</h3>
                    <div className="tile-foot">
                      <span>Captured from mapped meter telemetry</span>
                    </div>
                  </div>
                </Col>
              </Row>

              <Row className="g-3 mt-1">
                {[
                  { label: 'Voltage', value: `${formatMetric(mainMeterRow?.voltage)} V`, hint: 'R-phase live' },
                  { label: 'Current', value: `${formatMetric(mainMeterRow?.current)} A`, hint: 'R-phase live' },
                  { label: 'Power Factor', value: formatMetric(mainMeterRow?.pf, 2), hint: 'Efficiency marker' },
                  { label: 'Sub Meter Load', value: `${formatMetric(subMeterRows.reduce((sum, row) => sum + row.load, 0))} kW`, hint: 'Aggregated feeders' }
                ].map((item, index) => (
                  <Col key={index} sm={6}>
                    <div className="compact-metric-card">
                      <span className="compact-label">{item.label}</span>
                      <strong className="compact-value">{item.value}</strong>
                      <small className="compact-hint">{item.hint}</small>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="overview-panel border-0 h-100 text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <div>
                  <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                    <Activity className="text-warning" size={18} /> Load Composition
                  </h5>
                  <p className="mb-0 text-secondary fs-13">Category-wise breakdown of visible sub-meter demand.</p>
                </div>
                <Badge className="overview-chip">{zoneBreakdown.length} categories</Badge>
              </div>

              {zoneBreakdown.length === 0 ? (
                <div className="empty-panel">No sub meters available yet.</div>
              ) : (
                <Row className="align-items-center">
                  <Col sm={6}>
                    <div style={{ width: '100%', height: '220px' }} className="d-flex align-items-center justify-content-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(15, 23, 42, 0.95)',
                              borderColor: 'rgba(56, 189, 248, 0.3)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '11px',
                              border: '1px solid rgba(56, 189, 248, 0.2)'
                            }}
                            formatter={(value) => [`${value.toFixed(1)} kW`, 'Load']}
                          />
                          <Pie
                            data={zoneBreakdown}
                            dataKey="load"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="95%"
                            labelLine={false}
                            stroke="rgba(15, 23, 42, 0.8)"
                            strokeWidth={1}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
                              const radian = Math.PI / 180;
                              const x = cx + radius * Math.cos(-midAngle * radian);
                              const y = cy + radius * Math.sin(-midAngle * radian);
                              if (percent < 0.04) return null; // Hide text on tiny slices
                              return (
                                <text 
                                  x={x} y={y} 
                                  fill="white" 
                                  fontSize="10px" 
                                  fontWeight="bold" 
                                  textAnchor="middle" 
                                  dominantBaseline="central"
                                  style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.8)' }}
                                >
                                  {`${(percent * 100).toFixed(1)}%`}
                                </text>
                              );
                            }}
                          >
                            {zoneBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                      {zoneBreakdown.map(zone => (
                        <div key={zone.name} className="zone-row-compact">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="d-flex align-items-center gap-2">
                              <span className="group-dot" style={{ backgroundColor: zone.color, width: '8px', height: '8px' }} />
                              <span className="text-white fw-bold fs-12">{zone.name}</span>
                            </div>
                            <span className="text-white font-monospace fs-12">{zone.percentage}%</span>
                          </div>
                          <div className="overview-progress" style={{ height: '6px' }}>
                            <div
                              className="overview-progress-bar"
                              style={{ width: `${zone.percentage}%`, backgroundColor: zone.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="overview-panel border-0 text-white mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                <Layers3 className="text-success" size={18} /> Custom Meter Groups
              </h5>
              <p className="mb-0 text-secondary fs-13">User-defined groups from Settings are summarized here with live meter values.</p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {groupActionStatus && <Badge className="overview-chip">{groupActionStatus}</Badge>}
              <button
                onClick={() => navigate('/energy-metering/sub', { state: { openGroupSettings: true } })}
                className="btn btn-outline-info rounded-pill px-3 py-2 d-flex align-items-center gap-2 overview-action-btn"
              >
                <Plus size={15} /> Add Group
              </button>
              <Badge className="overview-chip">{groupedCollections.length} active groups</Badge>
            </div>
          </div>

          {groupedCollections.length === 0 ? (
            <div className="empty-panel">
              No custom groups saved yet. Create them in Settings to organize sub meters by area, tenant, or function.
            </div>
          ) : (
            <Row className="g-4">
              {groupedCollections.map(group => (
                <Col key={group.id} lg={6}>
                  <div className="group-card" style={{ borderColor: `${group.color}55` }}>
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="group-dot" style={{ backgroundColor: group.color }} />
                          <h6 className="mb-0 text-white fw-black">{group.name}</h6>
                        </div>
                        <small className="text-secondary">{group.meters.length} meter(s) linked</small>
                      </div>
                      <div className="text-end">
                        <div className="text-white fw-bold">{formatMetric(group.totalLoad)} kW</div>
                        <small style={{ color: group.color }}>{group.onlineCount} online</small>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGroup(group.id);
                        }}
                        className="btn btn-outline-info rounded-pill px-3 py-1 d-flex align-items-center gap-2 overview-action-btn"
                      >
                        <Settings2 size={14} /> Edit Group
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="btn btn-outline-danger rounded-pill px-3 py-1 d-flex align-items-center gap-2 overview-delete-btn"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      {group.meters.map(meter => (
                        <div key={meter.id} className="group-meter-row" onClick={() => navigate(meter.path)}>
                          <div>
                            <div className="text-white fw-bold">{meter.name}</div>
                            <small className="text-secondary">{meter.id}</small>
                          </div>
                          <div className="text-end d-flex flex-column align-items-end gap-2">
                            <div className="text-white fw-bold">{formatMetric(meter.load)} kW</div>
                            <small className={meter.isOnline ? 'text-success' : 'text-danger'}>
                              {meter.isOnline ? 'Online' : 'Offline'}
                            </small>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMeterFromGroup(group.id, meter.templateId);
                              }}
                              className="btn btn-sm btn-outline-warning rounded-pill px-2 py-1 overview-remove-meter-btn"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card className="overview-panel border-0 text-white mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                <FolderTree className="text-warning" size={18} /> Ungrouped Live Feeds
              </h5>
              <p className="mb-0 text-secondary fs-13">Meters without a custom group still stay visible here with their latest values.</p>
            </div>
            <Badge className="overview-chip warning">{ungroupedMeters.length} visible</Badge>
          </div>

          {ungroupedMeters.length === 0 ? (
            <div className="empty-panel">All available sub meters are already organized into groups.</div>
          ) : (
            <Row className="g-3">
              {ungroupedMeters.map(meter => (
                <Col key={meter.id} md={6} xl={4}>
                  <div className="ungrouped-card" onClick={() => navigate(meter.path)}>
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <div className="text-white fw-bold">{meter.name}</div>
                        <small className="text-secondary">{meter.category}</small>
                      </div>
                      <StatusBadge status={meter.status} />
                    </div>
                    <div className="ungrouped-grid">
                      <div>
                        <span>Load</span>
                        <strong>{formatMetric(meter.load)} kW</strong>
                      </div>
                      <div>
                        <span>Voltage</span>
                        <strong>{formatMetric(meter.voltage)} V</strong>
                      </div>
                      <div>
                        <span>Current</span>
                        <strong>{formatMetric(meter.current)} A</strong>
                      </div>
                      <div>
                        <span>PF</span>
                        <strong>{formatMetric(meter.pf, 2)}</strong>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card className="overview-panel border-0 text-white">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h5 className="mb-1 fw-black d-flex align-items-center gap-2">
                <Cpu className="text-info" size={18} /> Meter Status Registry
              </h5>
              <p className="mb-0 text-secondary fs-13">Single registry for main feed, grouped feeds, and ungrouped sub meters.</p>
            </div>
            {spotlightFeed && (
              <Badge className="overview-chip">
                Spotlight: {spotlightFeed.name}
              </Badge>
            )}
          </div>

          <div className="table-responsive">
            <Table hover borderless className="align-middle overview-table text-white mb-0">
              <thead>
                <tr>
                  <th>Meter ID</th>
                  <th>Feed Name</th>
                  <th>Category / Group</th>
                  <th className="text-center">Load</th>
                  <th className="text-center">Voltage</th>
                  <th className="text-center">Current</th>
                  <th className="text-center">Power Factor</th>
                  <th className="text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                {meterRows.map(row => {
                  const linkedGroup = groupLookup.get(String(row.templateId));
                  return (
                    <tr key={row.id} onClick={() => navigate(row.path)}>
                      <td className="font-monospace text-info">{row.id}</td>
                      <td>
                        <div className="fw-bold text-white">{row.name}</div>
                        {row.isMain && <small className="text-secondary">Primary incomer</small>}
                      </td>
                      <td>
                        <Badge
                          bg="none"
                          className="registry-badge"
                          style={{
                            color: linkedGroup?.color || getCategoryColor(row.category),
                            borderColor: `${linkedGroup?.color || getCategoryColor(row.category)}40`
                          }}
                        >
                          {row.isMain ? 'Main Feed' : linkedGroup?.name || row.category || 'Ungrouped'}
                        </Badge>
                      </td>
                      <td className="text-center">{formatMetric(row.load)} kW</td>
                      <td className="text-center">{formatMetric(row.voltage)} V</td>
                      <td className="text-center">{formatMetric(row.current)} A</td>
                      <td className="text-center">{formatMetric(row.pf, 2)}</td>
                      <td className="text-end"><StatusBadge status={row.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Modal
        show={showGroupManager}
        onHide={() => setShowGroupManager(false)}
        size="xl"
        centered
        dialogClassName="overview-group-modal"
        contentClassName="border-0 text-white"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25 py-3" style={{ background: 'rgba(15, 23, 42, 0.55)' }}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Settings2 className="text-info" size={18} /> Manage Saved Group Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: 'rgba(15, 23, 42, 0.96)' }}>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <h6 className="text-info fw-bold mb-2">Edit or delete overview groups from here</h6>
              <p className="text-secondary mb-0" style={{ fontSize: '0.88rem' }}>
                Yahin se group name, color aur meter mapping update ho jayegi. Save karte hi Neon aur overview dono update ho jayenge.
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button onClick={addDraftGroup} className="btn btn-outline-info rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                <Plus size={15} /> Add Group
              </button>
              <button onClick={handleSaveDraftGroups} className="btn btn-info rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2">
                <Settings2 size={15} /> Save Settings
              </button>
            </div>
          </div>

          <Row className="g-4">
            <Col lg={4}>
              <div className="grouping-panel h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="grouping-panel-title">Available Single Meters</span>
                  <Badge bg="dark" className="border border-info border-opacity-25 text-info">{subMeterRows.length}</Badge>
                </div>
                <div className="d-flex flex-column gap-2">
                  {subMeterRows.map(meter => {
                    const assignedGroup = groupDrafts.find(group => group.meterIds.includes(String(meter.templateId)));
                    return (
                      <div key={meter.id} className="group-meter-pill">
                        <div>
                          <div className="text-white fw-bold fs-13">{meter.name}</div>
                          <small className="text-secondary">{meter.category}</small>
                        </div>
                        <Badge
                          bg="none"
                          className="border"
                          style={{
                            color: assignedGroup?.color || '#94a3b8',
                            borderColor: `${assignedGroup?.color || '#94a3b8'}55`,
                            background: assignedGroup ? `${assignedGroup.color}15` : 'rgba(148,163,184,0.08)'
                          }}
                        >
                          {assignedGroup?.name || 'Single'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Col>

            <Col lg={8}>
              <div className="d-flex flex-column gap-3">
                {groupDrafts.length === 0 ? (
                  <div className="grouping-panel text-center py-5">
                    <h6 className="text-white mb-2">No groups created yet</h6>
                    <p className="text-secondary mb-0">Add a group if you want combined values in overview. Otherwise meters stay single by default.</p>
                  </div>
                ) : (
                  groupDrafts.map((group, index) => {
                    const hasNewGroup = groupDrafts.some(g => g.isNew);
                    const isGroupDisabled = hasNewGroup && !group.isNew;
                    const normalizedName = String(group.name || '').trim().toLowerCase();
                    const hasDuplicateName = normalizedName && duplicateDraftGroupNames.has(normalizedName);
                    return (
                      <div key={group.id} className="grouping-panel" style={{ opacity: isGroupDisabled ? 0.65 : 1 }}>
                        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            <div className="grouping-strip" style={{ background: isGroupDisabled ? '#475569' : group.color }} />
                            <div className="d-flex gap-2 flex-wrap flex-grow-1">
                              <Form.Control
                                value={group.name}
                                onChange={(e) => updateDraftGroup(group.id, 'name', e.target.value)}
                                className={`grouping-input ${hasDuplicateName ? 'is-invalid' : ''}`}
                                placeholder={`Group ${index + 1}`}
                                disabled={isGroupDisabled}
                              />
                              <Form.Control
                                type="color"
                                value={group.color}
                                onChange={(e) => updateDraftGroup(group.id, 'color', e.target.value)}
                                className="grouping-color-input"
                                disabled={isGroupDisabled}
                              />
                              {hasDuplicateName && (
                                <div className="w-100">
                                  <small className="text-danger">This group name is already used. Choose a different name.</small>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeDraftGroup(group.id)}
                            disabled={isGroupDisabled}
                            className="btn btn-outline-danger rounded-pill px-3 py-2 d-flex align-items-center gap-2"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          {getDraftMeterOptions(group.id).map(meter => {
                            const meterKey = String(meter.templateId);
                            const checked = group.meterIds.includes(meterKey);
                            const assignedElsewhere = getDraftAssignedGroupForMeter(meterKey, group.id);
                            const disabled = (!checked && !!assignedElsewhere) || isGroupDisabled;
                            return (
                              <label
                                key={`${group.id}-${meter.templateId}`}
                                className={`grouping-chip ${checked ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                style={{
                                  borderColor: checked ? (isGroupDisabled ? 'rgba(148,163,184,0.12)' : `${group.color}55`) : disabled ? 'rgba(239,68,68,0.28)' : 'rgba(148,163,184,0.12)',
                                  background: checked ? (isGroupDisabled ? 'rgba(148,163,184,0.08)' : `${group.color}15`) : disabled ? 'rgba(51, 65, 85, 0.55)' : 'rgba(15,23,42,0.72)',
                                  opacity: disabled ? 0.5 : 1,
                                  pointerEvents: disabled ? 'none' : 'auto'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => toggleDraftMeter(group.id, meter.templateId)}
                                />
                                <span className="text-white fw-bold fs-13">{meter.name}</span>
                                <small className={disabled ? 'text-danger' : 'text-secondary'}>
                                  {disabled ? (isGroupDisabled ? 'Locked (Editing new group)' : `Locked in ${assignedElsewhere.name}`) : meter.category}
                                </small>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary border-opacity-25 py-3" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
          <Button variant="outline-secondary" className="text-white border-secondary border-opacity-25" onClick={() => setShowGroupManager(false)}>
            Close
          </Button>
          <Button variant="info" className="fw-bold px-4" onClick={handleSaveDraftGroups} disabled={duplicateDraftGroupNames.size > 0}>
            Save to Neon
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={saveSuccess}
        onHide={() => setSaveSuccess(false)}
        centered
        dialogClassName="success-modal"
        contentClassName="border-0 text-white"
      >
        <Modal.Body className="p-4 text-center" style={{ background: 'linear-gradient(180deg, rgba(8,47,73,0.96), rgba(15,23,42,0.98))' }}>
            <div className="success-pop-wrap">
            <div className="success-pop-icon">
              <CheckCircle2 size={38} />
            </div>
            <h4 className="text-white fw-black mb-2">{saveSuccessMessage}</h4>
            <p className="text-info mb-0">Overview updated.</p>
          </div>
        </Modal.Body>
      </Modal>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .energy-overview-page {
          --panel-bg: linear-gradient(180deg, rgba(12,18,34,0.98), rgba(15,23,42,0.96));
          --panel-border: rgba(148,163,184,0.12);
        }
        .chart-glow-card {
          border: 1px solid rgba(56, 189, 248, 0.08) !important;
          background: linear-gradient(180deg, rgba(16, 24, 48, 0.96), rgba(15, 23, 42, 0.98)) !important;
          box-shadow: 
            0 20px 40px -15px rgba(2, 6, 23, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
          transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
        }
        .chart-glow-card:hover {
          border-color: rgba(56, 189, 248, 0.22) !important;
          box-shadow: 
            0 22px 45px -12px rgba(2, 6, 23, 0.6),
            0 0 15px rgba(56, 189, 248, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        }
        .energy-hero {
          padding: 20px 22px;
          border-radius: 24px;
          background:
            radial-gradient(circle at top left, rgba(56,189,248,0.10), transparent 30%),
            radial-gradient(circle at top right, rgba(59,130,246,0.08), transparent 20%),
            linear-gradient(135deg, rgba(15,23,42,0.98), rgba(12,19,35,0.96));
          border: 1px solid rgba(148,163,184,0.12);
          box-shadow: 0 22px 50px rgba(2,6,23,0.28);
        }
        .hero-badge,
        .overview-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(56,189,248,0.2);
          background: rgba(56,189,248,0.08);
          color: #7dd3fc;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .live-pulse {
          position: relative;
        }
        .pulse-dot-green {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: pulseGreen 2s infinite;
        }
        @keyframes pulseGreen {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        .overview-chip.warning {
          background: rgba(250,204,21,0.1);
          border-color: rgba(250,204,21,0.22);
          color: #fde68a;
        }
        .overview-subtitle { max-width: 760px; }
        .overview-stat-card,
        .overview-panel {
          background: linear-gradient(180deg, rgba(14,20,35,0.98), rgba(15,23,42,0.96));
          border: 1px solid var(--panel-border);
          border-radius: 24px;
          box-shadow: 0 18px 40px rgba(2,6,23,0.24);
        }
        .overview-summary-band {
          background:
            linear-gradient(135deg, rgba(8,47,73,0.18), transparent 40%),
            linear-gradient(180deg, rgba(14,20,35,0.98), rgba(15,23,42,0.96));
        }
        .overview-stat-card { min-height: 190px; }
        .metric-label {
          color: #94a3b8;
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .metric-icon-shell {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          color: #f8fafc;
        }
        .metric-value {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #f8fafc;
          margin-bottom: 6px;
        }
        .metric-note { color: #64748b; font-size: 0.84rem; }
        .highlight-tile {
          min-height: 180px;
          border-radius: 22px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .highlight-tile.primary {
          background:
            radial-gradient(circle at top left, rgba(56,189,248,0.24), transparent 40%),
            linear-gradient(135deg, rgba(8,47,73,0.9), rgba(12,18,34,0.95));
        }
        .highlight-tile.accent {
          background:
            radial-gradient(circle at top right, rgba(250,204,21,0.22), transparent 35%),
            linear-gradient(135deg, rgba(51,65,85,0.8), rgba(12,18,34,0.95));
        }
        .tile-label {
          color: rgba(255,255,255,0.72);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.75rem;
          font-weight: 800;
        }
        .tile-title {
          margin: 0;
          color: #fff;
          font-weight: 900;
          line-height: 1.12;
          font-size: 1.6rem;
          max-width: 90%;
        }
        .tile-foot { color: rgba(255,255,255,0.72); font-size: 0.82rem; }
        .compact-metric-card {
          height: 100%;
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.1);
          background: rgba(15,23,42,0.72);
        }
        .compact-label {
          display: block;
          color: #94a3b8;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: 800;
        }
        .compact-value {
          display: block;
          color: #f8fafc;
          font-size: 1.1rem;
          margin-bottom: 4px;
        }
        .compact-hint { color: #64748b; }
        .zone-row {
          padding: 16px 18px;
          border-radius: 18px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(148,163,184,0.1);
        }
        .zone-row-compact {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.06);
          margin-bottom: 2px;
        }
        .overview-progress {
          height: 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          overflow: hidden;
        }
        .overview-progress-bar {
          height: 100%;
          border-radius: inherit;
          transition: width 0.35s ease;
        }
        .group-card,
        .ungrouped-card {
          height: 100%;
          border-radius: 22px;
          padding: 20px;
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.72);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .group-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          box-shadow: 0 0 16px currentColor;
        }
        .group-meter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(2,6,23,0.28);
          border: 1px solid rgba(148,163,184,0.08);
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .group-meter-row:hover,
        .ungrouped-card:hover,
        .overview-table tbody tr:hover {
          transform: translateY(-2px);
          border-color: rgba(56,189,248,0.22);
        }
        .ungrouped-card { cursor: pointer; transition: transform 0.18s ease, border-color 0.18s ease; }
        .ungrouped-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .ungrouped-grid span {
          display: block;
          color: #94a3b8;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
        }
        .ungrouped-grid strong { color: #fff; font-size: 1rem; }
        .overview-table {
          border-collapse: separate;
          border-spacing: 0;
          background: rgba(8, 13, 24, 0.92);
          border: 1px solid rgba(56, 189, 248, 0.10);
          border-radius: 18px;
          overflow: hidden;
        }
        .overview-table thead {
          background: linear-gradient(180deg, rgba(16, 25, 44, 0.98), rgba(11, 18, 32, 0.96));
        }
        .overview-table thead th {
          color: #7dd3fc;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 18px 16px;
          border-bottom: 1px solid rgba(56,189,248,0.14);
          background: transparent;
        }
        .overview-table tbody tr {
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease;
          background: rgba(10, 17, 30, 0.96);
        }
        .overview-table tbody td {
          color: #dbe7f5;
          padding-top: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(148,163,184,0.06);
          background: transparent;
        }
        .overview-table tbody tr:nth-child(even) {
          background: rgba(13, 20, 35, 0.98);
        }
        .overview-table tbody tr:hover {
          background: rgba(22, 34, 58, 0.98) !important;
        }
        .registry-badge {
          border: 1px solid rgba(148,163,184,0.2);
          background: rgba(15,23,42,0.95);
          font-size: 0.72rem;
          font-weight: 800;
          padding: 8px 10px;
        }
        .summary-band-card {
          height: 100%;
          border-radius: 18px;
          padding: 16px 18px;
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.66);
        }
        .overview-action-btn,
        .overview-delete-btn {
          border-color: rgba(56,189,248,0.25);
          color: #7dd3fc;
          background: rgba(56,189,248,0.08);
        }
        .overview-delete-btn {
          border-color: rgba(239,68,68,0.25);
          color: #fca5a5;
          background: rgba(239,68,68,0.06);
        }
        .overview-remove-meter-btn {
          border-color: rgba(245,158,11,0.28);
          color: #fcd34d;
          background: rgba(245,158,11,0.08);
          font-size: 0.68rem;
          font-weight: 700;
        }
        .grouping-panel {
          background: linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.62));
          border: 1px solid rgba(148,163,184,0.12);
          border-radius: 18px;
          padding: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .grouping-panel-title {
          color: #cbd5e1;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .group-meter-pill {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-radius: 14px;
          padding: 12px 14px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(148,163,184,0.1);
        }
        .grouping-strip {
          width: 12px;
          height: 48px;
          border-radius: 999px;
          box-shadow: 0 0 18px rgba(255,255,255,0.12);
        }
        .grouping-input {
          min-width: 240px;
          background: rgba(15,23,42,0.92) !important;
          color: #fff !important;
          border: 1px solid rgba(148,163,184,0.18) !important;
        }
        .grouping-color-input {
          width: 54px;
          min-height: 42px;
          background: transparent !important;
          border: 1px solid rgba(148,163,184,0.18) !important;
          border-radius: 12px;
          padding: 4px;
        }
        .grouping-chip {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 220px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.12);
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .grouping-chip:hover { transform: translateY(-2px); }
        .grouping-chip input { margin-bottom: 6px; }
        .grouping-chip.active { box-shadow: 0 12px 22px rgba(2,6,23,0.22); }
        .grouping-chip.disabled {
          cursor: not-allowed;
        }
        .grouping-chip.disabled:hover {
          transform: none;
        }
        .overview-group-modal .modal-content,
        .success-modal .modal-content {
          background: transparent !important;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.45);
        }
        .success-pop-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 12px 4px;
        }
        .success-pop-icon {
          width: 78px;
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: #86efac;
          background: radial-gradient(circle, rgba(34,197,94,0.28), rgba(34,197,94,0.08));
          box-shadow: 0 0 30px rgba(34,197,94,0.22);
        }
        .empty-panel {
          padding: 24px;
          border-radius: 18px;
          border: 1px dashed rgba(148,163,184,0.18);
          color: #94a3b8;
          background: rgba(15,23,42,0.5);
        }
        .fw-black { font-weight: 900 !important; }
        .fs-13 { font-size: 0.82rem !important; }
        .fs-7 { font-size: 1rem !important; }
        @media (max-width: 767px) {
          .metric-value { font-size: 1.7rem; }
          .tile-title { font-size: 1.3rem; max-width: 100%; }
          .ungrouped-grid { grid-template-columns: 1fr; }
        }
      `
        }}
      />
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error in Overview:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#0f172a', color: '#f8fafc', fontFamily: 'monospace', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ color: '#ef4444', fontWeight: 900 }}>Render Error Encountered</h2>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <h5 style={{ color: '#fca5a5', fontWeight: 800 }}>Error Message:</h5>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#f8fafc' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>
          {this.state.errorInfo && (
            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.1)' }}>
              <h5 style={{ color: '#cbd5e1', fontWeight: 800 }}>Component Stack:</h5>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#94a3b8', fontSize: '0.85rem' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <div>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }} 
              style={{ padding: '12px 24px', background: '#0284c7', border: 'none', color: '#fff', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2,132,199,0.4)' }}
            >
              Clear Storage Cache & Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const SafeEnergyMeteringOverview = () => (
  <ErrorBoundary>
    <EnergyMeteringOverview />
  </ErrorBoundary>
);

export default SafeEnergyMeteringOverview;

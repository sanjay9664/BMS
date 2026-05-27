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
  CheckCircle2,
  Battery,
  Plug,
  Flashlight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
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
  VRV: '#f87171',
  Lighting: '#a78bfa',
  'Sub Meter': '#94a3b8',
  Ungrouped: '#facc15'
};

const getCategoryColor = (category) => {
  if (!category) return '#94a3b8';
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
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
  if (targetName.includes('VRV') || targetName.includes('CHILLER') || targetName.includes('AC')) return 'VRV';
  if (targetName.includes('LIGHT') || targetName.includes('STREET') || targetName.includes('PARKING')) return 'Lighting';
  return 'Sub Meter';
};

const ParameterCard = ({ label, value, unit, icon, colorClass = "info" }) => (
  <div className={`param-card border-${colorClass}`}>
    <div className="d-flex align-items-center justify-content-between mb-1">
      <span className="param-label">{label}</span>
      <span className={`text-${colorClass}`}>{icon}</span>
    </div>
    <div className="d-flex align-items-baseline gap-1 mt-2">
      <span className="param-value">{value}</span>
      <span className="param-unit">{unit}</span>
    </div>
  </div>
);

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
  const [selectedMainMeterId, setSelectedMainMeterId] = useState('');
  const [selectedSubMeterId, setSelectedSubMeterId] = useState('');
  const [showGroups, setShowGroups] = useState(false);

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

    const TELEMETRY_FRESHNESS_MS = 24 * 60 * 60 * 1000;
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

  const extractMeterParameters = (template, isMain, index) => {
    const isOnline = isTemplateOnline(template);
    
    // Extracting comprehensive parameters exactly as requested
    const loadKw = getTelemetryValue(template, 'emChangeConfig', 'totalKw') ?? getTelemetryValue(template, 'emPowerConfig', 'activePower');
    const loadKva = getTelemetryValue(template, 'emChangeConfig', 'totalKva') ?? getTelemetryValue(template, 'emPowerConfig', 'apparentPower');
    const kwh = getTelemetryValue(template, 'emReadConfig', 'ebKwh') ?? getTelemetryValue(template, 'emChangeConfig', 'ebKwh') ?? getTelemetryValue(template, 'emConsumptionConfig', 'cumulativekWh');
    const kvah = getTelemetryValue(template, 'emReadConfig', 'ebKvah') ?? getTelemetryValue(template, 'emChangeConfig', 'ebKvah');

    const vR = getTelemetryValue(template, 'emChangeConfig', 'vR') ?? getTelemetryValue(template, 'emVoltageConfig', 'vR');
    const vY = getTelemetryValue(template, 'emChangeConfig', 'vY') ?? getTelemetryValue(template, 'emVoltageConfig', 'vY');
    const vB = getTelemetryValue(template, 'emChangeConfig', 'vB') ?? getTelemetryValue(template, 'emVoltageConfig', 'vB');

    const iR = getTelemetryValue(template, 'emChangeConfig', 'iR') ?? getTelemetryValue(template, 'emCurrentConfig', 'iR');
    const iY = getTelemetryValue(template, 'emChangeConfig', 'iY') ?? getTelemetryValue(template, 'emCurrentConfig', 'iY');
    const iB = getTelemetryValue(template, 'emChangeConfig', 'iB') ?? getTelemetryValue(template, 'emCurrentConfig', 'iB');

    const pf = getTelemetryValue(template, 'emChangeConfig', 'pf') ?? getTelemetryValue(template, 'emSystemConfig', 'pf');

    return {
      id: `${isMain ? 'MAIN' : 'SM'}-${template.id || index + 1}`,
      templateId: String(template.id || index + 1),
      name: template.mapping?.energyMeteringTarget || template.name || `${isMain ? 'Main Feed' : 'Sub Meter'} ${index + 1}`,
      category: isMain ? 'Main Feed' : resolveSubMeterCategory(template),
      isMain,
      isOnline,
      status: isOnline ? 'Running' : 'Offline',
      path: isMain ? '/energy-metering/main' : '/energy-metering/sub',
      
      // Core Parameters
      loadKw: isOnline ? parseNumber(loadKw) : 0,
      loadKva: isOnline ? parseNumber(loadKva) : 0,
      kwh: parseNumber(kwh),
      kvah: parseNumber(kvah),
      pf: isOnline ? parseNumber(pf, 2) : 0,

      // Phases
      vR: isOnline ? parseNumber(vR) : 0,
      vY: isOnline ? parseNumber(vY) : 0,
      vB: isOnline ? parseNumber(vB) : 0,
      iR: isOnline ? parseNumber(iR) : 0,
      iY: isOnline ? parseNumber(iY) : 0,
      iB: isOnline ? parseNumber(iB) : 0,
    };
  };

  const meterRows = useMemo(() => {
    const rows = [];
    mainMeterTemplates.forEach((template, index) => {
      rows.push(extractMeterParameters(template, true, index));
    });
    subMeterTemplates.forEach((template, index) => {
      rows.push(extractMeterParameters(template, false, index));
    });
    return rows;
  }, [mainMeterTemplates, subMeterTemplates, telemetryStats, getOverallStatus]);

  const mainMeterRow = useMemo(() => {
    const mainRows = meterRows.filter(row => row.isMain);
    return mainRows.find(row => row.isOnline) || mainRows[0];
  }, [meterRows]);

  const subMeterRows = meterRows.filter(row => !row.isMain);

  const inspectionMainMeter = useMemo(() => {
    if (!selectedMainMeterId) {
      const mainMeters = meterRows.filter(m => m.isMain);
      return mainMeters[0] || meterRows[0] || null;
    }
    return meterRows.find(m => m.id === selectedMainMeterId) || null;
  }, [selectedMainMeterId, meterRows]);

  const inspectionSubMeter = useMemo(() => {
    if (!selectedSubMeterId) {
      const subMeters = meterRows.filter(m => !m.isMain);
      return subMeters[0] || meterRows[1] || meterRows[0] || null;
    }
    return meterRows.find(m => m.id === selectedSubMeterId) || null;
  }, [selectedSubMeterId, meterRows]);

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
        
        // Aggregate totals for the group
        const totalLoadKw = meters.reduce((sum, row) => sum + row.loadKw, 0);
        const totalLoadKva = meters.reduce((sum, row) => sum + row.loadKva, 0);
        const totalKwh = meters.reduce((sum, row) => sum + row.kwh, 0);
        const totalKvah = meters.reduce((sum, row) => sum + row.kvah, 0);
        
        const onlineCount = meters.filter(row => row.isOnline).length;
        
        return {
          id: group.id || `group-${index}`,
          name: group.name || `Group ${index + 1}`,
          color: group.color || getCategoryColor('Sub Meter'),
          meters,
          totalLoadKw,
          totalLoadKva,
          totalKwh,
          totalKvah,
          onlineCount
        };
      })
      .filter(group => group.meters.length > 0)
      .sort((a, b) => b.totalLoadKw - a.totalLoadKw); // SORT DESCENDING BY LOAD (KW) AS REQUESTED
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
      ? mainRows.reduce((sum, row) => sum + row.loadKw, 0)
      : subMeterRows.reduce((sum, row) => sum + row.loadKw, 0);
    const onlineMeters = meterRows.filter(row => row.isOnline).length;
    const groupedMeters = groupedCollections.reduce((sum, group) => sum + group.meters.length, 0);
    return {
      totalLoad,
      onlineMeters,
      groupedMeters,
      totalMeters: meterRows.length,
      ungroupedMeters: ungroupedMeters.length,
    };
  }, [subMeterRows, meterRows, groupedCollections, ungroupedMeters]);

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
    <div className="fade-in energy-overview-page pb-5">
      <div className="page-header energy-hero d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h2 className="mb-0 text-white fw-black d-flex align-items-center gap-2">
              <Zap className="text-warning" size={28} /> Energy Metering Breakdown
            </h2>
            <Badge className="hero-badge">
              <Sparkles size={14} /> Clear Informatic View
            </Badge>
          </div>
          <p className="text-secondary fs-7 mt-2 mb-0 overview-subtitle">
            Detailed separation of Main Meter, Ranked Sub-Meter Groups, and Individual Sub-Meters highlighting critical metrics.
          </p>
        </div>
        <PdfButton />
      </div>

      <Row className="g-4 mb-5">
        {/* Main Meter Compact Tile */}
        <Col md={6} xl={4}>
          <Card 
            className="overview-stat-card border-0 h-100 text-white position-relative overflow-hidden" 
            style={{ 
              cursor: 'pointer', 
              transition: 'transform 0.2s, boxShadow 0.2s',
              background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              borderRadius: '16px'
            }}
            onClick={(e) => {
               if(e.target.tagName !== 'SELECT' && inspectionMainMeter) {
                   navigate(inspectionMainMeter.path);
               }
            }}
          >
            {/* Subtle glow effect */}
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.05) 0%, transparent 60%)' }}></div>
            
            <Card.Body className="p-3 d-flex flex-column position-relative z-1">
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1 px-2 rounded bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center shadow-sm">
                    <Zap size={14} />
                  </div>
                  <Form.Select 
                    className="bg-dark text-white shadow-none fw-bold p-1 px-2"
                    style={{ width: 'auto', minWidth: '140px', maxWidth: '180px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', letterSpacing: '0.5px', borderRadius: '6px' }}
                    value={selectedMainMeterId}
                    onChange={(e) => setSelectedMainMeterId(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="" style={{backgroundColor: '#0f172a', color: '#fff'}}>-- Select Main Meter --</option>
                    {meterRows.filter(m => m.isMain).map(m => (
                      <option key={m.id} value={m.id} style={{backgroundColor: '#0f172a', color: '#fff'}}>{m.name}</option>
                    ))}
                  </Form.Select>
                </div>
                {inspectionMainMeter && (
                  <div className="mb-0" style={{ transform: 'scale(0.8)', transformOrigin: 'right center' }}>
                    <StatusBadge status={inspectionMainMeter.status} />
                  </div>
                )}
              </div>

              {inspectionMainMeter ? (
                <>
                  <div className="d-flex align-items-center gap-2 mb-2 flex-grow-1">
                     <div className="p-2 rounded-circle bg-warning bg-opacity-10 border border-warning border-opacity-25 shadow-sm">
                        <Activity size={20} className="text-warning" />
                     </div>
                     <div>
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.6rem', letterSpacing: '0.5px'}}>TOTAL ACTIVE LOAD</div>
                       <div className="fw-black text-white d-flex align-items-baseline gap-1" style={{fontSize: '1.5rem', lineHeight: '1'}}>
                         {formatMetric(inspectionMainMeter.loadKw)} <span className="text-warning fw-bold" style={{fontSize:'0.75rem'}}>kW</span>
                       </div>
                     </div>
                  </div>

                  <div className="d-flex gap-2 mb-2">
                    <div className="bg-dark bg-opacity-50 rounded p-1 px-2 flex-fill text-center border border-secondary border-opacity-25 shadow-sm transition-all hover-highlight">
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.55rem', letterSpacing: '0.5px'}}>KVA</div>
                       <div className="fw-bold text-info" style={{fontSize: '0.85rem'}}>{formatMetric(inspectionMainMeter.loadKva)}</div>
                    </div>
                    <div className="bg-dark bg-opacity-50 rounded p-1 px-2 flex-fill text-center border border-secondary border-opacity-25 shadow-sm transition-all hover-highlight">
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.55rem', letterSpacing: '0.5px'}}>KWH</div>
                       <div className="fw-bold text-success" style={{fontSize: '0.85rem'}}>{formatMetric(inspectionMainMeter.kwh)}</div>
                    </div>
                    <div className="bg-dark bg-opacity-50 rounded p-1 px-2 flex-fill text-center border border-secondary border-opacity-25 shadow-sm transition-all hover-highlight">
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.55rem', letterSpacing: '0.5px'}}>KVAH</div>
                       <div className="fw-bold text-primary" style={{fontSize: '0.85rem'}}>{formatMetric(inspectionMainMeter.kvah)}</div>
                    </div>
                  </div>

                  <div className="mt-1 pt-2 border-top border-secondary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center text-secondary mb-1 fw-bold" style={{fontSize: '0.6rem', letterSpacing: '0.5px'}}>
                      <span style={{width: '30px'}}>PH</span>
                      <span className="text-center" style={{width: '60px'}}>VOLT(V)</span>
                      <span className="text-end" style={{width: '60px'}}>CURR(A)</span>
                    </div>
                    {[
                      { label: 'R', color: 'danger', v: inspectionMainMeter.vR, i: inspectionMainMeter.iR },
                      { label: 'Y', color: 'warning', v: inspectionMainMeter.vY, i: inspectionMainMeter.iY },
                      { label: 'B', color: 'info', v: inspectionMainMeter.vB, i: inspectionMainMeter.iB },
                    ].map((phase, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-1 bg-dark bg-opacity-25 rounded p-1 px-2 border border-secondary border-opacity-10 transition-all hover-highlight">
                        <span className={`fw-bold text-white bg-${phase.color} rounded-circle d-flex align-items-center justify-content-center shadow-sm`} style={{width: '18px', height: '18px', fontSize: '0.6rem'}}>
                          {phase.label}
                        </span>
                        <span className="font-monospace text-center fw-bold text-light" style={{width: '60px', fontSize: '0.75rem'}}>{formatMetric(phase.v)}</span>
                        <span className="font-monospace text-end fw-bold text-light" style={{width: '60px', fontSize: '0.75rem'}}>{formatMetric(phase.i)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-secondary" style={{fontSize: '0.75rem'}}>
                  <Activity size={24} className="mb-2 opacity-25" />
                  No Main Meter Selected
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sub Meter Compact Tile */}
        <Col md={6} xl={4}>
          <Card 
            className="overview-stat-card border-0 h-100 text-white position-relative overflow-hidden" 
            style={{ 
              cursor: 'pointer', 
              transition: 'transform 0.2s, boxShadow 0.2s',
              background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              borderRadius: '16px'
            }}
            onClick={(e) => {
               if(e.target.tagName !== 'SELECT' && inspectionSubMeter) {
                   navigate(inspectionSubMeter.path);
               }
            }}
          >
            {/* Subtle glow effect */}
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ background: 'radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.05) 0%, transparent 60%)' }}></div>

            <Card.Body className="p-3 d-flex flex-column position-relative z-1">
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1 px-2 rounded bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center shadow-sm">
                    <Plug size={14} />
                  </div>
                  <Form.Select 
                    className="bg-dark text-white shadow-none fw-bold p-1 px-2"
                    style={{ width: 'auto', minWidth: '140px', maxWidth: '180px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', letterSpacing: '0.5px', borderRadius: '6px' }}
                    value={selectedSubMeterId}
                    onChange={(e) => setSelectedSubMeterId(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="" style={{backgroundColor: '#0f172a', color: '#fff'}}>-- Select Sub Meter --</option>
                    {meterRows.filter(m => !m.isMain).map(m => (
                      <option key={m.id} value={m.id} style={{backgroundColor: '#0f172a', color: '#fff'}}>{m.name}</option>
                    ))}
                  </Form.Select>
                </div>
                {inspectionSubMeter && (
                  <div className="mb-0" style={{ transform: 'scale(0.8)', transformOrigin: 'right center' }}>
                    <StatusBadge status={inspectionSubMeter.status} />
                  </div>
                )}
              </div>

              {inspectionSubMeter ? (
                <>
                  <div className="d-flex align-items-center gap-2 mb-2 flex-grow-1">
                     <div className="p-2 rounded-circle bg-warning bg-opacity-10 border border-warning border-opacity-25 shadow-sm">
                        <Activity size={20} className="text-warning" />
                     </div>
                     <div>
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.6rem', letterSpacing: '0.5px'}}>TOTAL ACTIVE LOAD</div>
                       <div className="fw-black text-white d-flex align-items-baseline gap-1" style={{fontSize: '1.5rem', lineHeight: '1'}}>
                         {formatMetric(inspectionSubMeter.loadKw)} <span className="text-warning fw-bold" style={{fontSize:'0.75rem'}}>kW</span>
                       </div>
                     </div>
                  </div>

                  <div className="d-flex gap-2 mb-2">
                    <div className="bg-dark bg-opacity-50 rounded p-1 px-2 flex-fill text-center border border-secondary border-opacity-25 shadow-sm transition-all hover-highlight">
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.55rem', letterSpacing: '0.5px'}}>KVA</div>
                       <div className="fw-bold text-info" style={{fontSize: '0.85rem'}}>{formatMetric(inspectionSubMeter.loadKva)}</div>
                    </div>
                    <div className="bg-dark bg-opacity-50 rounded p-1 px-2 flex-fill text-center border border-secondary border-opacity-25 shadow-sm transition-all hover-highlight">
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.55rem', letterSpacing: '0.5px'}}>KWH</div>
                       <div className="fw-bold text-success" style={{fontSize: '0.85rem'}}>{formatMetric(inspectionSubMeter.kwh)}</div>
                    </div>
                    <div className="bg-dark bg-opacity-50 rounded p-1 px-2 flex-fill text-center border border-secondary border-opacity-25 shadow-sm transition-all hover-highlight">
                       <div className="text-secondary fw-bold mb-0" style={{fontSize: '0.55rem', letterSpacing: '0.5px'}}>KVAH</div>
                       <div className="fw-bold text-primary" style={{fontSize: '0.85rem'}}>{formatMetric(inspectionSubMeter.kvah)}</div>
                    </div>
                  </div>

                  <div className="mt-1 pt-2 border-top border-secondary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center text-secondary mb-1 fw-bold" style={{fontSize: '0.6rem', letterSpacing: '0.5px'}}>
                      <span style={{width: '30px'}}>PH</span>
                      <span className="text-center" style={{width: '60px'}}>VOLT(V)</span>
                      <span className="text-end" style={{width: '60px'}}>CURR(A)</span>
                    </div>
                    {[
                      { label: 'R', color: 'danger', v: inspectionSubMeter.vR, i: inspectionSubMeter.iR },
                      { label: 'Y', color: 'warning', v: inspectionSubMeter.vY, i: inspectionSubMeter.iY },
                      { label: 'B', color: 'info', v: inspectionSubMeter.vB, i: inspectionSubMeter.iB },
                    ].map((phase, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-1 bg-dark bg-opacity-25 rounded p-1 px-2 border border-secondary border-opacity-10 transition-all hover-highlight">
                        <span className={`fw-bold text-white bg-${phase.color} rounded-circle d-flex align-items-center justify-content-center shadow-sm`} style={{width: '18px', height: '18px', fontSize: '0.6rem'}}>
                          {phase.label}
                        </span>
                        <span className="font-monospace text-center fw-bold text-light" style={{width: '60px', fontSize: '0.75rem'}}>{formatMetric(phase.v)}</span>
                        <span className="font-monospace text-end fw-bold text-light" style={{width: '60px', fontSize: '0.75rem'}}>{formatMetric(phase.i)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-secondary" style={{fontSize: '0.75rem'}}>
                  <Activity size={24} className="mb-2 opacity-25" />
                  No Sub Meter Selected
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {[
          { label: 'Total Live Load', value: `${formatMetric(headlineMetrics.totalLoad)} kW`, note: 'Main/Sub Aggregated', icon: <Gauge size={18} /> },
          { label: 'Online Meters', value: `${headlineMetrics.onlineMeters}/${headlineMetrics.totalMeters}`, note: 'Realtime communication health', icon: <Network size={18} /> },
          { label: 'Ranked Groups', value: `${headlineMetrics.groupedMeters}`, note: `${groupedCollections.length} custom groups active`, icon: <Layers3 size={18} /> },
          { label: 'Ungrouped Feeds', value: `${headlineMetrics.ungroupedMeters}`, note: 'Standalone MFM panels', icon: <FolderTree size={18} /> }
        ].map((metric, index) => (
          <Col key={index} md={6} xl={4}>
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


      {/* 2. Group Comparison (Sorted by Highest Load) */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-warning fw-black m-0 d-flex align-items-center gap-2">
          <Layers3 size={24} /> Sub-Meter Groups (Ranked by Load)
        </h4>
        <div className="d-flex gap-2">
          <button 
            onClick={() => setShowGroups(!showGroups)} 
            className={`btn ${showGroups ? 'btn-warning text-dark' : 'btn-outline-warning'} rounded-pill px-3 py-1 fw-bold fs-13 d-flex align-items-center gap-2`}
          >
            {showGroups ? <EyeOff size={14} /> : <Eye size={14} />} 
            {showGroups ? 'Hide Groups' : 'Show Groups'}
          </button>
          <button onClick={() => navigate('/energy-metering/sub', { state: { openGroupSettings: true } })} className="btn btn-outline-warning rounded-pill px-3 py-1 fw-bold fs-13 d-flex align-items-center gap-2">
            <Settings2 size={14} /> Manage Groups
          </button>
        </div>
      </div>
      
      {showGroups && (
        groupedCollections.length === 0 ? (
          <div className="empty-panel mb-5 text-center">
            No groups created. Go to settings to combine multiple sub-meters into functional areas.
          </div>
        ) : (
          <Row className="g-3 mb-5">
            {groupedCollections.map((group, index) => (
              <Col key={group.id} lg={4} xl={3}>
                <div className="group-card p-3" style={{ borderColor: `${group.color}55` }}>
                  <div className="group-rank-badge" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>#{index + 1} Load</div>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2 mt-2">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="group-dot" style={{ backgroundColor: group.color, width: '8px', height: '8px' }} />
                        <h6 className="mb-0 text-white fw-bold fs-14">{group.name}</h6>
                      </div>
                      <small className="text-secondary fs-12">{group.meters.length} meter(s) linked</small>
                    </div>
                    <div className="text-end">
                      <div className="text-white fw-bold fs-6">{formatMetric(group.totalLoadKw)} kW</div>
                      <small style={{ color: group.color, fontSize: '0.7rem' }}>{group.onlineCount} online</small>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between gap-2 mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroup(group.id);
                      }}
                      className="btn btn-outline-info rounded-pill px-2 py-1 d-flex align-items-center gap-1 overview-action-btn fs-12 flex-grow-1 justify-content-center"
                    >
                      <Settings2 size={12} /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="btn btn-outline-danger rounded-pill px-2 py-1 d-flex align-items-center gap-1 overview-delete-btn fs-12 flex-grow-1 justify-content-center"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-1">
                    {group.meters.map(meter => (
                      <div key={meter.id} className="group-meter-row p-2 py-1" onClick={() => navigate(meter.path)}>
                        <div>
                          <div className="text-white fw-bold fs-13">{meter.name}</div>
                          <small className="text-secondary" style={{fontSize: '0.65rem'}}>{meter.id}</small>
                        </div>
                        <div className="text-end d-flex flex-column align-items-end gap-1">
                          <div className="text-white fw-bold fs-13">{formatMetric(meter.loadKw)} kW</div>
                          <small className={meter.isOnline ? 'text-success' : 'text-danger'} style={{fontSize: '0.65rem'}}>
                            {meter.isOnline ? 'Online' : 'Offline'}
                          </small>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMeterFromGroup(group.id, meter.templateId);
                            }}
                            className="btn btn-sm btn-outline-warning rounded-pill py-0 overview-remove-meter-btn"
                            style={{fontSize: '0.6rem', padding: '0px 6px'}}
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
        )
      )}

      {/* 3. Ungrouped Sub-Meters Detailed View */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-secondary fw-black m-0 d-flex align-items-center gap-2">
          <FolderTree size={24} /> Individual Sub-Meters (Ungrouped)
        </h4>
        <Badge className="overview-chip warning">{ungroupedMeters.length} visible</Badge>
      </div>

      <Card className="overview-panel border-0 text-white mb-4">
        <Card.Body className="p-0">
          {ungroupedMeters.length === 0 ? (
            <div className="empty-panel m-4 text-center">
              All sub-meters are assigned to groups.
            </div>
          ) : (
            <div className="table-responsive p-4">
              <Table hover borderless className="align-middle group-detail-table text-white mb-0">
                <thead>
                  <tr>
                    <th>Meter Name</th>
                    <th>Category</th>
                    <th className="text-center">Total KW</th>
                    <th className="text-center">Total KVA</th>
                    <th className="text-center">KWH</th>
                    <th className="text-center">Volt (R,Y,B)</th>
                    <th className="text-center">Amp (R,Y,B)</th>
                    <th className="text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ungroupedMeters.map(meter => (
                    <tr key={meter.id} onClick={() => navigate(meter.path)}>
                      <td><div className="fw-bold">{meter.name}</div></td>
                      <td><Badge bg="dark" className="border border-secondary border-opacity-50 text-secondary">{meter.category}</Badge></td>
                      <td className="text-center fw-bold text-warning">{formatMetric(meter.loadKw)}</td>
                      <td className="text-center text-info">{formatMetric(meter.loadKva)}</td>
                      <td className="text-center text-success">{formatMetric(meter.kwh)}</td>
                      <td className="text-center font-monospace fs-12 text-secondary">
                        {formatMetric(meter.vR)} | {formatMetric(meter.vY)} | {formatMetric(meter.vB)}
                      </td>
                      <td className="text-center font-monospace fs-12 text-secondary">
                        {formatMetric(meter.iR)} | {formatMetric(meter.iY)} | {formatMetric(meter.iB)}
                      </td>
                      <td className="text-end">
                        <Badge 
                          bg={meter.isOnline ? 'success' : 'secondary'} 
                          className="border border-secondary border-opacity-50 text-uppercase"
                          style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                        >
                          {meter.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Group Manager Modal - Keeping the core functionality intact for managing groups */}
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
                Group properties and meter mapping.
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
            Save
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
        
        .energy-hero {
          padding: 24px 28px;
          border-radius: 24px;
          background:
            radial-gradient(circle at top left, rgba(56,189,248,0.15), transparent 40%),
            radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 30%),
            linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,13,24,0.98));
          border: 1px solid rgba(56,189,248,0.2);
          box-shadow: 0 22px 50px rgba(0,0,0,0.4), inset 0 0 20px rgba(56,189,248,0.05);
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

        .overview-chip.warning {
          background: rgba(250,204,21,0.1);
          border-color: rgba(250,204,21,0.22);
          color: #fde68a;
        }
        
        .overview-stat-card,
        .overview-panel {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        
        .overview-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(56, 189, 248, 0.2);
          border-color: rgba(56, 189, 248, 0.3);
        }

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
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          background: linear-gradient(90deg, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 6px;
        }
        
        .metric-note { color: #64748b; font-size: 0.84rem; }

        .param-card {
          padding: 16px 20px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .param-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 4px; height: 100%;
        }
        .param-card.border-warning::after { background: #f59e0b; box-shadow: 0 0 12px #f59e0b; }
        .param-card.border-info::after { background: #0ea5e9; box-shadow: 0 0 12px #0ea5e9; }
        .param-card.border-success::after { background: #22c55e; box-shadow: 0 0 12px #22c55e; }
        .param-card.border-secondary::after { background: #64748b; }
        
        .param-card:hover {
          background: rgba(30, 41, 59, 0.8);
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.1);
        }
        
        .param-label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
        }
        
        .param-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: #fff;
          font-family: monospace;
          line-height: 1.2;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        
        .param-unit {
          font-size: 0.85rem;
          color: #cbd5e1;
          font-weight: 800;
          margin-left: 4px;
        }

        /* Main Meter Additional Styling */
        .main-meter-container {
          background: linear-gradient(145deg, rgba(15,23,42,0.8), rgba(8,13,24,0.95));
          border: 1px solid rgba(56, 189, 248, 0.15);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.05);
          position: relative;
          overflow: hidden;
        }
        .main-meter-container::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent);
        }

        /* Phase Grid */
        .phase-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .phase-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(148,163,184,0.08);
          align-items: center;
          transition: background 0.2s;
        }
        .phase-row:not(.header):hover {
          background: rgba(30,41,59,0.8);
        }
        .phase-row.header {
          background: transparent;
          border: none;
          padding: 0 18px 4px;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .phase-row span:not(:first-child) {
          text-align: center;
          font-size: 1.1rem;
          color: #fff;
        }

        /* Detail Table */
        .group-detail-table {
          border-collapse: separate;
          border-spacing: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .group-detail-table thead {
          background: rgba(15, 23, 42, 0.8);
        }
        .group-detail-table thead th {
          color: #7dd3fc;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 18px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background: transparent;
        }
        .group-detail-table tbody tr {
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
        }
        .group-detail-table tbody td {
          color: #f8fafc;
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: transparent;
        }
        .group-detail-table tbody tr:hover {
          background: rgba(56, 189, 248, 0.05) !important;
        }

        .group-rank-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          font-weight: 900;
          padding: 4px 16px;
          border-radius: 0 24px 0 12px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 12px rgba(245,158,11,0.3);
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
        .fs-12 { font-size: 0.75rem !important; }
        .fs-7 { font-size: 1rem !important; }
        .letter-spacing-1 { letter-spacing: 1px !important; }

        .group-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.3);
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .group-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 50px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1);
        }
        .group-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 12px currentColor;
        }
        .group-meter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(15,23,42,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .group-meter-row:hover {
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.3);
          transform: translateX(4px);
        }

        /* Existing Group Modal styles retained to avoid breaking it */
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

        @media (max-width: 1200px) {
          .group-summary-col { border-right: none !important; margin-bottom: 24px; width: 100% !important; }
          .group-meters-col { padding-left: 0 !important; }
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

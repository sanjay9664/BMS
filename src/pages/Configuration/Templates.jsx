import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Badge, Modal } from 'react-bootstrap';
import { Save, Settings, Database, Activity, Zap, Droplets, LayoutGrid, CheckCircle2, ChevronRight, Layers, History, Eye, Info, X, Home, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { loginToSochiot, getSochiotUserMe, getSochiotLocationData, getSochiotDeviceDetails } from '../../services/authService';

const ConfigTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState('Water Management');
  const [selectedModule, setSelectedModule] = useState('AG Tank');
  const [savedTemplates, setSavedTemplates] = useState(() => {
    const saved = localStorage.getItem('scada_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [viewMode, setViewMode] = useState('FORM'); // 'FORM' or 'LIST'
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  // States for Mapping Fields
  const [agLowerConfig, setAgLowerConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agUpperConfig, setAgUpperConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agAutoConfig, setAgAutoConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agManualConfig, setAgManualConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agBypassConfig, setAgBypassConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agLevelConfig, setAgLevelConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agOpenConfig, setAgOpenConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agCloseConfig, setAgCloseConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [agTankRange, setAgTankRange] = useState({ domStart: '', domEnd: '', flushStart: '', flushEnd: '' });
  const [agTankType, setAgTankType] = useState('DOMESTIC'); // 'DOMESTIC' or 'FLUSHING'
  const [agMasterEnabled, setAgMasterEnabled] = useState(true);
  const [ugLowerConfig, setUgLowerConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugUpperConfig, setUgUpperConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugAutoConfig, setUgAutoConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugManualConfig, setUgManualConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugStartCmdConfig, setUgStartCmdConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugStopCmdConfig, setUgStopCmdConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugStartPressConfig, setUgStartPressConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugStopPressConfig, setUgStopPressConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugLocalModeConfig, setUgLocalModeConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugRemoteModeConfig, setUgRemoteModeConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugPumpRange, setUgPumpRange] = useState({ name: '', id: '' });
  const [ugTankLevelConfig, setUgTankLevelConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [ugTankRange, setUgTankRange] = useState({ name: '', id: '' });
  const [pressureConfig, setPressureConfig] = useState({ location: '', device: '', module: '', field: '', enabled: true });
  const [elecVoltageConfig, setElecVoltageConfig] = useState({ location: '', device: '', module: '', ry: '', yb: '', br: '', enabled: true });
  const [elecCurrentConfig, setElecCurrentConfig] = useState({ location: '', device: '', module: '', r: '', y: '', b: '', enabled: true });
  const [elecSystemConfig, setElecSystemConfig] = useState({ location: '', device: '', module: '', pf: '', freq: '', load: '', enabled: true });
  const [elecConsumptionConfig, setElecConsumptionConfig] = useState({ location: '', device: '', module: '', kva: '', kwh: '', kvah: '', enabled: true });
  const [selectedUgPumpNo, setSelectedUgPumpNo] = useState(1);
  const [pressureTarget, setPressureTarget] = useState('');
  const [electricalTarget, setElectricalTarget] = useState('');
  const [ugConfig, setUgConfig] = useState({
    integration: {
      'LEVEL MONITORING': true,
      'PUMP STATUS': true,
      'AUTO LOGIC': true,
      'MANUAL CONTROL': true,
      'START COMMAND': true,
      'STOP COMMAND': true,
      'PRESSURE SENSOR': true
    },
    electrical: {
      'PHASE VOLTAGE': true,
      'PHASE CURRENT': true,
      'POWER FACTOR': true,
      'FREQUENCY': true,
      'KW LOAD': true,
      'KVAH UNIT': true
    },
    stationMode: 'REMOTE'
  });

  // Individual Tank data (24 Domestic, 24 Flushing) with TOWER naming
  const domesticTowers = Array.from({ length: 24 }, (_, i) => ({
    name: `TOWER-D-${i + 1}`,
    id: `D-${String(i + 1).padStart(2, '0')}`
  }));

  const flushingTowers = Array.from({ length: 24 }, (_, i) => ({
    name: `TOWER-F-${i + 1}`,
    id: `F-${String(i + 1).padStart(2, '0')}`
  }));

  const ugPumpsList = [
    { name: 'FIRE RESERVOIR', id: 'UG-FIRE-01' },
    { name: 'DOMESTIC SUMP', id: 'UG-DOM-01' },
    { name: 'PROCESS TANK', id: 'UG-PROC-01' }
  ];

  const pressureSensorsList = [
    { name: 'INLET PRESSURE', id: 'PT-01' },
    { name: 'OUTLET PRESSURE', id: 'PT-02' },
    { name: 'PUMP 01 PRESSURE', id: 'PT-P1' },
    { name: 'PUMP 02 PRESSURE', id: 'PT-P2' }
  ];

  const electricalMetersList = [
    { name: 'MAIN PANEL METER', id: 'EM-01' },
    { name: 'PUMP 01 METER', id: 'EM-P1' },
    { name: 'PUMP 02 METER', id: 'EM-P2' }
  ];

  const handleUgPumpNoChange = (no) => {
    setSelectedUgPumpNo(no);
    // Find if a template already exists for this specific pump number
    const existing = savedTemplates.find(t => 
      t.module === 'UG Pump' && 
      t.mapping.ugPumpRange && 
      t.mapping.ugPumpRange.pumpNo === no
    );

    if (existing) {
      setUgLowerConfig(existing.mapping.ugLowerConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgUpperConfig(existing.mapping.ugUpperConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgAutoConfig(existing.mapping.ugAutoConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgManualConfig(existing.mapping.ugManualConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStartCmdConfig(existing.mapping.ugStartCmdConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStopCmdConfig(existing.mapping.ugStopCmdConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStartPressConfig(existing.mapping.ugStartPressConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStopPressConfig(existing.mapping.ugStopPressConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgLocalModeConfig(existing.mapping.ugLocalModeConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgRemoteModeConfig(existing.mapping.ugRemoteModeConfig || { location: '', device: '', module: '', field: '', enabled: true });
    } else {
      // Clear for a new pump if no template exists
      setUgLowerConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgUpperConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgAutoConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgManualConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgStartCmdConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgStopCmdConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgStartPressConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgStopPressConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgLocalModeConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setUgRemoteModeConfig({ location: '', device: '', module: '', field: '', enabled: true });
    }
  };

  const handleUgPumpChange = (name) => {
    setTemplateName('');
    const tank = ugPumpsList.find(t => t.name === name);
    if (tank) {
      setUgPumpRange({ name: tank.name, id: tank.id });
    } else {
      setUgPumpRange({ name: '', id: '' });
    }
  };

  const handleUgTankChange = (name) => {
    setTemplateName('');
    const tank = ugPumpsList.find(t => t.name === name);
    if (tank) {
      const existing = savedTemplates.find(t => 
        t.module === 'UG Tank' && 
        t.mapping.ugTankRange && 
        t.mapping.ugTankRange.name === name
      );

      if (existing) {
        setUgTankLevelConfig(existing.mapping.ugTankLevelConfig || { location: '', device: '', module: '', field: '', enabled: true });
      } else {
        setUgTankLevelConfig({ location: '', device: '', module: '', field: '', enabled: true });
      }
      setUgTankRange({ name: tank.name, id: tank.id });
    } else {
      setUgTankRange({ name: '', id: '' });
    }
  };

  const [locationIdMap, setLocationIdMap] = useState({});
  const [locationDetails, setLocationDetails] = useState({}); // { locationName: { deviceList: [{label, id}] } }
  const [deviceDetails, setDeviceDetails] = useState({}); // { deviceId: { modules: { name: [fields] } } }
  const [dynamicOptions, setDynamicOptions] = useState({
    locations: ['Basement 1', 'Basement 2', 'Rooftop Sector A', 'Rooftop Sector B'],
    devices: ['Gateway-01', 'Gateway-02', 'PLC-Main', 'Controller-X'],
    modules: ['Modbus-RTU-1', 'BACnet-IP-1', 'Digital-IO'],
    fields: ['Valve_Status', 'Level_Sensor', 'Pump_State', 'Pressure_Reading', 'Motor_Current']
  });

  // Fetch Dynamic Data from Sochiot API
  useEffect(() => {
    const initDynamicData = async () => {
      try {
        // Try to get user data (if token exists)
        let userData = await getSochiotUserMe();
        
        // If no data/token, perform dummy login as requested
        if (!userData) {
          await loginToSochiot("sa@ismartaccess.com", "I0t3ch");
          userData = await getSochiotUserMe();
        }

        if (userData) {
          const companies = [];
          const clients = [];
          const zones = [];
          const locations = [];

          const lMap = {};

          const traverseZones = (zList) => {
            zList.forEach(z => {
              zones.push(z.name);
              if (z.locations) {
                z.locations.forEach(l => {
                  locations.push(l.name);
                  lMap[l.name] = l.id;
                });
              }
              if (z.subZones) traverseZones(z.subZones);
            });
          };

          if (userData.userZoneLocationVO?.companyList) {
            userData.userZoneLocationVO.companyList.forEach(comp => {
              companies.push(comp.name);
              if (comp.consumers) {
                comp.consumers.forEach(client => {
                  clients.push(client.name);
                  if (client.zoneVOS) traverseZones(client.zoneVOS);
                });
              }
            });
          }

          setLocationIdMap(lMap);
          setDynamicOptions({
            locations: locations.length > 0 ? [...new Set(locations)] : dynamicOptions.locations,
            devices: zones.length > 0 ? [...new Set(zones)] : dynamicOptions.devices,
            modules: clients.length > 0 ? [...new Set(clients)] : dynamicOptions.modules,
            fields: companies.length > 0 ? [...new Set(companies)] : dynamicOptions.fields
          });
        }
      } catch (error) {
        console.error('Failed to load dynamic Sochiot data:', error);
      }
    };

    initDynamicData();
  }, []);

  const fetchLocationDetails = async (locationName) => {
    if (locationDetails[locationName]) return;
    
    const locId = locationIdMap[locationName];
    if (!locId) return;

    try {
      const data = await getSochiotLocationData(locId);
      if (data?.locationVOS?.[0]) {
        const gateways = data.locationVOS[0].gatewayVOList || [];
        const deviceList = [];
        
        gateways.forEach(g => {
          if (g.deviceEntityVOS) {
            g.deviceEntityVOS.forEach(d => {
              deviceList.push({
                label: `${g.name} / ${d.name}`,
                id: d.id,
                uuid: d.uuid
              });
            });
          }
        });

        setLocationDetails(prev => ({
          ...prev,
          [locationName]: { deviceList }
        }));
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  };

  const fetchDeviceDetails = async (deviceId) => {
    console.log('Fetching details for device:', deviceId);
    if (!deviceId || deviceDetails[deviceId]) return;
    try {
      const data = await getSochiotDeviceDetails(deviceId);
      if (data) {
        // Sochiot API can have modules in root 'modules' or 'deviceTemplateVO.moduleTemplates'
        const moduleSource = data.modules || data.deviceTemplateVO?.moduleTemplates || [];
        const moduleMap = {};
        
        moduleSource.forEach(m => {
          // Event fields can be in root or inside moduleTypeVO
          const fieldsSource = m.eventFieldVOS || m.moduleTypeVO?.eventFieldVOS || [];
          const fields = fieldsSource.map(f => ({
            label: `${f.displayName} (${f.fieldName})`, 
            id: f.fieldName
          }));
          
          moduleMap[m.id] = {
            id: m.id,
            name: m.name,
            fields: fields
          };
        });

        setDeviceDetails(prev => ({
          ...prev,
          [deviceId]: { modules: moduleMap }
        }));
      }
    } catch (error) {
      console.error('Error fetching device details:', error);
    }
  };

  const handleConfigChange = async (config, setter, key, value) => {
    console.log(`Config Change: ${key} = ${value}`);
    const updated = { ...config, [key]: value };
    
    if (key === 'location') {
      updated.device = '';
      updated.module = '';
      updated.field = '';
      if (value) {
        const locId = locationIdMap[value];
        if (locId) fetchLocationDetails(value, locId);
      }
    } else if (key === 'device') {
      updated.module = '';
      updated.field = '';
      if (value) fetchDeviceDetails(value);
    } else if (key === 'module') {
      updated.field = '';
    }
    
    setter(updated);
  };

  const getFieldList = (key, rowState) => {
    const locationName = typeof rowState === 'string' ? rowState : (rowState?.location || '');
    if (key === 'location') return locations;
    
    const locInfo = locationDetails[locationName];
    if (!locInfo || !locInfo.deviceList) return [];

    if (key === 'device') return locInfo.deviceList;
    
    const selectedDeviceId = rowState?.device;
    const devInfo = deviceDetails[selectedDeviceId];
    
    console.log(`getFieldList lookup for ${key}:`, {
      selectedDeviceId,
      hasDevInfo: !!devInfo,
      cachedDeviceIds: Object.keys(deviceDetails)
    });

    if (!devInfo) return [];

    if (key === 'module') {
      const modules = Object.values(devInfo.modules).map(m => ({
        label: m.name,
        id: m.id
      }));
      console.log('Resolved modules:', modules);
      return modules;
    }
    
    const selectedModuleId = rowState?.module;
    const moduleData = devInfo.modules[selectedModuleId];
    if (key === 'field') {
      const fields = (moduleData?.fields || []).map(f => ({
        label: f.label,
        id: f.id
      }));
      console.log('Resolved fields:', fields);
      return fields;
    }
    
    return [];
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('scada_templates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  // Fetch from backend on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/templates');
        if (response.ok) {
          const data = await response.json();
          // Map backend data to frontend format if necessary
          const mappedData = data.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category || 'Water Management', // Fallback
            module: t.settings[0]?.eventKey || 'AG Tank',
            mapping: t.defaultValues || t.settings[0]?.meta || {},
            timestamp: new Date(t.createdAt).toLocaleString()
          }));
          if (mappedData.length > 0) {
            setSavedTemplates(mappedData);
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, []);


  // Identify disabled towers for UI feedback in dropdowns
  const disabledTowerNames = useMemo(() => {
    return savedTemplates
      .filter(t => t.module === 'AG Tank' && t.mapping.agMasterEnabled === false)
      .map(t => t.mapping.agTankRange.domStart || t.mapping.agTankRange.flushStart)
      .filter(Boolean);
  }, [savedTemplates]);

  // Hierarchical Data Structure exactly matching the Sidebar
  const categories = {
    'Dashboard': ['Overview'],
    'Water Management': ['Overview', 'AG Tank', 'UG Pump', 'UG Tank', 'Pressure', 'Electrical Parameter'],
    'Motors': ['Overview', 'Pump Room 1', 'Pump Room 2', 'VFD Status'],
    'DG Set': ['Overview', 'DG Set-1', 'DG Set-2', 'DG Set-3'],
    'Alarm System': ['Overview', 'Active Alarms', 'Alarm History'],
    'LT Panel': ['Overview', 'LT Room-1', 'Incoming/Outgoing', 'Breaker Status'],
    'Transformer': ['Overview', 'Transformer-1', 'Transformer-2', 'Load/Temp'],
    'Fire Pumps': ['Overview', 'Pump Status', 'Header Pressure', 'Jockey / Main'],
    'Ticketing': ['Index'],
    'Maintenance': ['Scheduled', 'Pending Tasks'],
    'Service History': ['Records'],
    'Daily DPR': ['Data Aggregation', 'Daily Logs']
  };

  const locations = dynamicOptions.locations;
  const devices = dynamicOptions.devices;
  const modules = dynamicOptions.modules;
  const fields = dynamicOptions.fields;

  // Theme-consistent background colors based on Slate-900 (#0f172a)
  const themeBg = "rgba(15, 23, 42, 0.95)";
  const themeOverlay = "rgba(15, 23, 42, 0.6)";
  const themeCardBg = "rgba(30, 41, 59, 0.4)"; // Slate-800 with opacity for cards inside cards

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedModule(categories[cat][0]);
  };

  const handleDomesticTowerChange = (name) => {
    setTemplateName('');
    const tower = domesticTowers.find(t => t.name === name);
    if (tower) {
      // Find if a template for this specific tower already exists
      const existing = savedTemplates.find(t => 
        t.module === 'AG Tank' && 
        t.mapping.agTankRange && 
        t.mapping.agTankRange.domStart === name
      );

      if (existing) {
        // Load the saved state for this specific tower
        setAgMasterEnabled(existing.mapping.agMasterEnabled !== undefined ? existing.mapping.agMasterEnabled : true);
        setAgLowerConfig(existing.mapping.agLowerConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgUpperConfig(existing.mapping.agUpperConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgAutoConfig(existing.mapping.agAutoConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgManualConfig(existing.mapping.agManualConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgBypassConfig(existing.mapping.agBypassConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgLevelConfig(existing.mapping.agLevelConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgOpenConfig(existing.mapping.agOpenConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgCloseConfig(existing.mapping.agCloseConfig || { location: '', device: '', module: '', field: '', enabled: true });
      } else {
        // Default for new selection
        setAgMasterEnabled(true);
      }
      setAgTankRange({ ...agTankRange, domStart: tower.name, domEnd: tower.id });
    } else {
      setAgTankRange({ ...agTankRange, domStart: name, domEnd: '' });
      setAgMasterEnabled(true);
    }
  };

  const autoSaveMasterStatus = (enabledValue) => {
    if (!agTankRange.domStart && !agTankRange.flushStart) return;

    const rawMapping = {
      agLowerConfig, agUpperConfig, agTankRange,
      agAutoConfig, agManualConfig, agBypassConfig,
      agLevelConfig, agOpenConfig, agCloseConfig,
      agTankType, agMasterEnabled: enabledValue
    };

    const cleanedMapping = {};
    Object.keys(rawMapping).forEach(key => {
      const val = rawMapping[key];
      if (val && typeof val === 'object' && !Array.isArray(val) && 'location' in val) {
        if (!val.location) return;
      }
      cleanedMapping[key] = val;
    });

    const templateData = {
      category: selectedCategory,
      module: selectedModule,
      timestamp: new Date().toLocaleString(),
      mapping: cleanedMapping
    };

    const existingTowerIdx = savedTemplates.findIndex(t => 
      t.module === 'AG Tank' && 
      ((agTankType === 'DOMESTIC' && t.mapping.agTankRange.domStart === agTankRange.domStart) ||
       (agTankType === 'FLUSHING' && t.mapping.agTankRange.flushStart === agTankRange.flushStart))
    );

    if (existingTowerIdx !== -1) {
      const updated = [...savedTemplates];
      updated[existingTowerIdx] = { ...updated[existingTowerIdx], ...templateData, id: updated[existingTowerIdx].id };
      setSavedTemplates(updated);
    } else {
      setSavedTemplates([...savedTemplates, { id: Date.now(), ...templateData }]);
    }
  };

  const handleFlushingTowerChange = (name) => {
    setTemplateName('');
    const tower = flushingTowers.find(t => t.name === name);
    if (tower) {
      const existing = savedTemplates.find(t => 
        t.module === 'AG Tank' && 
        t.mapping.agTankRange && 
        t.mapping.agTankRange.flushStart === name
      );

      if (existing) {
        setAgMasterEnabled(existing.mapping.agMasterEnabled !== undefined ? existing.mapping.agMasterEnabled : true);
        setAgLowerConfig(existing.mapping.agLowerConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgUpperConfig(existing.mapping.agUpperConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgAutoConfig(existing.mapping.agAutoConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgManualConfig(existing.mapping.agManualConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgBypassConfig(existing.mapping.agBypassConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgLevelConfig(existing.mapping.agLevelConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgOpenConfig(existing.mapping.agOpenConfig || { location: '', device: '', module: '', field: '', enabled: true });
        setAgCloseConfig(existing.mapping.agCloseConfig || { location: '', device: '', module: '', field: '', enabled: true });
      } else {
        setAgMasterEnabled(true);
      }
      setAgTankRange({ ...agTankRange, flushStart: tower.name, flushEnd: tower.id });
    } else {
      setAgTankRange({ ...agTankRange, flushStart: name, flushEnd: '' });
      setAgMasterEnabled(true);
    }
  };

  const handleSave = async () => {
    let mapping = {};
    if (selectedModule === 'AG Tank') {
      mapping = {
        agLowerConfig, agUpperConfig, agTankRange,
        agAutoConfig, agManualConfig, agBypassConfig,
        agLevelConfig, agOpenConfig, agCloseConfig,
        agTankType, agMasterEnabled
      };
    } else if (selectedModule === 'UG Pump') {
      mapping = {
        ugLowerConfig, ugUpperConfig, ugAutoConfig, ugManualConfig,
        ugStartCmdConfig, ugStopCmdConfig, ugStartPressConfig, ugStopPressConfig,
        ugLocalModeConfig, ugRemoteModeConfig, 
        ugPumpRange: { ...ugPumpRange, pumpNo: selectedUgPumpNo }, 
        ugConfig
      };
    } else if (selectedModule === 'UG Tank') {
      mapping = {
        ugTankLevelConfig, ugTankRange
      };
    } else if (selectedModule === 'Pressure') {
      mapping = {
        pressureConfig, pressureTarget
      };
    } else if (selectedModule === 'Electrical Parameter') {
      mapping = {
        elecVoltageConfig, elecCurrentConfig, elecSystemConfig, elecConsumptionConfig, electricalTarget
      };
    } else {
      // Fallback
      mapping = {
        agLowerConfig, agUpperConfig, agTankRange,
        agAutoConfig, agManualConfig, agBypassConfig,
        agLevelConfig, agOpenConfig, agCloseConfig,
        ugLowerConfig, ugUpperConfig, ugAutoConfig, ugManualConfig,
        ugStartCmdConfig, ugStopCmdConfig, ugStartPressConfig, ugStopPressConfig,
        ugLocalModeConfig, ugRemoteModeConfig, 
        ugPumpRange: { ...ugPumpRange, pumpNo: selectedUgPumpNo }, 
        ugConfig,
        pressureConfig, pressureTarget,
        elecVoltageConfig, elecCurrentConfig, elecSystemConfig, elecConsumptionConfig, electricalTarget,
        agTankType, agMasterEnabled,
        ugTankLevelConfig, ugTankRange
      };
    }

    const rawMapping = mapping;
    const cleanedMapping = {};
    Object.keys(rawMapping).forEach(key => {
      const val = rawMapping[key];
      if (val && typeof val === 'object' && !Array.isArray(val) && 'module' in val) {
        if (!val.module && val.enabled !== false) return; // Only strip if module ID is empty AND it's not disabled
      }
      cleanedMapping[key] = val;
    });

    const hasValidConfig = Object.values(cleanedMapping).some(val => 
      val && typeof val === 'object' && val.module && val.field
    );

    if (!hasValidConfig) {
      setToastMessage({ type: 'error', text: "Please map at least one field to a device module before saving." });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    const templateData = {
      category: selectedCategory,
      module: selectedModule,
      timestamp: new Date().toLocaleString(),
      mapping: cleanedMapping
    };

    let autoName = '';
    if (selectedModule === 'UG Pump') {
      autoName = `PUMP ${selectedUgPumpNo} - UG SYSTEM`;
    } else if (selectedModule === 'UG Tank' && ugTankRange.name) {
      autoName = `${ugTankRange.name} - UG LEVEL`;
    } else if (selectedModule === 'AG Tank') {
      autoName = agTankRange.domStart || agTankRange.flushStart || 'AG TANK';
    } else {
      autoName = pressureTarget || electricalTarget || selectedModule;
    }
    const uniqueName = templateName || `${autoName} (#${String(savedTemplates.length + 1).padStart(2, '0')})`;

    try {
      const response = await fetch('http://localhost:5000/api/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTemplateId,
          name: uniqueName.toUpperCase(),
          category: selectedCategory,
          module: selectedModule,
          mapping: templateData.mapping
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to backend');
      }

      const result = await response.json();
      console.log('Saved to backend:', result);

      if (editingTemplateId) {
        setSavedTemplates(savedTemplates.map(t => t.id === editingTemplateId ? { ...t, ...templateData, name: uniqueName.toUpperCase() } : t));
        setEditingTemplateId(null);
      } else {
        setSavedTemplates([...savedTemplates, { id: result.templateId || Date.now(), ...templateData, name: uniqueName.toUpperCase() }]);
      }

      setToastMessage({ type: 'success', text: `${selectedModule} Configuration Saved Successfully.` });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Error saving to backend:', error);
      // Fallback to local storage if backend fails
      if (editingTemplateId) {
        setSavedTemplates(savedTemplates.map(t => t.id === editingTemplateId ? { ...t, ...templateData, name: uniqueName.toUpperCase() } : t));
        setEditingTemplateId(null);
      } else {
        setSavedTemplates([...savedTemplates, { id: Date.now(), ...templateData, name: uniqueName.toUpperCase() }]);
      }
      
      setToastMessage({ type: 'success', text: `${selectedModule} Configuration Saved Locally.` });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }

    // Reset only if NOT AG Tank (to let user see their save)
    if (selectedModule !== 'AG Tank') {
      setAgLowerConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgUpperConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgAutoConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgManualConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgBypassConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgLevelConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgOpenConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgCloseConfig({ location: '', device: '', module: '', field: '', enabled: true });
      setAgTankRange({ domStart: '', domEnd: '', flushStart: '', flushEnd: '' });
      setAgMasterEnabled(true);
    }
    setUgLowerConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgUpperConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgAutoConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgManualConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgStartCmdConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgStopCmdConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgStartPressConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgStopPressConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgLocalModeConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgRemoteModeConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setPressureConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setElecVoltageConfig({ location: '', device: '', module: '', ry: '', yb: '', br: '', enabled: true });
    setElecCurrentConfig({ location: '', device: '', module: '', r: '', y: '', b: '', enabled: true });
    setElecSystemConfig({ location: '', device: '', module: '', pf: '', freq: '', load: '', enabled: true });
    setElecConsumptionConfig({ location: '', device: '', module: '', kva: '', kwh: '', kvah: '', enabled: true });
    setUgTankLevelConfig({ location: '', device: '', module: '', field: '', enabled: true });
    setUgTankRange({ name: '', id: '' });
    setTemplateName('');
    setUgConfig({
      integration: { 'LEVEL MONITORING': true, 'PUMP STATUS': true, 'AUTO LOGIC': true, 'MANUAL CONTROL': true, 'START COMMAND': true, 'STOP COMMAND': true, 'PRESSURE SENSOR': true },
      electrical: { 'PHASE VOLTAGE': true, 'PHASE CURRENT': true, 'POWER FACTOR': true, 'FREQUENCY': true, 'KW LOAD': true, 'KVAH UNIT': true },
      stationMode: 'REMOTE'
    });
    setViewMode('LIST');
  };


  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this mapping?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/templates/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete from backend');
        }
      } catch (error) {
        console.error('Error deleting from backend:', error);
      }
      setSavedTemplates(savedTemplates.filter(t => t.id !== id));
    }
  };

  const toggleSelectTemplate = (id) => {
    setSelectedTemplates(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkRemove = async () => {
    if (window.confirm(`Are you sure you want to remove ${selectedTemplates.length} selected mappings?`)) {
      try {
        await Promise.all(selectedTemplates.map(id => fetch(`http://localhost:5000/api/templates/${id}`, { method: 'DELETE' })));
      } catch (error) {
        console.error('Error deleting multiple from backend:', error);
      }
      setSavedTemplates(savedTemplates.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
    }
  };

  const handleEdit = (template) => {
    setSelectedCategory(template.category);
    setSelectedModule(template.module);
    if (template.mapping) {
      setAgLowerConfig(template.mapping.agLowerConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgUpperConfig(template.mapping.agUpperConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgAutoConfig(template.mapping.agAutoConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgManualConfig(template.mapping.agManualConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgBypassConfig(template.mapping.agBypassConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgLevelConfig(template.mapping.agLevelConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgOpenConfig(template.mapping.agOpenConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgCloseConfig(template.mapping.agCloseConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setAgTankRange(template.mapping.agTankRange || { domStart: '', domEnd: '', flushStart: '', flushEnd: '' });
      setAgTankType(template.mapping.agTankType || 'DOMESTIC');
      setAgMasterEnabled(template.mapping.agMasterEnabled !== undefined ? template.mapping.agMasterEnabled : true);
      setUgLowerConfig(template.mapping.ugLowerConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgUpperConfig(template.mapping.ugUpperConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgAutoConfig(template.mapping.ugAutoConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgManualConfig(template.mapping.ugManualConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStartCmdConfig(template.mapping.ugStartCmdConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStopCmdConfig(template.mapping.ugStopCmdConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStartPressConfig(template.mapping.ugStartPressConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgStopPressConfig(template.mapping.ugStopPressConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgLocalModeConfig(template.mapping.ugLocalModeConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgRemoteModeConfig(template.mapping.ugRemoteModeConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setPressureConfig(template.mapping.pressureConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setElecVoltageConfig(template.mapping.elecVoltageConfig || { location: '', device: '', module: '', ry: '', yb: '', br: '', enabled: true });
      setElecCurrentConfig(template.mapping.elecCurrentConfig || { location: '', device: '', module: '', r: '', y: '', b: '', enabled: true });
      setElecSystemConfig(template.mapping.elecSystemConfig || { location: '', device: '', module: '', pf: '', freq: '', load: '', enabled: true });
      setElecConsumptionConfig(template.mapping.elecConsumptionConfig || { location: '', device: '', module: '', kva: '', kwh: '', kvah: '', enabled: true });
      setUgConfig(template.mapping.ugConfig || {
        integration: { 'LEVEL MONITORING': true, 'PUMP STATUS': true, 'AUTO LOGIC': true, 'MANUAL CONTROL': true, 'START COMMAND': true, 'STOP COMMAND': true, 'PRESSURE SENSOR': true },
        electrical: { 'PHASE VOLTAGE': true, 'PHASE CURRENT': true, 'POWER FACTOR': true, 'FREQUENCY': true, 'KW LOAD': true, 'KVAH UNIT': true },
        stationMode: 'REMOTE'
      });
      setUgPumpRange(template.mapping.ugPumpRange || { name: '', id: '' });
      setPressureTarget(template.mapping.pressureTarget || '');
      setElectricalTarget(template.mapping.electricalTarget || '');
      setUgTankLevelConfig(template.mapping.ugTankLevelConfig || { location: '', device: '', module: '', field: '', enabled: true });
      setUgTankRange(template.mapping.ugTankRange || { name: '', id: '' });
      setTemplateName(template.name || '');

      // Pre-fetch dynamic data so dropdowns are fully populated
      Object.values(template.mapping).forEach(config => {
        if (config && typeof config === 'object') {
          if (config.location) {
            fetchLocationDetails(config.location);
          }
          if (config.device) {
            fetchDeviceDetails(config.device);
          }
        }
      });
    }
    setEditingTemplateId(template.id);
    setViewMode('FORM');
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  return (
    <div className="fade-in p-4 scada-config-page">
      <div className="page-header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4 mb-4 p-4 bg-dark bg-opacity-40 rounded-4 border border-white border-opacity-10 shadow-lg">
        <div className="d-flex align-items-center gap-4">
          <div className="p-3 rounded-4 bg-info bg-opacity-10 text-info border border-info border-opacity-20 shadow-glow">
            <Layers size={32} />
          </div>
          <div>
            <h2 className="mb-0 text-white fw-black tracking-tighter">
              {viewMode === 'FORM' ? 'MAPPING' : 'SAVED'} <span className="text-info">{viewMode === 'FORM' ? 'TEMPLATES' : 'SETTINGS'}</span>
            </h2>
            <p className="text-secondary fs-10 fw-bold opacity-75 mb-0 uppercase letter-spacing-2">
              {viewMode === 'FORM' ? 'Hierarchical Field & Device Configuration' : 'Active System Mappings & Protocols'}
            </p>
          </div>
        </div>
        
        {toastMessage && (
          <div className="position-fixed start-50 translate-middle-x fade-in" style={{ zIndex: 9999, bottom: '12%' }}>
            <div className={`px-4 py-3 rounded-pill shadow-lg d-flex align-items-center gap-3 border ${
              toastMessage.type === 'error' ? 'bg-danger bg-opacity-20 border-danger text-danger' : 'bg-success bg-opacity-20 border-success text-success'
            }`} style={{ backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              {toastMessage.type === 'error' ? <Info size={20} /> : <CheckCircle2 size={20} />}
              <span className="fw-black tracking-widest fs-9">{toastMessage.text}</span>
            </div>
          </div>
        )}

        <div className="d-flex flex-column w-100 w-lg-auto gap-3">
          {viewMode === 'LIST' && (
            <div className="d-flex flex-column flex-sm-row gap-2 w-100">
              {selectedTemplates.length > 0 && (
                <Button variant="danger" className="fw-black px-4 rounded-3 shadow-glow-danger-box me-0 me-sm-2 w-100 text-nowrap" onClick={handleBulkRemove}>
                  <X size={18} className="me-2" /> DELETE SELECTED ({selectedTemplates.length})
                </Button>
              )}
              <Button variant="outline-info" className="fw-bold px-4 rounded-3" onClick={() => {
                setEditingTemplateId(null);
                // Reset AG Configs
                setAgLowerConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgUpperConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgAutoConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgManualConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgBypassConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgLevelConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgOpenConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgCloseConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgTankRange({ domStart: '', domEnd: '', flushStart: '', flushEnd: '' });
                
                // Reset UG Configs
                setUgLowerConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgUpperConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgAutoConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgManualConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgStartCmdConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgStopCmdConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgStartPressConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgStopPressConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgLocalModeConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgRemoteModeConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setUgPumpRange({ name: '', id: '' });
                
                // Reset Others
                setPressureConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setElecVoltageConfig({ location: '', device: '', module: '', ry: '', yb: '', br: '', enabled: true });
                setElecCurrentConfig({ location: '', device: '', module: '', r: '', y: '', b: '', enabled: true });
                setElecSystemConfig({ location: '', device: '', module: '', pf: '', freq: '', load: '', enabled: true });
                setElecConsumptionConfig({ location: '', device: '', module: '', kva: '', kwh: '', kvah: '', enabled: true });
                
                setViewMode('FORM');
              }}>
                <Settings size={18} className="me-2" /> MAPPING CONFIGURATION
              </Button>
              <Button variant="info" className="fw-bold px-4 rounded-3 shadow-glow" onClick={() => {
                setEditingTemplateId(null);
                // Same reset logic as above but focused on "Add New"
                setAgLowerConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgUpperConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgAutoConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgManualConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgBypassConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgLevelConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgOpenConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgCloseConfig({ location: '', device: '', module: '', field: '', enabled: true });
                setAgTankRange({ domStart: '', domEnd: '', flushStart: '', flushEnd: '' });
                setUgPumpRange({ name: '', id: '' });
                setViewMode('FORM');
              }}>
                <Zap size={18} className="me-2" /> ADD NEW MAPPING
              </Button>
            </div>
          )}
          {viewMode === 'FORM' && (
            <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 w-100 justify-content-xl-end">
              <div className="d-flex flex-column w-100" style={{ maxWidth: '400px' }}>
                <span className="fs-10 text-secondary fw-black uppercase opacity-50 tracking-widest mb-1">Config Label</span>
                <Form.Control 
                  type="text" 
                  placeholder="E.g. Primary Mapping V1" 
                  className="premium-input bg-dark bg-opacity-40 border-info border-opacity-20 text-info fw-black fs-11 px-3 py-2 rounded-3 w-100"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="d-flex flex-column flex-sm-row gap-2 align-self-start align-self-xl-end w-100 w-xl-auto">
                <Button variant="outline-warning" className="fw-bold px-4 rounded-3 border-opacity-25 w-100 text-nowrap" onClick={() => setViewMode('LIST')}>
                  <History size={18} className="me-2" /> PREVIOUS SETTING
                </Button>
                <Button variant="info" className={`fw-bold px-4 rounded-3 shadow-glow transition-all w-100 text-nowrap ${isSaving ? 'opacity-50' : ''}`} onClick={handleSave} disabled={isSaving}>
                  <Save size={18} className="me-2" /> {isSaving ? 'SAVING...' : 'SAVE TEMPLATE'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'FORM' ? (
        <>
          <div className="configuration-form-wrapper p-4 premium-figma-card rounded-4 position-relative overflow-hidden" style={{ marginBottom: '300px' }}>
            <div className="card-inner-glow"></div>
            <div className="position-relative z-1">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="text-white fw-black tracking-tighter mb-1 uppercase">MODULE <span className="text-info">CONFIGURATOR</span></h4>
                  <p className="text-secondary fs-12 fw-bold uppercase tracking-widest opacity-50 mb-0">Define hardware parameters and system mapping</p>
                </div>
                <Button variant="outline-danger" className="fw-black px-4 py-2 fs-11 uppercase tracking-widest border-opacity-20 hover-glow-text" onClick={() => setViewMode('LIST')}>
                  Discard
                </Button>
              </div>

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 scada-data-box">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="icon-box-premium info" style={{ width: '24px', height: '24px' }}>
                        <Layers size={14} />
                      </div>
                      <small className="text-info d-block fw-black uppercase tracking-widest opacity-80 mb-0" style={{ fontSize: '0.65rem' }}>Step 1: Primary Module Group</small>
                    </div>
                    <Form.Select className="premium-input p-2 fs-11" value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                      {Object.keys(categories).map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 scada-data-box">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="icon-box-premium warning" style={{ width: '24px', height: '24px' }}>
                        <Settings size={14} />
                      </div>
                      <small className="text-warning d-block fw-black uppercase tracking-widest opacity-80 mb-0" style={{ fontSize: '0.65rem' }}>Step 2: Operational Sub-Module</small>
                    </div>
                    <Form.Select className="premium-input p-2 fs-11" value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                      {categories[selectedCategory].map(mod => (
                        <option key={mod} value={mod}>{mod.toUpperCase()}</option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>
              </Row>

              {selectedModule === 'AG Tank' ? (
                <div className="config-form-container scale-in">
                  {/* TANK TYPE SELECTION & ASSET MAPPING */}
                  <div className="p-0 rounded-4 bg-dark bg-opacity-20 border border-white border-opacity-5 mb-4 overflow-hidden position-relative">
                    <div className="p-3 border-bottom border-white border-opacity-5 bg-dark bg-opacity-40 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <LayoutGrid className="text-primary shadow-glow-blue" size={18} />
                        <h6 className="mb-0 text-white fw-black uppercase tracking-widest fs-11">Tank Asset Mapping</h6>
                      </div>
                      <div className="d-flex gap-4 bg-dark bg-opacity-40 px-4 py-2 rounded-pill border border-white border-opacity-10">
                        <Form.Check
                          type="radio"
                          label="DOMESTIC TANK"
                          name="tankType"
                          id="radio-domestic"
                          className="scada-radio text-info fw-black fs-11 uppercase"
                          checked={agTankType === 'DOMESTIC'}
                          onChange={() => setAgTankType('DOMESTIC')}
                        />
                        <Form.Check
                          type="radio"
                          label="UG PUMP"
                          name="ugPumpType"
                          id="radio-flushing"
                          className="scada-radio text-primary fw-black fs-11 uppercase"
                          checked={agTankType === 'FLUSHING'}
                          onChange={() => setAgTankType('FLUSHING')}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-dark bg-opacity-20">
                      <Row className="g-4 justify-content-center">
                        {agTankType === 'DOMESTIC' ? (
                          <Col md={8}>
                            <div className="p-4 rounded-4 bg-dark bg-opacity-40 border border-info border-opacity-10 premium-figma-card position-relative overflow-hidden transition-all hover-glow-blue">
                              <div className="card-inner-glow bg-info opacity-20"></div>
                              <div className="mb-4 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="icon-box-premium info p-2 shadow-glow-blue"><Home size={20} /></div>
                                  <div>
                                    <h6 className="text-white fw-black uppercase tracking-widest mb-0 fs-9">Domestic Tank Configuration</h6>
                                    <small className="text-info opacity-50 uppercase fs-12 fw-bold">Primary Supply Mapping</small>
                                  </div>
                                </div>
                                <Home size={32} className="text-info opacity-5" />
                              </div>
                              <Row className="g-3 align-items-end position-relative z-1">
                                <Col xs={5}>
                                  <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2 d-block">Source Tower</Form.Label>
                                  <Form.Select className="premium-input p-2 fs-9 fw-bold border-info border-opacity-10"
                                    value={agTankRange.domStart} onChange={(e) => handleDomesticTowerChange(e.target.value)}>
                                    <option value="">SELECT TOWER</option>
                                    {domesticTowers.map(t => (
                                      <option key={t.name} value={t.name}>
                                        {t.name}{disabledTowerNames.includes(t.name) ? ' (DISABLED)' : ''}
                                      </option>
                                    ))}
                                  </Form.Select>
                                </Col>
                                <Col xs={3}>
                                  <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2 d-block">Asset ID</Form.Label>
                                  <div className="p-2 rounded bg-dark bg-opacity-40 border border-info border-opacity-10 text-info fw-black fs-9 text-center" style={{ height: '38px', lineHeight: '22px' }}>
                                    {agTankRange.domEnd || 'D-XX'}
                                  </div>
                                </Col>
                                <Col xs={4}>
                                  <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2 d-block">Master Control</Form.Label>
                                  <div className="p-1 rounded bg-dark bg-opacity-40 border border-info border-opacity-10 d-flex align-items-center justify-content-between px-3" style={{ height: '38px' }}>
                                    <div className={`p-1 rounded-circle ${agMasterEnabled ? 'bg-info shadow-glow-blue' : 'bg-secondary'} transition-all`} style={{ width: '6px', height: '6px' }}></div>
                                    <Form.Check 
                                      type="switch" 
                                      className="scada-switch success sm m-0" 
                                      checked={agMasterEnabled} 
                                      onChange={(e) => {
                                        const val = e.target.checked;
                                        setAgMasterEnabled(val);
                                        autoSaveMasterStatus(val);
                                      }}
                                    />
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          </Col>
                        ) : (
                          <Col md={8}>
                            <div className="p-4 rounded-4 bg-dark bg-opacity-40 border border-primary border-opacity-10 premium-figma-card position-relative overflow-hidden transition-all hover-glow-blue">
                              <div className="card-inner-glow bg-primary opacity-20"></div>
                              <div className="mb-4 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="icon-box-premium primary p-2 shadow-glow-blue"><Droplets size={20} /></div>
                                  <div>
                                    <h6 className="text-white fw-black uppercase tracking-widest mb-0 fs-9">Flushing Tank Configuration</h6>
                                    <small className="text-primary opacity-50 uppercase fs-12 fw-bold">Secondary Supply Mapping</small>
                                  </div>
                                </div>
                                <Droplets size={32} className="text-primary opacity-5" />
                              </div>
                              <Row className="g-3 align-items-end position-relative z-1">
                                <Col xs={5}>
                                  <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2 d-block">Source Tower</Form.Label>
                                  <Form.Select className="premium-input p-2 fs-9 fw-bold border-primary border-opacity-10"
                                    value={agTankRange.flushStart} onChange={(e) => handleFlushingTowerChange(e.target.value)}>
                                    <option value="">SELECT TOWER</option>
                                    {flushingTowers.map(t => (
                                      <option key={t.name} value={t.name}>
                                        {t.name}{disabledTowerNames.includes(t.name) ? ' (DISABLED)' : ''}
                                      </option>
                                    ))}
                                  </Form.Select>
                                </Col>
                                <Col xs={3}>
                                  <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2 d-block">Asset ID</Form.Label>
                                  <div className="p-2 rounded bg-dark bg-opacity-40 border border-primary border-opacity-10 text-primary fw-black fs-9 text-center" style={{ height: '38px', lineHeight: '22px' }}>
                                    {agTankRange.flushEnd || 'F-XX'}
                                  </div>
                                </Col>
                                <Col xs={4}>
                                  <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2 d-block">Master Control</Form.Label>
                                  <div className="p-1 rounded bg-dark bg-opacity-40 border border-primary border-opacity-10 d-flex align-items-center justify-content-between px-3" style={{ height: '38px' }}>
                                    <div className={`p-1 rounded-circle ${agMasterEnabled ? 'bg-primary shadow-glow-blue' : 'bg-secondary'} transition-all`} style={{ width: '6px', height: '6px' }}></div>
                                    <Form.Check 
                                      type="switch" 
                                      className="scada-switch success sm m-0" 
                                      checked={agMasterEnabled} 
                                      onChange={(e) => {
                                        const val = e.target.checked;
                                        setAgMasterEnabled(val);
                                        autoSaveMasterStatus(val);
                                      }}
                                    />
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  </div>

                  {/* FULL HARDWARE MAPPING GRID BASED ON SKETCH */}
                  <div className="mb-5">
                    <Row className="g-4">
                      {[
                        { title: 'Lower Limits', state: agLowerConfig, setter: setAgLowerConfig, icon: <ArrowDownCircle size={18} />, color: 'info' },
                        { title: 'Upper Limits', state: agUpperConfig, setter: setAgUpperConfig, icon: <ArrowUpCircle size={18} />, color: 'primary' },
                        { title: 'Auto Command', state: agAutoConfig, setter: setAgAutoConfig, icon: <Activity size={18} />, color: 'success' },
                        { title: 'Manual Command', state: agManualConfig, setter: setAgManualConfig, icon: <Settings size={18} />, color: 'warning' },
                        { title: 'Bypass Command', state: agBypassConfig, setter: setAgBypassConfig, icon: <Zap size={18} />, color: 'danger' },
                        { title: 'Level Command', state: agLevelConfig, setter: setAgLevelConfig, icon: <Layers size={18} />, color: 'info' },
                        { title: 'Open Valve Command', state: agOpenConfig, setter: setAgOpenConfig, icon: <Droplets size={18} />, color: 'primary' },
                        { title: 'Close Valve Command', state: agCloseConfig, setter: setAgCloseConfig, icon: <X size={18} />, color: 'danger' },
                      ].map((section, idx) => (
                        <Col md={6} key={idx}>
                          <div className={`p-4 rounded-4 bg-dark bg-opacity-40 border border-white border-opacity-10 premium-figma-card h-100 position-relative overflow-hidden transition-all ${agMasterEnabled ? 'hover-glow-blue' : 'opacity-25 grayscale'}`} style={{ pointerEvents: agMasterEnabled ? 'auto' : 'none' }}>
                            <div className="card-inner-glow bg-white opacity-5"></div>
                            <div className="mb-3 d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                <div className={`icon-box-premium ${section.color} p-2`}>
                                  {section.icon}
                                </div>
                                <h6 className="text-white fw-black uppercase tracking-widest mb-0 fs-10">{section.title}</h6>
                              </div>
                              <Form.Check
                                type="switch"
                                className="scada-switch success"
                                checked={section.state.enabled}
                                onChange={(e) => section.setter({ ...section.state, enabled: e.target.checked })}
                              />
                            </div>
                            <Row className="g-2 position-relative z-1">
                              {[
                                { label: 'Location', key: 'location' },
                                { label: 'Device_ID', key: 'device' },
                                { label: 'Module_ID', key: 'module' },
                                { label: 'Event_ Field', key: 'field' }
                              ].map((f) => (
                                <Col xs={6} key={f.key}>
                                  <Form.Label className="fs-12 text-secondary fw-black uppercase tracking-widest opacity-50 mb-1 d-block" style={{ fontSize: '0.6rem' }}>{f.label}</Form.Label>
                                    <Form.Select className="premium-input p-2 fs-12 fw-bold border-white border-opacity-10" style={{ height: '32px', fontSize: '0.7rem' }}
                                      value={section.state[f.key]} onChange={(e) => handleConfigChange(section.state, section.setter, f.key, e.target.value)}>
                                      <option value="">SELECT {f.label.toUpperCase()}</option>
                                      {getFieldList(f.key, section.state).map(opt => (
                                        <option key={typeof opt === 'object' ? opt.id : opt} value={typeof opt === 'object' ? opt.id : opt}>
                                          {typeof opt === 'object' ? opt.label : opt}
                                        </option>
                                      ))}
                                    </Form.Select>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </div>
              ) : selectedModule === 'UG Pump' ? (
                <div className="config-form-container scale-in">
                  <div className="p-0 rounded-4 bg-dark bg-opacity-20 border border-white border-opacity-5 mb-5 overflow-hidden position-relative">
                    <div className="p-3 border-bottom border-white border-opacity-5 bg-dark bg-opacity-40 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <Database className="text-success shadow-glow-green" size={18} />
                        <h6 className="mb-0 text-white fw-black uppercase tracking-widest fs-11">UG Pump Network Integration</h6>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                         <Form.Select 
                            className="premium-input p-2 fs-10 fw-bold border-success border-opacity-20" 
                            style={{ width: '150px' }}
                            value={selectedUgPumpNo || ''}
                            onChange={(e) => handleUgPumpNoChange(Number(e.target.value))}
                         >
                            <option value="">SELECT UNIT</option>
                            <option value="1">PUMP 1</option>
                            <option value="2">PUMP 2</option>
                            <option value="3">PUMP 3</option>
                         </Form.Select>
                      </div>
                    </div>

                    <div className={`p-4 bg-dark bg-opacity-20 position-relative ${!selectedUgPumpNo ? 'opacity-25 grayscale' : ''}`} style={{ pointerEvents: selectedUgPumpNo ? 'auto' : 'none' }}>
                      <Row className="g-4">
                        {[
                          { title: 'Lower Limits', state: ugLowerConfig, setter: setUgLowerConfig, icon: <ArrowDownCircle size={18} />, color: 'info' },
                          { title: 'Upper Limits', state: ugUpperConfig, setter: setUgUpperConfig, icon: <ArrowUpCircle size={18} />, color: 'primary' },
                          { title: 'Auto Setting', state: ugAutoConfig, setter: setUgAutoConfig, icon: <Activity size={18} />, color: 'success' },
                          { title: 'Manual Setting', state: ugManualConfig, setter: setUgManualConfig, icon: <Settings size={18} />, color: 'warning' },
                          { title: 'Start Command', state: ugStartCmdConfig, setter: setUgStartCmdConfig, icon: <Zap size={18} />, color: 'info' },
                          { title: 'Stop Command', state: ugStopCmdConfig, setter: setUgStopCmdConfig, icon: <X size={18} />, color: 'danger' },
                          { title: 'Start Pressure', state: ugStartPressConfig, setter: setUgStartPressConfig, icon: <Activity size={18} />, color: 'primary' },
                          { title: 'Stop Pressure', state: ugStopPressConfig, setter: setUgStopPressConfig, icon: <Zap size={18} />, color: 'warning' },
                          { title: 'Local Mode', state: ugLocalModeConfig, setter: setUgLocalModeConfig, icon: <Home size={18} />, color: 'info' },
                          { title: 'Remote Mode', state: ugRemoteModeConfig, setter: setUgRemoteModeConfig, icon: <Activity size={18} />, color: 'primary' },
                        ].map((section, idx) => (
                          <Col md={6} key={idx}>
                            <div className="p-4 rounded-4 bg-dark bg-opacity-40 border border-white border-opacity-10 premium-figma-card h-100 position-relative overflow-hidden transition-all hover-glow-blue">
                              <div className="card-inner-glow bg-white opacity-5"></div>
                              <div className="mb-3 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                  <div className={`icon-box-premium ${section.color} p-2`}>
                                    {section.icon}
                                  </div>
                                  <h6 className="text-white fw-black uppercase tracking-widest mb-0 fs-10">{section.title}</h6>
                                </div>
                                <Form.Check
                                  type="switch"
                                  className="scada-switch success"
                                  checked={section.state.enabled}
                                  onChange={(e) => section.setter({ ...section.state, enabled: e.target.checked })}
                                />
                              </div>
                              <Row className="g-2 position-relative z-1">
                                {[
                                  { label: 'Location', key: 'location' },
                                  { label: 'Device_ID', key: 'device' },
                                  { label: 'Module_ID', key: 'module' },
                                  { label: 'Event_ Field', key: 'field' }
                                ].map((f) => (
                                  <Col xs={6} key={f.key}>
                                    <Form.Label className="fs-12 text-secondary fw-black uppercase tracking-widest opacity-50 mb-1 d-block" style={{ fontSize: '0.6rem' }}>{f.label}</Form.Label>
                                    <Form.Select className="premium-input p-2 fs-12 fw-bold border-white border-opacity-10" style={{ height: '32px', fontSize: '0.7rem' }}
                                      value={section.state[f.key]} onChange={(e) => handleConfigChange(section.state, section.setter, f.key, e.target.value)}>
                                      <option value="">SELECT {f.label.toUpperCase()}</option>
                                      {getFieldList(f.key, section.state).map(opt => (
                                        <option key={typeof opt === 'object' ? opt.id : opt} value={typeof opt === 'object' ? opt.id : opt}>
                                          {typeof opt === 'object' ? opt.label : opt}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>
                </div>
              ) : selectedModule === 'UG Tank' ? (
                <div className="config-form-container scale-in">
                  <div className="p-0 rounded-4 bg-dark bg-opacity-20 border border-white border-opacity-5 mb-5 overflow-hidden position-relative">
                    <div className="p-3 border-bottom border-white border-opacity-5 bg-dark bg-opacity-40 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <Droplets className="text-info shadow-glow-blue" size={18} />
                        <h6 className="mb-0 text-white fw-black uppercase tracking-widest fs-11">UG Tank Level Integration <span className="opacity-40">(Hydrostatic / Ultrasonic)</span></h6>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                         <Form.Label className="mb-0 text-secondary fs-10 fw-black uppercase tracking-widest opacity-50">Target Asset:</Form.Label>
                         <Form.Select 
                            className="premium-input p-2 fs-10 fw-bold border-info border-opacity-20" 
                            style={{ width: '220px' }}
                            value={ugTankRange.name}
                            onChange={(e) => handleUgTankChange(e.target.value)}
                         >
                            <option value="">SELECT TANK UNIT</option>
                            {ugPumpsList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                         </Form.Select>
                      </div>
                    </div>

                    <div className="p-4 bg-dark bg-opacity-20">
                      <Row className="g-4 justify-content-center">
                        <Col md={8}>
                          <div className="p-4 rounded-4 bg-dark bg-opacity-40 border border-info border-opacity-10 premium-figma-card h-100 position-relative overflow-hidden transition-all hover-glow-blue">
                            <div className="card-inner-glow bg-info opacity-5"></div>
                            <div className="mb-3 d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-2">
                                <div className="icon-box-premium info p-2">
                                  <Layers size={18} />
                                </div>
                                <h6 className="text-white fw-black uppercase tracking-widest mb-0 fs-10">Water Level Mapping</h6>
                              </div>
                              <Form.Check
                                type="switch"
                                className="scada-switch success"
                                checked={ugTankLevelConfig.enabled}
                                onChange={(e) => setUgTankLevelConfig({ ...ugTankLevelConfig, enabled: e.target.checked })}
                              />
                            </div>
                            <Row className="g-2 position-relative z-1">
                              {[
                                { label: 'Location', key: 'location' },
                                { label: 'Device_ID', key: 'device' },
                                { label: 'Module_ID', key: 'module' },
                                { label: 'Event_ Field', key: 'field' }
                              ].map((f) => (
                                <Col xs={6} key={f.key}>
                                  <Form.Label className="fs-12 text-secondary fw-black uppercase tracking-widest opacity-50 mb-1 d-block" style={{ fontSize: '0.6rem' }}>{f.label}</Form.Label>
                                  <Form.Select className="premium-input p-2 fs-12 fw-bold border-white border-opacity-10" style={{ height: '32px', fontSize: '0.7rem' }}
                                    value={ugTankLevelConfig[f.key]} onChange={(e) => handleConfigChange(ugTankLevelConfig, setUgTankLevelConfig, f.key, e.target.value)}>
                                    <option value="">SELECT {f.label.toUpperCase()}</option>
                                    {getFieldList(f.key, ugTankLevelConfig).map(opt => (
                                      <option key={typeof opt === 'object' ? opt.id : opt} value={typeof opt === 'object' ? opt.id : opt}>
                                        {typeof opt === 'object' ? opt.label : opt}
                                      </option>
                                    ))}
                                  </Form.Select>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </div>
              ) : selectedModule === 'Pressure' ? (
                <div className="config-form-container scale-in">
                  <div className="p-0 rounded-4 bg-dark bg-opacity-20 border border-white border-opacity-5 mb-5 overflow-hidden position-relative">
                    <div className="p-3 border-bottom border-white border-opacity-5 bg-dark bg-opacity-40 d-flex align-items-center gap-2">
                      <Activity className="text-info shadow-glow-blue" size={18} />
                      <h6 className="mb-0 text-white fw-black uppercase tracking-widest fs-11">Pressure Transmitter Mapping <span className="opacity-40">(Analog / Digital)</span></h6>
                    </div>
                    <div className="p-4 bg-dark bg-opacity-20">
                      <Row className="g-4">
                        <Col md={12}>
                          <div className="p-4 rounded-4 bg-dark bg-opacity-40 border border-info border-opacity-10 premium-figma-card position-relative overflow-hidden transition-all hover-glow-blue">
                            <div className="card-inner-glow bg-info opacity-20"></div>
                              <div className="d-flex align-items-center gap-3">
                                <div className="icon-box-premium info p-2 shadow-glow-blue"><Zap size={20} /></div>
                                <div className="flex-grow-1">
                                  <h6 className="text-white fw-black uppercase tracking-widest mb-0 fs-9">Pressure_Settings</h6>
                                  <small className="text-info opacity-50 uppercase fs-12 fw-bold">Live Pressure Feedback Integration</small>
                                </div>
                                <div className="d-flex align-items-center gap-3 bg-dark bg-opacity-30 p-1 px-3 rounded-pill border border-info border-opacity-10">
                                   <Form.Label className="mb-0 text-secondary fs-11 fw-black uppercase tracking-widest opacity-50">Sensor Unit:</Form.Label>
                                   <Form.Select 
                                      className="premium-input p-1 fs-11 fw-bold border-0 bg-transparent text-info" 
                                      style={{ width: '180px', height: '30px !important' }}
                                      value={pressureTarget}
                                      onChange={(e) => setPressureTarget(e.target.value)}
                                   >
                                      <option value="">SELECT SENSOR</option>
                                      {pressureSensorsList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                   </Form.Select>
                                </div>
                                <Form.Check 
                                  type="switch" 
                                  className="scada-switch success" 
                                  checked={pressureConfig.enabled} 
                                  onChange={(e) => setPressureConfig({ ...pressureConfig, enabled: e.target.checked })}
                                />
                              </div>
                            </div>
                            <div className={`transition-all ${!pressureTarget ? 'opacity-25 grayscale' : ''}`} style={{ pointerEvents: pressureTarget ? 'auto' : 'none' }}>
                               {!pressureTarget && (
                                  <div className="text-center py-2">
                                     <small className="text-info fw-black uppercase tracking-widest opacity-50 fs-12"><Info size={14} className="me-2" /> Select a Pressure Sensor to Begin Mapping</small>
                                  </div>
                               )}
                               <Row className="g-3">
                              {[
                                 { label: 'Location', key: 'location' },
                                 { label: 'Device_ID', key: 'device' },
                                 { label: 'Module_ID', key: 'module' },
                                 { label: 'Event_ Field', key: 'field' }
                               ].map((f) => (
                                 <Col md={3} key={f.key} className="mb-3 position-relative z-1">
                                   <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-2 d-block">{f.label}</Form.Label>
                                   <Form.Select className="premium-input p-2 fs-9 fw-bold border-info border-opacity-10"
                                     value={pressureConfig[f.key]} onChange={(e) => handleConfigChange(pressureConfig, setPressureConfig, f.key, e.target.value)}>
                                     <option value="">SELECT {f.label.toUpperCase()}</option>
                                     {getFieldList(f.key, pressureConfig).map(opt => (
                                       <option key={typeof opt === 'object' ? opt.id : opt} value={typeof opt === 'object' ? opt.id : opt}>
                                         {typeof opt === 'object' ? opt.label : opt}
                                       </option>
                                     ))}
                                   </Form.Select>
                                 </Col>
                               ))}
                             </Row>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </div>
              ) : selectedModule === 'Electrical Parameter' ? (
                <div className="config-form-container scale-in">
                  <div className="p-0 rounded-4 bg-dark bg-opacity-20 border border-white border-opacity-5 mb-5 overflow-hidden position-relative">
                    <div className="p-3 border-bottom border-white border-opacity-5 bg-dark bg-opacity-40 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <Zap className="text-warning shadow-glow" size={18} />
                        <h6 className="mb-0 text-white fw-black uppercase tracking-widest fs-11">Power Meter Integration <span className="opacity-40">(RS-485 / Modbus)</span></h6>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                         <Form.Label className="mb-0 text-secondary fs-10 fw-black uppercase tracking-widest opacity-50">Select Meter Unit:</Form.Label>
                         <Form.Select 
                            className="premium-input p-2 fs-10 fw-bold border-warning border-opacity-20" 
                            style={{ width: '220px' }}
                            value={electricalTarget}
                            onChange={(e) => setElectricalTarget(e.target.value)}
                         >
                            <option value="">SELECT METER</option>
                            {electricalMetersList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                         </Form.Select>
                      </div>
                    </div>

                    <div className={`p-4 bg-dark bg-opacity-20 ${!electricalTarget ? 'opacity-25 grayscale' : ''}`} style={{ pointerEvents: electricalTarget ? 'auto' : 'none' }}>
                      {!electricalTarget && (
                        <div className="position-absolute top-50 start-50 translate-middle z-3 text-center w-100">
                           <div className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20 px-4 py-2 rounded-pill fs-11 fw-black tracking-widest">
                             <Info size={14} className="me-2" /> SELECT AN ELECTRICAL METER TO BEGIN MAPPING
                           </div>
                        </div>
                      )}
                      <Row className="g-4">
                        {[
                          { 
                            title: 'Avg Voltage (L-L)', 
                            state: elecVoltageConfig, 
                            setter: setElecVoltageConfig, 
                            icon: <Zap size={18} />, 
                            color: 'warning',
                            fields: [
                              { label: 'RY Voltage', key: 'ry' },
                              { label: 'YB Voltage', key: 'yb' },
                              { label: 'BR Voltage', key: 'br' }
                            ]
                          },
                          { 
                            title: 'Current per Phase', 
                            state: elecCurrentConfig, 
                            setter: setElecCurrentConfig, 
                            icon: <Activity size={18} />, 
                            color: 'info',
                            fields: [
                              { label: 'R Phase', key: 'r' },
                              { label: 'Y Phase', key: 'y' },
                              { label: 'B Phase', key: 'b' }
                            ]
                          },
                          { 
                            title: 'System Metrics', 
                            state: elecSystemConfig, 
                            setter: setElecSystemConfig, 
                            icon: <Database size={18} />, 
                            color: 'success',
                            fields: [
                              { label: 'Power Factor', key: 'pf' },
                              { label: 'Frequency', key: 'freq' },
                              { label: 'Total Load', key: 'load' }
                            ]
                          },
                          { 
                            title: 'Power Consumption', 
                            state: elecConsumptionConfig, 
                            setter: setElecConsumptionConfig, 
                            icon: <Zap size={18} />, 
                            color: 'primary',
                            fields: [
                              { label: 'KVA', key: 'kva' },
                              { label: 'KWH', key: 'kwh' },
                              { label: 'KVAH', key: 'kvah' }
                            ]
                          }
                        ].map((section, idx) => (
                          <Col md={6} key={idx}>
                            <div className="p-4 rounded-4 bg-dark bg-opacity-40 border border-white border-opacity-10 premium-figma-card h-100 position-relative overflow-hidden transition-all hover-glow-blue">
                              <div className="card-inner-glow bg-white opacity-5"></div>
                              <div className="mb-4 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                  <div className={`icon-box-premium ${section.color} p-2`}>
                                    {section.icon}
                                  </div>
                                  <h6 className="text-white fw-black uppercase tracking-widest mb-0 fs-10">{section.title}</h6>
                                </div>
                                <Form.Check 
                                  type="switch" 
                                  className="scada-switch success" 
                                  checked={section.state.enabled} 
                                  onChange={(e) => section.setter({ ...section.state, enabled: e.target.checked })}
                                />
                              </div>

                              <Row className="g-2 mb-3 pb-3 border-bottom border-white border-opacity-5">
                                {[
                                  { label: 'Location', key: 'location' },
                                  { label: 'Device_ID', key: 'device' },
                                  { label: 'Module_ID', key: 'module' }
                                ].map((f) => (
                                  <Col xs={4} key={f.key}>
                                    <Form.Label className="fs-11 text-secondary fw-black uppercase tracking-widest opacity-50 mb-1 d-block" style={{ fontSize: '0.55rem' }}>{f.label}</Form.Label>
                                    <Form.Select className="premium-input p-2 fs-11 fw-bold border-white border-opacity-10" style={{ height: '30px', fontSize: '0.65rem' }}
                                      value={section.state[f.key]} onChange={(e) => handleConfigChange(section.state, section.setter, f.key, e.target.value)}>
                                      <option value="">{f.label.split('_')[0]}</option>
                                      {getFieldList(f.key, section.state).map(opt => (
                                        <option key={typeof opt === 'object' ? opt.id : opt} value={typeof opt === 'object' ? opt.id : opt}>
                                          {typeof opt === 'object' ? opt.label : opt}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Col>
                                ))}
                              </Row>

                               <Row className="g-2">
                                 {section.fields.map((field) => (
                                   <Col xs={4} key={field.key}>
                                     <Form.Label className="fs-11 text-white fw-bold uppercase tracking-wider mb-1 d-block" style={{ fontSize: '0.6rem' }}>{field.label}</Form.Label>
                                     <Form.Select className={`premium-input p-2 fs-11 fw-bold border-${section.color} border-opacity-20`} style={{ height: '30px', fontSize: '0.65rem' }}
                                       value={section.state[field.key]} onChange={(e) => section.setter({ ...section.state, [field.key]: e.target.value })}>
                                       <option value="">FIELD ID</option>
                                       {getFieldList('field', section.state).map(opt => (
                                         <option key={typeof opt === 'object' ? opt.id : opt} value={typeof opt === 'object' ? opt.id : opt}>
                                           {typeof opt === 'object' ? opt.label : opt}
                                         </option>
                                       ))}
                                     </Form.Select>
                                   </Col>
                                 ))}
                               </Row>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="bg-dark bg-opacity-20 border border-white border-opacity-5 rounded-4 p-5 text-center">
                  <LayoutGrid size={48} className="text-secondary mb-3 mx-auto opacity-50" />
                  <h5 className="text-white fw-bold mb-2">Module Setup Pending</h5>
                  <p className="text-secondary fs-9">The configuration template for {selectedModule} is currently being mapped to technical feasibility protocols.</p>
                </Card>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="list-mode-view scale-in">
          <div className="d-flex align-items-center justify-content-between mb-4 p-3 bg-dark bg-opacity-20 rounded-4 border border-white border-opacity-5">
            <div className="d-flex align-items-center gap-3">
              <span className="fs-11 text-secondary fw-black uppercase letter-spacing-1 ms-2">Filter By:</span>
              <div className="d-flex gap-2">
                {['ALL', 'AG Tank', 'UG Pump', 'UG Tank', 'Pressure', 'Electrical Parameter'].map(mod => (
                  <Button
                    key={mod}
                    variant={filterModule === mod ? "info" : "outline-secondary"}
                    className={`fs-11 fw-black px-3 py-2 rounded-3 transition-all ${filterModule === mod ? 'shadow-glow' : 'border-opacity-20 opacity-75'}`}
                    onClick={() => setFilterModule(mod)}
                  >
                    {mod.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
               <Form.Check 
                  type="checkbox"
                  className="scada-checkbox info"
                  label={<span className="text-secondary fs-12 fw-bold uppercase tracking-widest">Select All</span>}
                  checked={selectedTemplates.length === savedTemplates.length && savedTemplates.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTemplates(savedTemplates.map(t => t.id));
                    else setSelectedTemplates([]);
                  }}
               />
            </div>
          </div>

          <Row className="g-4">
            {savedTemplates.filter(t => filterModule === 'ALL' || t.module === filterModule).length === 0 ? (
              <Col md={12}>
                <Card className="bg-dark bg-opacity-20 border border-white border-opacity-5 rounded-4 p-5 text-center">
                  <LayoutGrid size={48} className="text-secondary mb-3 mx-auto opacity-50" />
                  <h5 className="text-white fw-bold">{filterModule === 'ALL' ? 'No Settings Saved' : `No ${filterModule} Mappings Found`}</h5>
                  <p className="text-secondary">{filterModule === 'ALL' ? "Click 'Add New Mapping' to start configuring your SCADA modules." : "Try clearing the filter or adding a new mapping for this module."}</p>
                  {filterModule !== 'ALL' && (
                    <Button variant="outline-info" className="mt-3 fs-11 fw-black px-4" onClick={() => setFilterModule('ALL')}>SHOW ALL MAPPINGS</Button>
                  )}
                </Card>
              </Col>
            ) : (
              savedTemplates
                .filter(t => filterModule === 'ALL' || t.module === filterModule)
                .map((template) => (
                  <Col xl={3} lg={4} md={6} key={template.id}>
                    <Card className={`premium-figma-card border-0 rounded-4 overflow-hidden h-100 d-flex flex-column transition-all ${selectedTemplates.includes(template.id) ? 'selected-premium-card' : ''}`}>
                      <div className="card-inner-glow"></div>
                      <div className="p-3 position-relative z-1 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <Form.Check 
                              type="checkbox"
                              className="scada-checkbox info m-0"
                              checked={selectedTemplates.includes(template.id)}
                              onChange={() => toggleSelectTemplate(template.id)}
                            />
                            <div className="status-indicator-pulse"></div>
                            <div>
                              <h6 className="text-info fw-black mb-0 fs-10 tracking-widest uppercase">
                                {template.name || template.module}
                              </h6>
                              <span className="text-secondary fs-12 uppercase fw-bold opacity-40 letter-spacing-2" style={{ fontSize: '0.6rem' }}>{template.module} • {template.category}</span>
                            </div>
                          </div>
                          <div
                            className="preview-badge-premium d-flex align-items-center gap-2 cursor-pointer"
                            onClick={() => handlePreview(template)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Eye size={12} className="eye-icon-glow" />
                            <span className="fw-black uppercase tracking-widest" style={{ fontSize: '0.65rem' }}>Preview</span>
                          </div>
                        </div>

                        {template.module === 'AG Tank' && template.mapping && template.mapping.agTankRange && (template.mapping.agTankRange.domStart || template.mapping.agTankRange.flushStart) && (
                          <div className="mt-3 mb-3 p-2 rounded-3 bg-dark bg-opacity-40 border border-white border-opacity-5 scada-data-box">
                            <div className="d-flex flex-column gap-2">
                              {template.mapping.agTankRange.domStart && (
                                <div className="d-flex justify-content-between align-items-center px-1">
                                  <span className="fs-12 text-secondary uppercase fw-black opacity-60">Domestic</span>
                                  <span className="fs-11 text-primary fw-black tracking-widest">{template.mapping.agTankRange.domStart}</span>
                                </div>
                              )}
                              {template.mapping.agTankRange.flushStart && (
                                <div className="d-flex justify-content-between align-items-center px-1">
                                  <span className="fs-12 text-secondary uppercase fw-black opacity-60">Flushing</span>
                                  <span className="fs-11 text-info fw-black tracking-widest">{template.mapping.agTankRange.flushStart}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {template.module === 'UG Pump' && template.mapping && template.mapping.ugConfig && (
                          <div className="mt-3 mb-3 p-2 rounded-3 bg-dark bg-opacity-40 border border-white border-opacity-5 scada-data-box">
                            <div className="d-flex justify-content-between align-items-center px-1">
                              <span className="fs-12 text-secondary uppercase fw-black opacity-60">Mode</span>
                              <span className={`fs-11 fw-black tracking-widest ${template.mapping.ugConfig.stationMode === 'REMOTE' ? 'text-info' : 'text-warning'}`}>
                                {template.mapping.ugConfig.stationMode || 'REMOTE'}
                              </span>
                            </div>
                          </div>
                        )}

                        {template.module === 'UG Tank' && template.mapping && template.mapping.ugTankRange && (
                          <div className="mt-3 mb-3 p-2 rounded-3 bg-dark bg-opacity-40 border border-white border-opacity-5 scada-data-box">
                            <div className="d-flex justify-content-between align-items-center px-1">
                              <span className="fs-12 text-secondary uppercase fw-black opacity-60">Level Tank</span>
                              <span className="fs-11 text-info fw-black tracking-widest">{template.mapping.ugTankRange.name || 'UG TANK'}</span>
                            </div>
                          </div>
                        )}
                        <div className="pt-2 mt-auto border-top border-white border-opacity-5">
                          <div className="d-flex justify-content-between text-secondary fs-12 fw-bold mb-1">
                            <span className="opacity-40 uppercase tracking-tighter" style={{ fontSize: '0.65rem' }}>Site Status</span>
                            <span className="text-success fs-13 fw-black tracking-widest shadow-glow-green">ACTIVE</span>
                          </div>
                          <div className="d-flex justify-content-between text-secondary fs-12 fw-bold">
                            <span className="opacity-40 uppercase tracking-tighter" style={{ fontSize: '0.65rem' }}>Synchronized</span>
                            <span className="fs-13 opacity-75 fw-black tracking-tighter">{template.timestamp.split(',')[0]}</span>
                          </div>
                        </div>
                        </div>
                      <div className="card-action-bar-premium p-2 d-flex justify-content-between align-items-center mt-auto position-relative z-1">
                        <Button variant="link" className="text-info fs-11 fw-black text-decoration-none p-2 uppercase tracking-widest hover-glow-text cursor-pointer" onClick={() => handleEdit(template)}>EDIT CONFIG</Button>
                        <Button variant="link" className="text-danger fs-11 fw-black text-decoration-none p-2 uppercase tracking-widest hover-glow-text cursor-pointer" onClick={() => handleRemove(template.id)}>REMOVE</Button>
                      </div>
                    </Card>
                  </Col>
                ))
            )}
          </Row>
        </div>
      )}

      {/* BEAUTIFULLY INFORMATION MODAL (PREVIEW) */}
      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        centered
        size="lg"
        className="scada-modal premium-modal"
      >
        <Modal.Body className="bg-dark rounded-4 border-0 overflow-hidden shadow-2xl p-0 premium-figma-card">
          <div className="card-inner-glow"></div>
          {previewTemplate && (
            <div className="preview-container h-100 position-relative z-1">
              <div className="p-3 border-bottom border-white border-opacity-5 d-flex justify-content-between align-items-center bg-dark bg-opacity-20">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info border border-info border-opacity-10">
                    <Info size={20} />
                  </div>
                  <div>
                    <h6 className="mb-0 text-white fw-black uppercase tracking-tighter fs-10">Module Configuration <span className="text-info">Preview</span></h6>
                    <p className="mb-0 text-secondary fs-12 fw-bold opacity-50 uppercase letter-spacing-1">
                      {previewTemplate.category} / {previewTemplate.module} #{String(savedTemplates.filter(t => t.module === previewTemplate.module).findIndex(t => t.id === previewTemplate.id) + 1).padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <Button variant="link" className="text-secondary p-0 hover-text-white transition-all" onClick={() => setShowPreviewModal(false)}>
                  <X size={20} />
                </Button>
              </div>

              <div className="p-3">
                <Row className="g-3">
                  {/* UG TANK LEVEL SECTION */}
                  {previewTemplate.module === 'UG Tank' && previewTemplate.mapping && previewTemplate.mapping.ugTankLevelConfig && (
                    <Col md={12}>
                      <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 mb-0 scada-data-box">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="text-info fw-black uppercase letter-spacing-1 m-0 d-flex align-items-center gap-2 fs-11">
                            <Droplets size={16} /> UG Tank Level Configuration
                          </h6>
                          <div className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-20 px-3 py-1 rounded-pill fs-11 fw-black tracking-widest">
                             {previewTemplate.mapping.ugTankRange?.name || 'UG TANK'}
                          </div>
                        </div>
                        <Row className="g-3">
                          <Col md={12}>
                            <div className="p-3 rounded bg-dark bg-opacity-40 border border-info border-opacity-10">
                              <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-white border-opacity-5 pb-2">
                                <span className="fs-12 text-info fw-black uppercase">Level Mapping Status</span>
                                <Badge bg={previewTemplate.mapping.ugTankLevelConfig.enabled ? "success" : "secondary"} className="bg-opacity-10 text-success border border-success border-opacity-25">
                                  {previewTemplate.mapping.ugTankLevelConfig.enabled ? "ACTIVE" : "DISABLED"}
                                </Badge>
                              </div>
                              <Row className="g-2">
                                {[
                                  { label: 'Location', key: 'location' },
                                  { label: 'Device ID', key: 'device' },
                                  { label: 'Module ID', key: 'module' },
                                  { label: 'Event Field', key: 'field' }
                                ].map((f) => (
                                  <Col xs={3} key={f.key}>
                                    <span className="fs-13 text-secondary uppercase fw-bold opacity-40 d-block">{f.label}</span>
                                    <span className="fs-13 text-white fw-bold d-block truncate">{previewTemplate.mapping.ugTankLevelConfig[f.key] || '---'}</span>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  )}
                  {/* UG PUMP SPECIFIC SECTION */}
                  {previewTemplate.module === 'UG Pump' && previewTemplate.mapping && previewTemplate.mapping.ugConfig && (
                    <Col md={12}>
                      <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 mb-0 scada-data-box">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="text-success fw-black uppercase letter-spacing-1 m-0 d-flex align-items-center gap-2 fs-11">
                            <Database size={16} /> UG System Parameters
                          </h6>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-12 text-secondary uppercase fw-black opacity-50">Mode:</span>
                            <Badge bg={previewTemplate.mapping.ugConfig.stationMode === 'REMOTE' ? 'info' : 'warning'} className="fs-11 py-1 px-3 rounded-pill bg-opacity-10 border border-opacity-25">
                              {previewTemplate.mapping.ugConfig.stationMode || 'REMOTE'}
                            </Badge>
                          </div>
                        </div>
                        <Row className="g-2">
                          <Col md={12}>
                            <div className="fs-11 text-secondary uppercase fw-black mb-2 opacity-50">Tank Unit Assignment</div>
                            <div className="p-2 rounded bg-dark bg-opacity-40 border border-success border-opacity-20 text-success fw-black fs-9 text-center shadow-inner">
                               {previewTemplate.mapping.ugPumpRange?.name || 'NOT ASSIGNED'}
                            </div>
                          </Col>
                          <Col md={12} className="mt-2">
                            <div className="fs-11 text-secondary uppercase fw-black mb-2 opacity-50">Network Integration</div>
                            <div className="d-flex flex-wrap gap-2">
                              {Object.entries(previewTemplate.mapping.ugConfig.integration).map(([key, val]) => (
                                <Badge key={key} bg={val ? "success" : "secondary"} className={`bg-opacity-10 ${val ? 'text-success' : 'text-secondary'} border ${val ? 'border-success' : 'border-secondary'} border-opacity-25 px-2 py-1 fs-12 uppercase`}>
                                  {key}: {val ? 'ON' : 'OFF'}
                                </Badge>
                              ))}
                            </div>
                          </Col>
                          <Col md={12} className="mt-3">
                            <div className="fs-11 text-secondary uppercase fw-black mb-2 opacity-50">Hardware Mapping Matrix</div>
                            <Row className="g-2">
                              {[
                                { title: 'Lower Limits', key: 'ugLowerConfig' },
                                { title: 'Upper Limits', key: 'ugUpperConfig' },
                                { title: 'Auto Setting', key: 'ugAutoConfig' },
                                { title: 'Manual Setting', key: 'ugManualConfig' },
                                { title: 'Start Command', key: 'ugStartCmdConfig' },
                                { title: 'Stop Command', key: 'ugStopCmdConfig' },
                                { title: 'Start Press', key: 'ugStartPressConfig' },
                                { title: 'Stop Press', key: 'ugStopPressConfig' },
                                { title: 'Local Mode', key: 'ugLocalModeConfig' },
                                { title: 'Remote Mode', key: 'ugRemoteModeConfig' }
                              ].map((section, idx) => (
                                <Col md={4} key={idx}>
                                  <div className="p-2 rounded bg-dark bg-opacity-40 border border-white border-opacity-5">
                                    <span className="fs-13 text-success fw-black uppercase d-block mb-1 border-bottom border-white border-opacity-5">{section.title}</span>
                                    {['location', 'device', 'module', 'field'].map(f => (
                                      <div key={f} className="d-flex justify-content-between">
                                        <span className="fs-13 text-secondary uppercase fw-bold opacity-40">{f}</span>
                                        <span className="fs-13 text-white fw-bold">{previewTemplate.mapping[section.key]?.[f] || '---'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </Col>
                          <Col md={12} className="mt-4">
                            <div className="fs-11 text-secondary uppercase fw-black mb-2 opacity-50">Electrical Data Export</div>
                            <div className="d-flex flex-wrap gap-2">
                              {Object.entries(previewTemplate.mapping.ugConfig.electrical).map(([key, val]) => (
                                <Badge key={key} bg={val ? "info" : "secondary"} className={`bg-opacity-10 ${val ? 'text-info' : 'text-secondary'} border ${val ? 'border-info' : 'border-secondary'} border-opacity-25 px-2 py-1 fs-12 uppercase`}>
                                  {key}: {val ? 'ON' : 'OFF'}
                                </Badge>
                              ))}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  )}

                  {/* TANK RANGE SECTION - ONLY FOR AG TANK */}
                  {previewTemplate.module === 'AG Tank' && previewTemplate.mapping && previewTemplate.mapping.agTankRange && (
                    <Col md={12}>
                      <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 scada-data-box">
                        <h6 className="text-info fw-black uppercase letter-spacing-1 mb-3 d-flex align-items-center gap-2 fs-11">
                          <LayoutGrid size={16} /> Tank Mapping Data
                        </h6>
                        <Row className="g-3">
                          <Col md={6}>
                            <div className="p-3 rounded-4 bg-dark bg-opacity-40 border border-white border-opacity-5 d-flex justify-content-between align-items-center shadow-inner hover-border-info transition-all cursor-default">
                              <div>
                                <small className="text-info uppercase fw-black fs-12 d-block opacity-80 mb-1 letter-spacing-1">Domestic Supply</small>
                                <h4 className="text-white fw-black mb-0 tracking-widest fs-4 text-glow-blue">{previewTemplate.mapping.agTankRange.domStart || '---'}</h4>
                              </div>
                              <div className="bg-primary px-3 py-1 rounded-pill shadow-glow-blue border border-primary border-opacity-20 d-flex align-items-center">
                                <span className="text-white fw-black uppercase tracking-widest" style={{ fontSize: '0.6rem' }}>Mapped</span>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="p-3 rounded-4 bg-dark bg-opacity-40 border border-white border-opacity-5 d-flex justify-content-between align-items-center shadow-inner hover-border-info transition-all cursor-default">
                              <div>
                                <small className="text-info uppercase fw-black fs-12 d-block opacity-80 mb-1 letter-spacing-1">Flushing Supply</small>
                                <h4 className="text-white fw-black mb-0 tracking-widest fs-4 text-glow-blue">{previewTemplate.mapping.agTankRange.flushStart || '---'}</h4>
                              </div>
                              <div className="bg-info px-3 py-1 rounded-pill shadow-glow-blue border border-info border-opacity-20 d-flex align-items-center">
                                <span className="text-white fw-black uppercase tracking-widest" style={{ fontSize: '0.6rem' }}>Mapped</span>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  )}

                  {/* PRESSURE MODULE PREVIEW */}
                  {previewTemplate.module === 'Pressure' && previewTemplate.mapping && previewTemplate.mapping.pressureConfig && (
                    <Col md={12}>
                      <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 scada-data-box">
                        <h6 className="text-info fw-black uppercase letter-spacing-1 mb-3 d-flex align-items-center gap-2 fs-11">
                          <Activity size={16} /> Pressure Sensor Protocol
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(previewTemplate.mapping.pressureConfig).map(([key, val]) => (
                            <div key={key} className="flex-grow-1 p-2 rounded bg-dark bg-opacity-40 border border-white border-opacity-5 text-center">
                              <small className="text-secondary uppercase fw-black fs-12 d-block opacity-50">{key}</small>
                              <span className="text-white fw-bold fs-11">{val || '---'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Col>
                  )}

                  {/* ELECTRICAL PARAMETER PREVIEW */}
                  {previewTemplate.module === 'Electrical Parameter' && previewTemplate.mapping && (
                    <Col md={12}>
                      <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 scada-data-box">
                        <h6 className="text-warning fw-black uppercase letter-spacing-1 mb-3 d-flex align-items-center gap-2 fs-11">
                          <Zap size={16} /> Electrical Analysis Matrix
                        </h6>
                        <Row className="g-3">
                          {[
                            { title: 'Line-To-Line Voltage', key: 'elecVoltageConfig', fields: ['ry', 'yb', 'br'] },
                            { title: 'Phase Current', key: 'elecCurrentConfig', fields: ['r', 'y', 'b'] },
                            { title: 'System Metrics', key: 'elecSystemConfig', fields: ['pf', 'freq', 'load'] },
                            { title: 'Energy Consumption', key: 'elecConsumptionConfig', fields: ['kva', 'kwh', 'kvah'] }
                          ].map((section, idx) => (
                            <Col md={6} key={idx}>
                              <div className="p-2 rounded bg-dark bg-opacity-40 border border-white border-opacity-5">
                                <span className="fs-13 text-warning fw-black uppercase d-block mb-1 border-bottom border-white border-opacity-5">{section.title}</span>
                                {['location', 'device', 'module', ...section.fields].map(f => (
                                  <div key={f} className="d-flex justify-content-between">
                                    <span className="fs-13 text-secondary uppercase fw-bold opacity-40">{f}</span>
                                    <span className="fs-13 text-white fw-bold">{previewTemplate.mapping[section.key]?.[f] || '---'}</span>
                                  </div>
                                ))}
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Col>
                  )}

                  {/* FIELD MAPPING SECTION - FOR AG TANKS (NEW SKETCH BASED) */}
                  {previewTemplate.module === 'AG Tank' && previewTemplate.mapping && (
                    <Col md={12}>
                      <div className="p-3 rounded-4 bg-dark bg-opacity-30 border border-white border-opacity-5 scada-data-box">
                        <h6 className="text-white fw-black uppercase letter-spacing-1 mb-3 d-flex align-items-center gap-2 fs-11">
                          <LayoutGrid size={16} className="text-info" /> AG Hardware Field Matrix
                        </h6>
                        <Row className="g-3">
                          {[
                            { title: 'Lower Limits', key: 'agLowerConfig' },
                            { title: 'Upper Limits', key: 'agUpperConfig' },
                            { title: 'Auto Cmd', key: 'agAutoConfig' },
                            { title: 'Manual Cmd', key: 'agManualConfig' },
                            { title: 'Bypass Cmd', key: 'agBypassConfig' },
                            { title: 'Level Cmd', key: 'agLevelConfig' },
                            { title: 'Open Valve', key: 'agOpenConfig' },
                            { title: 'Close Valve', key: 'agCloseConfig' }
                          ].map((section, idx) => (
                            <Col md={4} key={idx}>
                              <div className="p-2 rounded bg-dark bg-opacity-40 border border-white border-opacity-5">
                                <div className="d-flex justify-content-between align-items-center mb-1 border-bottom border-white border-opacity-5 pb-1">
                                  <span className="fs-12 text-info fw-black uppercase">{section.title}</span>
                                  {previewTemplate.mapping[section.key]?.enabled !== undefined && (
                                    <Badge bg={previewTemplate.mapping[section.key].enabled ? "success" : "secondary"} className="fs-13 py-0">
                                      {previewTemplate.mapping[section.key].enabled ? 'ON' : 'OFF'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="d-flex flex-column gap-1">
                                  {['location', 'device', 'module', 'field'].map(f => (
                                    <div key={f} className="d-flex justify-content-between">
                                      <span className="fs-13 text-secondary uppercase fw-bold opacity-40">{f}</span>
                                      <span className="fs-13 text-white fw-bold">{previewTemplate.mapping[section.key]?.[f] || '---'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Col>
                  )}

                </Row>

                <div className="mt-3 p-2 rounded-3 bg-success bg-opacity-20 border border-success border-opacity-20 d-flex justify-content-between align-items-center shadow-inner">
                  <div className="d-flex align-items-center gap-2 text-white fw-bold fs-12 uppercase tracking-widest">
                    <CheckCircle2 size={14} className="text-success shadow-glow-green" /> Protocols Verified
                  </div>
                  <span className="text-white opacity-40 fs-12 fw-black tracking-widest">TID: {previewTemplate.id}</span>
                </div>
              </div>

              <div className="p-2 border-top border-white border-opacity-5 bg-dark bg-opacity-40 d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" className="fs-12 fw-black uppercase tracking-widest py-1 px-3 border-opacity-20 hover-text-white cursor-pointer" onClick={() => setShowPreviewModal(false)}>
                  Dismiss
                </Button>
                <Button variant="dark" className="fs-12 fw-black uppercase tracking-widest py-1 px-3 shadow-glow border border-info border-opacity-20 cursor-pointer text-info" onClick={() => { setShowPreviewModal(false); handleEdit(previewTemplate); }}>
                  Modify Setting
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scada-select {
          background-color: rgba(15, 23, 42, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 6px !important;
          box-shadow: none !important;
          appearance: auto !important;
          cursor: pointer;
          font-size: 0.75rem !important;
          padding: 6px 10px !important;
          height: 34px !important;
        }
        .scada-select:focus {
          border-color: var(--bs-info) !important;
        }
        .scada-select option {
          background-color: #111827;
          color: white;
          padding: 4px;
          font-size: 0.75rem;
        }
        .scada-switch .form-check-input {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          width: 2.4em;
          height: 1.2em;
          cursor: pointer;
        }
        .scada-switch .form-check-input:checked {
          background-color: var(--bs-info);
          border-color: var(--bs-info);
        }
        .scada-switch.success .form-check-input:checked {
          background-color: var(--bs-success);
          border-color: var(--bs-success);
        }
        .shadow-glow { box-shadow: 0 0 20px rgba(56, 189, 248, 0.15); }
        .min-w-200 { min-width: 200px; }
        .hover-bg-white-5:hover { background: rgba(255, 255, 255, 0.05); }
        .fw-black { font-weight: 900 !important; }
        .letter-spacing-1 { letter-spacing: 1px; }
        .letter-spacing-2 { letter-spacing: 2.5px; }
        .fs-12 { font-size: 0.6rem; }
        .fs-11 { font-size: 0.65rem; }
        .fs-10 { font-size: 0.75rem; }
        .fs-9 { font-size: 0.85rem; }
        .fs-8 { font-size: 0.95rem; }
        .scada-modal .modal-content {
          background: transparent !important;
          border: none !important;
        }
        .hover-text-white:hover { color: white !important; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        
        .premium-figma-card {
          background: linear-gradient(145deg, rgba(23, 33, 50, 0.7) 0%, rgba(8, 12, 21, 0.9) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
          position: relative;
          transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .card-inner-glow {
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent);
          z-index: 2;
        }

        .premium-figma-card:hover {
          transform: translateY(-5px);
          border-color: rgba(56, 189, 248, 0.3) !important;
          box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.1);
        }

        .preview-badge-premium {
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.15);
          padding: 4px 10px;
          border-radius: 100px;
          color: #38bdf8;
          font-size: 0.65rem;
          transition: all 0.3s ease;
        }

        .preview-badge-premium:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
        }

        .scada-data-box {
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.03) !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .status-indicator-pulse {
          width: 6px; height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
          animation: status-pulse 2s infinite;
        }

        .icon-box-premium {
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .icon-box-premium.info { border-color: rgba(56, 189, 248, 0.3) !important; box-shadow: 0 0 12px rgba(56, 189, 248, 0.1); color: #38bdf8; }
        .icon-box-premium.primary { border-color: rgba(13, 110, 253, 0.3) !important; box-shadow: 0 0 12px rgba(13, 110, 253, 0.1); color: #0d6efd; }
        .icon-box-premium.success { border-color: rgba(34, 197, 94, 0.3) !important; box-shadow: 0 0 12px rgba(34, 197, 94, 0.1); color: #22c55e; }
        .icon-box-premium.warning { border-color: rgba(234, 179, 8, 0.3) !important; box-shadow: 0 0 12px rgba(234, 179, 8, 0.1); color: #eab308; }
        .icon-box-premium.danger { border-color: rgba(239, 68, 68, 0.3) !important; box-shadow: 0 0 12px rgba(239, 68, 68, 0.1); color: #ef4444; }

        .scada-radio .form-check-input {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
        }
        .scada-radio .form-check-input:checked {
          background-color: var(--bs-info);
          border-color: var(--bs-info);
        }
        .grayscale { filter: grayscale(1); }
        .scada-switch.lg .form-check-input {
          width: 3.2em;
          height: 1.6em;
        }

        @keyframes status-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .card-action-bar-premium {
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .hover-glow-text:hover {
          text-shadow: 0 0 8px currentColor;
          opacity: 1 !important;
        }

        .shadow-glow-green { text-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
        .shadow-glow-blue { box-shadow: 0 0 15px rgba(56, 189, 248, 0.25); }
        .shadow-glow-green-box { box-shadow: 0 0 15px rgba(34, 197, 94, 0.25); }
        .shadow-glow-warning-box { box-shadow: 0 0 15px rgba(234, 179, 8, 0.25); }
        .shadow-glow-danger-box { box-shadow: 0 0 15px rgba(239, 68, 68, 0.25); }
        
        .selected-premium-card {
          background: linear-gradient(145deg, rgba(56, 189, 248, 0.1) 0%, rgba(12, 18, 30, 0.95) 100%) !important;
          border-color: rgba(56, 189, 248, 0.6) !important;
          box-shadow: 0 0 40px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.05) !important;
        }

        .selected-premium-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.15), transparent 70%);
          pointer-events: none;
        }

        .scada-checkbox .form-check-input {
          width: 1.1rem;
          height: 1.1rem;
          background-color: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(56, 189, 248, 0.4) !important;
          cursor: pointer;
          border-radius: 4px !important;
          transition: all 0.3s ease;
        }
        
        .scada-checkbox .form-check-input:checked {
          background-color: #38bdf8 !important;
          border-color: #38bdf8 !important;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e") !important;
        }

        .scada-checkbox.lg .form-check-input {
          width: 1.4rem;
          height: 1.4rem;
        }

        .text-glow-blue { text-shadow: 0 0 15px rgba(56, 189, 248, 0.4); }
        .text-glow-white { text-shadow: 0 0 10px rgba(255, 255, 255, 0.2); }
        .hover-border-info:hover { border-color: #38bdf8 !important; }
        .hover-border-primary:hover { border-color: #0d6efd !important; }
        .hover-border-success:hover { border-color: #198754 !important; }
        .hover-border-danger:hover { border-color: #dc3545 !important; }
        .hover-bg-white-opacity:hover { background: rgba(255, 255, 255, 0.03); }
        .premium-figma-card {
          background: linear-gradient(145deg, rgba(12, 18, 30, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(56, 189, 248, 0.15) !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
          position: relative;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-inner-glow {
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent);
          z-index: 2;
        }

        .configuration-form-wrapper {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(12, 18, 30, 1) 100%);
          border: 1px solid rgba(56, 189, 248, 0.1) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }

        .scada-data-box {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(56, 189, 248, 0.1) !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }

        .premium-input {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(56, 189, 248, 0.2) !important;
          color: #e2e8f0 !important;
          border-radius: 8px !important;
          transition: all 0.3s ease;
          padding: 8px 12px !important;
          height: 38px !important;
          font-size: 0.85rem !important;
        }
        
        /* Dark Theme Options */
        .premium-input option {
          background-color: #0f172a !important;
          color: white !important;
          padding: 10px !important;
          font-size: 0.85rem !important;
        }

        .premium-input:focus {
           background: rgba(15, 23, 42, 1) !important;
           border-color: #38bdf8 !important;
           box-shadow: 0 0 20px rgba(56, 189, 248, 0.2) !important;
        }

        .fs-9 { font-size: 0.95rem !important; font-weight: 800; color: #f8fafc; }
        .fs-12 { font-size: 0.65rem !important; color: #94a3b8; }
        .fs-11 { font-size: 0.75rem !important; color: #cbd5e1; }
        .hover-glow-blue:hover {
           box-shadow: 0 0 30px rgba(56, 189, 248, 0.1) !important;
           border-color: rgba(56, 189, 248, 0.4) !important;
           transform: translateY(-2px);
        .scada-config-page { max-width: 1600px; margin: 0 auto; }
        
        /* Typography System */
        .fw-black { font-weight: 900 !important; }
        .letter-spacing-2 { letter-spacing: 2px; }
        .tracking-widest { letter-spacing: 0.1em; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .uppercase { text-transform: uppercase; }
        
        .fs-7 { font-size: 1.1rem; }
        .fs-9 { font-size: 0.8rem; }
        .fs-10 { font-size: 0.7rem; }
        .fs-11 { font-size: 0.65rem; }
        .fs-12 { font-size: 0.6rem; }
        .fs-13 { font-size: 0.55rem; }

        /* Responsive Global Scaling */
        @media (max-width: 768px) {
            .page-header h2 { font-size: 1.3rem !important; }
            .page-header p { font-size: 0.6rem !important; }
            .page-header .btn { font-size: 0.75rem !important; padding: 0.6rem 1rem !important; width: 100%; justify-content: center; }
            .premium-input { font-size: 0.75rem !important; padding: 0.6rem !important; width: 100% !important; }
            .scada-config-page { padding: 0.5rem !important; }
            .page-header { padding: 1rem !important; margin-bottom: 1rem !important; }
            .page-header .lucide { width: 18px; height: 18px; }
            .configuration-form-wrapper { padding: 1rem !important; }
            .premium-figma-card { padding: 1rem !important; }
            h4 { font-size: 1.1rem !important; }
            h5 { font-size: 0.9rem !important; }
            h6 { font-size: 0.8rem !important; }
            .form-switch .form-check-input { width: 2em; height: 1em; }
        } 
        
        .z-1 { z-index: 1; }
        .shadow-glow-blue { text-shadow: 0 0 15px rgba(56, 189, 248, 0.6); }
      `}} />
    </div>
  );
};

export default ConfigTemplates;

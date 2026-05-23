import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Form, Badge } from 'react-bootstrap';
import {
  Settings as SettingsIcon,
  Shield,
  Save,
  RotateCcw,
  Layers3,
  Plus,
  Trash2,
  FolderTree
} from 'lucide-react';

const GROUP_EVENT_NAME = 'energy-meter-groups-updated';
const GROUP_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#f97316', '#a78bfa', '#f43f5e'];

const createDefaultModules = () => ({
  Dashboard: true,
  'Water Management': true,
  Motors: true,
  'DG Set': true,
  'Setting Templates': true,
  'Alarm System': true,
  'LT Panel': true,
  Transformer: true,
  'Fire Pumps': true,
  Ticketing: true,
  Maintenance: true,
  'Service History': true,
  'Daily DPR': true,
  'Energy Metering': true
});

const normalizeGroups = (groups, availableMeters) => {
  const validIds = new Set(availableMeters.map(m => String(m.id)));
  const meterLookup = new Map(
    availableMeters.map(meter => [
      String(meter.id),
      {
        id: String(meter.id),
        label: meter.label,
        type: meter.type || 'Sub Meter',
        category: meter.type || 'Sub Meter'
      }
    ])
  );
  return (Array.isArray(groups) ? groups : [])
    .map((group, index) => ({
      id: group?.id || `group-${Date.now()}-${index}`,
      name: String(group?.name || '').trim() || `Group ${index + 1}`,
      color: group?.color || GROUP_COLORS[index % GROUP_COLORS.length],
      meterIds: Array.from(
        new Set((Array.isArray(group?.meterIds) ? group.meterIds : []).map(id => String(id)))
      ).filter(id => validIds.has(id)),
      meterDetails: Array.from(
        new Set((Array.isArray(group?.meterIds) ? group.meterIds : []).map(id => String(id)))
      )
        .filter(id => validIds.has(id))
        .map(id => meterLookup.get(id))
        .filter(Boolean)
    }))
    .filter(group => group.name);
};

const fetchSavedGroupsFromBackend = async (availableMeters) => {
  const response = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/energy-meter-groups`);
  if (!response.ok) {
    throw new Error('Failed to fetch saved meter groups');
  }
  const data = await response.json();
  return normalizeGroups(Array.isArray(data?.groups) ? data.groups : [], availableMeters);
};

const Settings = () => {
  const defaultModules = useMemo(() => createDefaultModules(), []);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState(defaultModules);
  const [saveStatus, setSaveStatus] = useState(null);
  const [groupSaveStatus, setGroupSaveStatus] = useState(null);
  const [subMeters, setSubMeters] = useState([]);
  const [meterGroups, setMeterGroups] = useState([]);

  const hydrateSubMeters = async () => {
    try {
      const raw = localStorage.getItem('scada_templates');
      if (!raw) {
        setSubMeters([]);
        setMeterGroups(prev => normalizeGroups(prev, []));
        return;
      }
      const parsed = JSON.parse(raw);
      const nextSubMeters = parsed
        .filter(template => template.module === 'Sub Meters')
        .map((template, index) => ({
          id: String(template.id || `sub-${index + 1}`),
          label: template.mapping?.energyMeteringTarget || template.name || `Sub Meter ${index + 1}`,
          type: template.category || template.mapping?.subMeterCategory || 'Sub Meter'
        }));
      setSubMeters(nextSubMeters);
      const savedGroups = await fetchSavedGroupsFromBackend(nextSubMeters);
      setMeterGroups(normalizeGroups(savedGroups, nextSubMeters));
    } catch (error) {
      console.error('Failed to load sub meter templates:', error);
      setSubMeters([]);
      setMeterGroups(prev => normalizeGroups(prev, []));
    }
  };

  const fetchGlobalConfig = async () => {
    try {
      const response = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/super-admin/config`);
      if (response.ok) {
        const data = await response.json();
        const moduleMap = {
          showDashboard: 'Dashboard',
          showWaterManagement: 'Water Management',
          showMotors: 'Motors',
          showDGSet: 'DG Set',
          showSettingTemplates: 'Setting Templates',
          showAlarms: 'Alarm System',
          showLTPanel: 'LT Panel',
          showTransformers: 'Transformer',
          showFirePumps: 'Fire Pumps',
          showTicketing: 'Ticketing',
          showMaintenance: 'Maintenance',
          showServiceHistory: 'Service History',
          showDailyDPR: 'Daily DPR',
          showEnergyMetering: 'Energy Metering'
        };

        const sidebarModules = {};
        Object.entries(moduleMap).forEach(([key, label]) => {
          sidebarModules[label] = data[key] ?? true;
        });
        setModules(sidebarModules);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  useEffect(() => {
    fetchGlobalConfig();
    hydrateSubMeters();
  }, []);

  useEffect(() => {
    const syncSettingsState = async () => {
      try {
        const raw = localStorage.getItem('scada_templates');
        const parsed = raw ? JSON.parse(raw) : [];
        const nextSubMeters = parsed
          .filter(template => template.module === 'Sub Meters')
          .map((template, index) => ({
            id: String(template.id || `sub-${index + 1}`),
            label: template.mapping?.energyMeteringTarget || template.name || `Sub Meter ${index + 1}`,
            type: template.category || template.mapping?.subMeterCategory || 'Sub Meter'
          }));
        setSubMeters(nextSubMeters);
        const savedGroups = await fetchSavedGroupsFromBackend(nextSubMeters);
        setMeterGroups(normalizeGroups(savedGroups, nextSubMeters));
      } catch (error) {
        console.error('Failed to sync settings state:', error);
      }
    };

    window.addEventListener('storage', syncSettingsState);
    window.addEventListener('storage-update', syncSettingsState);
    window.addEventListener(GROUP_EVENT_NAME, syncSettingsState);
    return () => {
      window.removeEventListener('storage', syncSettingsState);
      window.removeEventListener('storage-update', syncSettingsState);
      window.removeEventListener(GROUP_EVENT_NAME, syncSettingsState);
    };
  }, []);

  const assignedMeterIds = useMemo(
    () => new Set(meterGroups.flatMap(group => group.meterIds.map(id => String(id)))),
    [meterGroups]
  );

  const ungroupedMeters = useMemo(
    () => subMeters.filter(meter => !assignedMeterIds.has(String(meter.id))),
    [subMeters, assignedMeterIds]
  );

  const toggleModule = (name) => {
    setModules(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleAll = (enabled) => {
    const nextModules = {};
    Object.keys(modules).forEach(key => {
      nextModules[key] = enabled;
    });
    setModules(nextModules);
  };

  const handleSaveToBackend = async () => {
    setSaving(true);
    try {
      const reverseMap = {
        Dashboard: 'showDashboard',
        'Water Management': 'showWaterManagement',
        Motors: 'showMotors',
        'DG Set': 'showDGSet',
        'Setting Templates': 'showSettingTemplates',
        'Alarm System': 'showAlarms',
        'LT Panel': 'showLTPanel',
        Transformer: 'showTransformers',
        'Fire Pumps': 'showFirePumps',
        Ticketing: 'showTicketing',
        Maintenance: 'showMaintenance',
        'Service History': 'showServiceHistory',
        'Daily DPR': 'showDailyDPR',
        'Energy Metering': 'showEnergyMetering'
      };

      const backendConfig = {};
      Object.entries(reverseMap).forEach(([label, key]) => {
        backendConfig[key] = modules[label];
      });

      const response = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/super-admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: backendConfig })
      });

      if (response.ok) {
        localStorage.setItem('scada_modules_config', JSON.stringify(modules));
        window.dispatchEvent(new Event('storage-update'));
        setSaveStatus('System Updated Successfully');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('Error saving to system');
    } finally {
      setSaving(false);
    }
  };

  const persistMeterGroups = async (groups) => {
    const normalized = normalizeGroups(groups, subMeters);
    const response = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/energy-meter-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups: normalized })
    });

    if (!response.ok) {
      throw new Error('Failed to save meter groups');
    }

    const data = await response.json();
    return normalizeGroups(Array.isArray(data?.groups) ? data.groups : normalized, subMeters);
  };

  const saveMeterGroups = async () => {
    const normalized = normalizeGroups(meterGroups, subMeters);
    try {
      const savedGroups = await persistMeterGroups(normalized);
      setMeterGroups(savedGroups);
      window.dispatchEvent(new Event(GROUP_EVENT_NAME));
      setGroupSaveStatus('Meter groups saved to database');
    } catch (error) {
      console.error('Failed to save meter groups to backend:', error);
      setGroupSaveStatus('Database save failed');
    }
    setTimeout(() => setGroupSaveStatus(null), 3000);
  };

  const resetConfig = () => {
    setModules(defaultModules);
    setSaveStatus('Values Reset (Click Save to Persist)');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const resetMeterGroups = async () => {
    try {
      await persistMeterGroups([]);
      setMeterGroups([]);
      window.dispatchEvent(new Event(GROUP_EVENT_NAME));
      setGroupSaveStatus('Meter groups reset');
    } catch (error) {
      console.error('Failed to reset meter groups in backend:', error);
      setGroupSaveStatus('Database reset failed');
    }
    setTimeout(() => setGroupSaveStatus(null), 3000);
  };

  const addGroup = () => {
    setMeterGroups(prev => [
      ...prev,
      {
        id: `group-${Date.now()}`,
        name: `Group ${prev.length + 1}`,
        color: GROUP_COLORS[prev.length % GROUP_COLORS.length],
        meterIds: []
      }
    ]);
  };

  const removeGroup = (groupId) => {
    setMeterGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const updateGroupField = (groupId, field, value) => {
    setMeterGroups(prev =>
      prev.map(group => (group.id === groupId ? { ...group, [field]: value } : group))
    );
  };

  const toggleMeterInGroup = (groupId, meterId) => {
    const targetId = String(meterId);
    setMeterGroups(prev =>
      prev.map(group => {
        const hasMeter = group.meterIds.includes(targetId);
        if (group.id === groupId) {
          return {
            ...group,
            meterIds: hasMeter
              ? group.meterIds.filter(id => id !== targetId)
              : [...group.meterIds, targetId]
          };
        }
        return {
          ...group,
          meterIds: group.meterIds.filter(id => id !== targetId)
        };
      })
    );
  };

  return (
    <div className="fade-in p-2">
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold">System Configuration</h2>
          <p className="text-secondary fs-7 mb-0">
            Global module control plus custom grouping for Energy Metering MFM meters.
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {saveStatus && <Badge bg="success" className="d-flex align-items-center px-3 py-2 fade-in">{saveStatus}</Badge>}
          <button onClick={() => toggleAll(true)} className="btn-scada-outline text-success border-success border-opacity-25">ENABLE ALL</button>
          <button onClick={() => toggleAll(false)} className="btn-scada-outline text-danger border-danger border-opacity-25">DISABLE ALL</button>
          <button onClick={resetConfig} className="btn-scada-outline d-flex align-items-center gap-2">
            <RotateCcw size={16} /> RESET
          </button>
          <button
            onClick={handleSaveToBackend}
            disabled={saving}
            className="btn btn-info rounded-pill px-4 fw-bold fs-11 shadow-lg d-flex align-items-center gap-2"
          >
            {saving ? <div className="spinner-border spinner-border-sm" /> : <Save size={16} />}
            SAVE & SYNC SYSTEM
          </button>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={12}>
          <Card className="scada-card border-0 shadow-lg h-100" style={{ background: '#0f172a' }}>
            <Card.Body className="p-4">
              <h6 className="mb-4 d-flex align-items-center text-info fw-black uppercase tracking-widest fs-12">
                <Shield size={18} className="me-2" /> Application Module Control
              </h6>

              <div className="module-list-container pe-2">
                <Row className="g-3">
                  {Object.keys(modules).map((name) => (
                    <Col key={name} md={6} lg={4} xl={3}>
                      <div
                        className={`d-flex justify-content-between align-items-center h-100 p-3 rounded-4 border transition-all ${
                          modules[name]
                            ? 'border-info border-opacity-10 bg-black bg-opacity-40'
                            : 'border-secondary border-opacity-5 bg-dark bg-opacity-10 opacity-40'
                        }`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className={`p-2 rounded-circle ${modules[name] ? 'bg-info text-dark' : 'bg-secondary text-white opacity-10'}`}>
                            <SettingsIcon size={14} />
                          </div>
                          <span className={`fw-bold fs-11 ${modules[name] ? 'text-white' : 'text-muted'}`}>{name}</span>
                        </div>
                        <Form.Check
                          type="switch"
                          id={`switch-${name}`}
                          checked={modules[name]}
                          onChange={() => toggleModule(name)}
                          className="scada-switch custom-switch-large"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={12}>
          <Card className="scada-card border-0 shadow-lg overflow-hidden" style={{ background: '#0b1324' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                <div>
                  <h6 className="mb-2 d-flex align-items-center text-warning fw-black uppercase tracking-widest fs-12">
                    <FolderTree size={18} className="me-2" /> MFM Meter Group Manager
                  </h6>
                  <p className="text-secondary mb-0 fs-11">
                    User settings ke andar sub meters ko custom group me assign kijiye. Jo meters kisi group me nahi honge,
                    woh Energy Metering Overview par individual live values ke saath dikhte rahenge.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {groupSaveStatus && <Badge bg="success" className="px-3 py-2">{groupSaveStatus}</Badge>}
                  <button onClick={addGroup} className="btn-scada-outline text-info border-info border-opacity-25 d-flex align-items-center gap-2">
                    <Plus size={15} /> ADD GROUP
                  </button>
                  <button onClick={resetMeterGroups} className="btn-scada-outline text-warning border-warning border-opacity-25 d-flex align-items-center gap-2">
                    <RotateCcw size={15} /> RESET GROUPS
                  </button>
                  <button onClick={saveMeterGroups} className="btn btn-warning rounded-pill px-4 fw-bold fs-11 d-flex align-items-center gap-2">
                    <Save size={16} /> SAVE METER GROUPS
                  </button>
                </div>
              </div>

              <Row className="g-4">
                <Col xl={4}>
                  <div className="glass-panel p-3 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="panel-label">Available Sub Meters</span>
                      <Badge bg="dark" className="border border-white border-opacity-10 text-info">{subMeters.length}</Badge>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {subMeters.length === 0 ? (
                        <div className="empty-note">No Sub Meter templates found yet.</div>
                      ) : (
                        subMeters.map(meter => {
                          const assignedGroup = meterGroups.find(group => group.meterIds.includes(String(meter.id)));
                          return (
                            <div key={meter.id} className="meter-pill">
                              <div>
                                <div className="text-white fw-bold fs-11">{meter.label}</div>
                                <div className="text-secondary small">{meter.type}</div>
                              </div>
                              <Badge
                                bg="none"
                                className="border"
                                style={{
                                  color: assignedGroup ? assignedGroup.color : '#94a3b8',
                                  borderColor: assignedGroup ? `${assignedGroup.color}55` : 'rgba(148,163,184,0.25)',
                                  background: assignedGroup ? `${assignedGroup.color}15` : 'rgba(148,163,184,0.08)'
                                }}
                              >
                                {assignedGroup ? assignedGroup.name : 'Ungrouped'}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Col>

                <Col xl={8}>
                  <div className="d-flex flex-column gap-3">
                    {meterGroups.length === 0 ? (
                      <div className="glass-panel p-4 text-center empty-state">
                        <Layers3 className="text-info mb-3" size={28} />
                        <h6 className="text-white mb-2">No meter groups created</h6>
                        <p className="text-secondary mb-0 fs-11">
                          Ek ya multiple groups bana sakte hain, jaise HVAC, Tenant Tower, Utility Block, Data Center.
                        </p>
                      </div>
                    ) : (
                      meterGroups.map((group, index) => (
                        <div key={group.id} className="glass-panel p-3 meter-group-card">
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                              <div className="group-swatch" style={{ background: group.color }} />
                              <div className="d-flex gap-2 flex-wrap flex-grow-1">
                                <Form.Control
                                  value={group.name}
                                  onChange={(e) => updateGroupField(group.id, 'name', e.target.value)}
                                  className="scada-input group-name-input"
                                  placeholder={`Group ${index + 1}`}
                                />
                                <Form.Control
                                  type="color"
                                  value={group.color}
                                  onChange={(e) => updateGroupField(group.id, 'color', e.target.value)}
                                  className="group-color-picker"
                                  title="Group color"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeGroup(group.id)}
                              className="btn-scada-outline text-danger border-danger border-opacity-25 d-flex align-items-center gap-2"
                            >
                              <Trash2 size={14} /> REMOVE
                            </button>
                          </div>

                          <div className="d-flex flex-wrap gap-2">
                            {subMeters.map(meter => {
                              const checked = group.meterIds.includes(String(meter.id));
                              return (
                                <label
                                  key={`${group.id}-${meter.id}`}
                                  className={`assignment-chip ${checked ? 'checked' : ''}`}
                                  style={{
                                    borderColor: checked ? `${group.color}55` : 'rgba(148,163,184,0.12)',
                                    background: checked ? `${group.color}14` : 'rgba(15,23,42,0.72)'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleMeterInGroup(group.id, meter.id)}
                                  />
                                  <span className="fw-bold text-white fs-11">{meter.label}</span>
                                  <small className="text-secondary">{meter.type}</small>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Col>
              </Row>

              <div className="glass-panel p-3 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="panel-label">Ungrouped meters that will still appear in Overview</span>
                  <Badge bg="dark" className="border border-white border-opacity-10 text-warning">{ungroupedMeters.length}</Badge>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {ungroupedMeters.length === 0 ? (
                    <div className="empty-note">All visible sub meters are assigned to a group.</div>
                  ) : (
                    ungroupedMeters.map(meter => (
                      <div key={meter.id} className="ungrouped-chip">
                        <span className="text-white fw-bold fs-11">{meter.label}</span>
                        <small className="text-secondary">{meter.type}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scada-card { transition: all 0.3s; }
        .scada-switch .form-check-input { width: 45px; height: 22px; cursor: pointer; }
        .scada-switch .form-check-input:checked { background-color: #0ea5e9; border-color: #0ea5e9; box-shadow: 0 0 10px rgba(14, 165, 233, 0.5); }
        .btn-scada-outline {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s;
        }
        .btn-scada-outline:hover { color: white; border-color: rgba(255, 255, 255, 0.3); background: rgba(255,255,255,0.05); }
        .glass-panel {
          background: linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.62));
          border: 1px solid rgba(148,163,184,0.12);
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 30px rgba(2,6,23,0.22);
        }
        .panel-label {
          color: #cbd5e1;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }
        .meter-pill,
        .ungrouped-chip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-radius: 14px;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(148,163,184,0.1);
        }
        .ungrouped-chip {
          flex-direction: column;
          align-items: flex-start;
          min-width: 220px;
        }
        .empty-note {
          color: #94a3b8;
          font-size: 0.82rem;
          padding: 12px 2px;
        }
        .empty-state { min-height: 220px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .meter-group-card { border-left: 4px solid rgba(56,189,248,0.4); }
        .group-swatch {
          width: 14px;
          height: 54px;
          border-radius: 999px;
          box-shadow: 0 0 18px rgba(255,255,255,0.15);
        }
        .group-name-input.scada-input {
          min-width: 240px;
          background: rgba(15,23,42,0.9);
          color: #fff;
          border: 1px solid rgba(148,163,184,0.18);
        }
        .group-color-picker {
          width: 56px;
          min-height: 42px;
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 12px;
          background: transparent;
          padding: 4px;
        }
        .assignment-chip {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 220px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.12);
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .assignment-chip:hover { transform: translateY(-2px); }
        .assignment-chip input { margin-bottom: 6px; }
        .assignment-chip.checked { box-shadow: 0 12px 24px rgba(2,6,23,0.22); }
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-11 { font-size: 0.75rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .tracking-widest { letter-spacing: 2px !important; }
      `
        }}
      />
    </div>
  );
};

export default Settings;

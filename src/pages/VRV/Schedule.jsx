import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Badge, Tabs, Tab } from 'react-bootstrap';
import { Calendar, Clock, Plus, Trash2, Power, Thermometer, CalendarDays, RefreshCcw, ShieldAlert, MonitorUp, Settings } from 'lucide-react';
import './VRVOverview.css';

const initialSchedules = {
  Monday: [{ id: 1, start: '08:00', end: '18:00', temp: 24, state: 'ON' }],
  Tuesday: [{ id: 2, start: '08:00', end: '18:00', temp: 24, state: 'ON' }],
  Wednesday: [{ id: 3, start: '08:00', end: '18:00', temp: 24, state: 'ON' }],
  Thursday: [{ id: 4, start: '08:00', end: '18:00', temp: 24, state: 'ON' }],
  Friday: [{ id: 5, start: '08:00', end: '18:00', temp: 24, state: 'ON' }],
  Saturday: [],
  Sunday: []
};

const initialHolidays = [
  { id: 1, name: 'Christmas Day', date: '2024-12-25', action: 'OFF' },
  { id: 2, name: 'Store Maintenance', date: '2024-11-15', action: 'Custom', temp: 28 }
];

const Schedule = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [schedules, setSchedules] = useState(initialSchedules);
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Annual/Holiday State
  const [holidays, setHolidays] = useState(initialHolidays);
  const [weekendsAction, setWeekendsAction] = useState('OFF');

  // Auto Return & Remote State
  const [autoReturnEnabled, setAutoReturnEnabled] = useState(true);
  const [autoReturnTime, setAutoReturnTime] = useState(30); // minutes
  const [remoteOperation, setRemoteOperation] = useState(true);
  const [remoteMonitor, setRemoteMonitor] = useState(true);

  // Helper for Daily Schedules
  const addSlot = (day) => {
    const newSlot = { id: Date.now(), start: '09:00', end: '17:00', temp: 24, state: 'ON' };
    setSchedules({ ...schedules, [day]: [...schedules[day], newSlot] });
  };

  const removeSlot = (day, id) => {
    setSchedules({ ...schedules, [day]: schedules[day].filter(s => s.id !== id) });
  };

  const updateSlot = (day, id, field, value) => {
    setSchedules({
      ...schedules,
      [day]: schedules[day].map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  // Helper for Holiday Schedules
  const addHoliday = () => {
    const newHoliday = { id: Date.now(), name: 'New Holiday', date: '', action: 'OFF' };
    setHolidays([...holidays, newHoliday]);
  };

  const removeHoliday = (id) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  const updateHoliday = (id, field, value) => {
    setHolidays(holidays.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  return (
    <div className="fade-in p-2 VRV-full-panel">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-white d-flex align-items-center"><Calendar className="me-2 text-info" /> Schedule Management</h2>
          <p className="text-secondary fs-7">Automate VRV operation schedules based on days, holidays, and automated return rules.</p>
        </div>
        <Button variant="info" className="px-4 fw-bold">Save All Schedules</Button>
      </div>

      <div className="scada-glass-tabs mb-4">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-secondary border-opacity-25">
          <Tab eventKey="daily" title={<span><Clock size={16} className="me-2" /> Daily & Weekly</span>}></Tab>
          <Tab eventKey="annual" title={<span><CalendarDays size={16} className="me-2" /> Annual & Holidays</span>}></Tab>
          <Tab eventKey="advanced" title={<span><Settings size={16} className="me-2" /> Advanced Rules</span>}></Tab>
        </Tabs>
      </div>

      {activeTab === 'daily' && (
        <Row className="g-4">
          <Col lg={3}>
            <Card className="scada-card border-0 h-100 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-3">
                <span className="text-secondary fw-bold text-uppercase fs-8 d-flex align-items-center"><Clock size={14} className="me-2" /> Days of Week</span>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="d-flex flex-column">
                  {Object.keys(schedules).map(day => (
                    <div
                      key={day}
                      className={`p-3 d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-25 ${selectedDay === day ? 'bg-info bg-opacity-10 border-start border-info border-3' : 'hover-bg'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => setSelectedDay(day)}
                    >
                      <span className={`fw-bold ${selectedDay === day ? 'text-white' : 'text-secondary'}`}>{day}</span>
                      <Badge bg={schedules[day].length > 0 ? 'info' : 'secondary'} className="rounded-pill">
                        {schedules[day].length} Slots
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={9}>
            <Card className="scada-card border-0 h-100 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-4 d-flex justify-content-between align-items-center">
                <h4 className="text-white fw-bold m-0">{selectedDay} Schedule</h4>
                <Button variant="outline-info" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => addSlot(selectedDay)}>
                  <Plus size={16} className="me-1" /> Add Time Slot
                </Button>
              </Card.Header>
              <Card.Body className="p-4">
                {schedules[selectedDay].length === 0 ? (
                  <div className="text-center py-5">
                    <Clock size={48} className="text-secondary opacity-25 mb-3" />
                    <h5 className="text-secondary">No schedules set for {selectedDay}</h5>
                    <p className="text-secondary fs-7">The system will remain in its previous state.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {schedules[selectedDay].map((slot, index) => (
                      <div key={slot.id} className="d-flex align-items-center p-3 rounded border-start border-info border-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <span className="text-secondary fw-bold me-4" style={{ width: '60px' }}>Slot {index + 1}</span>

                        <div className="d-flex align-items-center me-4">
                          <Form.Control type="time" value={slot.start} onChange={(e) => updateSlot(selectedDay, slot.id, 'start', e.target.value)} className="bg-dark text-white border-secondary me-2" style={{ width: '120px' }} />
                          <span className="text-secondary mx-2">to</span>
                          <Form.Control type="time" value={slot.end} onChange={(e) => updateSlot(selectedDay, slot.id, 'end', e.target.value)} className="bg-dark text-white border-secondary ms-2" style={{ width: '120px' }} />
                        </div>

                        <div className="d-flex align-items-center ms-auto gap-3">
                          <div className="d-flex align-items-center bg-dark rounded px-3 py-1 border border-secondary">
                            <Thermometer size={16} className="text-info me-2" />
                            <Form.Control
                              type="number"
                              value={slot.temp}
                              onChange={(e) => updateSlot(selectedDay, slot.id, 'temp', e.target.value)}
                              className="bg-transparent text-white border-0 p-0 text-center fw-bold"
                              style={{ width: '40px' }}
                            />
                            <span className="text-secondary">°C</span>
                          </div>

                          <Button
                            variant={slot.state === 'ON' ? 'info' : 'outline-secondary'}
                            className="fw-bold px-4"
                            onClick={() => updateSlot(selectedDay, slot.id, 'state', slot.state === 'ON' ? 'OFF' : 'ON')}
                          >
                            <Power size={14} className="me-2" /> {slot.state}
                          </Button>

                          <Button variant="link" className="text-danger p-0 ms-2" onClick={() => removeSlot(selectedDay, slot.id)}>
                            <Trash2 size={20} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'annual' && (
        <Row className="g-4 fade-in">
          <Col lg={12}>
            <Card className="scada-card border-0 mb-4 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white fw-bold m-0"><CalendarDays size={18} className="me-2 text-info" /> Annual & Holiday Schedule</h5>
                  <p className="text-secondary fs-7 m-0 mt-1">Program special settings for weekends, holidays, and store closings.</p>
                </div>
                <Button variant="outline-info" size="sm" className="rounded-pill px-3 fw-bold" onClick={addHoliday}>
                  <Plus size={16} className="me-1" /> Add Special Date
                </Button>
              </Card.Header>
              <Card.Body className="p-4">

                {/* Global Weekend Rules */}
                <div className="p-3 rounded mb-5" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h6 className="text-info fw-bold mb-3">Global Weekend Rule (Saturday & Sunday)</h6>
                  <div className="d-flex gap-3 align-items-center">
                    <Form.Select
                      className="scada-select fw-bold w-auto"
                      value={weekendsAction}
                      onChange={(e) => setWeekendsAction(e.target.value)}
                    >
                      <option value="OFF">Force OFF (System Shutdown)</option>
                      <option value="NORMAL">Use Normal Daily Schedule</option>
                      <option value="CUSTOM">Custom Low Energy Mode (28°C)</option>
                    </Form.Select>
                    <span className="text-secondary fs-7">This rule applies automatically to all weekends unless overridden by a specific holiday date below.</span>
                  </div>
                </div>

                {/* Specific Dates List */}
                <h6 className="text-white fw-bold mb-3">Specific Dates / Store Closings</h6>
                {holidays.length === 0 ? (
                  <p className="text-secondary">No special dates configured.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {holidays.map((holiday, index) => (
                      <div key={holiday.id} className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <Form.Control
                          type="text"
                          placeholder="Event Name (e.g. Christmas)"
                          value={holiday.name}
                          onChange={(e) => updateHoliday(holiday.id, 'name', e.target.value)}
                          className="bg-dark text-white border-secondary me-3"
                          style={{ width: '200px' }}
                        />
                        <Form.Control
                          type="date"
                          value={holiday.date}
                          onChange={(e) => updateHoliday(holiday.id, 'date', e.target.value)}
                          className="bg-dark text-white border-secondary me-4"
                          style={{ width: '180px' }}
                        />

                        <div className="d-flex align-items-center gap-2 border-start border-secondary border-opacity-25 ps-4">
                          <span className="text-secondary fs-7">Action:</span>
                          <Form.Select
                            className="scada-select fw-bold"
                            value={holiday.action}
                            onChange={(e) => updateHoliday(holiday.id, 'action', e.target.value)}
                            style={{ width: '150px' }}
                          >
                            <option value="OFF">System OFF</option>
                            <option value="Custom">Custom Temp</option>
                          </Form.Select>

                          {holiday.action === 'Custom' && (
                            <div className="d-flex align-items-center ms-2 bg-dark rounded px-2 py-1 border border-secondary">
                              <Form.Control
                                type="number"
                                value={holiday.temp || 26}
                                onChange={(e) => updateHoliday(holiday.id, 'temp', e.target.value)}
                                className="bg-transparent text-white border-0 p-0 text-center fw-bold"
                                style={{ width: '40px' }}
                              />
                              <span className="text-secondary">°C</span>
                            </div>
                          )}
                        </div>

                        <Button variant="link" className="text-danger p-0 ms-auto" onClick={() => removeHoliday(holiday.id)}>
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'advanced' && (
        <Row className="g-4 fade-in">
          {/* Automatic Return to Set Temp */}
          <Col lg={6}>
            <Card className="scada-card border-0 h-100 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-4">
                <h5 className="text-white fw-bold m-0 d-flex align-items-center">
                  <RefreshCcw size={18} className="me-2 text-info" /> Automatic Return to Set Temp
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <label className="text-white fw-bold fs-6">Enable Auto-Return</label>
                  <Form.Check
                    type="switch"
                    checked={autoReturnEnabled}
                    onChange={(e) => setAutoReturnEnabled(e.target.checked)}
                    className="fs-4 custom-switch-info m-0"
                  />
                </div>
                <p className="text-secondary fs-7 mb-4">
                  A function that automatically returns the manually changed temperature back to its original scheduled value over time. Prevents users from permanently overriding the energy-saving schedule.
                </p>

                <div style={{ opacity: autoReturnEnabled ? 1 : 0.4, pointerEvents: autoReturnEnabled ? 'auto' : 'none' }}>
                  <label className="text-secondary fw-bold text-uppercase fs-8 d-block mb-2">Return Delay Time (Minutes)</label>
                  <div className="d-flex align-items-center">
                    <Form.Range
                      min={10} max={120} step={10}
                      value={autoReturnTime}
                      onChange={(e) => setAutoReturnTime(Number(e.target.value))}
                      className="custom-range flex-grow-1 me-4"
                    />
                    <div className="bg-dark border border-info rounded px-3 py-2 text-info fw-bold fs-5">
                      {autoReturnTime} min
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Remote Monitor / Operation */}
          <Col lg={6}>
            <Card className="scada-card border-0 h-100 shadow-sm" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-4">
                <h5 className="text-white fw-bold m-0 d-flex align-items-center">
                  <MonitorUp size={18} className="me-2 text-info" /> Remote Monitor / Operation
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="text-white fw-bold fs-6">Remote Operation Control</label>
                    <Form.Check
                      type="switch"
                      checked={remoteOperation}
                      onChange={(e) => setRemoteOperation(e.target.checked)}
                      className="fs-4 custom-switch-info m-0"
                    />
                  </div>
                  <p className="text-secondary fs-7 m-0">Allow Central BMS dashboard to issue ON/OFF, mode, and set-point commands remotely to the local controller.</p>
                </div>

                <hr className="border-secondary border-opacity-25 my-4" />

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="text-white fw-bold fs-6">Remote Monitor (Telemetry)</label>
                    <Form.Check
                      type="switch"
                      checked={remoteMonitor}
                      onChange={(e) => setRemoteMonitor(e.target.checked)}
                      className="fs-4 custom-switch-info m-0"
                    />
                  </div>
                  <p className="text-secondary fs-7 m-0">Allow Central BMS dashboard to view current temperature, fault codes, and occupancy status.</p>
                </div>

                {(!remoteMonitor || !remoteOperation) && (
                  <div className="mt-4 p-3 bg-warning bg-opacity-10 border border-warning rounded d-flex align-items-start">
                    <ShieldAlert size={20} className="text-warning me-3 mt-1 flex-shrink-0" />
                    <p className="text-warning fs-7 m-0">
                      Warning: Disabling remote monitoring or operation will prevent this central BMS software from managing the VRV system properly. Local controller access will be required.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .scada-glass-tabs .nav-tabs {
          border-bottom: 2px solid rgba(255,255,255,0.05);
        }
        .scada-glass-tabs .nav-link {
          color: #94a3b8;
          border: none;
          padding: 1rem 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .scada-glass-tabs .nav-link:hover {
          color: white;
          background: rgba(255,255,255,0.02);
        }
        .scada-glass-tabs .nav-link.active {
          color: #38bdf8;
          background: transparent;
          border-bottom: 2px solid #38bdf8;
        }
        .hover-bg:hover {
          background-color: rgba(255,255,255,0.02);
        }
      `}} />
    </div>
  );
};

export default Schedule;

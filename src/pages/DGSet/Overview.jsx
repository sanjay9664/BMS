import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, ProgressBar, Toast, ToastContainer, Table } from 'react-bootstrap';
import { 
  Factory, ShieldAlert, Zap, Activity, Gauge, Fuel, History, 
  Fan, Settings, Thermometer, Droplets, FileDown, Home, 
  Database, AlertCircle, AlertTriangle, TrendingDown, 
  ChevronRight, ArrowRightCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PdfButton from '../../components/PdfButton';

// VIBRANT BUT BALANCED SCADA PALETTE
const SCADA_COLORS = {
  bg: '#05070a', // Deep Black
  panel: 'rgba(255,255,255,0.03)',
  red: '#dc2626', // Vibrant Red
  yellow: '#f59e0b', // Vibrant Gold
  blue: '#2563eb', // Vibrant Blue
  green: '#10b981', // Vibrant Emerald
  cyan: '#0891b2', // Vibrant Cyan
  info: '#1e293b', 
  textMain: '#f8fafc',
  textDim: '#94a3b8',
  glow: 'rgba(8, 145, 178, 0.4)'
};

const SiemensStyleDG = () => {
  const navigate = useNavigate();
  const [activeDG, setActiveDG] = useState('DG1');
  const [showToast, setShowToast] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const userRole = localStorage.getItem('userRole') || 'user';
  const isAdmin = userRole === 'admin';

  const [data, setData] = useState({
    voltage: { ry: 415.7, yb: 416.1, br: 414.9, rn: 239.8, yn: 239.5, bn: 241.2 },
    current: { r: 145, y: 142, b: 148, avg: 145 },
    power: { kw: 125.5, kvar: 12.4, kva: 130.2, pf: 0.98 },
    engine: { coolant: 82.2, oilPressure: 4.5, speed: 1500, runtime: 1245 },
    diesel: { 
        level: 82.5, 
        remaining: 1650, 
        capacity: 2000, 
        spentToday: 45.5, 
        spentYesterday: 120.2,
        efficiency: 0.3, 
        lastFill: '18 APR 2026',
        temp: 32.5 
    },
    generation: { today: 450.2, yesterday: 1250, month: 14200, morning: 0.000 }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        voltage: {
          ry: 415 + (Math.random() - 0.5) * 1.5,
          yb: 416 + (Math.random() - 0.5) * 1.5,
          br: 414 + (Math.random() - 0.5) * 1.5,
          rn: 240 + (Math.random() - 0.5),
          yn: 239 + (Math.random() - 0.5),
          bn: 241 + (Math.random() - 0.5),
        },
        engine: {
          ...prev.engine,
          speed: 1500 + (Math.random() - 0.5) * 10
        },
        power: {
            ...prev.power,
            kw: 125 + (Math.random() - 0.5) * 2
        }
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePdfDownload = () => {
    setGeneratingPdf(true);
    setTimeout(() => {
        setGeneratingPdf(false);
        setShowToast(true);
    }, 2000);
  };

  const DataBox = ({ label, value, unit, labelBg = SCADA_COLORS.info, valueColor = '#38bdf8' }) => (
    <div className="d-flex align-items-center mb-1 gap-1">
        <div className="text-white px-2 py-1 fw-black fs-12 text-center rounded-1 border border-white border-opacity-5" style={{ width: '90px', minHeight: '30px', fontSize: '0.68rem', backgroundColor: labelBg }}>
            {label}
        </div>
        <div className="bg-black border border-white border-opacity-10 px-2 py-1 fw-black fs-10 text-center rounded-1 flex-grow-1 font-monospace shadow-value" style={{ minWidth: '75px', minHeight: '30px', color: valueColor }}>
            {typeof value === 'number' ? value.toFixed(1) : value}
        </div>
        <div className="text-secondary fw-black fs-13 ms-1" style={{ width: '22px', fontSize: '0.7rem' }}>{unit}</div>
    </div>
  );

  const SectionHeader = ({ title, icon, color = SCADA_COLORS.cyan }) => (
    <div className="text-center py-2 fw-black fs-11 border-bottom border-white border-opacity-5 mb-3 uppercase letter-spacing-1 d-flex align-items-center justify-content-center gap-2" 
         style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: color, letterSpacing: '2px' }}>
        {icon} {title}
    </div>
  );

  return (
    <div className="fade-in p-2 min-vh-100" style={{ backgroundColor: SCADA_COLORS.bg, color: SCADA_COLORS.textMain }}>
      {/* PREMIUM HIGH-GLOW NAV BAR */}
      <div className="d-flex align-items-center bg-black border border-white border-opacity-10 p-2 mb-3 shadow-2xl justify-content-between rounded-3">
        <div className="d-flex align-items-center gap-3 ps-3">
            <div className="text-info px-4 py-1 fw-black fs-9 rounded-2 border border-info border-opacity-20 shadow-info">HMI CONTROL CENTER</div>
            <div className="d-flex align-items-center gap-2">
                <div className="rounded-circle status-pulse" style={{width: 10, height: 10, backgroundColor: isAdmin ? '#22c55e' : '#f59e0b'}}></div>
                <small className={`${isAdmin ? 'text-success' : 'text-warning'} fw-black fs-12 uppercase tracking-tight`}>
                  {isAdmin ? 'System Online (ADMIN)' : 'System Online (READ-ONLY)'}
                </small>
            </div>
        </div>
        <div className="d-flex gap-2">
            <button onClick={() => navigate('/dashboard')} className="btn btn-sm fw-black border border-white border-opacity-10 rounded-2 px-4 py-1 bg-dark text-secondary hover-info fs-12">
                <Home size={14} className="me-2" /> DASHBOARD
            </button>
            <div className="d-flex gap-1 bg-white bg-opacity-5 p-1 rounded-2">
                {['DG1', 'DG2', 'DG3'].map(dg => (
                    <button key={dg} onClick={() => setActiveDG(dg)} 
                            className={`btn btn-sm fw-black rounded-1 border-0 px-4 py-1 transition-all fs-12 ${activeDG === dg ? 'bg-info text-dark shadow-info' : 'text-secondary hover-white'}`}>
                        {dg}
                    </button>
                ))}
            </div>
            <button 
              onClick={handlePdfDownload} 
              disabled={!isAdmin}
              className={`btn btn-sm fw-black border border-white border-opacity-10 rounded-2 px-4 py-1 fs-12 ${isAdmin ? 'bg-primary text-white' : 'bg-secondary bg-opacity-20 text-muted opacity-50 cursor-not-allowed'}`}
            >
                <FileDown size={14} className="me-2" /> {isAdmin ? 'REPORTS' : 'REPORTS LOCKED'}
            </button>
        </div>
        <div className="text-secondary fs-13 font-monospace px-4 fw-black">
            {new Date().toLocaleTimeString()}
        </div>
      </div>

      <Row className="g-3">
        {/* LEFT: SAFETY & ASSET */}
        <Col xl={4}>
            <div className="bg-panel border border-white border-opacity-5 p-1 h-100 rounded-4 shadow-sm backdrop-blur">
                <SectionHeader title="Safety Status" icon={<ShieldAlert size={16} />} color="#ef4444" />
                <Row className="g-1 px-3 mb-4">
                    {[
                        'EMERGENCY STOP', 'MASTER TRIP', 'OVER VOLTAGE', 'UNDER VOLTAGE', 'OVER FREQUENCY', 'UNDER FREQUENCY', 'LOW OIL LEVEL', 'OVER TEMP'
                    ].map((item, i) => (
                        <Col xs={6} key={i}>
                            <div className="text-white text-center py-2 fw-black fs-13 border border-white border-opacity-5 uppercase transition-all shadow-sm" style={{fontSize: '0.65rem', backgroundColor: 'rgba(34, 197, 94, 0.12)', letterSpacing: '0.5px'}}>
                                {item}
                            </div>
                        </Col>
                    ))}
                </Row>
                
                {/* HIGH-POP DG IMAGE */}
                <div className="px-3 mb-4">
                    <div className="border border-info border-opacity-20 p-1 bg-black rounded-4 overflow-hidden shadow-2xl position-relative asset-box">
                        <img src="/dg_set.png" alt="DG" className="img-fluid" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                        <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-gradient-scada border-top border-white border-opacity-10">
                             <div className="d-flex justify-content-around text-center py-1">
                                <div><small className="text-muted d-block fs-13 uppercase fw-black">RPM</small><span className="text-white fw-black fs-10 digital-font">{data.engine.speed.toFixed(0)}</span></div>
                                <div className="border-start border-white border-opacity-10 px-4"><small className="text-muted d-block fs-13 uppercase fw-black">Load</small><span className="text-info fw-black fs-10 digital-font">{data.power.kw.toFixed(1)} <small className="fs-13">KW</small></span></div>
                                <div className="border-start border-white border-opacity-10 ps-4"><small className="text-muted d-block fs-13 uppercase fw-black">Line</small><span className="text-warning fw-black fs-10 digital-font">{data.voltage.ry.toFixed(0)} <small className="fs-13">V</small></span></div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="px-3">
                    <SectionHeader title="Operating Ledger" icon={<History size={16} />} color="#94a3b8" />
                    <div className="p-4 bg-black bg-opacity-40 border border-white border-opacity-10 rounded-4 shadow-inner">
                         <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-secondary fw-black fs-12 uppercase">Accumulated Run Time</small>
                            <span className="text-info fw-black fs-8">{data.engine.runtime} <small className="fs-13 text-secondary">HRS</small></span>
                         </div>
                         <ProgressBar now={75} variant="info" style={{ height: 5 }} className="bg-white bg-opacity-5 rounded-pill" />
                         <div className="d-flex justify-content-between mt-2">
                             <small className="text-muted fs-13 fw-bold">NEXT SERVICE 2500 HRS</small>
                             <small className="text-success fs-13 fw-bold">OPTIMAL</small>
                         </div>
                    </div>
                </div>
            </div>
        </Col>

        {/* CENTER: ELECTRICALS */}
        <Col xl={4}>
            <div className="bg-panel border border-white border-opacity-5 p-1 h-100 rounded-4 shadow-sm backdrop-blur">
                <Row className="g-1">
                    <Col xs={6}>
                        <SectionHeader title="HV Line Bus" icon={<Zap size={16} />} color="#f59e0b" />
                        <div className="p-2 pt-0">
                            <DataBox label="R-Y VOLTS" value={data.voltage.ry} unit="V" labelBg={SCADA_COLORS.red} valueColor={SCADA_COLORS.textMain} />
                            <DataBox label="Y-B VOLTS" value={data.voltage.yb} unit="V" labelBg={SCADA_COLORS.yellow} valueColor={SCADA_COLORS.textMain} />
                            <DataBox label="B-R VOLTS" value={data.voltage.br} unit="V" labelBg={SCADA_COLORS.blue} valueColor={SCADA_COLORS.textMain} />
                        </div>
                    </Col>
                    <Col xs={6}>
                        <SectionHeader title="LV Phase Bus" icon={<Zap size={16} />} color="#f59e0b" />
                        <div className="p-2 pt-0">
                            <DataBox label="R-N VOLTS" value={data.voltage.rn} unit="V" labelBg={SCADA_COLORS.red} valueColor={SCADA_COLORS.textMain} />
                            <DataBox label="Y-N VOLTS" value={data.voltage.yn} unit="V" labelBg={SCADA_COLORS.yellow} valueColor={SCADA_COLORS.textMain} />
                            <DataBox label="B-N VOLTS" value={data.voltage.bn} unit="V" labelBg={SCADA_COLORS.blue} valueColor={SCADA_COLORS.textMain} />
                        </div>
                    </Col>
                    <Col xs={6}>
                        <SectionHeader title="Amperage" icon={<Activity size={16} />} color="#06b6d4" />
                        <div className="p-2 pt-0">
                            <DataBox label="PH-R AMPS" value={data.current.r} unit="A" labelBg={SCADA_COLORS.red} valueColor={SCADA_COLORS.textMain} />
                            <DataBox label="PH-Y AMPS" value={data.current.y} unit="A" labelBg={SCADA_COLORS.yellow} valueColor={SCADA_COLORS.textMain} />
                            <DataBox label="PH-B AMPS" value={data.current.b} unit="A" labelBg={SCADA_COLORS.blue} valueColor={SCADA_COLORS.textMain} />
                        </div>
                    </Col>
                    <Col xs={6}>
                        <SectionHeader title="Power Matrix" icon={<TrendingDown size={16} />} color="#10b981" />
                        <div className="p-2 pt-0">
                            <DataBox label="LOAD (KW)" value={data.power.kw} unit="" labelBg={SCADA_COLORS.cyan} valueColor="#fff" />
                            <DataBox label="APP. (KVA)" value={data.power.kva} unit="" labelBg="#334155" valueColor="#fff" />
                            <DataBox label="EFF. (P.F)" value={data.power.pf} unit="" labelBg={SCADA_COLORS.green} valueColor="#fff" />
                        </div>
                    </Col>
                    <Col xs={12}>
                        <SectionHeader title="Engine Health" icon={<Gauge size={16} />} color="#94a3b8" />
                        <div className="p-4 pt-1 d-flex gap-3 justify-content-around">
                            <div className="health-card text-center min-w-85 p-2 rounded-3 border border-white border-opacity-5">
                                <small className="text-muted d-block fs-13 mb-1 fw-black uppercase">Coolant</small>
                                <span className="text-warning fw-black fs-9">{data.engine.coolant.toFixed(1)}°C</span>
                            </div>
                            <div className="health-card text-center min-w-85 p-2 rounded-3 border border-white border-opacity-5">
                                <small className="text-muted d-block fs-13 mb-1 fw-black uppercase">Oil PR.</small>
                                <span className="text-white fw-black fs-9">{data.engine.oilPressure.toFixed(1)} <small className="fs-13 text-muted">BAR</small></span>
                            </div>
                            <div className="health-card text-center min-w-85 p-2 rounded-3 border border-white border-opacity-5">
                                <small className="text-muted d-block fs-13 mb-1 fw-black uppercase">Freq</small>
                                <span className="text-success fw-black fs-9">50.1 <small className="fs-13 text-muted">HZ</small></span>
                            </div>
                        </div>
                    </Col>
                </Row>

                <SectionHeader title="Production Stats" icon={<Database size={16} />} color="#06b6d4" />
                <div className="px-4 pb-4">
                    <Table borderless variant="dark" className="bg-transparent mb-0">
                        <tbody>
                            <tr className="border-bottom border-white border-opacity-5">
                                <td className="py-2 text-muted fw-black fs-12 uppercase">Today's Generation</td>
                                <td className="py-2 text-end text-info fw-black fs-10">{data.generation.today} MWH</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-muted fw-black fs-12 uppercase">Monthly Total</td>
                                <td className="py-2 text-end text-success fw-black fs-10">{data.generation.month} MWH</td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </div>
        </Col>

        {/* RIGHT: DIESEL STATUS */}
        <Col xl={4}>
             <div className="bg-panel border border-white border-opacity-5 p-1 h-100 rounded-4 shadow-sm backdrop-blur">
                <SectionHeader title="Fuel Management" icon={<Fuel size={16} />} color="#f59e0b" />
                <div className="px-4 py-3">
                    <div className="text-center mb-4 mt-2">
                        <div className="position-relative d-inline-block p-1 bg-black rounded-4 border border-white border-opacity-5 shadow-2xl">
                             <div className="tank-visual-modern-scada">
                                <div className="liquid-fill" style={{ height: `${data.diesel.level}%`, background: 'linear-gradient(to top, #d97706, #f59e0b)' }}>
                                     <div className="wave-scada"></div>
                                </div>
                             </div>
                             <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
                                <h2 className="text-white fw-black mb-1 fs-7 digital-font" style={{textShadow: '0 0 15px rgba(245, 158, 11, 0.5)'}}>{data.diesel.level.toFixed(1)}%</h2>
                                <small className="text-warning fw-black uppercase fs-12 tracking-widest">Level</small>
                             </div>
                        </div>
                    </div>
                    
                    <Row className="g-2 mb-4">
                        <Col xs={6}>
                            <div className="p-3 rounded-4 bg-black border border-white border-opacity-10 text-center shadow-inner">
                                <small className="text-muted d-block fw-black fs-12 mb-1 uppercase">Today Used</small>
                                <span className="text-danger fw-black fs-9">{data.diesel.spentToday.toFixed(1)} <small className="fs-12 text-muted">L</small></span>
                            </div>
                        </Col>
                        <Col xs={6}>
                             <div className="p-3 rounded-4 bg-black border border-white border-opacity-10 text-center shadow-inner">
                                <small className="text-muted d-block fw-black fs-12 mb-1 uppercase">Refill Date</small>
                                <span className="text-info fw-black fs-12">{data.diesel.lastFill}</span>
                            </div>
                        </Col>
                    </Row>

                    <div className="d-flex flex-column gap-2 mb-4">
                         <DataBox label="Current Ltrs" value={data.diesel.remaining} unit="L" labelBg="#1e293b" valueColor="#fff" />
                         <DataBox label="Efficiency" value={data.diesel.efficiency} unit="L/KWh" labelBg="#1e293b" valueColor="#fff" />
                    </div>
                </div>

                <SectionHeader title="System Auxiliaries" icon={<Settings size={16} />} color="#94a3b8" />
                <div className="px-4 py-2">
                    <Row className="g-2">
                        {[
                            {l: 'COOLING FAN', s: 'ONLINE', c: 'success'},
                            {l: 'EXHAUST MTR', s: 'ONLINE', c: 'success'},
                            {l: 'FUEL PUMP', s: 'IDLE', c: 'warning'},
                            {l: 'OIL COOLER', s: 'ONLINE', c: 'success'},
                        ].map((aux, i) => (
                            <Col xs={6} key={i}>
                                <div className="p-2 border border-white border-opacity-5 bg-black rounded-3 d-flex justify-content-between align-items-center shadow-inner px-3">
                                    <small className="fw-black fs-13 text-muted uppercase">{aux.l}</small>
                                    <div className={`status-dot bg-${aux.c}`}></div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
                
                 <div className="mt-auto px-4 pb-4 pt-4 text-center">
                    <button 
                      disabled={!isAdmin}
                      className={`btn w-100 fw-black uppercase py-3 rounded-4 border-0 mb-3 fs-12 d-flex align-items-center justify-content-center gap-2 shadow-info ${isAdmin ? 'btn-info' : 'btn-secondary opacity-50'}`}
                    >
                         <ArrowRightCircle size={18} /> {isAdmin ? 'CONTROL SYNC ACTIVE' : 'VIEW ONLY MODE'}
                    </button>
                    <PdfButton onClick={handlePdfDownload} />
                 </div>
             </div>
        </Col>
      </Row>

      {/* PDF OVERLAY */}
      {generatingPdf && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-80 d-flex flex-column align-items-center justify-content-center" style={{zIndex: 9999, backdropFilter: 'blur(10px)'}}>
            <div className="spinner-border text-info mb-4" style={{width: '3rem', height: '3rem'}}></div>
            <h4 className="text-white fw-black uppercase letter-spacing-2">Synchronizing SCADA Logs...</h4>
        </div>
      )}

      {/* SUCCESS TOAST */}
      <ToastContainer position="bottom-end" className="p-4">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide className="bg-dark border border-info border-opacity-20 shadow-2xl">
            <Toast.Body className="text-white fs-12 p-3 d-flex align-items-center gap-3">
                <div className="bg-success bg-opacity-20 p-2 rounded-circle"><FileDown size={20} className="text-success" /></div>
                <div>
                     <div className="fw-black text-info uppercase">Export Complete</div>
                     <small className="text-muted">DG_SET_REPORT_SUCCESS.pdf</small>
                </div>
            </Toast.Body>
        </Toast>
      </ToastContainer>

      <style dangerouslySetInnerHTML={{ __html: `
        .fw-black { font-weight: 950 !important; }
        .fs-13 { font-size: 0.68rem !important; }
        .fs-12 { font-size: 0.78rem !important; }
        .fs-11 { font-size: 0.95rem !important; }
        .fs-10 { font-size: 1.15rem !important; }
        .fs-9 { font-size: 1.4rem !important; }
        .fs-8 { font-size: 1.8rem !important; }
        .fs-7 { font-size: 2.2rem !important; }
        .uppercase { text-transform: uppercase !important; }
        .letter-spacing-1 { letter-spacing: 1px !important; }
        .letter-spacing-2 { letter-spacing: 2px !important; }
        .bg-panel { background-color: rgba(15, 23, 42, 0.4); }
        .shadow-info { box-shadow: 0 0 20px rgba(8, 145, 178, 0.4); }
        .shadow-value { box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9); }
        .shadow-inner { box-shadow: inset 0 2px 8px rgba(0,0,0,0.6); }
        .backdrop-blur { backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); }
        .asset-box { border: 2px solid rgba(8, 145, 178, 0.3); }
        .bg-gradient-scada { background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%); }
        .min-w-85 { min-width: 85px; }
        .digital-font { font-family: 'Courier New', Courier, monospace !important; }

        /* Modern Tank Visual */
        .tank-visual-modern-scada {
            width: 140px;
            height: 180px;
            background: rgba(255,255,255,0.03);
            border-radius: 12px;
            position: relative;
            overflow: hidden;
        }
        .liquid-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            transition: height 1s ease-in-out;
        }
        .wave-scada {
            position: absolute;
            top: -15px;
            left: -50%;
            width: 200%;
            height: 30px;
            background: rgba(255,255,255,0.1);
            border-radius: 45%;
            animation: scada-wave 5s linear infinite;
        }
        @keyframes scada-wave {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .status-pulse { animation: status-pulse-anim 2s infinite; }
        @keyframes status-pulse-anim {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0.8; }
        .health-card:hover { border-color: rgba(255,255,255,0.2) !important; background-color: rgba(255,255,255,0.05) !important; }
        .transition-all { transition: all 0.3s ease; }
      `}} />
    </div>
  );
};

export default SiemensStyleDG;

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Droplets, Activity, Zap, Bell, Battery, ShieldAlert, 
  Settings, ClipboardList, PenTool, History, LayoutDashboard,
  ChevronRight, Gauge, Database, Lock
} from 'lucide-react';
import { Accordion } from 'react-bootstrap';
import logo from "../assets/logo.png";

const Sidebar = ({ collapsed }) => {
  const [modulesConfig, setModulesConfig] = useState(() => {
    const saved = localStorage.getItem('scada_modules_config');
    return saved ? JSON.parse(saved) : null;
  });

  const userRole = localStorage.getItem('userRole') || 'user';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const updateConfig = () => {
      const saved = localStorage.getItem('scada_modules_config');
      if (saved) setModulesConfig(JSON.parse(saved));
    };
    
    window.addEventListener('storage-update', updateConfig);
    return () => window.removeEventListener('storage-update', updateConfig);
  }, []);

  const menuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      disabled: modulesConfig ? !modulesConfig["Dashboard"] : false
    },
    {
      title: "Water Management",
      icon: <Droplets size={20} />,
      disabled: modulesConfig ? !modulesConfig["Water Management"] : false,
      subItems: [
        { title: "Overview", path: "/water-management/overview" },
        { title: "AG TANK", path: "/water-management/ag-pump" },
        { title: "UG TANK", path: "/water-management/ug-pump" }
      ]
    },
    {
      title: "Motors",
      icon: <Activity size={20} />,
      disabled: modulesConfig ? !modulesConfig["Motors"] : false,
      subItems: [
        { title: "Overview", path: "/motors/overview" },
        { title: "Pump Room 1", path: "/motors/room1" },
        { title: "Pump Room 2", path: "/motors/room2" },
        { title: "VFD / DOL Status", path: "/motors/status" },
        { title: "PDF Report", path: "/motors/report" }
      ]
    },
    {
      title: "DG Set",
      icon: <Database size={20} />,
      disabled: modulesConfig ? !modulesConfig["DG Monitoring"] : false,
      subItems: [
        { title: "Overview", path: "/dg-set/overview" },
        { title: "DG Set-1", path: "/dg-set/dg1" },
        { title: "DG Set-2", path: "/dg-set/dg2" },
        { title: "DG Set-3", path: "/dg-set/dg3" }
      ]
    },
    {
      title: "Setting Templates",
      icon: <Settings size={20} />,
      path: "/config/templates"
    },
    {
      title: "Alarm System",
      icon: <Bell size={20} />,
      disabled: modulesConfig ? !modulesConfig["Alarm System"] : false,
      subItems: [
        { title: "Overview", path: "/alarm-system/overview" },
        { title: "Active Alarms", path: "/alarm-system/active" },
        { title: "Inactive Alarms", path: "/alarm-system/inactive" },
        { title: "ACK (Acknowledge)", path: "/alarm-system/ack" },
        { title: "Alarm History", path: "/alarm-system/history" },
        { title: "PDF Report", path: "/alarm-system/report" }
      ]
    },
    {
      title: "LT Panel",
      icon: <LayoutDashboard size={20} />,
      disabled: modulesConfig ? !modulesConfig["LT Panel"] : false,
      subItems: [
        { title: "Overview", path: "/lt-panel/overview" },
        { title: "LT Room-1", path: "/lt-panel/room1" },
        { title: "LT Room-2", path: "/lt-panel/room2" },
        { title: "LT Room-3", path: "/lt-panel/room3" },
        { title: "Incoming / Outgoing", path: "/lt-panel/io" },
        { title: "Breaker Status", path: "/lt-panel/breaker" },
        { title: "PDF Report", path: "/lt-panel/report" }
      ]
    },
    {
      title: "Transformer",
      icon: <Zap size={20} />,
      disabled: modulesConfig ? !modulesConfig["Transformer"] : false,
      subItems: [
        { title: "Overview", path: "/transformer/overview" },
        { title: "Transformer-1", path: "/transformer/t1" },
        { title: "Transformer-2", path: "/transformer/t2" },
        { title: "Load / Temp", path: "/transformer/load" },
        { title: "PDF Report", path: "/transformer/report" }
      ]
    },
    {
      title: "Fire Pumps",
      icon: <ShieldAlert size={20} />,
      disabled: modulesConfig ? !modulesConfig["Fire Pumps"] : false,
      subItems: [
        { title: "Overview", path: "/fire-pumps/overview" },
        { title: "Pump Status", path: "/fire-pumps/status" },
        { title: "Header Pressure", path: "/fire-pumps/pressure" },
        { title: "Jockey / Main", path: "/fire-pumps/jockey" },
        { title: "PDF Report", path: "/fire-pumps/report" }
      ]
    },
    {
      title: "Ticketing",
      icon: <ClipboardList size={20} />,
      path: "/ticketing",
      disabled: modulesConfig ? !modulesConfig["Ticketing"] : false
    },
    {
      title: "Maintenance",
      icon: <PenTool size={20} />,
      disabled: modulesConfig ? !modulesConfig["Maintenance"] : false,
      subItems: [
        { title: "Scheduled", path: "/maintenance/scheduled" },
        { title: "Pending Tasks", path: "/maintenance/pending" },
        { title: "PDF Report", path: "/maintenance/report" }
      ]
    },
    {
      title: "Service History",
      icon: <History size={20} />,
      disabled: modulesConfig ? !modulesConfig["Service History"] : false,
      subItems: [
        { title: "Equipment-wise", path: "/service/equipment" },
        { title: "Service Records", path: "/service/records" },
        { title: "PDF Report", path: "/service/report" }
      ]
    },
    {
      title: "Daily DPR",
      icon: <Gauge size={20} />,
      disabled: modulesConfig ? !modulesConfig["Daily DPR"] : false,
      subItems: [
        { title: "Data Aggregation", path: "/dpr/aggregation" },
        { title: "Daily Logs", path: "/dpr/logs" },
        { title: "PDF Report", path: "/dpr/report" }
      ]
    }
  ];

  return (
    <div className={`scada-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand d-flex align-items-center justify-content-center py-4 border-bottom border-secondary border-opacity-25">
       <img 
        src={logo} 
        alt="Company Logo" 
        style={{ width: 165, height: 55, objectFit: "contain" }} 
        className="me-2"
      />
      </div>
      
      <div className="sidebar-nav py-3">
        {menuItems.map((item, index) => (
          item.subItems ? (
            <Accordion key={index} className="sidebar-accordion">
              <Accordion.Item eventKey={index.toString()} className={`bg-transparent border-0 ${item.disabled ? 'sidebar-disabled-item' : ''}`}>
                <Accordion.Header className={`sidebar-link ${collapsed ? 'collapsed-header' : ''} ${item.disabled ? 'pe-none' : ''}`}>
                  <div className="d-flex align-items-center w-100 position-relative">
                    <span className="sidebar-icon">{item.icon}</span>
                    {!collapsed && <span className="sidebar-text ms-3 flex-grow-1">{item.title}</span>}
                    {item.disabled && !collapsed && <Lock size={12} className="text-secondary opacity-50 ms-2" />}
                  </div>
                </Accordion.Header>
                {!collapsed && !item.disabled && (
                  <Accordion.Body className="p-0 ps-4">
                    {item.subItems.map((sub, subIdx) => (
                      <NavLink 
                        key={subIdx} 
                        to={sub.path} 
                        className={({ isActive }) => `sidebar-sub-link ${isActive ? 'active' : ''}`}
                      >
                        {sub.title}
                      </NavLink>
                    ))}
                  </Accordion.Body>
                )}
              </Accordion.Item>
            </Accordion>
          ) : (
            <div key={index} className={item.disabled ? 'sidebar-disabled-item' : ''}>
               {item.disabled ? (
                 <div className="sidebar-link pe-none opacity-50 d-flex align-items-center">
                    <span className="sidebar-icon">{item.icon}</span>
                    {!collapsed && <span className="sidebar-text ms-3 flex-grow-1">{item.title}</span>}
                    {!collapsed && <Lock size={12} className="text-secondary opacity-50" />}
                 </div>
               ) : (
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar-text ms-3">{item.title}</span>}
                </NavLink>
               )}
            </div>
          )
        ))}
      </div>

      <div className="sidebar-footer mt-auto p-3 border-top border-secondary border-opacity-25 text-center">
        {isAdmin && (
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} />
            {!collapsed && <span className="ms-3">Settings</span>}
          </NavLink>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-link {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          color: var(--scada-text-muted);
          text-decoration: none;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          cursor: pointer;
        }
        .sidebar-link:hover, .sidebar-link.active {
          color: var(--scada-text);
          background-color: rgba(255, 255, 255, 0.05);
          border-left-color: var(--scada-accent);
        }
        .sidebar-disabled-item {
          opacity: 0.35;
          filter: grayscale(1);
          cursor: not-allowed !important;
        }
        .pe-none {
          pointer-events: none !important;
        }
        .sidebar-sub-link {
          display: block;
          padding: 8px 16px;
          color: var(--scada-text-muted);
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }
        .sidebar-sub-link:hover, .sidebar-sub-link.active {
          color: var(--scada-accent);
        }
        .sidebar-accordion .accordion-button {
          background-color: transparent !important;
          color: var(--scada-text-muted) !important;
          box-shadow: none !important;
          padding: 0;
        }
        .sidebar-accordion .accordion-button::after {
          filter: invert(1);
          transform: scale(0.7);
        }
        .sidebar-disabled-item .accordion-button::after {
          display: none !important;
        }
        .sidebar-accordion .accordion-body {
          background-color: transparent;
        }
        .collapsed-header .accordion-button::after {
          display: none;
        }
      `}} />
    </div>
  );
};

export default Sidebar;

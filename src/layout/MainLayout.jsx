import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { io } from 'socket.io-client';

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    setIsImpersonating(!!localStorage.getItem('impersonator_backup_role'));
  }, []);

  const handleExitVerification = () => {
    const backupUser = localStorage.getItem('impersonator_backup_user');
    const backupRole = localStorage.getItem('impersonator_backup_role');
    const cacheGlobalConfig = localStorage.getItem('cache_global_config');

    if (backupUser && backupRole) {
      localStorage.setItem('userData', backupUser);
      localStorage.setItem('userRole', backupRole);
      
      localStorage.removeItem('impersonator_backup_user');
      localStorage.removeItem('impersonator_backup_role');

      // Restore global modules config if available
      if (cacheGlobalConfig) {
        try {
          const globalConfig = JSON.parse(cacheGlobalConfig);
          const sidebarModules = {
            "Dashboard": globalConfig.showDashboard,
            "Water Management": globalConfig.showWaterManagement,
            "Motors": globalConfig.showMotors,
            "DG Monitoring": globalConfig.showDGSet,
            "Setting Templates": globalConfig.showSettingTemplates,
            "Alarm System": globalConfig.showAlarms,
            "LT Panel": globalConfig.showLTPanel,
            "Transformer": globalConfig.showTransformers,
            "Fire Pumps": globalConfig.showFirePumps,
            "Ticketing": globalConfig.showTicketing,
            "Maintenance": globalConfig.showMaintenance,
            "Service History": globalConfig.showServiceHistory,
            "Daily DPR": globalConfig.showDailyDPR,
            "Energy Metering": globalConfig.showEnergyMetering,
          };
          localStorage.setItem('scada_modules_config', JSON.stringify(sidebarModules));
          localStorage.setItem('scada_submodules_config', JSON.stringify(globalConfig.submoduleVisibility || {}));
        } catch(e) {}
      }

      window.location.href = '/super-admin';
    }
  };  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const tenantId = userData?.tenantId;
        const url = tenantId ? `/api/templates?tenantId=${tenantId}` : '/api/templates';

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Map backend data to frontend format to match what templates page saves
          const mappedData = data.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category || 'Water Management',
            module: t.settings[0]?.eventKey || 'AG Tank',
            mapping: (t.defaultValues || t.settings[0]?.meta || {}),
            timestamp: new Date(t.createdAt).toLocaleString()
          }));
          
          // Cleanup corrupted mappings like Templates.jsx does
          const cleanCorruptedMapping = (obj) => {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
            const cleaned = {};
            Object.keys(obj).forEach(key => {
              let newKey = key;
              if (key.includes('Water Level') && key !== 'agLevelConfig' && key !== 'ugTankLevelConfig' && key !== 'Water Level' && key !== 'agLevel' && key !== 'waterLevel') {
                newKey = key.replace('Water Level', '').trim();
              }
              let value = obj[key];
              if (value && typeof value === 'object' && !Array.isArray(value)) value = cleanCorruptedMapping(value);
              cleaned[newKey] = value;
            });
            return cleaned;
          };

          const finalData = mappedData.map(t => ({
            ...t,
            mapping: cleanCorruptedMapping(t.mapping)
          }));

          localStorage.setItem('scada_templates', JSON.stringify(finalData));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        console.error('Error syncing templates on load:', error);
      }
    };

    fetchTemplates();

    // Set up WebSocket listener to fetch updated templates instantly without reload
    const socket = io('/', { path: '/socket.io' });

    socket.on('templates_updated', (payload) => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const tenantId = userData?.tenantId;

      // If the payload matches current tenantId or is global, sync templates
      if (!payload || payload.tenantId === undefined || Number(payload.tenantId) === Number(tenantId)) {
        console.log('[MainLayout] Templates updated via WebSocket. Fetching fresh settings...');
        fetchTemplates();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="scada-container">
      <Sidebar collapsed={collapsed} />
      <div 
        className={`scada-main-content w-100 ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{ marginLeft: collapsed ? '80px' : '280px' }}
      >
        {isImpersonating && (
          <div className="bg-warning text-dark px-4 py-2 d-flex justify-content-between align-items-center position-sticky top-0 z-3 shadow-sm border-bottom border-warning">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span className="fw-bold tracking-widest uppercase fs-7">
                Verification Mode Active
              </span>
              <span className="ms-2 opacity-75 fs-7">
                Previewing as: {JSON.parse(localStorage.getItem('userData') || '{}')?.name}
              </span>
            </div>
            <button 
              className="btn btn-sm btn-dark fw-bold uppercase tracking-wider fs-8 px-3"
              onClick={handleExitVerification}
            >
              Exit Verification
            </button>
          </div>
        )}
        <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />
        <main className="px-3 px-md-4 pb-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

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
        <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />
        <main className="px-3 px-md-4 pb-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

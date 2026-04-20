import React from 'react';
import { Menu, Search, User, Bell, LayoutGrid } from 'lucide-react';
import { Button, Form, InputGroup, Dropdown } from 'react-bootstrap';

const Header = ({ collapsed, toggleSidebar }) => {
  return (
    <header className={`scada-header ${collapsed ? 'collapsed' : ''}`}>
      <div className="header-left d-flex align-items-center">
        <Button 
          variant="link" 
          className="text-white p-0 me-3" 
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </Button>
        <h5 className="mb-0 fw-bold tracking-tight d-none d-md-block">
           Sochiot Smart Monitoring System
        </h5>
      </div>

      <div className="header-center d-none d-lg-block">
        <InputGroup className="header-search border-0">
          <InputGroup.Text className="bg-transparent border-secondary border-opacity-25 text-muted">
            <Search size={18} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search systems..."
            className="bg-transparent border-secondary border-opacity-25 text-white"
          />
        </InputGroup>
      </div>

      <div className="header-right d-flex align-items-center">
        <Button variant="link" className="text-muted p-2 me-2 position-relative">
          <Bell size={20} />
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ marginTop: '8px', marginLeft: '-8px' }}></span>
        </Button>
        <Button variant="link" className="text-muted p-2 me-3">
          <LayoutGrid size={20} />
        </Button>
        
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="d-flex align-items-center text-white text-decoration-none p-0 border-0 custom-toggle">
            <div className="user-avatar bg-info rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
              <User size={18} className="text-dark" />
            </div>
            <div className="user-info d-none d-sm-block text-start">
              <p className="mb-0 fs-7 fw-semibold leading-tight">Admin User</p>
              <p className="mb-0 fs-8 text-muted leading-tight">System Engineer</p>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="bg-dark border-secondary mt-2 shadow">
            <Dropdown.Item className="text-white hover-bg-secondary">Profile</Dropdown.Item>
            <Dropdown.Item className="text-white hover-bg-secondary">Logs</Dropdown.Item>
            <Dropdown.Divider className="bg-secondary" />
            <Dropdown.Item className="text-danger hover-bg-secondary">Sign Out</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .header-search {
          width: 400px;
        }
        .header-search .form-control:focus {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: var(--scada-accent) !important;
          box-shadow: none;
          color: white;
        }
        .leading-tight { line-height: 1.25; }
        .fs-8 { font-size: 0.75rem; }
        .fs-7 { font-size: 0.875rem; }
        .custom-toggle::after { display: none; }
        .hover-bg-secondary:hover { background-color: rgba(255, 255, 255, 0.1); }
      `}} />
    </header>
  );
};

export default Header;

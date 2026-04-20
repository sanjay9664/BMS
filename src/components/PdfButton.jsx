import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { FileDown } from 'lucide-react';

const PdfButton = ({ label = "Download PDF Report", onClick }) => {
  return (
    <Button 
      variant="outline-info" 
      size="sm" 
      className="d-flex align-items-center"
      onClick={onClick || (() => alert('Generating PDF Report... (Demo Mode)'))}
    >
      <FileDown size={16} className="me-2" />
      {label}
    </Button>
  );
};

export default PdfButton;

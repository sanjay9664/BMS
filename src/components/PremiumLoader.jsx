import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const PremiumLoader = ({ message = "Initializing System Modules" }) => {
  return (
    <div className="premium-loader-container">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loader-backdrop"
      />
      <div className="loader-content">
        <div className="orbit-container">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="orbit-ring ring-1"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="orbit-ring ring-2"
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="loader-center"
          >
            <ShieldCheck size={40} className="text-info" />
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="loader-text-wrapper"
        >
          <h4 className="loader-title">{message}</h4>
          <div className="loader-status">
            <span className="pulse-dot"></span>
            Synchronizing...
          </div>
        </motion.div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-loader-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          background: #0f172a;
        }
        .loader-backdrop {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.05) 0%, transparent 70%);
        }
        .loader-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        .orbit-container {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .orbit-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid transparent;
        }
        .ring-1 {
          width: 100%;
          height: 100%;
          border-top-color: #38bdf8;
          border-bottom-color: rgba(56, 189, 248, 0.1);
        }
        .ring-2 {
          width: 70%;
          height: 70%;
          border-left-color: rgba(56, 189, 248, 0.4);
          border-right-color: rgba(56, 189, 248, 0.05);
        }
        .loader-center {
          z-index: 2;
          filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.5));
        }
        .loader-text-wrapper {
          text-align: center;
        }
        .loader-title {
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          font-size: 1.1rem;
          color: #f8fafc;
        }
        .loader-status {
          color: #94a3b8;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          background: #38bdf8;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          70% { transform: scale(1.5); opacity: 0.5; box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
      `}} />
    </div>
  );
};

export default PremiumLoader;

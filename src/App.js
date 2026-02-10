import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './Pages/LoginPage.js';
import RegisterPage from './Pages/RegisterPage.js';
import CashDrop from './Pages/CashDrop.js';
import Homepage from './Pages/HomePage.js';
import Header from './Pages/Header.js';
import CdDashboard from './Pages/CdDashboard.js';
import Dashboard from './Pages/Dashboard.js';
import CashDropReconcilerPage from './Pages/CdValidation.js';
import BankDrop from './Pages/BankDrop.js';
import { API_ENDPOINTS } from './config/api';
import useInactivityTimer from './hooks/useInactivityTimer.js';

function App() {
  const navigate = useNavigate();
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [showInactivityModal, setShowInactivityModal] = useState(false);

  // Color constants
  const COLORS = {
    magenta: '#AA056C',
    yellowGreen: '#48BB78',
    lightPink: '#F46690',
    gray: '#64748B'
  };

  // Handle inactivity logout after 10 minutes
  const handleInactivityLogout = () => {
    localStorage.clear();
    setShowInactivityModal(true);
  };

  const handleInactivityModalClose = () => {
    setShowInactivityModal(false);
    navigate('/login');
  };

  // Initialize inactivity timer (10 minutes)
  useInactivityTimer(10 * 60 * 1000, handleInactivityLogout);

  useEffect(() => {
    const checkUserCount = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.USER_COUNT);
        if (response.ok) {
          const data = await response.json();
          if (data.count === 0) {
            // No users exist, redirect to register
            navigate('/register');
          }
        }
      } catch (error) {
        console.error('Error checking user count:', error);
        // If we can't check, continue normally
      } finally {
        setCheckingUsers(false);
      }
    };

    checkUserCount();
  }, [navigate]);

  if (checkingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
   <>
    <Header />
   <Routes>
    <Route path="/" element={<Homepage />} /> 
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/cash-drop" element={<CashDrop />} /> 
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/cd-dashboard" element={<CdDashboard />} />
    <Route path="/cd-validation" element={<CashDropReconcilerPage />} />
    <Route path="/bank-drop" element={<BankDrop />} />
   </Routes>

   {/* Inactivity Logout Modal */}
   {showInactivityModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" style={{ fontFamily: 'Calibri, Verdana, sans-serif' }}>
       <div className="relative max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden">
         <div className="p-4 text-white font-black uppercase tracking-widest" style={{ backgroundColor: COLORS.magenta, fontSize: '18px' }}>
           Session Expired
         </div>
         <div className="p-6">
           <p className="mb-4 font-bold text-center" style={{ color: COLORS.gray, fontSize: '14px' }}>
             You have been logged out due to inactivity.
           </p>
           <div className="flex justify-center">
             <button
               onClick={handleInactivityModalClose}
               className="px-6 py-2 rounded-lg text-white font-black transition-all active:scale-95 uppercase tracking-widest"
               style={{ backgroundColor: COLORS.magenta, fontSize: '14px' }}
             >
               OK
             </button>
           </div>
         </div>
       </div>
     </div>
   )}
   </>
  );
}

export default App;

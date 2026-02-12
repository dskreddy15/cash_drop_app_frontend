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

function App() {
  const navigate = useNavigate();
  const [checkingUsers, setCheckingUsers] = useState(true);

  useEffect(() => {
    const USER_COUNT_TIMEOUT_MS = 10000; // 10 seconds

    const checkUserCount = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), USER_COUNT_TIMEOUT_MS);
        const response = await fetch(API_ENDPOINTS.USER_COUNT, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data.count === 0) {
            navigate('/register');
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('User count request timed out – is the backend running and database reachable?');
        } else {
          console.error('Error checking user count:', error);
        }
        // Continue to app (e.g. show login) so user isn't stuck
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
   </>
  );
}

export default App;

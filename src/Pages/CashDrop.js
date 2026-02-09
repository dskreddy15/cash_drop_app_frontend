import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { getPSTDate } from '../utils/dateUtils';

function CashDrop() {
  const navigate = useNavigate();
  
  // Set page title
  useEffect(() => {
    document.title = 'Cash Drop';
  }, []);
  
  // Color constants
  const COLORS = {
    magenta: '#AA056C',
    yellowGreen: '#48BB78',
    lightPink: '#F46690',
    gray: '#64748B'
  };
  
  // --- STATE ---
  const [formData, setFormData] = useState({
    employeeName: '',
    shiftNumber: '',
    workStation: '',
    date: getPSTDate(),
    startingCash: '200.00',
    cashReceivedOnReceipt: 0,
    pennies: '', nickels: '', dimes: '', quarters: '', halfDollars: '',
    ones: '', twos: '', fives: '', tens: '', twenties: '', fifties: '', hundreds: '',
    quarterRolls: '', dimeRolls: '', nickelRolls: '', pennyRolls: '',
    notes: ''
  });

  const [rollsModal, setRollsModal] = useState({ show: false, quarterRolls: '', dimeRolls: '', nickelRolls: '', pennyRolls: '' });

  const [labelImage, setLabelImage] = useState(null);
  const [cashDropDenominations, setCashDropDenominations] = useState(null);
  const [remainingCashInDrawer, setRemainingCashInDrawer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ show: false, text: '', type: 'info' });
  const [adminSettings, setAdminSettings] = useState({ shifts: [], workstations: [], starting_amount: 200.00, max_cash_drops_per_day: 10 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const DENOMINATION_CONFIG = [
    { name: 'Hundreds', value: 100, field: 'hundreds', display: 'Hundreds ($100)' },
    { name: 'Fifties', value: 50, field: 'fifties', display: 'Fifties ($50)' },
    { name: 'Twenties', value: 20, field: 'twenties', display: 'Twenties ($20)' },
    { name: 'Tens', value: 10, field: 'tens', display: 'Tens ($10)' },
    { name: 'Fives', value: 5, field: 'fives', display: 'Fives ($5)' },
    { name: 'Twos', value: 2, field: 'twos', display: 'Twos ($2)' },
    { name: 'Ones', value: 1, field: 'ones', display: 'Ones ($1)' },
    { name: 'Half Dollars', value: 0.50, field: 'halfDollars', display: 'Half Dollars ($0.50)' },
    { name: 'Quarters', value: 0.25, field: 'quarters', display: 'Quarters ($0.25)' },
    { name: 'Dimes', value: 0.10, field: 'dimes', display: 'Dimes ($0.10)' },
    { name: 'Nickels', value: 0.05, field: 'nickels', display: 'Nickels ($0.05)' },
    { name: 'Pennies', value: 0.01, field: 'pennies', display: 'Pennies ($0.01)' },
  ];

  // --- EFFECTS ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await fetch(API_ENDPOINTS.CURRENT_USER, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Auth failed');
        const data = await response.json();
        setFormData(prev => ({ ...prev, employeeName: data.name }));
        setIsAdmin(data.is_admin);
        // Get user ID from token or response if available
        // We'll need to decode the token or get it from the response
        // For now, we'll filter by user in the frontend after fetching
        setLoading(false);
      } catch (err) { navigate('/login'); }
    };
    fetchUser();
    
    // Fetch admin settings
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(API_ENDPOINTS.ADMIN_SETTINGS, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAdminSettings(data);
          setFormData(prev => ({ ...prev, startingCash: data.starting_amount.toString() }));
        }
      } catch (error) {
        console.error("Error fetching admin settings:", error);
      }
    };
    fetchSettings();

    // Load draft from backend or localStorage
    const loadDraft = async () => {
      try {
        // Fetch both cash drawer and cash drop drafts
        const today = getPSTDate();
        const token = localStorage.getItem('access_token');
        
        const [drawerResponse, dropResponse] = await Promise.all([
          fetch(`${API_ENDPOINTS.CASH_DRAWER}?datefrom=${today}&dateto=${today}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_ENDPOINTS.CASH_DROP}?datefrom=${today}&dateto=${today}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (drawerResponse.ok && dropResponse.ok) {
          const drawers = await drawerResponse.json();
          const drops = await dropResponse.json();
          
          const drawerDraft = drawers.find(d => d.status === 'drafted');
          const dropDraft = drops.find(d => d.status === 'drafted');
          
          if (drawerDraft || dropDraft) {
            // Use drawer draft for denominations and basic info
            const draft = drawerDraft || {};
            // Use drop draft for ws_label_amount and notes
            const drop = dropDraft || {};
            
            if (drop.id) {
              setDraftId(drop.id);
            }
            if (drawerDraft && drawerDraft.id) {
              setDraftDrawerId(drawerDraft.id);
            }
            if (drop.drawer_entry_id) {
              setDraftDrawerId(drop.drawer_entry_id);
            }
            
            // Format date - handle both date strings and Date objects
            let formattedDate = getPSTDate();
            const dateSource = draft.date || drop.date;
            if (dateSource) {
              if (typeof dateSource === 'string') {
                // Extract just the date part (YYYY-MM-DD) if it includes time
                formattedDate = dateSource.split('T')[0];
              } else {
                formattedDate = getPSTDate();
              }
            }
            
            // Handle cashReceivedOnReceipt - use ws_label_amount from cash drop table
            // If it's 0, show 0; if null/undefined, show empty string; otherwise show the value
            const cashReceivedValue = drop.ws_label_amount !== null && drop.ws_label_amount !== undefined 
              ? (drop.ws_label_amount === 0 ? '0' : String(drop.ws_label_amount))
              : '';
            
            // Use drawer draft for denominations (Register Cash Count)
            setFormData(prev => ({
              ...prev,
              shiftNumber: (draft.shift_number || drop.shift_number) || '',
              workStation: (draft.workstation || drop.workstation) || '',
              date: formattedDate,
              cashReceivedOnReceipt: cashReceivedValue,
              notes: drop.notes || '',
              // Denominations from cash drawer
              hundreds: draft.hundreds && draft.hundreds !== 0 ? draft.hundreds : '',
              fifties: draft.fifties && draft.fifties !== 0 ? draft.fifties : '',
              twenties: draft.twenties && draft.twenties !== 0 ? draft.twenties : '',
              tens: draft.tens && draft.tens !== 0 ? draft.tens : '',
              fives: draft.fives && draft.fives !== 0 ? draft.fives : '',
              twos: draft.twos && draft.twos !== 0 ? draft.twos : '',
              ones: draft.ones && draft.ones !== 0 ? draft.ones : '',
              halfDollars: draft.half_dollars && draft.half_dollars !== 0 ? draft.half_dollars : '',
              quarters: draft.quarters && draft.quarters !== 0 ? draft.quarters : '',
              dimes: draft.dimes && draft.dimes !== 0 ? draft.dimes : '',
              nickels: draft.nickels && draft.nickels !== 0 ? draft.nickels : '',
              pennies: draft.pennies && draft.pennies !== 0 ? draft.pennies : '',
              quarterRolls: draft.quarter_rolls && draft.quarter_rolls !== 0 ? draft.quarter_rolls : '',
              dimeRolls: draft.dime_rolls && draft.dime_rolls !== 0 ? draft.dime_rolls : '',
              nickelRolls: draft.nickel_rolls && draft.nickel_rolls !== 0 ? draft.nickel_rolls : '',
              pennyRolls: draft.penny_rolls && draft.penny_rolls !== 0 ? draft.penny_rolls : ''
            }));
            
            setTimeout(() => {
              showStatusMessage('Retrieved previous draft details.', 'info');
            }, 500);
            return;
          }
        }
        
        // Fallback to localStorage
        const draftData = localStorage.getItem('cashDropDraft');
        if (draftData) {
          const draft = JSON.parse(draftData);
          // Only restore if we have essential fields
          if (draft.workStation || draft.shiftNumber || draft.cashReceivedOnReceipt) {
            setFormData(prev => ({ ...draft }));
            if (draft.labelImage) {
              // Note: We can't restore the actual file, but we can store the filename
              setLabelImage(draft.labelImage);
            }
            // Use setTimeout to ensure showStatusMessage is available
            setTimeout(() => {
              showStatusMessage('Retrieved previous draft details.', 'info');
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };
    loadDraft();
  }, [navigate]);

  useEffect(() => {
    calculateDenominations();
  }, [formData]);

  // --- HELPERS ---
  const showStatusMessage = (text, type = 'info') => {
    setStatusMessage({ show: true, text, type });
    setTimeout(() => setStatusMessage({ show: false, text: '', type: 'info' }), 5000);
  };

  const [draftId, setDraftId] = useState(null);
  const [draftDrawerId, setDraftDrawerId] = useState(null);

  // Save draft to backend
  const saveDraft = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Drawer as draft
      const drawerData = {
        workstation: formData.workStation,
        shift_number: formData.shiftNumber,
        date: formData.date,
        starting_cash: parseFloat(formData.startingCash),
        total_cash: parseFloat(calculateTotalCash()),
        status: 'drafted',
        ...Object.fromEntries(DENOMINATION_CONFIG.map(d => [d.field === 'halfDollars' ? 'half_dollars' : d.field, parseFloat(formData[d.field] || 0)])),
        quarter_rolls: parseFloat(formData.quarterRolls || 0),
        dime_rolls: parseFloat(formData.dimeRolls || 0),
        nickel_rolls: parseFloat(formData.nickelRolls || 0),
        penny_rolls: parseFloat(formData.pennyRolls || 0)
      };

      const token = localStorage.getItem('access_token');
      const dRes = await fetch(API_ENDPOINTS.CASH_DRAWER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(drawerData),
      });

      if (!dRes.ok) throw new Error('Failed to save Drawer draft.');
      const dResult = await dRes.json();
      setDraftDrawerId(dResult.id);

      // 2. Save Drop as draft
      const dropForm = new FormData();
      dropForm.append('drawer_entry', dResult.id);
      dropForm.append('workstation', formData.workStation);
      dropForm.append('shift_number', formData.shiftNumber);
      dropForm.append('date', formData.date);
      dropForm.append('drop_amount', calculateDropAmount());
      dropForm.append('ws_label_amount', formData.cashReceivedOnReceipt);
      dropForm.append('cashReceivedOnReceipt', formData.cashReceivedOnReceipt);
      dropForm.append('variance', calculateVariance());
      dropForm.append('status', 'drafted');
      if (formData.notes) dropForm.append('notes', formData.notes);
      if (labelImage) dropForm.append('label_image', labelImage);

      Object.keys(cashDropDenominations || {}).forEach(key => {
        const backendKey = key === 'halfDollars' ? 'half_dollars' : key;
        dropForm.append(backendKey, cashDropDenominations[key] || 0);
      });

      // Add roll data
      dropForm.append('quarter_rolls', parseFloat(formData.quarterRolls || 0));
      dropForm.append('dime_rolls', parseFloat(formData.dimeRolls || 0));
      dropForm.append('nickel_rolls', parseFloat(formData.nickelRolls || 0));
      dropForm.append('penny_rolls', parseFloat(formData.pennyRolls || 0));

      const dropRes = await fetch(API_ENDPOINTS.CASH_DROP, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: dropForm,
      });

      if (!dropRes.ok) throw new Error('Failed to save Cash Drop draft.');
      const dropResult = await dropRes.json();
      setDraftId(dropResult.id);
      
      // Also save to localStorage for quick restore
      const draftData = {
        ...formData,
        labelImage: labelImage ? labelImage.name : null
      };
      localStorage.setItem('cashDropDraft', JSON.stringify(draftData));
      
      showStatusMessage('Draft saved successfully.', 'success');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error saving draft:', error);
      showStatusMessage(error.message || 'Failed to save draft.', 'error');
      setIsSubmitting(false);
    }
  };

  // Delete draft from backend
  const deleteDraft = async () => {
    try {
      const promises = [];
      
      if (draftId) {
        promises.push(
          fetch(API_ENDPOINTS.DELETE_CASH_DROP(draftId), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          })
        );
      }
      
      if (draftDrawerId) {
        promises.push(
          fetch(API_ENDPOINTS.DELETE_CASH_DRAWER(draftDrawerId), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          })
        );
      }
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      // Clear localStorage
      localStorage.removeItem('cashDropDraft');
      setDraftId(null);
      setDraftDrawerId(null);
      
      // Reset form
      setFormData({
        employeeName: formData.employeeName,
        shiftNumber: '',
        workStation: '',
        date: getPSTDate(),
        startingCash: adminSettings.starting_amount.toString(),
        cashReceivedOnReceipt: 0,
        pennies: '', nickels: '', dimes: '', quarters: '', halfDollars: '',
        ones: '', twos: '', fives: '', tens: '', twenties: '', fifties: '', hundreds: '',
        quarterRolls: '', dimeRolls: '', nickelRolls: '', pennyRolls: '',
        notes: ''
      });
      setLabelImage(null);
      
      showStatusMessage('Draft deleted successfully.', 'success');
    } catch (error) {
      console.error('Error deleting draft:', error);
      showStatusMessage('Failed to delete draft.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent selecting prior day's dates
    if (name === 'date') {
      const selectedDate = new Date(value + 'T00:00:00-08:00'); // PST
      const today = new Date(getPSTDate() + 'T00:00:00-08:00'); // PST
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        showStatusMessage('Cannot select prior dates. Cash drop is for immediate shift/day closure.', 'error');
        return;
      }
    }
    
    // Parse numeric values for numeric fields (except cashReceivedOnReceipt which should remain as text to allow decimals)
    const numericFields = ['startingCash', 'pennies', 'nickels', 'dimes', 'quarters', 'halfDollars', 'ones', 'twos', 'fives', 'tens', 'twenties', 'fifties', 'hundreds', 'quarterRolls', 'dimeRolls', 'nickelRolls', 'pennyRolls'];
    if (numericFields.includes(name)) {
      // Keep as empty string if value is empty, otherwise parse as number
      if (value === '') {
        setFormData(prev => ({ ...prev, [name]: '' }));
      } else {
        const numValue = parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      // For cashReceivedOnReceipt and other text fields, keep as string to allow decimal input
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRollsModalSave = () => {
    setFormData(prev => ({
      ...prev,
      quarterRolls: rollsModal.quarterRolls === '' ? '' : (parseFloat(rollsModal.quarterRolls) || 0),
      dimeRolls: rollsModal.dimeRolls === '' ? '' : (parseFloat(rollsModal.dimeRolls) || 0),
      nickelRolls: rollsModal.nickelRolls === '' ? '' : (parseFloat(rollsModal.nickelRolls) || 0),
      pennyRolls: rollsModal.pennyRolls === '' ? '' : (parseFloat(rollsModal.pennyRolls) || 0)
    }));
    setRollsModal({ show: false, quarterRolls: '', dimeRolls: '', nickelRolls: '', pennyRolls: '' });
    showStatusMessage('Coin rolls saved successfully.', 'success');
  };

  const handleRollsModalOpen = () => {
    setRollsModal({
      show: true,
      quarterRolls: formData.quarterRolls === '' || formData.quarterRolls === 0 ? '' : formData.quarterRolls,
      dimeRolls: formData.dimeRolls === '' || formData.dimeRolls === 0 ? '' : formData.dimeRolls,
      nickelRolls: formData.nickelRolls === '' || formData.nickelRolls === 0 ? '' : formData.nickelRolls,
      pennyRolls: formData.pennyRolls === '' || formData.pennyRolls === 0 ? '' : formData.pennyRolls
    });
  };

  const calculateTotalCash = () => {
    // Calculate from individual coins and bills
    const billsAndCoins = DENOMINATION_CONFIG.reduce((acc, d) => {
      const value = parseFloat(formData[d.field] || 0);
      return acc + (value * d.value);
    }, 0);
    
    // Calculate from rolls
    // Quarter rolls: 40 quarters each = $10 per roll
    // Dime rolls: 50 dimes each = $5 per roll
    // Nickel rolls: 40 nickels each = $2 per roll
    // Penny rolls: 50 pennies each = $0.50 per roll
    const quarterRollsValue = (parseFloat(formData.quarterRolls || 0) * 40 * 0.25);
    const dimeRollsValue = (parseFloat(formData.dimeRolls || 0) * 50 * 0.10);
    const nickelRollsValue = (parseFloat(formData.nickelRolls || 0) * 40 * 0.05);
    const pennyRollsValue = (parseFloat(formData.pennyRolls || 0) * 50 * 0.01);
    
    return (billsAndCoins + quarterRollsValue + dimeRollsValue + nickelRollsValue + pennyRollsValue).toFixed(2);
  };
  
  const calculateDropAmount = () => (parseFloat(calculateTotalCash()) - parseFloat(formData.startingCash)).toFixed(2);
  const calculateVariance = () => (parseFloat(calculateDropAmount()) - parseFloat(formData.cashReceivedOnReceipt || 0)).toFixed(2);

  const calculateDenominations = () => {
    const amountToDrop = parseFloat(calculateDropAmount());
    if (amountToDrop <= 0) { setCashDropDenominations(null); return; }

    let remaining = Math.round(amountToDrop * 100);
    const dropBreakdown = {};
    const finalDrawer = {};

    DENOMINATION_CONFIG.forEach(denom => {
      const valCents = Math.round(denom.value * 100);
      const available = formData[denom.field];
      let count = 0;
      if (valCents > 0 && remaining >= valCents) {
        count = Math.min(Math.floor(remaining / valCents), available);
        remaining -= count * valCents;
      }
      dropBreakdown[denom.field] = count;
      finalDrawer[denom.field] = available - count;
    });

    setCashDropDenominations(dropBreakdown);
    setRemainingCashInDrawer(finalDrawer);
  };

  const isSubmitValid = () => {
    const drop = parseFloat(calculateDropAmount());
    const mathCheck = Math.abs(drop - (parseFloat(calculateTotalCash()) - parseFloat(formData.startingCash))) < 0.01;
    return mathCheck && drop > 0 && formData.workStation;
  };

  const handleSubmit = async (isDraft = false) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Check max cash drops per day (excluding ignored ones and drafts)
      if (!isDraft) {
        const todayDropsResponse = await fetch(`${API_ENDPOINTS.CASH_DROP}?datefrom=${formData.date}&dateto=${formData.date}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (todayDropsResponse.ok) {
          const todayDrops = await todayDropsResponse.json();
          const nonIgnoredCount = todayDrops.filter(d => !d.ignored && d.status !== 'drafted').length;
          if (nonIgnoredCount >= adminSettings.max_cash_drops_per_day) {
            showStatusMessage(`Maximum cash drops per day (${adminSettings.max_cash_drops_per_day}) reached. Please ignore any incorrect entries first.`, 'error');
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 1. Save Drawer
      const drawerData = {
        workstation: formData.workStation,
        shift_number: formData.shiftNumber,
        date: formData.date,
        starting_cash: parseFloat(formData.startingCash),
        total_cash: parseFloat(calculateTotalCash()),
        ...Object.fromEntries(DENOMINATION_CONFIG.map(d => [d.field === 'halfDollars' ? 'half_dollars' : d.field, parseFloat(formData[d.field] || 0)])),
        quarter_rolls: parseFloat(formData.quarterRolls || 0),
        dime_rolls: parseFloat(formData.dimeRolls || 0),
        nickel_rolls: parseFloat(formData.nickelRolls || 0),
        penny_rolls: parseFloat(formData.pennyRolls || 0)
      };

      const dRes = await fetch(API_ENDPOINTS.CASH_DRAWER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(drawerData),
      });

      if (!dRes.ok) {
        const error = await dRes.json();
        throw new Error('Failed to save Drawer data. ' + error.error);
      }
      const dResult = await dRes.json();

      // 2. Save Drop with Image
      const dropForm = new FormData();
      dropForm.append('drawer_entry', dResult.id);
      dropForm.append('workstation', formData.workStation);
      dropForm.append('shift_number', formData.shiftNumber);
      dropForm.append('date', formData.date);
      dropForm.append('drop_amount', calculateDropAmount());
      dropForm.append('ws_label_amount', formData.cashReceivedOnReceipt);
      dropForm.append('cashReceivedOnReceipt', formData.cashReceivedOnReceipt);
      dropForm.append('variance', calculateVariance());
      dropForm.append('status', isDraft ? 'drafted' : 'submitted');
      if (formData.notes) dropForm.append('notes', formData.notes);
      if (labelImage) dropForm.append('label_image', labelImage);

      Object.keys(cashDropDenominations).forEach(key => {
        const backendKey = key === 'halfDollars' ? 'half_dollars' : key;
        dropForm.append(backendKey, cashDropDenominations[key]);
      });

      // Add roll data
      dropForm.append('quarter_rolls', parseFloat(formData.quarterRolls || 0));
      dropForm.append('dime_rolls', parseFloat(formData.dimeRolls || 0));
      dropForm.append('nickel_rolls', parseFloat(formData.nickelRolls || 0));
      dropForm.append('penny_rolls', parseFloat(formData.pennyRolls || 0));

      const dropRes = await fetch(API_ENDPOINTS.CASH_DROP, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: dropForm,
      });

      if (!dropRes.ok) {
        const error = await dropRes.json();
        //console.log(error);
        throw new Error('Failed to save Cash Drop & Image. ' + error.error);
      }
        //throw new Error('Failed to save Cash Drop & Image.'); // TODO: Add error message from backend
      
      // Clear draft on successful submission
      localStorage.removeItem('cashDropDraft');
      
      if (isDraft) {
        showStatusMessage('Draft saved successfully.', 'success');
        setIsSubmitting(false);
      } else {
        // Success - navigate immediately
        navigate('/cd-dashboard');
      }

    } catch (err) {
      setIsSubmitting(false);
      showStatusMessage(err.message, 'error');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ fontFamily: 'Calibri, Verdana, sans-serif' }}>Initializing Terminal...</div>;

  return (
    <div className={`min-h-screen bg-gray-50 p-3 md:p-6 ${isSubmitting ? 'blur-sm pointer-events-none' : ''}`} style={{ fontFamily: 'Calibri, Verdana, sans-serif', fontSize: '14px', color: COLORS.gray }}>
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.magenta }}></div>
            <p className="font-black uppercase tracking-widest" style={{ fontSize: '18px', color: COLORS.magenta }}>Processing...</p>
          </div>
        </div>
      )}
      
      {/* Status Message */}
      {statusMessage.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          statusMessage.type === 'error' ? 'bg-red-100 border-l-4 border-red-500' : 
          statusMessage.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' : 
          'bg-blue-100 border-l-4 border-blue-500'
        }`}>
          <p className={`font-bold ${statusMessage.type === 'error' ? 'text-red-700' : statusMessage.type === 'success' ? 'text-green-700' : 'text-blue-700'}`} style={{ fontSize: '14px' }}>
            {statusMessage.text}
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4" style={{ backgroundColor: COLORS.magenta }}>
          <h2 className="text-white font-black tracking-widest text-center uppercase" style={{ fontSize: '24px' }}>CashDrop Terminal</h2>
        </div>

        <div className="p-4 md:p-8">
          {/* Section 1: Top Bar Details - Split into two divs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 p-4 bg-gray-50 rounded-lg">
            {/* Left Div: Input Fields */}
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1" style={{ color: COLORS.gray, fontSize: '14px' }}>Shift Number</label>
                <select name="shiftNumber" value={formData.shiftNumber} onChange={handleChange} className="p-2 bg-white border-b border-gray-300 focus:border-pink-600 outline-none" style={{ fontSize: '14px' }}>
                  <option value="">Select Shift</option>
                  {adminSettings.shifts.map((shift, idx) => (
                    <option key={idx} value={shift}>{shift}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1" style={{ color: COLORS.gray, fontSize: '14px' }}>Register Number</label>
                <select name="workStation" value={formData.workStation} onChange={handleChange} className="p-2 bg-white border-b border-gray-300 focus:border-pink-600 outline-none" style={{ fontSize: '14px' }}>
                  <option value="">Select Register</option>
                  {adminSettings.workstations.map((workstation, idx) => (
                    <option key={idx} value={workstation}>{workstation}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1" style={{ color: COLORS.gray, fontSize: '14px' }}>Cash Received on Receipt</label>
                <input type="text" name="cashReceivedOnReceipt" value={formData.cashReceivedOnReceipt} onChange={handleChange} className="p-2 bg-white border-b border-gray-300 font-bold focus:border-pink-600 outline-none" style={{ fontSize: '14px', color: COLORS.magenta }} />
              </div>
            </div>
            
            {/* Right Div: Display Only Fields */}
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1" style={{ color: COLORS.gray, fontSize: '14px' }}>Employee</label>
                <div className="p-2 bg-transparent border-b border-gray-300 font-bold" style={{ fontSize: '14px', color: COLORS.gray }}>{formData.employeeName}</div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1" style={{ color: COLORS.gray, fontSize: '14px' }}>Date</label>
                <input type="date" name="date" value={formData.date || getPSTDate()} onChange={handleChange} max={getPSTDate()} className="p-2 bg-white border-b border-gray-300 font-bold focus:border-pink-600 outline-none" style={{ fontSize: '14px', color: COLORS.gray }} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1" style={{ color: COLORS.gray, fontSize: '14px' }}>Starting Cash</label>
                <div className="p-2 bg-transparent border-b border-gray-300 font-bold" style={{ fontSize: '14px', color: COLORS.magenta }}>${formData.startingCash}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-start">
            {/* Input Column */}
            <div className="bg-white border rounded-lg p-4 md:p-6">
              <h3 className="font-black uppercase mb-4 md:mb-6 tracking-widest border-b pb-2" style={{ fontSize: '18px', color: COLORS.gray }}>1. Register Cash Count</h3>
              <div className="space-y-3">
                {DENOMINATION_CONFIG.map(d => (
                  <div key={d.field} className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ color: COLORS.gray, fontSize: '14px' }}>{d.display}</span>
                    <input type="text" name={d.field} value={formData[d.field] || ''} onChange={handleChange} className="w-20 p-1 border rounded text-right" style={{ fontSize: '14px' }} />
                  </div>
                ))}
              </div>
              
              {/* Display Coin Rolls if any are greater than zero */}
              {((formData.quarterRolls && parseFloat(formData.quarterRolls) > 0) ||
                (formData.dimeRolls && parseFloat(formData.dimeRolls) > 0) ||
                (formData.nickelRolls && parseFloat(formData.nickelRolls) > 0) ||
                (formData.pennyRolls && parseFloat(formData.pennyRolls) > 0)) && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-xs font-bold uppercase mb-2" style={{ color: COLORS.gray, fontSize: '14px' }}>Coin Rolls:</h4>
                  <div className="space-y-2">
                    {formData.quarterRolls && parseFloat(formData.quarterRolls) > 0 && (
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-xs font-bold" style={{ color: COLORS.gray, fontSize: '14px' }}>Quarter Rolls (40 quarters = $10 per roll):</span>
                        <span className="font-bold" style={{ color: COLORS.magenta, fontSize: '14px' }}>{formData.quarterRolls} roll(s) = ${(parseFloat(formData.quarterRolls) * 40 * 0.25).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.dimeRolls && parseFloat(formData.dimeRolls) > 0 && (
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-xs font-bold" style={{ color: COLORS.gray, fontSize: '14px' }}>Dime Rolls (50 dimes = $5 per roll):</span>
                        <span className="font-bold" style={{ color: COLORS.magenta, fontSize: '14px' }}>{formData.dimeRolls} roll(s) = ${(parseFloat(formData.dimeRolls) * 50 * 0.10).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.nickelRolls && parseFloat(formData.nickelRolls) > 0 && (
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-xs font-bold" style={{ color: COLORS.gray, fontSize: '14px' }}>Nickel Rolls (40 nickels = $2 per roll):</span>
                        <span className="font-bold" style={{ color: COLORS.magenta, fontSize: '14px' }}>{formData.nickelRolls} roll(s) = ${(parseFloat(formData.nickelRolls) * 40 * 0.05).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.pennyRolls && parseFloat(formData.pennyRolls) > 0 && (
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-xs font-bold" style={{ color: COLORS.gray, fontSize: '14px' }}>Penny Rolls (50 pennies = $0.50 per roll):</span>
                        <span className="font-bold" style={{ color: COLORS.magenta, fontSize: '14px' }}>{formData.pennyRolls} roll(s) = ${(parseFloat(formData.pennyRolls) * 50 * 0.01).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRollsModalOpen}
                  className="w-full py-2 text-white font-bold rounded-lg transition uppercase tracking-widest"
                  style={{ backgroundColor: COLORS.yellowGreen, fontSize: '14px' }}
                >
                  Add Coin Rolls
                </button>
              </div>
              <div className="mt-6 md:mt-8 pt-4 border-t space-y-2">
                <div className="flex justify-between" style={{ fontSize: '14px' }}><span>Drawer Total:</span> <span className="font-bold">${calculateTotalCash()}</span></div>
              </div>
            </div>

            {/* Auto Drop Column */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 md:p-6">
              <h3 className="font-black uppercase mb-4 md:mb-6 tracking-widest border-b border-blue-100 pb-2" style={{ fontSize: '18px', color: COLORS.magenta }}>2. Suggested Cash Drop</h3>
              <div className="space-y-2">
                {cashDropDenominations ? DENOMINATION_CONFIG.map(d => cashDropDenominations[d.field] > 0 && (
                  <div key={d.field} className="flex justify-between p-2 bg-white rounded border border-blue-50">
                    <span className="text-xs font-bold uppercase" style={{ color: COLORS.gray, fontSize: '14px' }}>{d.display}</span>
                    <span className="font-black" style={{ color: COLORS.magenta, fontSize: '14px' }}>x {cashDropDenominations[d.field]}</span>
                  </div>
                )) : <p className="text-center text-gray-300 py-20 italic" style={{ fontSize: '14px' }}>Enter amounts to calculate...</p>}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between" style={{ color: COLORS.yellowGreen, fontSize: '14px' }}>
                    <span>Net Drop:</span> 
                    <span className="font-black">${calculateDropAmount()}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: COLORS.lightPink, fontSize: '14px' }}>
                    <span>Variance:</span> 
                    <span className="font-black">${calculateVariance()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Image & Submit Column */}
            <div className="space-y-4 md:space-y-6">
              <div className="bg-white border rounded-lg p-4 md:p-6">
                <h3 className="font-black uppercase mb-4 md:mb-6 tracking-widest border-b pb-2" style={{ fontSize: '18px', color: COLORS.gray }}>3. Cash Drop Receipt (Optional)</h3>
                <label className={`group flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${labelImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-pink-500'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="font-bold" style={{ color: COLORS.gray, fontSize: '14px' }}>{labelImage ? "✅ Image Ready" : "Upload Cash Drop Receipt (Optional)"}</p>
                    <p className="mt-1" style={{ color: COLORS.gray, fontSize: '14px' }}>{labelImage ? labelImage.name : "PNG, JPG or JPEG"}</p>
                  </div>
                  <input type="file" className="hidden" onChange={(e) => setLabelImage(e.target.files[0])} accept="image/*" />
                </label>
              </div>

              {/* Notes/Comments Field */}
              <div className="bg-white border rounded-lg p-4 md:p-6">
                <h3 className="font-black uppercase mb-4 tracking-widest border-b pb-2" style={{ fontSize: '18px', color: COLORS.gray }}>Notes/Comments</h3>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Enter any notes or comments about this cash drop..."
                  style={{ fontSize: '14px' }}
                />
              </div>

              <div className="space-y-3">
                {isSubmitValid() ? (
                  <button onClick={() => handleSubmit(false)} className="w-full py-3 md:py-4 text-white font-black rounded-lg shadow-lg transform transition active:scale-95 uppercase tracking-widest" style={{ backgroundColor: COLORS.magenta, fontSize: '18px' }}>
                    Finalize Cash Drop
                  </button>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <p className="font-black text-red-500 leading-relaxed" style={{ fontSize: '14px' }}>
                      {parseFloat(calculateDropAmount()) <= 0 && "• Drop Amount must be positive"}<br/>
                      {formData.workStation === '' && "• Register Number is required"}<br/>
                      {formData.shiftNumber === '' && "• Shift Number is required"}<br/>
                      {formData.startingCash === '' && "• Starting Cash is required"}<br/>
                      {formData.cashReceivedOnReceipt === '' && "• Cash Received on Receipt is required"}<br/>
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={saveDraft} 
                    className="py-3 md:py-4 text-white font-black rounded-lg shadow-lg transform transition active:scale-95 uppercase tracking-widest" 
                    style={{ backgroundColor: COLORS.gray, fontSize: '18px' }}
                    disabled={isSubmitting}
                  >
                    Save as Draft
                  </button>
                  {(draftId || localStorage.getItem('cashDropDraft')) && (
                    <button 
                      onClick={deleteDraft} 
                      className="py-3 md:py-4 text-white font-black rounded-lg shadow-lg transform transition active:scale-95 uppercase tracking-widest" 
                      style={{ backgroundColor: '#EF4444', fontSize: '18px' }}
                    >
                      Delete Draft
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Rolls Modal */}
      {rollsModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setRollsModal({ ...rollsModal, show: false })}>
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} style={{ fontFamily: 'Calibri, Verdana, sans-serif' }}>
            <h3 className="font-black uppercase mb-6 tracking-widest border-b pb-2" style={{ fontSize: '18px', color: COLORS.gray }}>Coin Rolls</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: COLORS.gray, fontSize: '14px' }}>Quarter Rolls (40 quarters = $10 per roll)</label>
                <input
                  type="number"
                  min="0"
                  value={rollsModal.quarterRolls}
                  onChange={(e) => setRollsModal({ ...rollsModal, quarterRolls: e.target.value === '' ? '' : e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none"
                  style={{ fontSize: '14px' }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: COLORS.gray, fontSize: '14px' }}>Dime Rolls (50 dimes = $5 per roll)</label>
                <input
                  type="number"
                  min="0"
                  value={rollsModal.dimeRolls}
                  onChange={(e) => setRollsModal({ ...rollsModal, dimeRolls: e.target.value === '' ? '' : e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none"
                  style={{ fontSize: '14px' }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: COLORS.gray, fontSize: '14px' }}>Nickel Rolls (40 nickels = $2 per roll)</label>
                <input
                  type="number"
                  min="0"
                  value={rollsModal.nickelRolls}
                  onChange={(e) => setRollsModal({ ...rollsModal, nickelRolls: e.target.value === '' ? '' : e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none"
                  style={{ fontSize: '14px' }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: COLORS.gray, fontSize: '14px' }}>Penny Rolls (50 pennies = $0.50 per roll)</label>
                <input
                  type="number"
                  min="0"
                  value={rollsModal.pennyRolls}
                  onChange={(e) => setRollsModal({ ...rollsModal, pennyRolls: e.target.value === '' ? '' : e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none"
                  style={{ fontSize: '14px' }}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleRollsModalSave}
                className="flex-1 py-2 text-white font-bold rounded-lg transition uppercase tracking-widest"
                style={{ backgroundColor: COLORS.magenta, fontSize: '14px' }}
              >
                Save
              </button>
              <button
                onClick={() => setRollsModal({ show: false, quarterRolls: '', dimeRolls: '', nickelRolls: '', pennyRolls: '' })}
                className="flex-1 py-2 text-white font-bold rounded-lg transition uppercase tracking-widest"
                style={{ backgroundColor: COLORS.gray, fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashDrop;

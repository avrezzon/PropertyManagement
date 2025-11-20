import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Wrench, AlertCircle, Plus, X, Home, Trash2, RefreshCw, UserPlus, Zap, Edit2, Info, Clock, Camera, Key, LogOut, CheckSquare } from 'lucide-react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import UserSessionManager from './components/UserSessionManager';
import GuestBanner from './components/GuestBanner';

const RentalCalculator = () => {
    // --- Global Inputs ---
    const [initialMortgage, setInitialMortgage] = useState(1500);
    const [vacancyUtilities, setVacancyUtilities] = useState(150);
    const [forecastYears, setForecastYears] = useState(3);

    // --- User Session State ---
    const [user, setUser] = useState(null);
    const [showGuestBanner, setShowGuestBanner] = useState(true);
    const [hasLoggedOut, setHasLoggedOut] = useState(false);

    // --- Date Configuration ---
    const [analysisStartMonth, setAnalysisStartMonth] = useState(12); // Default Dec
    const [analysisStartYear, setAnalysisStartYear] = useState(2025); // Default 2025

    // --- Lease Segments State ---
    // Added: rent, moveOutCosts, moveOutDetails
    const [leaseSegments, setLeaseSegments] = useState([
        {
            id: 1,
            type: 'new',
            startMonth: 1,
            duration: 12,
            marketingFee: true,
            rent: 2500,
            moveOutCosts: 550, // Sum of defaults below
            moveOutDetails: { cleaning: 250, carpet: 200, rekey: 100, other: 0 }
        }
    ]);

    // --- Overrides State ---
    const [monthlyRepairs, setMonthlyRepairs] = useState({});
    const [utilityOverrides, setUtilityOverrides] = useState({});
    const [mortgageUpdates, setMortgageUpdates] = useState({}); // { monthIndex: newBaseAmount }

    // --- Session Persistence ---
    useEffect(() => {
        const storedToken = localStorage.getItem('google_token');
        const storedProfile = localStorage.getItem('google_profile');
        if (storedToken && storedProfile) {
            setUser({
                token: JSON.parse(storedToken),
                profile: JSON.parse(storedProfile)
            });
            setShowGuestBanner(false);
        }
    }, []);

    const handleLoginSuccess = async (tokenResponse) => {
        try {
            const userInfo = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
            );
            const profile = userInfo.data;
            setUser({ token: tokenResponse, profile });
            setShowGuestBanner(false);

            // Save to localStorage
            localStorage.setItem('google_token', JSON.stringify(tokenResponse));
            localStorage.setItem('google_profile', JSON.stringify(profile));
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }
    };

    // --- Google Auth ---
    const login = useGoogleLogin({
        onSuccess: handleLoginSuccess,
        onError: error => console.error('Google Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/drive.file profile email',
    });

    const handleLogout = () => {
        googleLogout();
        setUser(null);
        setHasLoggedOut(true);
        localStorage.removeItem('google_token');
        localStorage.removeItem('google_profile');
    };

    // --- Dirty State Tracking ---
    const [isDirty, setIsDirty] = useState(false);

    // Mark as dirty on any change

    // --- Unsaved Changes Protection ---
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // Warn if there are unsaved changes (for both guests and logged-in users)
            if (isDirty) {
                e.preventDefault();
                const message = 'You have unsaved changes. Are you sure you want to leave?';
                e.returnValue = message; // Required for Chrome/Edge
                return message; // Required for some other browsers
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, user, hasLoggedOut]);


    // --- Modal State ---
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'repair', // 'repair', 'utility', 'mortgage', 'moveOut'
        monthIndex: null, // For timeline events
        segmentId: null, // For lease segment settings
        amount: '',
        note: '',
        details: {} // For move-out breakdown
    });

    // --- Tooltip State ---
    const [tooltip, setTooltip] = useState(null);

    // --- Constants from Contract ---
    const MANAGEMENT_FEE_PERCENT = 0.10;
    const LEASING_FEE_PERCENT = 0.50;
    const RENEWAL_FEE_PERCENT = 0.10;
    const MARKETING_FEE = 150;
    const MAINTENANCE_SURVEY_FEE = 100;
    const REPAIR_COORD_THRESHOLD = 2000;
    const REPAIR_COORD_PERCENT = 0.10;
    const HOA_MONTHLY = 240;
    const HOA_ONETIME = 150;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // --- Helper Functions ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getAbsoluteMonth = (month, year) => (year * 12) + (month - 1);

    const getRelativeMonthIndex = (targetMonth, targetYear) => {
        const startAbs = getAbsoluteMonth(analysisStartMonth, analysisStartYear);
        const targetAbs = getAbsoluteMonth(targetMonth, targetYear);
        return targetAbs - startAbs + 1;
    };

    const getDateFromRelativeIndex = (index) => {
        const startAbs = getAbsoluteMonth(analysisStartMonth, analysisStartYear);
        const targetAbs = startAbs + (index - 1);
        const year = Math.floor(targetAbs / 12);
        const month = (targetAbs % 12) + 1;
        return { month, year };
    };

    const getDateLabel = (index) => {
        const { month, year } = getDateFromRelativeIndex(index + 1);
        return `${monthNames[month - 1].substring(0, 3)} '${String(year).substring(2)}`;
    };

    const getFullDateLabel = (index) => {
        const { month, year } = getDateFromRelativeIndex(index + 1);
        return `${monthNames[month - 1]} ${year}`;
    };

    // --- Tooltip Handler ---
    const handleMouseEnter = (e, content) => {
        if (!content) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            x: rect.left + (rect.width / 2),
            y: rect.top - 10,
            content
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    // --- Lease Management Handlers ---
    const addRenewal = () => {
        const lastSegment = leaseSegments[leaseSegments.length - 1];
        const newStart = lastSegment.startMonth + lastSegment.duration;
        // Default renewal rent to previous rent
        const newSegment = {
            id: Date.now(),
            type: 'renewal',
            startMonth: newStart,
            duration: 12,
            marketingFee: false,
            rent: lastSegment.rent,
            moveOutCosts: 0,
            moveOutDetails: { cleaning: 0, carpet: 0, rekey: 0, other: 0 }
        };
        setLeaseSegments([...leaseSegments, newSegment]);
        setIsDirty(true);
    };

    const addNewTenant = () => {
        const lastSegment = leaseSegments[leaseSegments.length - 1];
        const newStart = lastSegment.startMonth + lastSegment.duration + 1;
        // Use last segment rent as default, or 2500 if none
        const defaultRent = lastSegment ? lastSegment.rent : 2500;

        const newSegment = {
            id: Date.now(),
            type: 'new',
            startMonth: newStart,
            duration: 12,
            marketingFee: true,
            rent: defaultRent,
            moveOutCosts: 550,
            moveOutDetails: { cleaning: 250, carpet: 200, rekey: 100, other: 0 }
        };
        setLeaseSegments([...leaseSegments, newSegment]);
        setIsDirty(true);
    };

    const removeSegment = (id) => {
        if (leaseSegments.length > 1) {
            setLeaseSegments(leaseSegments.filter(s => s.id !== id));
            setIsDirty(true);
        }
    };

    const updateSegment = (id, field, value) => {
        setLeaseSegments(leaseSegments.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
        setIsDirty(true);
    };

    const updateSegmentDate = (id, newMonth, newYear) => {
        const newRelativeStart = getRelativeMonthIndex(newMonth, newYear);
        if (newRelativeStart < 1) return;
        updateSegment(id, 'startMonth', newRelativeStart);
    };

    // --- Modal Handlers ---
    const openRepairModal = (monthIndex) => {
        const existing = monthlyRepairs[monthIndex] || { amount: '', note: '' };
        setModalConfig({ isOpen: true, type: 'repair', monthIndex, amount: existing.amount, note: existing.note });
    };

    const openUtilityModal = (monthIndex, currentVal) => {
        const existingOverride = utilityOverrides[monthIndex];
        setModalConfig({ isOpen: true, type: 'utility', monthIndex, amount: existingOverride !== undefined ? existingOverride : currentVal, note: '' });
    };

    const openMortgageModal = (monthIndex, currentVal) => {
        setModalConfig({ isOpen: true, type: 'mortgage', monthIndex, amount: currentVal, note: '' });
    };

    const openMoveOutModal = (segment) => {
        setModalConfig({
            isOpen: true,
            type: 'moveOut',
            segmentId: segment.id,
            amount: segment.moveOutCosts,
            details: segment.moveOutDetails || { cleaning: 0, carpet: 0, rekey: 0, other: 0 }
        });
    };

    const saveModalData = () => {
        if (modalConfig.type === 'moveOut') {
            // Sum up details for total
            const details = modalConfig.details;
            const total = (parseFloat(details.cleaning) || 0) + (parseFloat(details.carpet) || 0) + (parseFloat(details.rekey) || 0) + (parseFloat(details.other) || 0);

            const updatedSegments = leaseSegments.map(s => {
                if (s.id === modalConfig.segmentId) {
                    return { ...s, moveOutCosts: total, moveOutDetails: details };
                }
                return s;
            });
            setLeaseSegments(updatedSegments);
        } else {
            // Existing logic for Monthly Overrides
            const amount = parseFloat(modalConfig.amount);
            const idx = modalConfig.monthIndex;

            if (!isNaN(amount) && amount >= 0) {
                if (modalConfig.type === 'repair') {
                    const newRepairs = { ...monthlyRepairs };
                    if (amount === 0) delete newRepairs[idx];
                    else newRepairs[idx] = { amount, note: modalConfig.note };
                    setMonthlyRepairs(newRepairs);
                } else if (modalConfig.type === 'utility') {
                    const newOverrides = { ...utilityOverrides };
                    newOverrides[idx] = amount;
                    setUtilityOverrides(newOverrides);
                } else if (modalConfig.type === 'mortgage') {
                    const newUpdates = { ...mortgageUpdates };
                    newUpdates[idx] = amount;
                    setMortgageUpdates(newUpdates);
                }
            }
        }
        setModalConfig({ ...modalConfig, isOpen: false });
        setIsDirty(true);
    };

    const updateMoveOutDetail = (key, value) => {
        const val = parseFloat(value);
        setModalConfig(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [key]: isNaN(val) ? 0 : val
            }
        }));
    };

    // --- Engine: Generate Data ---
    const generateTimelineData = () => {
        const totalMonths = forecastYears * 12;
        const data = [];
        let totalExpenses = 0;
        let totalIncome = 0;
        let totalMortgage = 0;

        // Track current mortgage across iterations
        let currentMortgage = initialMortgage;

        for (let i = 1; i <= totalMonths; i++) {
            const monthIndex = i - 1;
            const dateLabel = getDateLabel(monthIndex);
            const analysisYear = Math.floor(monthIndex / 12) + 1;

            // Check for mortgage update
            if (mortgageUpdates[monthIndex] !== undefined) {
                currentMortgage = mortgageUpdates[monthIndex];
            }

            // Find Active Lease
            const activeSegment = leaseSegments.find(s => i >= s.startMonth && i < (s.startMonth + s.duration));
            const isOccupied = !!activeSegment;
            const isLeaseStart = activeSegment && i === activeSegment.startMonth;
            const isLeaseEnd = activeSegment && i === (activeSegment.startMonth + activeSegment.duration - 1);

            // Check for Move-out Fees (Applied to the month AFTER lease ends)
            // Find any segment that ended in the previous month (i-1)
            const endedSegment = leaseSegments.find(s => (s.startMonth + s.duration) === i);

            // --- Income ---
            // Use Segment-specific Rent
            let rent = isOccupied ? activeSegment.rent : 0;

            // --- Expenses ---
            let mgmtFee = isOccupied ? (activeSegment.rent * MANAGEMENT_FEE_PERCENT) : 0;
            let leasingFee = 0;
            let renewalFee = 0;
            let marketingFee = 0;

            if (isLeaseStart) {
                if (activeSegment.type === 'new') {
                    leasingFee = activeSegment.rent * LEASING_FEE_PERCENT;
                    if (activeSegment.marketingFee) marketingFee = MARKETING_FEE;
                } else if (activeSegment.type === 'renewal') {
                    renewalFee = activeSegment.rent * RENEWAL_FEE_PERCENT;
                }
            }

            // Move Out Costs
            let moveOutCost = endedSegment ? (endedSegment.moveOutCosts || 0) : 0;

            // HOA & Utilities
            let hoaOneTime = (i === 1) ? HOA_ONETIME : 0;
            let hoaMonthly = HOA_MONTHLY;

            const utilOverride = utilityOverrides[monthIndex];
            let utilCost = 0;
            if (utilOverride !== undefined) {
                utilCost = utilOverride;
            } else {
                utilCost = !isOccupied ? vacancyUtilities : 0;
            }

            let surveyFee = isLeaseEnd ? MAINTENANCE_SURVEY_FEE : 0;

            // Repairs
            const repairEntry = monthlyRepairs[monthIndex];
            let repairCost = repairEntry ? repairEntry.amount : 0;
            let repairNote = repairEntry ? repairEntry.note : '';
            let coordFee = repairCost > REPAIR_COORD_THRESHOLD ? repairCost * REPAIR_COORD_PERCENT : 0;

            // Totals
            let monthlyOperatingExpense = mgmtFee + leasingFee + renewalFee + marketingFee + hoaMonthly + hoaOneTime + utilCost + surveyFee + repairCost + coordFee + moveOutCost;
            let monthlyMortgage = currentMortgage;

            totalIncome += rent;
            totalExpenses += monthlyOperatingExpense;
            totalMortgage += monthlyMortgage;

            // Tooltip Generators
            const mgmtTooltip = isOccupied ? {
                title: "Management Fee",
                lines: [`10% of Rent (${formatCurrency(activeSegment.rent)})`]
            } : null;

            const oneTimeTooltip = (leasingFee + renewalFee + marketingFee + surveyFee + moveOutCost) > 0 ? {
                title: "One-Time Fees",
                lines: [
                    leasingFee > 0 && `Leasing Fee (50%): ${formatCurrency(leasingFee)}`,
                    marketingFee > 0 && `Marketing/Photo Fee: ${formatCurrency(marketingFee)}`,
                    renewalFee > 0 && `Renewal Fee (10%): ${formatCurrency(renewalFee)}`,
                    surveyFee > 0 && `Maint. Survey: ${formatCurrency(surveyFee)}`,
                    moveOutCost > 0 && `Move-Out Exp: ${formatCurrency(moveOutCost)}`
                ].filter(Boolean)
            } : null;

            const utilTooltip = {
                title: "HOA & Utilities",
                lines: [
                    `HOA Dues: ${formatCurrency(hoaMonthly)}`,
                    hoaOneTime > 0 && `HOA Setup Fee: ${formatCurrency(hoaOneTime)}`,
                    utilOverride !== undefined
                        ? `Utilities (Manual Override): ${formatCurrency(utilCost)}`
                        : (isOccupied ? "Tenant Pays Utilities" : `Vacancy Utilities: ${formatCurrency(utilCost)}`)
                ]
            };

            data.push({
                dateLabel,
                analysisYear,
                monthIndex,
                isOccupied,
                segmentType: activeSegment ? activeSegment.type : null,
                rent,
                expenses: {
                    mgmt: mgmtFee,
                    leasing: leasingFee,
                    renewal: renewalFee,
                    marketing: marketingFee,
                    hoa: hoaMonthly + hoaOneTime,
                    util: utilCost,
                    survey: surveyFee,
                    repair: repairCost,
                    coord: coordFee,
                    repairNote,
                    moveOut: moveOutCost
                },
                tooltips: {
                    mgmt: mgmtTooltip,
                    oneTime: oneTimeTooltip,
                    util: utilTooltip
                },
                mortgage: monthlyMortgage,
                trueNet: rent - monthlyOperatingExpense - monthlyMortgage
            });
        }
        return { data, totalIncome, totalExpenses, totalMortgage };
    };

    const { data: timelineData, totalIncome, totalExpenses, totalMortgage } = generateTimelineData();
    const trueCashFlow = totalIncome - totalExpenses - totalMortgage;

    // --- Session Management ---
    const getCurrentState = () => ({
        initialMortgage,
        vacancyUtilities,
        forecastYears,
        analysisStartMonth,
        analysisStartYear,
        leaseSegments,
        monthlyRepairs,
        utilityOverrides,
        mortgageUpdates
    });

    const loadState = (data) => {
        if (data.initialMortgage !== undefined) setInitialMortgage(data.initialMortgage);
        if (data.vacancyUtilities !== undefined) setVacancyUtilities(data.vacancyUtilities);
        if (data.forecastYears !== undefined) setForecastYears(data.forecastYears);
        if (data.analysisStartMonth !== undefined) setAnalysisStartMonth(data.analysisStartMonth);
        if (data.analysisStartYear !== undefined) setAnalysisStartYear(data.analysisStartYear);
        if (data.leaseSegments !== undefined) setLeaseSegments(data.leaseSegments);
        if (data.monthlyRepairs !== undefined) setMonthlyRepairs(data.monthlyRepairs);
        if (data.utilityOverrides !== undefined) setUtilityOverrides(data.utilityOverrides);
        if (data.mortgageUpdates !== undefined) setMortgageUpdates(data.mortgageUpdates);

        setIsDirty(false);
    };

    return (
        <div className="min-h-screen font-sans text-slate-800 relative" style={{ backgroundImage: 'url(/gradient-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

            {/* --- Session Manager --- */}
            <UserSessionManager
                currentData={getCurrentState()}
                onLoad={loadState}
                isDirty={isDirty}
                user={user}
                onLogin={login}
                onLogout={handleLogout}
            />

            {/* --- Guest Mode Banner --- */}
            {!user && showGuestBanner && !hasLoggedOut && (
                <GuestBanner
                    onLogin={login}
                    onDismiss={() => setShowGuestBanner(false)}
                />
            )}

            {hasLoggedOut ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">You have logged out</h2>
                        <p className="text-slate-600 mb-6">
                            Thank you for using the Rental Expense Forecaster. Your session has ended.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" /> Refresh to Start New Session
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">

                    {/* --- Header --- */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{forecastYears}-Year Rental Forecast</h1>
                        <p className="text-slate-600">Simulate your cash flow starting from {monthNames[analysisStartMonth - 1]} {analysisStartYear}.</p>
                    </div>

                    {/* --- Analysis Settings --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Analysis Start Date
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={analysisStartMonth}
                                    onChange={(e) => { setAnalysisStartMonth(Number(e.target.value)); setIsDirty(true); }}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    {monthNames.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={analysisStartYear}
                                    onChange={(e) => { setAnalysisStartYear(Number(e.target.value)); setIsDirty(true); }}
                                    className="w-24 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Year"
                                />
                            </div>
                        </div>

                        {/* Mortgage & Duration Only Now */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Home className="w-4 h-4" /> Base Mortgage
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input type="number" value={initialMortgage} onChange={(e) => { setInitialMortgage(Number(e.target.value)); setIsDirty(true); }}
                                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Forecast Duration
                            </label>
                            <div className="relative">
                                <input type="number" min="1" max="10" value={forecastYears} onChange={(e) => { setForecastYears(Math.max(1, Math.min(10, parseInt(e.target.value) || 1))); setIsDirty(true); }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Years</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Base Vacancy Utils
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input type="number" value={vacancyUtilities} onChange={(e) => { setVacancyUtilities(Number(e.target.value)); setIsDirty(true); }}
                                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* --- Lease Timeline Editor --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" /> Lease Configuration
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={addRenewal} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200">
                                    <RefreshCw className="w-4 h-4" /> Add Renewal
                                </button>
                                <button onClick={addNewTenant} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                                    <UserPlus className="w-4 h-4" /> New Tenant
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {leaseSegments.map((segment, index) => {
                                const { month: startMo, year: startYr } = getDateFromRelativeIndex(segment.startMonth);
                                const { month: endMo, year: endYr } = getDateFromRelativeIndex(segment.startMonth + segment.duration - 1);
                                const prevSegment = index > 0 ? leaseSegments[index - 1] : null;
                                const prevEnd = prevSegment ? (prevSegment.startMonth + prevSegment.duration - 1) : 0;
                                const gapMonths = segment.startMonth - prevEnd - 1;
                                const hasGap = gapMonths > 0;
                                const showMarketingToggle = segment.type === 'new' && hasGap;

                                return (
                                    <div key={segment.id} className={`relative p-4 rounded-lg border border-l-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between transition-all
                      ${segment.type === 'new' ? 'bg-blue-50/50 border-blue-500' : 'bg-emerald-50/50 border-emerald-500'}`}>

                                        {/* Left: Type & Dates */}
                                        <div className="flex items-center gap-3 min-w-[200px]">
                                            <div className={`p-2 rounded-full ${segment.type === 'new' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {segment.type === 'new' ? <UserPlus className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{segment.type === 'new' ? 'New Tenant Lease' : 'Lease Renewal'}</p>
                                                <p className="text-xs text-slate-500">
                                                    {startMo}/{startYr} — {endMo}/{endYr}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Middle: Controls */}
                                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto flex-1">
                                            <div className="flex gap-2 items-end">
                                                <div className="w-24">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Start Month</label>
                                                    <select value={startMo} onChange={(e) => updateSegmentDate(segment.id, Number(e.target.value), startYr)}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm bg-white">
                                                        {monthNames.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                                                    </select>
                                                </div>
                                                <div className="w-16">
                                                    <input type="number" value={startYr} onChange={(e) => updateSegmentDate(segment.id, startMo, Number(e.target.value))}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col w-20">
                                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Duration (Mo)</label>
                                                <input type="number" min="1" max={forecastYears * 12} value={segment.duration} onChange={(e) => updateSegment(segment.id, 'duration', Number(e.target.value))}
                                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-sm w-full" />
                                            </div>

                                            <div className="flex flex-col w-24">
                                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Monthly Rent</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                    <input type="number" value={segment.rent} onChange={(e) => updateSegment(segment.id, 'rent', Number(e.target.value))}
                                                        className="bg-white border border-slate-300 rounded px-2 py-1 text-sm w-full pl-5" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col w-28">
                                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1" title="Fees for cleaning, re-keying etc.">Move-Out Est.</label>
                                                <button
                                                    onClick={() => openMoveOutModal(segment)}
                                                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm bg-white text-left flex items-center justify-between hover:bg-slate-50"
                                                >
                                                    <span className="text-slate-700 font-medium">{formatCurrency(segment.moveOutCosts)}</span>
                                                    <Edit2 className="w-3 h-3 text-slate-400" />
                                                </button>
                                            </div>

                                            {showMarketingToggle && (
                                                <div className="flex flex-col w-24">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1">
                                                        <Camera className="w-3 h-3" /> Photo Fee
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                                        <input type="checkbox" checked={segment.marketingFee} onChange={(e) => updateSegment(segment.id, 'marketingFee', e.target.checked)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                        <span className="text-xs text-slate-600">Add $150</span>
                                                    </label>
                                                </div>
                                            )}

                                            {leaseSegments.length > 1 && (
                                                <button onClick={() => removeSegment(segment.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors ml-auto lg:ml-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* --- Dynamic Summary --- */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{forecastYears}-Year Gross Income</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{forecastYears}-Year Expenses</p>
                            <p className="text-2xl font-bold text-red-500 mt-2">{formatCurrency(totalExpenses)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{forecastYears}-Year Mortgage</p>
                            <p className="text-2xl font-bold text-slate-600 mt-2">{formatCurrency(totalMortgage)}</p>
                        </div>
                        <div className={`p-5 rounded-xl shadow-sm text-white ${trueCashFlow >= 0 ? 'bg-blue-600' : 'bg-rose-600'}`}>
                            <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold">{forecastYears}-Year Net Cash Flow</p>
                            <p className="text-2xl font-bold mt-2">{formatCurrency(trueCashFlow)}</p>
                        </div>
                    </div>

                    {/* --- Monthly Breakdown Table --- */}
                    <div className="rounded-xl shadow-sm border border-slate-200 overflow-hidden relative" style={{ backgroundImage: 'url(/mountain-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>
                        <div className="p-6 border-b border-slate-100 relative z-10">
                            <h2 className="text-lg font-bold text-slate-800">Monthly Breakdown ({forecastYears * 12} Months)</h2>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative z-10">
                            <table className="w-full text-sm text-left relative">
                                <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-4">Date</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Rent</th>
                                        <th className="px-4 py-4">Mgmt Fees</th>
                                        <th className="px-4 py-4">HOA/Util</th>
                                        <th className="px-4 py-4 w-48">Repairs/Move-Out</th>
                                        <th className="px-4 py-4 text-slate-400">Mortgage</th>
                                        <th className="px-4 py-4 text-right">True Net</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {timelineData.map((row, index) => {
                                        const oneTimeFees = row.expenses.leasing + row.expenses.marketing + row.expenses.survey + row.expenses.renewal + row.expenses.moveOut;
                                        const totalMgmt = row.expenses.mgmt + oneTimeFees;
                                        const totalUtil = row.expenses.hoa + row.expenses.util;
                                        const isNewYear = index > 0 && row.analysisYear !== timelineData[index - 1].analysisYear;

                                        return (
                                            <React.Fragment key={index}>
                                                {isNewYear && (
                                                    <tr className="bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest">
                                                        <td colSpan="8" className="px-4 py-2 text-center">Analysis Year {row.analysisYear}</td>
                                                    </tr>
                                                )}
                                                <tr className={`hover:bg-slate-50 transition-colors ${!row.isOccupied ? 'bg-rose-50/30' : ''}`}>
                                                    <td className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap">{row.dateLabel}</td>
                                                    <td className="px-4 py-4">
                                                        {row.isOccupied ? (
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${row.segmentType === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {row.segmentType === 'new' ? 'Leased' : 'Renewed'}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">Vacant</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-emerald-600">{row.rent > 0 ? formatCurrency(row.rent) : '-'}</td>

                                                    {/* Mgmt Fee Cell with Tooltip */}
                                                    <td
                                                        className="px-4 py-4 text-slate-600 cursor-help border-b border-transparent hover:border-slate-300 border-dashed transition-colors relative group"
                                                        onMouseEnter={(e) => {
                                                            if (totalMgmt > 0) {
                                                                const content = row.tooltips.mgmt || row.tooltips.oneTime ? {
                                                                    title: "Fee Breakdown",
                                                                    lines: [
                                                                        ...(row.tooltips.mgmt?.lines || []),
                                                                        ...(row.tooltips.oneTime?.lines || [])
                                                                    ]
                                                                } : null;
                                                                handleMouseEnter(e, content);
                                                            }
                                                        }}
                                                        onMouseLeave={handleMouseLeave}
                                                    >
                                                        {totalMgmt > 0 ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{formatCurrency(totalMgmt)}</span>
                                                                {oneTimeFees > 0 && (
                                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                        <Info className="w-3 h-3" /> Includes One-Time
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : '-'}
                                                    </td>

                                                    {/* HOA/Util Cell with Edit */}
                                                    <td
                                                        className="px-4 py-4 text-slate-600 group/cell relative"
                                                        onMouseEnter={(e) => handleMouseEnter(e, row.tooltips.util)}
                                                        onMouseLeave={handleMouseLeave}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <span>{formatCurrency(totalUtil)}</span>
                                                                {row.expenses.util > 0 && (
                                                                    <span className={`text-[10px] ${!row.isOccupied ? 'text-rose-400' : 'text-slate-400'}`}>
                                                                        {formatCurrency(row.expenses.util)} Utils
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => openUtilityModal(row.monthIndex, row.expenses.util)}
                                                                className="opacity-0 group-hover/cell:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                                                title="Edit Monthly Utility Cost"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Repairs Column */}
                                                    <td className="px-4 py-4 text-slate-600">
                                                        <div className="flex items-center justify-between group">
                                                            <div className="flex flex-col">
                                                                {row.expenses.repair > 0 || row.expenses.moveOut > 0 ? (
                                                                    <>
                                                                        <span className="font-medium text-amber-700">{formatCurrency(row.expenses.repair + row.expenses.coord + row.expenses.moveOut)}</span>
                                                                        {row.expenses.coord > 0 && <span className="text-[10px] text-amber-600 block">Incl. 10% Coord Fee</span>}
                                                                        {row.expenses.moveOut > 0 && <span className="text-[10px] text-amber-600 flex items-center gap-1"><LogOut className="w-3 h-3" /> Move-Out Exp</span>}
                                                                    </>
                                                                ) : '-'}
                                                            </div>
                                                            <button
                                                                onClick={() => openRepairModal(row.monthIndex)}
                                                                className={`p-1 rounded-full hover:bg-blue-100 transition-colors ${row.expenses.repair > 0 ? 'text-blue-500' : 'text-slate-400 hover:text-blue-600'}`}
                                                                title="Add/Edit Repair"
                                                            >
                                                                {row.expenses.repair > 0 ? <Wrench className="w-3 h-3" /> : <Plus className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Mortgage Column with Edit */}
                                                    <td className="px-4 py-4 text-slate-400 text-xs group/mortgage relative">
                                                        <div className="flex items-center justify-between">
                                                            <span>{formatCurrency(row.mortgage)}</span>
                                                            <button
                                                                onClick={() => openMortgageModal(row.monthIndex, row.mortgage)}
                                                                className="opacity-0 group-hover/mortgage:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                                                title="Update Base Mortgage"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    <td className={`px-4 py-4 text-right font-bold ${row.trueNet >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                                        {formatCurrency(row.trueNet)}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Global Tooltip Overlay */}
                        {tooltip && (
                            <div
                                className="fixed z-50 bg-slate-900 text-white px-3 py-2 rounded shadow-xl text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px] animate-in fade-in duration-150"
                                style={{ top: tooltip.y, left: tooltip.x, minWidth: '180px' }}
                            >
                                <div className="font-bold mb-1 border-b border-slate-700 pb-1 text-slate-300">{tooltip.content.title}</div>
                                {tooltip.content.lines.map((line, i) => (
                                    <div key={i} className="py-0.5">{line}</div>
                                ))}
                                <div className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                            </div>
                        )}
                    </div>


                    {/* --- Generic Edit Modal --- */}
                    {modalConfig.isOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">
                                        {modalConfig.type === 'repair' && 'Add Repair Expense'}
                                        {modalConfig.type === 'utility' && 'Edit Utilities'}
                                        {modalConfig.type === 'mortgage' && 'Update Base Mortgage'}
                                        {modalConfig.type === 'moveOut' && 'Estimated Turnover Costs'}
                                        {modalConfig.type !== 'moveOut' && <span className="block text-xs text-slate-500 font-normal mt-1">{getFullDateLabel(modalConfig.monthIndex)}</span>}
                                    </h3>
                                    <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">

                                    {/* --- Move Out Cost Breakdown Modal --- */}
                                    {modalConfig.type === 'moveOut' ? (
                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-600 mb-4">
                                                Select anticipated costs for preparing the property for the next tenant.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 p-2 rounded text-blue-600"><CheckSquare className="w-4 h-4" /></div>
                                                    <div className="flex-1">
                                                        <label className="text-sm font-medium text-slate-700">Professional Cleaning</label>
                                                    </div>
                                                    <div className="w-28 relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                        <input type="number" value={modalConfig.details.cleaning} onChange={(e) => updateMoveOutDetail('cleaning', e.target.value)}
                                                            className="w-full pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right" placeholder="0" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 p-2 rounded text-blue-600"><CheckSquare className="w-4 h-4" /></div>
                                                    <div className="flex-1">
                                                        <label className="text-sm font-medium text-slate-700">Carpet Cleaning</label>
                                                    </div>
                                                    <div className="w-28 relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                        <input type="number" value={modalConfig.details.carpet} onChange={(e) => updateMoveOutDetail('carpet', e.target.value)}
                                                            className="w-full pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right" placeholder="0" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 p-2 rounded text-blue-600"><Key className="w-4 h-4" /></div>
                                                    <div className="flex-1">
                                                        <label className="text-sm font-medium text-slate-700">Re-Keying</label>
                                                    </div>
                                                    <div className="w-28 relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                        <input type="number" value={modalConfig.details.rekey} onChange={(e) => updateMoveOutDetail('rekey', e.target.value)}
                                                            className="w-full pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right" placeholder="0" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 p-2 rounded text-blue-600"><Wrench className="w-4 h-4" /></div>
                                                    <div className="flex-1">
                                                        <label className="text-sm font-medium text-slate-700">General Repairs</label>
                                                    </div>
                                                    <div className="w-28 relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                        <input type="number" value={modalConfig.details.other} onChange={(e) => updateMoveOutDetail('other', e.target.value)}
                                                            className="w-full pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right" placeholder="0" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* --- Generic Input Modal --- */
                                        <>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-slate-700">Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                    <input
                                                        type="number"
                                                        value={modalConfig.amount}
                                                        onChange={(e) => setModalConfig({ ...modalConfig, amount: e.target.value })}
                                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="0.00"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            {modalConfig.type === 'repair' && (
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-slate-700">Description</label>
                                                    <textarea
                                                        value={modalConfig.note}
                                                        onChange={(e) => setModalConfig({ ...modalConfig, note: e.target.value })}
                                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                                        placeholder="e.g., Water Heater Repair"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveModalData}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RentalCalculator;

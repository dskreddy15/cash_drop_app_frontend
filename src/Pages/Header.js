import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";

// Color constants
const COLORS = {
  magenta: '#AA056C',
  yellowGreen: '#48BB78',
  lightPink: '#F46690',
  gray: '#64748B'
};

function Header() {
    const navigate = useNavigate();
    const [statusMessage, setStatusMessage] = useState({ show: false, text: '', type: 'info' });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Check authentication status on mount and periodically
    useEffect(() => {
        const checkAuthStatus = () => {
            const token = sessionStorage.getItem('access_token');
            const isAdmin = sessionStorage.getItem('is_admin') === 'true';
            setIsAuthenticated(!!token);
            setIsAdmin(isAdmin);
        };
        
        checkAuthStatus();
        // Check every 30 seconds
        const interval = setInterval(checkAuthStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const showStatusMessage = (text, type = 'info') => {
        setStatusMessage({ show: true, text, type });
        setTimeout(() => setStatusMessage({ show: false, text: '', type: 'info' }), 5000);
    };

    const handleLogout = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.LOGOUT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
                },
            });
            // Clear sessionStorage regardless of response
            sessionStorage.clear();
            setIsAuthenticated(false);
            setIsAdmin(false);
            navigate('/login');
            showStatusMessage("Logout Successful", 'success');
        } catch (error) {
            console.error("Error during logout:", error);
            // Still clear and navigate on error
            sessionStorage.clear();
            setIsAuthenticated(false);
            setIsAdmin(false);
            navigate('/login');
        }
    };

    const handleLinkClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <>
            {/* Status Message */}
            {statusMessage.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    statusMessage.type === 'error' ? 'bg-red-100 border-l-4 border-red-500' : 
                    statusMessage.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' : 
                    'bg-blue-100 border-l-4 border-blue-500'
                }`} style={{ fontFamily: 'Calibri, Verdana, sans-serif' }}>
                    <p className={`font-bold ${statusMessage.type === 'error' ? 'text-red-700' : statusMessage.type === 'success' ? 'text-green-700' : 'text-blue-700'}`} style={{ fontSize: '14px' }}>
                        {statusMessage.text}
                    </p>
                </div>
            )}

            <div className="bg-gray-100 rounded-md p-2" style={{ fontFamily: 'Calibri, Verdana, sans-serif' }}>
                {/* Desktop Navigation */}
                <nav className="hidden md:block text-center font-bold mb-2" style={{ fontSize: '24px', color: COLORS.magenta }}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/cash-drop" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Cash Drop</Link>
                            <Link to="/cd-dashboard" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Cash Drop Dashboard</Link>
                            {isAdmin && (
                                <Link to="/dashboard" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Admin Dashboard</Link>
                            )}
                            {isAdmin && (
                                <Link to="/cd-validation" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Cash Drop Validation</Link>
                            )}
                            {isAdmin && (
                                <Link to="/bank-drop" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Bank Drop</Link>
                            )}
                            <button onClick={handleLogout} className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Login</Link>
                            <Link to="/cash-drop" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Cash Drop</Link>
                            <Link to="/cd-dashboard" className="m-3 p-3 transition hover:underline" style={{ color: COLORS.magenta, fontSize: '18px' }}>Cash Drop Dashboard</Link>
                        </>
                    )}
                </nav>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-md transition"
                            style={{ color: COLORS.magenta }}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                        <span className="font-bold" style={{ fontSize: '18px', color: COLORS.magenta }}>Menu</span>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {mobileMenuOpen && (
                        <div className="mt-4 space-y-2 border-t pt-2" style={{ borderColor: COLORS.gray + '40' }}>
                            {isAuthenticated ? (
                                <>
                                    <Link 
                                        to="/cash-drop" 
                                        onClick={handleLinkClick}
                                        className="block p-3 rounded transition hover:bg-gray-200" 
                                        style={{ color: COLORS.magenta, fontSize: '16px' }}
                                    >
                                        Cash Drop
                                    </Link>
                                    <Link 
                                        to="/cd-dashboard" 
                                        onClick={handleLinkClick}
                                        className="block p-3 rounded transition hover:bg-gray-200" 
                                        style={{ color: COLORS.magenta, fontSize: '16px' }}
                                    >
                                        Cash Drop Dashboard
                                    </Link>
                                    {isAdmin && (
                                        <Link 
                                            to="/dashboard" 
                                            onClick={handleLinkClick}
                                            className="block p-3 rounded transition hover:bg-gray-200" 
                                            style={{ color: COLORS.magenta, fontSize: '16px' }}
                                        >
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <Link 
                                            to="/cd-validation" 
                                            onClick={handleLinkClick}
                                            className="block p-3 rounded transition hover:bg-gray-200" 
                                            style={{ color: COLORS.magenta, fontSize: '16px' }}
                                        >
                                            Cash Drop Validation
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <Link 
                                            to="/bank-drop" 
                                            onClick={handleLinkClick}
                                            className="block p-3 rounded transition hover:bg-gray-200" 
                                            style={{ color: COLORS.magenta, fontSize: '16px' }}
                                        >
                                            Bank Drop
                                        </Link>
                                    )}
                                    <button 
                                        onClick={() => {
                                            handleLogout();
                                            handleLinkClick();
                                        }} 
                                        className="block w-full text-left p-3 rounded transition hover:bg-gray-200" 
                                        style={{ color: COLORS.magenta, fontSize: '16px' }}
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link 
                                        to="/login" 
                                        onClick={handleLinkClick}
                                        className="block p-3 rounded transition hover:bg-gray-200" 
                                        style={{ color: COLORS.magenta, fontSize: '16px' }}
                                    >
                                        Login
                                    </Link>
                                    <Link 
                                        to="/cash-drop" 
                                        onClick={handleLinkClick}
                                        className="block p-3 rounded transition hover:bg-gray-200" 
                                        style={{ color: COLORS.magenta, fontSize: '16px' }}
                                    >
                                        Cash Drop
                                    </Link>
                                    <Link 
                                        to="/cd-dashboard" 
                                        onClick={handleLinkClick}
                                        className="block p-3 rounded transition hover:bg-gray-200" 
                                        style={{ color: COLORS.magenta, fontSize: '16px' }}
                                    >
                                        Cash Drop Dashboard
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Header;

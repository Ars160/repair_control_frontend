import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const Header = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isManager = user?.role === 'PM' || user?.role === 'SUPER_ADMIN';

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, label, mobile = false }) => (
        <Link
            to={to}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={`
                ${mobile
                    ? 'block px-4 py-3 text-base font-medium rounded-lg transition-colors'
                    : 'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200'
                }
                ${isActive(to)
                    ? (mobile ? 'bg-blue-50 text-blue-700' : 'text-blue-700 bg-blue-50')
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                }
            `}
        >
            {label}
        </Link>
    );

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo & Desktop Nav */}
                    <div className="flex">
                        <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                            <img className="h-14 w-auto" src="/logo.png" alt="Bauberg" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:ml-10 md:flex md:items-center md:space-x-4">
                            {/* Common Links */}
                            <NavItem to="/dashboard" label="Обзор" />

                            {/* Manager Only Links */}
                            {isManager && (
                                <>
                                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                                    <NavItem to="/analytics" label="Аналитика" />
                                    <NavItem to="/drafts" label="Черновики" />
                                    <NavItem to="/users" label="Сотрудники" />
                                </>
                            )}

                            {/* Estimator Only Links */}
                            {user?.role === 'ESTIMATOR' && (
                                <>
                                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                                    <NavItem to="/templates/works" label="Виды работ" />
                                    <NavItem to="/templates/checklists" label="Чеклисты" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Side: User Profile & Mobile Toggle */}
                    <div className="flex items-center gap-3">
                        <NotificationBell />

                        {/* User Profile (Desktop) */}
                        <Link to="/profile" className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 hover:bg-slate-50 rounded-lg transition-colors p-2">
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">{user?.fullName}</div>
                                <div className="text-[10px] font-medium text-slate-500 uppercase">{user?.role}</div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold shadow-sm">
                                {user?.fullName?.charAt(0)}
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            className="hidden md:block p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                            title="Выйти"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </button>

                        {/* Mobile: Worker View (Simple Profile, No Menu) */}
                        {(!isManager && user?.role !== 'ESTIMATOR') && (
                            <div className="md:hidden flex items-center gap-3">
                                <Link to="/profile" className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold shadow-sm text-sm">
                                    {user?.fullName?.charAt(0)}
                                </Link>
                                <button
                                    onClick={logout}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 focus:outline-none"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                </button>
                            </div>
                        )}

                        {/* Mobile: Hamburger Menu (Managers & Estimators) */}
                        {(isManager || user?.role === 'ESTIMATOR') && (
                            <div className="flex items-center md:hidden ml-1 border-l border-slate-200 pl-2">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-blue-700 hover:bg-slate-100 focus:outline-none transition-colors"
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {/* Icon menu */}
                                    <svg
                                        className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    {/* Icon close */}
                                    <svg
                                        className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {(isManager || user?.role === 'ESTIMATOR') && (
                <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white border-b border-slate-200 shadow-lg absolute w-full top-16 left-0 z-50 flex flex-col`}>

                    {/* Navigation Links */}
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavItem to="/dashboard" label="Обзор" mobile={true} />

                        {isManager && (
                            <>
                                <div className="h-px bg-slate-100 my-2 mx-4"></div>
                                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Управление</p>
                                <NavItem to="/analytics" label="Аналитика" mobile={true} />
                                <NavItem to="/drafts" label="Черновики" mobile={true} />
                                <NavItem to="/users" label="Сотрудники" mobile={true} />
                            </>
                        )}

                        {user?.role === 'ESTIMATOR' && (
                            <>
                                <div className="h-px bg-slate-100 my-2 mx-4"></div>
                                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Шаблоны</p>
                                <NavItem to="/templates/works" label="Виды работ" mobile={true} />
                                <NavItem to="/templates/checklists" label="Чеклисты" mobile={true} />
                            </>
                        )}
                    </div>

                    {/* Profile Section (At Bottom) */}
                    <div className="bg-slate-50 border-t border-slate-100 px-4 py-4 mt-auto">
                        <div className="flex items-center justify-between">
                            <Link to="/profile" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                                <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {user?.fullName?.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-slate-800 leading-none">{user?.fullName}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide">{user?.role}</div>
                                </div>
                            </Link>
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors bg-white shadow-sm border border-slate-200"
                                title="Выйти"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;

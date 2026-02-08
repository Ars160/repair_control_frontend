import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Sidebar = ({ isOpen, onClose, isCollapsed, toggleCollapse }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isManager = user.role === 'PM' || user.role === 'SUPER_ADMIN';

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon, label }) => (
        <Link
            to={to}
            onClick={onClose} // Close sidebar on mobile when link is clicked
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                ${isActive(to)
                    ? 'bg-bauberg-blue text-white shadow-md shadow-blue-900/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-bauberg-blue'
                }
                ${isCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isCollapsed ? label : ''}
        >
            <div className={`${isActive(to) ? 'text-white' : 'text-slate-400 group-hover:text-bauberg-blue'}`}>
                {icon}
            </div>
            {!isCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                    {label}
                </div>
            )}
        </Link>
    );

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div
                className={`fixed top-0 left-0 bottom-0 bg-white border-r border-slate-200 z-50 transform transition-all duration-300 ease-in-out 
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 
                    ${isCollapsed ? 'w-20' : 'w-72'}
                `}
            >

                {/* Logo Section */}
                <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Link to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
                        <img src="/logo.png" alt="Bauberg" className="w-10 h-10 object-contain" />
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">Bauberg</span>
                                <span className="text-[10px] font-bold text-bauberg-sky uppercase tracking-widest">Control</span>
                            </div>
                        )}
                    </Link>
                    {/* Close Button (Mobile Only) */}
                    <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Collapse Toggle Button (Desktop Only) */}
                <button
                    onClick={toggleCollapse}
                    className="hidden md:flex absolute -right-3 top-20 bg-white border border-slate-200 text-slate-400 hover:text-bauberg-blue rounded-full p-1 shadow-sm transition-colors z-50"
                >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {!isCollapsed && <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4 mt-2">Меню</div>}
                    <div className={isCollapsed ? 'mt-4 space-y-2' : ''}>
                        <NavItem
                            to="/dashboard"
                            label="Обзор"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>}
                        />

                        {isManager && (
                            <>
                                <NavItem
                                    to="/analytics"
                                    label="Аналитика"
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
                                />
                                <NavItem
                                    to="/drafts"
                                    label="Черновики"
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>}
                                />
                            </>
                        )}
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-bauberg-blue flex items-center justify-center text-white font-bold text-sm shadow-sm relative group">
                            {user.fullName.charAt(0)}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                                    {user.fullName} ({user.role})
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-800 truncate">{user.fullName}</div>
                                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user.role}</div>
                            </div>
                        )}
                        {!isCollapsed && (
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Выйти"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                        )}
                        {/* Collapsed Logout separate button logic if needed, currently embedded in profile click usually or just hidden */}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;

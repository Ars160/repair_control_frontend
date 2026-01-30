// src/App.jsx
import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import ReviewTask from './pages/ReviewTask';
import Analytics from './pages/Analytics';
import ProjectDetails from './pages/ProjectDetails';

// A wrapper for routes that require a logged-in user.
// Redirects to the login page if the user is not authenticated.
function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <Layout />;
}

// A simple layout component with a header.
function Layout() {
  const { user, logout } = useAuth();
  const isManager = user.role === 'PM' || user.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 sm:gap-8">
              <Link to="/dashboard" className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Bauberg<span className="text-indigo-600">Control</span>
              </Link>
              {isManager && (
                <div className="hidden sm:flex items-center gap-4">
                  <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Обзор</Link>
                  <Link to="/analytics" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Аналитика</Link>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <div className="flex flex-col items-end mr-3 sm:mr-4">
                <span className="text-xs sm:text-sm font-bold text-slate-800 leading-none truncate max-w-[100px] sm:max-w-none">{user.fullName.split(' ')[0]}</span>
                <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 sm:px-4 sm:py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                title="Выйти"
              >
                <span className="hidden sm:inline">Выйти</span>
                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
            </div>
          </div>
          {/* Mobile Nav for Managers */}
          {isManager && (
            <div className="flex sm:hidden items-center gap-4 pb-2 border-t border-slate-50 pt-2">
              <Link to="/dashboard" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600">Обзор</Link>
              <Link to="/analytics" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600">Аналитика</Link>
            </div>
          )}
        </nav>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}


function App() {
  return (
    <Routes>
      {/* Public route for login */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/project/:id" element={<ProjectDetails />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/review/:id" element={<ReviewTask />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

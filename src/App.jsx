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
import NotificationBell from './components/NotificationBell';
import DraftProjects from './pages/DraftProjects';

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
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';

function Layout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Persist collapsed state
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    localStorage.setItem('sidebar-collapsed', !isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebarCollapse}
      />

      {/* Mobile Header (visible only on small screens) */}
      <header className="md:hidden bg-white/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Bauberg" className="w-8 h-8 object-contain" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">Bauberg</span>
          </div>
        </div>
      </header>

      <main
        className={`transition-all duration-300 p-4 sm:p-6 lg:p-8
            ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-72'}
        `}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
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
        <Route path="/drafts" element={<DraftProjects />} />
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

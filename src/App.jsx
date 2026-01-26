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
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-2xl font-bold text-slate-800 tracking-tight">
                Bauberg<span className="text-indigo-600">Control</span>
              </Link>
              {isManager && (
                <div className="hidden md:flex items-center gap-4">
                  <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Обзор</Link>
                  <Link to="/analytics" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Аналитика</Link>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <div className="flex flex-col items-end mr-4">
                <span className="text-sm font-bold text-slate-800 leading-none">{user.fullName}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
              >
                Выйти
              </button>
            </div>
          </div>
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

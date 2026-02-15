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
import WorkTemplates from './pages/WorkTemplates';

import ChecklistTemplates from './pages/ChecklistTemplates';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';

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
import Header from './components/Header';

function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />

      <main className="p-4 sm:p-6 lg:p-8 transition-all duration-300">
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

        {/* Templates Routes */}
        <Route path="/templates/works" element={<WorkTemplates />} />
        <Route path="/templates/checklists" element={<ChecklistTemplates />} />

        <Route path="/project/:id" element={<ProjectDetails />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />

        <Route path="/review/:id" element={<ReviewTask />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={<UserManagement />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

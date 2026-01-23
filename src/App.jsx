// src/App.jsx
import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import ReviewTask from './pages/ReviewTask';
// TaskList is not used as a separate page in the new structure, Dashboard will show the list.

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
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/dashboard" className="text-2xl font-bold text-gray-800">
                            RepairControl
                        </Link>
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-4">
                                {user.fullName} ({user.role})
                            </span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
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
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/review/:id" element={<ReviewTask />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

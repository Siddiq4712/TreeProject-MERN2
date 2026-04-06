import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/auth-context';
import { ToastProvider } from './context/ToastProvider';
import { useContext } from 'react';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import MyEvents from './pages/MyEvents';
import MyTrees from './pages/MyTrees';
import TreeDetails from './pages/TreeDetails';
import MyLand from './pages/MyLand';
import AddLand from './pages/AddLand';
import LandDetail from './pages/LandDetail';
import AddHistoricalTree from './pages/AddHistoricalTree';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <p><i className="fas fa-spinner fa-spin"></i> Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
        <p><i className="fas fa-spinner fa-spin"></i> Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <p><i className="fas fa-spinner fa-spin"></i> Loading...</p>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-event" element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/event/:id" element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          } />
          <Route path="/my-events" element={
            <ProtectedRoute>
              <MyEvents />
            </ProtectedRoute>
          } />
          <Route path="/my-trees" element={
            <ProtectedRoute>
              <MyTrees />
            </ProtectedRoute>
          } />
          <Route path="/tree/:id" element={
            <ProtectedRoute>
              <TreeDetails />
            </ProtectedRoute>
          } />
          <Route path="/my-land" element={
            <ProtectedRoute>
              <MyLand />
            </ProtectedRoute>
          } />
          <Route path="/add-land" element={
            <ProtectedRoute>
              <AddLand />
            </ProtectedRoute>
          } />
          <Route path="/land/:id" element={
            <ProtectedRoute>
              <LandDetail />
            </ProtectedRoute>
          } />
          <Route path="/add-historical-tree" element={
            <ProtectedRoute>
              <AddHistoricalTree />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

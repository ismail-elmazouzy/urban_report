import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar            from './components/Navbar';
import Home              from './pages/Home';
import Login             from './pages/Login';
import Register          from './pages/Register';
import Dashboard         from './pages/Dashboard';
import CreateSignalement from './pages/CreateSignalement';
import MesSignalements   from './pages/MesSignalements';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminSignalements from './pages/admin/AdminSignalements';
import AdminUsers        from './pages/admin/AdminUsers';
import { isLogged, isAdmin } from './services/auth';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) =>
  isLogged() ? children : <Navigate to="/login" />;

const AdminRoute = ({ children }) =>
  isAdmin() ? children : <Navigate to="/dashboard" />;

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/profile" element={
  <PrivateRoute><Profile /></PrivateRoute>
}/>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        }/>
        <Route path="/signaler" element={
          <PrivateRoute><CreateSignalement /></PrivateRoute>
        }/>
        <Route path="/mes-signalements" element={
          <PrivateRoute><MesSignalements /></PrivateRoute>
        }/>
        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        }/>
        <Route path="/admin/signalements" element={
          <AdminRoute><AdminSignalements /></AdminRoute>
        }/>
        <Route path="/admin/users" element={
          <AdminRoute><AdminUsers /></AdminRoute>
        }/>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
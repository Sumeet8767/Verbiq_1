import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import LanguageSelection from './pages/LanguageSelection';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Instructions from './pages/Instructions';
import Completion from './pages/Completion';
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background-soft font-inter">
        <Routes>
          <Route path="/" element={<Landing />}/>
          <Route path="/login" element={<Login />}/>
          <Route path="/language-selection" element={<ProtectedRoute><LanguageSelection/></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
          <Route path="/instructions" element={<ProtectedRoute><Instructions/></ProtectedRoute>}/>
          <Route path="/assessment" element={<ProtectedRoute><Assessment/></ProtectedRoute>}/>
          <Route path="/completion" element={<ProtectedRoute><Completion/></ProtectedRoute>}/>
          <Route path="/forgot-password" element={<ForgotPassword/>}/>
          <Route path="/verify-otp" element={<VerifyOTP/>}/>
          <Route path="/reset-password" element={<ResetPassword/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;

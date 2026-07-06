import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import LanguageSelection from './pages/LanguageSelection';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Instructions from './pages/Instructions';
import Completion from './pages/Completion';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background-soft font-inter">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/language-selection" element={<LanguageSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/completion" element={<Completion />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

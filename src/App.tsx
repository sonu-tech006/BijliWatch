import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import LandingPage from './views/LandingPage.js';
import UserDashboard from './views/UserDashboard.js';
import AdminDashboard from './views/AdminDashboard.js';
import PublicComplaintTracker from './views/PublicComplaintTracker.js';
import TariffCalculatorView from './views/TariffCalculatorView.js';
import AuthModal from './views/AuthModal.js';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Auto-route to admin dashboard if an admin logs in and requests dashboard
  const handleTabChange = (tab: string) => {
    if (tab === 'dashboard') {
      if (user && user.role !== 'consumer') {
        setCurrentTab('admin_dashboard');
      } else {
        setCurrentTab('user_dashboard');
      }
    } else {
      setCurrentTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Strict 3-zone Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigateTab={handleTabChange}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'user_dashboard' && <UserDashboard />}

        {currentTab === 'admin_dashboard' && <AdminDashboard />}

        {currentTab === 'tracker' && <PublicComplaintTracker />}

        {currentTab === 'tariff' && <TariffCalculatorView />}
      </main>

      {/* Trustworthy Utility Footer */}
      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}

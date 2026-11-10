import React, { useState } from 'react';
import { useParking } from './context/ParkingContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DriverDashboard } from './pages/DriverDashboard';
import { ViolationDetailsPage } from './pages/ViolationDetailsPage';
import { ReportViolationPage } from './pages/ReportViolationPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App = () => {
  const { currentView } = useParking();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'auth':
        return <AuthPage />;
      case 'dashboard':
        return <DriverDashboard />;
      case 'details':
        return <ViolationDetailsPage />;
      case 'report':
        return <ReportViolationPage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <LandingPage />;
    }
  };

  // AuthPage has its own centered full layout if needed, but still within our theme
  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar onToggleSidebar={() => {}} />
        <main className="p-4 sm:p-6 lg:p-8">{renderCurrentView()}</main>
        <Footer />
        <Toast />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Dark Navy Vertical Sidebar (Left) */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Column (Right) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Horizontal Top Navigation / Search Bar */}
        <Navbar onToggleSidebar={() => setMobileSidebarOpen(true)} />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>

        {/* Clean, Compact Footer */}
        <Footer />

        {/* Floating Toast Notification */}
        <Toast />
      </div>
    </div>
  );
};

export default App;

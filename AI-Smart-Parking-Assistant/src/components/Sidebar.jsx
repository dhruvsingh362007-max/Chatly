import React from 'react';
import {
  LayoutDashboard,
  Car,
  Bot,
  AlertCircle,
  Building2,
  ShieldCheck,
  Sparkles,
  X,
  ChevronRight,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { currentView, navigateTo, role, user } = useParking();

  const navItems = [
    { id: 'landing', label: 'Dashboard', icon: LayoutDashboard, subtitle: 'Overview & metrics' },
    { id: 'dashboard', label: 'Driver Portal', icon: Car, subtitle: 'Violations & appeals' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, subtitle: 'XAI Copilot', badge: 'Live' },
    { id: 'report', label: 'Report Incident', icon: AlertCircle, subtitle: 'Citizen OCR scan' },
    { id: 'admin', label: 'Municipal Admin', icon: Building2, subtitle: 'Adjudication cell' },
  ];

  const handleNavClick = (viewId) => {
    navigateTo(viewId);
    if (setMobileOpen) setMobileOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0B192C] text-slate-300 border-r border-[#132A4A] select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#132A4A]/80 flex items-center justify-between">
        <div
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">ParkWise</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-300 border border-blue-400/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Parking Compliance</p>
          </div>
        </div>

        {/* Mobile close button */}
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#132A4A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-[#132A4A]/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 sticky top-0 h-screen z-30">
        <NavContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
};


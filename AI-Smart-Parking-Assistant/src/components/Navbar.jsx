import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Car,
  Building2,
  LogOut,
  Sparkles,
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { currentView, navigateTo, user, role, loginAs, logout, setSelectedViolationId } = useParking();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigateTo('dashboard');
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 text-slate-800 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile hamburger & Global Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar (matching Image 2) */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <input
                type="text"
                placeholder="Search violations, cameras, license plates (e.g. PB10)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </form>
          </div>

          {/* Right Controls: Quick Persona Switcher + Notifications + Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Quick Demo Persona Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => loginAs('driver')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  role === 'driver'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
                title="Switch demo persona to Driver"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Driver (PB10AB1234)</span>
              </button>
              <button
                onClick={() => loginAs('admin')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-navy-900 text-cyan-300 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
                title="Switch demo persona to Municipal Officer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin (Insp. Verma)</span>
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl text-slate-500 hover:text-navy-900 hover:bg-slate-100 border border-slate-200 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-navy-900">Compliance Alerts</span>
                    <span className="text-[10px] text-blue-600 font-semibold">2 New</span>
                  </div>
                  <div className="py-2 space-y-2 text-xs">
                    <div
                      onClick={() => {
                        setNotificationsOpen(false);
                        setSelectedViolationId('IND-VIO-2024-8841');
                        navigateTo('details', { violationId: 'IND-VIO-2024-8841' });
                      }}
                      className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-50 border border-blue-100 cursor-pointer space-y-1 transition-colors"
                    >
                      <p className="font-bold text-navy-900 flex items-center justify-between">
                        <span>Grace Window Eligible</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">₹500 fine</span>
                      </p>
                      <p className="text-slate-600 text-[11px]">
                        Citation IND-VIO-2024-8841 (Mall Road) matches Sample Rule PR-101.B.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigateTo('dashboard');
                      }}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer space-y-1 transition-colors"
                    >
                      <p className="font-bold text-navy-900">Dispute Under Demonstration Review</p>
                      <p className="text-slate-600 text-[11px]">
                        Appeal for PB10AB1234 on Connaught Place pending adjudicator sign-off.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-navy-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize">{role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-navy-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigateTo('dashboard');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Car className="w-3.5 h-3.5 text-blue-600" />
                        <span>My Vehicle Ledger</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigateTo('ai-assistant');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Ask AI Assistant</span>
                      </button>

                      {/* Mobile persona switcher options */}
                      <div className="sm:hidden border-t border-slate-100 pt-1 mt-1 px-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Switch Persona
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              loginAs('driver');
                              setProfileDropdownOpen(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center ${
                              role === 'driver' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Driver
                          </button>
                          <button
                            onClick={() => {
                              loginAs('admin');
                              setProfileDropdownOpen(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center ${
                              role === 'admin' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigateTo('auth')}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Radio, Ghost, Shield, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import { User, SocialAvailability } from '../../types/user';
import { authService } from '../../services/authService';
import { safetyService } from '../../services/safetyService';

interface NavbarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenProfileSetup: () => void;
  onToggleDiscoverable: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenProfileSetup,
  onToggleDiscoverable,
}) => {
  const [showAvailabilityMenu, setShowAvailabilityMenu] = useState(false);

  const handleHideMe = () => {
    safetyService.hideMeEmergency();
  };

  const setAvailability = (status: SocialAvailability) => {
    authService.setSocialAvailability(status);
    setShowAvailabilityMenu(false);
  };

  const getAvailabilityDot = (status: SocialAvailability) => {
    switch (status) {
      case 'open':
        return <span className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'maybe':
        return <span className="w-2 h-2 rounded-full bg-amber-500" />;
      case 'busy':
        return <span className="w-2 h-2 rounded-full bg-zinc-500" />;
    }
  };

  const getAvailabilityLabel = (status: SocialAvailability) => {
    switch (status) {
      case 'open':
        return 'Open to chat';
      case 'maybe':
        return 'Maybe';
      case 'busy':
        return 'Not now';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d0d10]/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Chatly Minimal Monochrome Logo */}
        <div 
          onClick={() => setActiveTab('radar')}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center transition-colors group-hover:border-zinc-500">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                Chatly
              </span>
              <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                PROXIMITY
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block font-normal">
              Meet people, not strangers.
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links — Clean Monochrome */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          {[
            { id: 'radar', label: 'Radar', icon: '🛰️' },
            { id: 'requests', label: 'Requests', icon: '🔔' },
            { id: 'chats', label: 'Chats', icon: '💬' },
            { id: 'events', label: 'Events & Groups', icon: '🎪' },
            { id: 'profile', label: 'Profile', icon: '👤' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Availability, Discoverability & Safety */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Social Availability State Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAvailabilityMenu(!showAvailabilityMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition-all"
              title="Change your social availability"
            >
              {getAvailabilityDot(currentUser.socialAvailability || 'open')}
              <span className="hidden lg:inline">{getAvailabilityLabel(currentUser.socialAvailability || 'open')}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showAvailabilityMenu && (
              <div className="absolute right-0 top-10 w-44 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 mb-1">
                  Availability
                </div>
                {(['open', 'maybe', 'busy'] as SocialAvailability[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setAvailability(status)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {getAvailabilityDot(status)}
                      <span>{getAvailabilityLabel(status)}</span>
                    </div>
                    {currentUser.socialAvailability === status && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Discoverable / Ghost State Indicator */}
          {currentUser.ghostMode ? (
            <div 
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer hover:bg-zinc-800 transition-all"
              title="Ghost Mode Active: You can browse, but are invisible on nearby radars."
            >
              <Ghost className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Ghost Mode</span>
            </div>
          ) : currentUser.isDiscoverable ? (
            <button
              onClick={onToggleDiscoverable}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium hover:bg-zinc-800 transition-all"
              title="Discoverable: People nearby can see you on their radar."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="hidden sm:inline">Discoverable</span>
            </button>
          ) : (
            <button
              onClick={onToggleDiscoverable}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium hover:bg-zinc-800 transition-all"
              title="Hidden: You are hidden from nearby discovery."
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hidden</span>
            </button>
          )}

          {/* Emergency Hide Me */}
          {currentUser.isDiscoverable && (
            <button
              onClick={handleHideMe}
              className="px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-all flex items-center gap-1.5"
              title="Emergency: Immediately hide yourself from all discovery"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline font-medium">Hide Me</span>
            </button>
          )}

          {/* User Avatar */}
          <button
            onClick={() => setActiveTab('profile')}
            className="p-0.5 rounded-full border border-zinc-700 hover:border-zinc-500 transition-colors"
            title="Open Profile"
          >
            <img
              src={currentUser.profilePhoto}
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-full object-cover"
            />
          </button>

        </div>

      </div>
    </header>
  );
};

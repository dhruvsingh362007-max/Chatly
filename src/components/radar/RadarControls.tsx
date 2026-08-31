import React, { useState, useEffect } from 'react';
import { Ghost, Clock, ShieldCheck, ChevronDown, Check, Navigation, Footprints } from 'lucide-react';
import { User, SessionDuration, SocialAvailability } from '../../types/user';
import { authService } from '../../services/authService';
import { locationService } from '../../services/locationService';

interface RadarControlsProps {
  currentUser: User;
  onRefresh: () => void;
}

export const RadarControls: React.FC<RadarControlsProps> = ({ currentUser, onRefresh }) => {
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [permissionState, setPermissionState] = useState(locationService.getPermissionState());
  const [isTracking, setIsTracking] = useState(locationService.isTracking());
  const remainingMinutes = locationService.getRemainingSessionMinutes();

  useEffect(() => {
    const unsub = locationService.subscribe(() => {
      setPermissionState(locationService.getPermissionState());
      setIsTracking(locationService.isTracking());
    });
    return () => unsub();
  }, []);

  const handleToggleDiscoverable = () => {
    const next = !currentUser.isDiscoverable;
    authService.setDiscoverable(next);
    if (next) {
      locationService.requestBrowserLocationPermission();
    }
    onRefresh();
  };

  const handleEnableLocation = async () => {
    await locationService.requestBrowserLocationPermission();
    onRefresh();
  };

  const handleSimulateMovement = async () => {
    await locationService.simulateMovementStep();
    onRefresh();
  };

  const handleToggleGhostMode = () => {
    authService.setGhostMode(!currentUser.ghostMode);
    onRefresh();
  };

  const handleSelectDuration = (duration: SessionDuration) => {
    authService.setSessionDuration(duration);
    setShowDurationDropdown(false);
    onRefresh();
  };

  return (
    <div className="w-full bg-[#141417] p-3.5 sm:p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-sm">
      
      {/* Top row: Discoverable & Ghost mode toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Discoverable Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleDiscoverable}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              currentUser.isDiscoverable ? 'bg-white' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition duration-200 ease-in-out ${
                currentUser.isDiscoverable ? 'translate-x-5 bg-zinc-950' : 'translate-x-0 bg-zinc-400'
              }`}
            />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">
                {currentUser.isDiscoverable ? 'Discoverable' : 'Hidden Mode'}
              </span>
              {currentUser.isDiscoverable && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-normal">
              {currentUser.isDiscoverable 
                ? 'People nearby can discover you' 
                : 'You are invisible on nearby radars'}
            </p>
          </div>
        </div>

        {/* Ghost Mode Toggle */}
        <button
          onClick={handleToggleGhostMode}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
            currentUser.ghostMode 
              ? 'bg-white text-zinc-950 border-white font-semibold' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
          title="Ghost Mode: Browse nearby people without appearing on their radar"
        >
          <Ghost className="w-3.5 h-3.5" />
          <span>Ghost Mode: {currentUser.ghostMode ? 'ON' : 'OFF'}</span>
        </button>

      </div>

      {/* Bottom row: Session Timer & Privacy reassurance */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-zinc-800/80 text-xs">
        
        {/* Session Duration Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDurationDropdown(!showDurationDropdown)}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors text-xs"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {currentUser.sessionDurationType === 'until_off'
                ? 'Active until turned off'
                : remainingMinutes !== null
                ? `Discoverable for ${remainingMinutes} min`
                : `Session: ${currentUser.sessionDurationType}`}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showDurationDropdown && (
            <div className="absolute left-0 bottom-8 sm:bottom-auto sm:top-8 w-44 bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-2xl z-30 animate-in fade-in zoom-in-95">
              {(['30m', '1h', 'until_off'] as SessionDuration[]).map((dur) => (
                <button
                  key={dur}
                  onClick={() => handleSelectDuration(dur)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    currentUser.sessionDurationType === dur ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <span>{dur === '30m' ? '30 minutes' : dur === '1h' ? '1 hour' : 'Until turned off'}</span>
                  {currentUser.sessionDurationType === dur && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Tracking & Movement Controls */}
        <div className="flex items-center gap-2">
          {permissionState === 'granted' && isTracking ? (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>GPS Proximity Active</span>
            </div>
          ) : currentUser.isDiscoverable ? (
            <button
              onClick={handleEnableLocation}
              className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-0.5 rounded transition-colors"
              title="Allow browser location to track proximity movement"
            >
              <Navigation className="w-3 h-3 text-zinc-400" />
              <span>Enable GPS</span>
            </button>
          ) : null}

          {/* Test Movement Button */}
          {currentUser.isDiscoverable && (
            <button
              onClick={handleSimulateMovement}
              className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-0.5 rounded-lg transition-colors"
              title="Test real-time proximity update (~20m ↔ ~40m ↔ ~60m)"
            >
              <Footprints className="w-3 h-3 text-zinc-400" />
              <span>Test Move</span>
            </button>
          )}

          {/* Privacy Note */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Fuzzy proximity • No exact GPS</span>
          </div>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { X, Shield, Ghost, Eye, Clock, Ban, Trash2, LogOut, Check } from 'lucide-react';
import { User, SessionDuration, SocialAvailability } from '../../types/user';
import { authService } from '../../services/authService';
import { safetyService } from '../../services/safetyService';

interface SettingsModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLogout,
}) => {
  const [discoverable, setDiscoverable] = useState(currentUser.isDiscoverable);
  const [ghostMode, setGhostMode] = useState(currentUser.ghostMode);
  const [socialAvailability, setSocialAvailability] = useState<SocialAvailability>(currentUser.socialAvailability || 'open');
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(currentUser.sessionDurationType);
  const [approxDistance, setApproxDistance] = useState(true);
  const [radarRandomization, setRadarRandomization] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(safetyService.getBlockedUids());

  if (!isOpen) return null;

  const handleSave = () => {
    authService.updateProfile({
      isDiscoverable: discoverable,
      ghostMode,
      socialAvailability,
      sessionDurationType: sessionDuration
    });
    onClose();
  };

  const handleUnblock = (uid: string) => {
    safetyService.unblockUser(uid);
    setBlockedUsers(safetyService.getBlockedUids());
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your Chatly account? All local data will be reset.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#141417] p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Privacy & Radar Settings</h2>
              <p className="text-xs text-zinc-400">Control your visibility, social availability, and sessions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          
          {/* Section 1: Visibility & Discoverability */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-white" />
                  <span>Discoverability</span>
                </h4>
                <p className="text-xs text-zinc-400 font-normal">
                  Allow people nearby to see your profile on their radar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={discoverable}
                onChange={(e) => setDiscoverable(e.target.checked)}
                className="w-4 h-4 accent-white rounded cursor-pointer"
              />
            </div>

            {/* Ghost Mode */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Ghost className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Ghost Mode</span>
                </h4>
                <p className="text-xs text-zinc-400 font-normal">
                  Browse nearby people without appearing on their radar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={ghostMode}
                onChange={(e) => setGhostMode(e.target.checked)}
                className="w-4 h-4 accent-white rounded cursor-pointer"
              />
            </div>

            {/* Social Availability */}
            <div className="pt-3 border-t border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Social Availability State
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'open', label: '🟢 Open to chat' },
                  { id: 'maybe', label: '🟡 Maybe' },
                  { id: 'busy', label: '🔴 Not now' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSocialAvailability(item.id as SocialAvailability)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      socialAvailability === item.id
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Duration */}
            <div className="pt-3 border-t border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Nearby Session Duration (Auto-Expiry)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['30m', '1h', 'until_off'] as SessionDuration[]).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSessionDuration(dur)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      sessionDuration === dur
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                    }`}
                  >
                    {dur === '30m' ? '30 min' : dur === '1h' ? '1 hour' : 'Until Off'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Proximity Privacy */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Approximate Distance Only (~20m, ~40m)
                </h4>
                <p className="text-[11px] text-zinc-400 font-normal">
                  Exact meters and coordinates are strictly hidden.
                </p>
              </div>
              <input
                type="checkbox"
                checked={approxDistance}
                onChange={(e) => setApproxDistance(e.target.checked)}
                className="w-4 h-4 accent-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Radar Position Randomization (Fuzzy)
                </h4>
                <p className="text-[11px] text-zinc-400 font-normal">
                  Fuzzes polar placement so users cannot triangulate location.
                </p>
              </div>
              <input
                type="checkbox"
                checked={radarRandomization}
                onChange={(e) => setRadarRandomization(e.target.checked)}
                className="w-4 h-4 accent-white"
              />
            </div>
          </div>

          {/* Section 3: Blocked Users */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-zinc-400" />
              <span>Blocked Users ({blockedUsers.length})</span>
            </h4>
            {blockedUsers.length === 0 ? (
              <p className="text-xs text-zinc-500 font-normal">No blocked users.</p>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map((uid) => (
                  <div key={uid} className="flex items-center justify-between text-xs bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-300 font-mono">{uid}</span>
                    <button
                      onClick={() => handleUnblock(uid)}
                      className="text-xs text-white underline hover:text-zinc-300"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
          >
            Save Preferences
          </button>

          {/* Danger Zone */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              onClick={onLogout}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Local Data</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

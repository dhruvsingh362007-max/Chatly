import React from 'react';
import { Settings, Shield, Edit3, LogOut, Radio, Ghost, Clock, Sparkles } from 'lucide-react';
import { User, SocialAvailability } from '../../types/user';
import { locationService } from '../../services/locationService';
import { connectionService } from '../../services/connectionService';

interface ProfileViewProps {
  currentUser: User;
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenEditProfile,
  onOpenSettings,
  onLogout,
}) => {
  const remainingMinutes = locationService.getRemainingSessionMinutes();
  const connectionsCount = connectionService.getConnections().length;

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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Profile Card */}
      <div className="bg-[#141417] p-6 sm:p-8 rounded-2xl border border-zinc-800 relative overflow-hidden mb-6">
        
        {/* Top Right Quick Settings */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <button
            onClick={onOpenEditProfile}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
            title="Privacy & Radar Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left mb-6">
          <div className="relative">
            <img
              src={currentUser.profilePhoto}
              alt={currentUser.displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-1 ring-zinc-700"
            />
            {currentUser.isOnline && (
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#141417] rounded-full" />
            )}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{currentUser.displayName}</h2>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 self-center sm:self-auto">
                @{currentUser.username}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
                <span>{currentUser.currentStatus}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium">
                {getAvailabilityDot(currentUser.socialAvailability || 'open')}
                <span>{getAvailabilityLabel(currentUser.socialAvailability || 'open')}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 mt-3 leading-relaxed max-w-md font-normal">
              "{currentUser.bio}"
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-5 border-t border-zinc-800">
          <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 text-center">
            <div className="text-lg font-bold text-white">{connectionsCount}</div>
            <div className="text-[11px] text-zinc-400">Mutual Connections</div>
          </div>
          <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 text-center">
            <div className="text-lg font-bold text-white">
              {currentUser.isDiscoverable ? 'Active' : 'Hidden'}
            </div>
            <div className="text-[11px] text-zinc-400">Radar Status</div>
          </div>
          <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 text-center">
            <div className="text-lg font-bold text-white">
              {currentUser.ghostMode ? 'Ghost ON' : 'Visible'}
            </div>
            <div className="text-[11px] text-zinc-400">Visibility Mode</div>
          </div>
        </div>

      </div>

      {/* Selected Interests */}
      <div className="bg-[#141417] p-6 rounded-2xl border border-zinc-800 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Interests ({currentUser.interests.length})</span>
          </h3>
          <button
            onClick={onOpenEditProfile}
            className="text-xs text-white underline hover:text-zinc-300"
          >
            Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentUser.interests.map((interest) => (
            <span
              key={interest}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-800 text-xs font-medium"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Privacy First Callout */}
      <div className="bg-[#141417] p-5 rounded-2xl border border-zinc-800 mb-6 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">
            Privacy First Design
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed font-normal">
            Your exact GPS coordinates are never stored or displayed. Other members only see fuzzy radial proximity (~20m, ~40m). Chat only unlocks with mutual consent.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={onOpenSettings}
          className="w-full py-3 rounded-xl bg-[#141417] hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Configure Privacy, Session & Blocked Users</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4 text-zinc-400" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
};

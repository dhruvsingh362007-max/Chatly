import React, { useState } from 'react';
import { X, Send, MessageSquare, ShieldAlert, Ban, Flag, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { User, SocialAvailability } from '../../types/user';
import { nearbyService } from '../../services/nearbyService';
import { connectionService } from '../../services/connectionService';
import { safetyService } from '../../services/safetyService';

interface UserProfileSheetProps {
  user: User | null;
  currentUser: User;
  onClose: () => void;
  onOpenSendSignal: (user: User) => void;
  onOpenChat: (otherUid: string) => void;
  onOpenReport: (user: User) => void;
}

export const UserProfileSheet: React.FC<UserProfileSheetProps> = ({
  user,
  currentUser,
  onClose,
  onOpenSendSignal,
  onOpenChat,
  onOpenReport,
}) => {
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);

  if (!user) return null;

  const commonInterests = nearbyService.calculateCommonInterests(currentUser, user);
  const isConnected = connectionService.isConnectedWith(user.uid);
  const hasPendingRequest = connectionService.hasPendingRequestWith(user.uid);

  const handleBlock = () => {
    if (confirm(`Block ${user.displayName}? They will no longer appear on your radar.`)) {
      safetyService.blockUser(user.uid);
      onClose();
    }
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
        return 'Maybe available';
      case 'busy':
        return 'Not now';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-lg bg-[#141417] border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
      >
        {/* Top Handle / Close & Safety */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-800 flex items-center gap-1.5 font-mono">
              <span>{user.approximateDistance}</span>
            </span>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              {getAvailabilityDot(user.socialAvailability || 'open')}
              <span>{getAvailabilityLabel(user.socialAvailability || 'open')}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title="Safety options"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>

              {showSafetyMenu && (
                <div className="absolute right-0 top-10 w-44 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 shadow-2xl z-20 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowSafetyMenu(false);
                      onOpenReport(user);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Report User</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSafetyMenu(false);
                      handleBlock();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>Block User</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Card Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <img
              src={user.profilePhoto}
              alt={user.displayName}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-1 ring-zinc-700"
            />
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#141417] rounded-full" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {user.displayName}
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              @{user.username}
            </p>
            <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
              <span>{user.currentStatus}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 mb-5">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            "{user.bio}"
          </p>
        </div>

        {/* Common Interests Highlight Banner */}
        {commonInterests.length > 0 ? (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 mb-5">
            <div className="flex items-center gap-2 mb-2 text-zinc-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>You have {commonInterests.length} {commonInterests.length === 1 ? 'interest' : 'interests'} in common</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {commonInterests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-lg bg-white text-zinc-950 text-xs font-semibold shadow-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 mb-5">
            <p className="text-xs text-zinc-400">
              Open to meeting new people and discovering shared passions.
            </p>
          </div>
        )}

        {/* All Interests */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Interests
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {user.interests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 text-xs border border-zinc-800"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Safe Meet Advice Banner */}
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 mb-6 text-xs text-zinc-400">
          <span className="text-base">📍</span>
          <span>Meeting someone new? Choose a public place and meet somewhere familiar.</span>
        </div>

        {/* Action Button */}
        <div>
          {isConnected ? (
            <button
              onClick={() => {
                onClose();
                onOpenChat(user.uid);
              }}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Chat</span>
            </button>
          ) : hasPendingRequest ? (
            <div className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Signal Sent • Waiting for mutual response</span>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenSendSignal(user);
              }}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Send a Signal</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MessageSquare, ArrowRight, X } from 'lucide-react';
import { User } from '../../types/user';

interface ConnectionModalProps {
  isOpen: boolean;
  connectedUser: User | null;
  currentUser: User;
  onClose: () => void;
  onStartChat: (targetUid: string) => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  connectedUser,
  currentUser,
  onClose,
  onStartChat,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#a1a1aa', '#52525b', '#e4e4e7']
        });
      } catch (e) {
        // Fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || !connectedUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#141417] p-6 sm:p-8 rounded-2xl border border-zinc-700 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium uppercase tracking-wider mb-4">
          <span>🤝 Mutual Connection</span>
        </div>

        {/* Connected Avatars Bridge */}
        <div className="flex items-center justify-center gap-4 my-5">
          <div className="relative">
            <img
              src={currentUser.profilePhoto}
              alt="You"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 text-xs bg-zinc-900 rounded px-1 border border-zinc-700 text-zinc-200">You</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xl">⚡</span>
            <div className="w-10 h-0.5 bg-zinc-700 my-1 rounded-full" />
          </div>

          <div className="relative">
            <img
              src={connectedUser.profilePhoto}
              alt={connectedUser.displayName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-zinc-500 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 text-xs bg-zinc-900 rounded px-1 border border-zinc-700 text-zinc-200">
              {connectedUser.displayName.split(' ')[0]}
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          🎉 It's a connection!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto mb-6">
          You and <strong className="text-white font-medium">{connectedUser.displayName}</strong> both want to connect. The chat is unlocked.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onStartChat(connectedUser.uid);
            }}
            className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Start Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors font-medium"
          >
            Keep Browsing Radar
          </button>
        </div>

      </div>
    </div>
  );
};

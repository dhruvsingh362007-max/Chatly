import React, { useState } from 'react';
import { X, Send, HeartHandshake } from 'lucide-react';
import { User } from '../../types/user';
import { SignalEmoji, AVAILABLE_SIGNALS } from '../../types/connection';
import { connectionService } from '../../services/connectionService';

interface SendSignalModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSignalSent: (targetUser: User, emoji: SignalEmoji) => void;
}

export const SendSignalModal: React.FC<SendSignalModalProps> = ({
  user,
  isOpen,
  onClose,
  onSignalSent,
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState<SignalEmoji>('👋');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSend = async () => {
    setIsSending(true);
    setErrorMessage(null);

    const result = await connectionService.sendSignal(user.uid, selectedEmoji);
    if (!result.success) {
      setIsSending(false);
      setErrorMessage(result.error || 'Failed to send signal');
      return;
    }

    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onSignalSent(user, selectedEmoji);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#141417] p-6 sm:p-7 rounded-2xl border border-zinc-800 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {sentSuccess ? (
          <div className="py-8 text-center animate-in zoom-in duration-150">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-3xl">
              {selectedEmoji}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Signal Sent</h3>
            <p className="text-xs text-zinc-400">
              {user.displayName} received your signal. You'll be notified when they respond.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <img
                  src={user.profilePhoto}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-zinc-700"
                />
                <span className="absolute -bottom-1 -right-1 text-sm bg-zinc-900 rounded-full px-1 border border-zinc-800">{selectedEmoji}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Send a Signal to {user.displayName}
                </h3>
                <p className="text-xs text-zinc-400">
                  {user.approximateDistance} away • Low-pressure icebreaker
                </p>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 mb-4 text-[11px] text-zinc-400 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-white shrink-0" />
              <span>Chat opens ONLY if {user.displayName} responds. Ignored requests expire quietly.</span>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Signal Choices Grid — Emojis remain colorful, surrounding buttons are clean monochrome */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {AVAILABLE_SIGNALS.map((sig) => {
                const isSelected = selectedEmoji === sig.emoji;
                return (
                  <button
                    key={sig.emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(sig.emoji)}
                    className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-colors border ${
                      isSelected
                        ? 'bg-zinc-800 border-white text-white shadow-sm'
                        : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{sig.emoji}</span>
                    <span className="text-xs font-medium text-white">{sig.label}</span>
                    <span className="text-[9px] text-zinc-400 line-clamp-1">{sig.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSending}
              onClick={handleSend}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending Signal...' : `Send ${selectedEmoji} Signal`}</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
};

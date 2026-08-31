import React, { useState } from 'react';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import { User } from '../../types/user';
import { safetyService, ReportSubmission } from '../../services/safetyService';

interface ReportModalProps {
  isOpen: boolean;
  targetUser: User | null;
  onClose: () => void;
}

const REPORT_CATEGORIES: ReportSubmission['category'][] = [
  'Harassment',
  'Spam',
  'Fake profile',
  'Inappropriate behavior',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  targetUser,
  onClose,
}) => {
  const [category, setCategory] = useState<ReportSubmission['category']>('Inappropriate behavior');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    safetyService.reportUser(targetUser.uid, category, notes);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#141417] p-6 sm:p-7 rounded-2xl border border-zinc-800 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center animate-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-3 text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Report Received</h3>
            <p className="text-xs text-zinc-400">
              Thank you for keeping Chatly safe and respectful.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Flag className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Report {targetUser.displayName}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">@{targetUser.username}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Select Reason
                </label>
                <div className="space-y-1.5">
                  {REPORT_CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                        category === cat
                          ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={category === cat}
                        onChange={() => setCategory(cat)}
                        className="accent-white"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe what occurred..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none font-normal"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

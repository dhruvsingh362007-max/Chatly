import React, { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { InterestCategory, UserStatus, SocialAvailability } from '../../types/user';
import { authService } from '../../services/authService';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ALL_INTERESTS: InterestCategory[] = [
  '🏎️ F1',
  '💻 Coding',
  '🎮 Gaming',
  '🎵 Music',
  '⚽ Football',
  '📚 Study',
  '📸 Photography',
  '🎬 Movies',
  '📖 Books',
  '🏋️ Fitness',
  '🎨 Art'
];

const ALL_STATUSES: UserStatus[] = [
  '💻 Looking for coding friends',
  '📚 Looking for study partners',
  '🎮 Looking for gaming squad',
  '🏎️ Looking for F1 watch party',
  '☕ Up for casual hangout',
  '🤝 Making friends',
  '👋 Just saying hi',
  '🗣️ Just want to talk'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onComplete }) => {
  const currentUser = authService.getCurrentUser();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Chatly Member');
  const [username, setUsername] = useState(currentUser?.username || 'member');
  const [bio, setBio] = useState(currentUser?.bio || 'Love building web apps, McLaren F1, and finding friendly people around.');
  const [selectedPhoto, setSelectedPhoto] = useState(currentUser?.profilePhoto || PRESET_AVATARS[0]);
  const [selectedInterests, setSelectedInterests] = useState<InterestCategory[]>(currentUser?.interests || ['🏎️ F1', '💻 Coding', '🎮 Gaming']);
  const [currentStatus, setCurrentStatus] = useState<UserStatus>(currentUser?.currentStatus || '💻 Looking for coding friends');
  const [socialAvailability, setSocialAvailability] = useState<SocialAvailability>(currentUser?.socialAvailability || 'open');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: InterestCategory) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter(i => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await authService.updateProfile({
        displayName: displayName.trim(),
        username: username.replace(/^@/, '').trim(),
        bio: bio.trim(),
        profilePhoto: selectedPhoto,
        interests: selectedInterests,
        currentStatus,
        socialAvailability,
        isDiscoverable: true
      });
    } finally {
      setIsSaving(false);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#141417] p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-2xl my-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 uppercase tracking-wider inline-block mb-2">
            Profile Setup
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Customize your Chatly profile</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Help people nearby discover shared interests before saying hello.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Choose Profile Photo
            </label>
            <div className="flex items-center gap-3 justify-center mb-3">
              <div className="relative">
                <img
                  src={selectedPhoto}
                  alt="Selected"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
              {PRESET_AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhoto(avatar)}
                  className={`w-9 h-9 rounded-xl overflow-hidden transition-all ${
                    selectedPhoto === avatar ? 'ring-2 ring-white scale-105' : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={avatar} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="text-zinc-500 text-sm absolute left-3 top-1/2 -translate-y-1/2 font-mono">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-7 pr-3.5 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Social Availability */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Social Availability
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
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
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

          {/* "I'm here for..." Status */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              What are you looking for right now?
            </label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as UserStatus)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-zinc-600"
            >
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Interests Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300">
                Select Your Interests <span className="text-zinc-400 font-normal">({selectedInterests.length} chosen)</span>
              </label>
              <span className="text-[11px] text-zinc-400">Pick 2 or more</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-white text-zinc-950 border-white font-semibold'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{interest}</span>
                    {isSelected && <Check className="w-3 h-3 text-zinc-950" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Short Bio
            </label>
            <textarea
              rows={2}
              maxLength={140}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about your hobbies, projects or studies..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none font-normal"
            />
            <div className="text-right text-[10px] text-zinc-400 mt-1">
              {bio.length}/140 characters
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile to Supabase...</span>
              </>
            ) : (
              <>
                <span>Save Profile & Open Radar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

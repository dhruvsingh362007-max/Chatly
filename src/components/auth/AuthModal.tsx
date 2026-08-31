import React, { useState } from 'react';
import { X, ArrowRight, Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewUser: boolean) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup'
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isConfigured = authService.isConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const result = await authService.signup({
          email,
          password,
          displayName: displayName.trim() || 'Chatly Member',
          username: username.trim() || 'member_' + Math.floor(Math.random() * 1000),
          bio: 'Exploring connections nearby.',
          interests: ['🏎️ F1', '💻 Coding'],
          socialAvailability: 'open'
        });

        if (result.error) {
          setErrorMessage(result.error);
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        onSuccess(true);
      } else if (mode === 'login') {
        const result = await authService.login(email, password);

        if (result.error) {
          setErrorMessage(result.error);
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        onSuccess(false);
      } else {
        setIsSubmitting(false);
        setMode('login');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#141417] p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'login' && 'Welcome back to Chatly'}
              {mode === 'signup' && 'Create your Chatly account'}
              {mode === 'forgot' && 'Reset your password'}
            </h2>
            <p className="text-xs text-zinc-400">
              {mode === 'login' && 'Sign in to discover people physically nearby.'}
              {mode === 'signup' && 'Real-world connections. Privacy first.'}
              {mode === 'forgot' && "Enter your email and we'll send a reset link."}
            </p>
          </div>
        </div>

        {/* Supabase Pending Configuration Alert */}
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Supabase Setup Required:</span> Please place your <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">.env.local</code> to enable real authentication.
            </div>
          </div>
        )}

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Chen"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Unique Username
                </label>
                <div className="relative">
                  <span className="text-zinc-500 text-sm absolute left-3 top-1/2 -translate-y-1/2 font-mono">@</span>
                  <input
                    type="text"
                    required
                    placeholder="alex_chen"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account & Continue' : mode === 'login' ? 'Sign In' : 'Send Reset Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-5 text-center text-xs text-zinc-400 border-t border-zinc-800 pt-4">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('signup');
                }}
                className="text-white font-semibold hover:underline ml-1"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('login');
                }}
                className="text-white font-semibold hover:underline ml-1"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

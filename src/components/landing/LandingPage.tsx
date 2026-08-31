import React from 'react';
import { Shield, Sparkles, HeartHandshake, ArrowRight, Lock, EyeOff, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const scrollToSteps = () => {
    const el = document.getElementById('how-it-works');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-zinc-800 selection:text-white">
      
      {/* Top Bar */}
      <header className="w-full border-b border-zinc-800/80 bg-[#0d0d10]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border border-white flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Chatly
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 px-4 py-1.5 rounded-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section — Spacious Desktop Max-Width */}
      <section className="relative pt-16 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Real-world social discovery & icebreakers</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
              Meet people around you. <br />
              <span className="text-zinc-400 font-normal">
                Without the awkward approach.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
              Discover people nearby, find common interests, send a simple signal, and start talking only when both people want to connect.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToSteps}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 font-medium text-sm border border-zinc-800 transition-all"
              >
                See How It Works
              </button>
            </div>

            {/* Privacy Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-300" />
                <span>Zero exact coordinates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-zinc-300" />
                <span>Mutual consent required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-zinc-300" />
                <span>Temporary session control</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Monochrome Proximity Radar Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-80 h-80 sm:w-[380px] sm:h-[380px] rounded-full bg-[#111114] border border-zinc-800 p-2 flex items-center justify-center select-none shadow-subtle overflow-hidden">
              
              {/* Concentric Proximity Rings */}
              <div className="radar-ring w-[28%] h-[28%] border-zinc-700/60" />
              <div className="radar-ring w-[50%] h-[50%] border-zinc-800" />
              <div className="radar-ring w-[72%] h-[72%] border-zinc-800/80" />
              <div className="radar-ring w-[92%] h-[92%] border-zinc-900" />

              {/* Gentle Monochrome Sweep */}
              <div className="radar-sweep-beam animate-radar-sweep" />

              {/* Distance Labels */}
              <span className="absolute top-[34%] text-[9px] text-zinc-500 font-mono font-medium tracking-wider pointer-events-none">~20m</span>
              <span className="absolute top-[23%] text-[9px] text-zinc-600 font-mono font-medium tracking-wider pointer-events-none">~40m</span>
              <span className="absolute top-[12%] text-[9px] text-zinc-700 font-mono font-medium tracking-wider pointer-events-none">~60m</span>

              {/* Center User Pin (YOU) */}
              <div className="relative z-20 flex flex-col items-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full ring-2 ring-white p-0.5 bg-zinc-900">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                      alt="You"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#111114] rounded-full" />
                </div>
                <span className="mt-1 px-1.5 py-0.5 text-[8px] font-bold bg-white text-zinc-950 rounded uppercase tracking-wider">
                  YOU
                </span>
              </div>

              {/* Nearby Users Bubbles */}
              {/* Priya ~20m */}
              <div className="absolute top-[28%] right-[22%] z-20 flex flex-col items-center group cursor-pointer">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full ring-1 ring-zinc-700 p-0.5 bg-zinc-900 group-hover:ring-white transition-all">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                      alt="Priya"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-1 -right-1 text-xs">🏎️</span>
                </div>
                <div className="mt-1 bg-zinc-900/95 px-2 py-0.5 rounded-md text-[10px] text-white border border-zinc-800">
                  Priya <span className="text-zinc-400 font-mono text-[9px]">~20m</span>
                </div>
              </div>

              {/* Rahul ~40m */}
              <div className="absolute bottom-[24%] left-[18%] z-20 flex flex-col items-center group cursor-pointer">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full ring-1 ring-zinc-700 p-0.5 bg-zinc-900 group-hover:ring-white transition-all">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Rahul"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-1 -right-1 text-xs">💻</span>
                </div>
                <div className="mt-1 bg-zinc-900/95 px-2 py-0.5 rounded-md text-[10px] text-white border border-zinc-800">
                  Rahul <span className="text-zinc-400 font-mono text-[9px]">~40m</span>
                </div>
              </div>

              {/* Arjun ~60m */}
              <div className="absolute top-[18%] left-[26%] z-20 flex flex-col items-center group cursor-pointer">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full ring-1 ring-zinc-800 p-0.5 bg-zinc-900">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                      alt="Arjun"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-1 -right-1 text-xs">🎵</span>
                </div>
                <div className="mt-1 bg-zinc-900/95 px-2 py-0.5 rounded-md text-[9px] text-white border border-zinc-800">
                  Arjun <span className="text-zinc-400 font-mono text-[9px]">~60m</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4 Steps Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-[#0c0c0e] border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              Low-pressure icebreaker
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-3">
              How Chatly Works
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base font-normal">
              Connecting in the physical world without pressure, rejection or awkward approaches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Step 01 */}
            <div className="bg-[#141417] p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors group">
              <div className="text-2xl font-bold text-zinc-600 group-hover:text-white transition-colors mb-3">
                01
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg mb-3">
                🛰️
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">
                Discover
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                See people nearby who are open to connecting. Displayed on a circular proximity radar with rounded distances.
              </p>
            </div>

            {/* Step 02 */}
            <div className="bg-[#141417] p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors group">
              <div className="text-2xl font-bold text-zinc-600 group-hover:text-white transition-colors mb-3">
                02
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg mb-3">
                🤝
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">
                Find common ground
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                See shared interests, what they are looking for, and conversation starters before saying a word.
              </p>
            </div>

            {/* Step 03 */}
            <div className="bg-[#141417] p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors group">
              <div className="text-2xl font-bold text-zinc-600 group-hover:text-white transition-colors mb-3">
                03
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg mb-3">
                🏎️
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">
                Send a signal
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Use a simple emoji signal (like 👋, 💻, or 🏎️) instead of a cold message. Zero pressure, zero rejection.
              </p>
            </div>

            {/* Step 04 */}
            <div className="bg-[#141417] p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors group">
              <div className="text-2xl font-bold text-zinc-600 group-hover:text-white transition-colors mb-3">
                04
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg mb-3">
                🎉
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">
                Connect
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Chat unlocks only when both people respond positively. If ignored, requests disappear quietly.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Privacy Pledge Section */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="bg-[#141417] p-8 sm:p-10 rounded-3xl border border-zinc-800 text-center relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Privacy is our first principle.
          </h3>
          <p className="text-zinc-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
            Your exact GPS coordinates are <strong className="text-white font-semibold">never shown</strong> to other users. The radar is a proximity visualization (~20m, ~40m), not a tracker.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto mb-8">
            <div className="flex items-start gap-2 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>Temporary session duration (auto-expires)</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>Ghost mode lets you browse silently</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>Block, report or hide yourself anytime</span>
            </div>
          </div>

          <div>
            <button
              onClick={onGetStarted}
              className="px-8 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
            >
              Start Discovering with Chatly
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800 text-center text-xs text-zinc-400">
        <p>Chatly — Meet people, not strangers. Privacy-first proximity discovery.</p>
      </footer>

    </div>
  );
};

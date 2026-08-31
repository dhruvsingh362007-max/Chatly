import React, { useState } from 'react';
import { Radio, Ghost, Filter, X, Zap, Users, Sparkles, Send, MessageSquare } from 'lucide-react';
import { User, SocialAvailability } from '../../types/user';
import { RadarControls } from './RadarControls';
import { UserProfileSheet } from './UserProfileSheet';
import { nearbyService } from '../../services/nearbyService';
import { authService } from '../../services/authService';
import { connectionService } from '../../services/connectionService';

interface RadarViewProps {
  currentUser: User;
  onOpenSendSignal: (user: User) => void;
  onOpenChat: (otherUid: string) => void;
  onOpenReport: (user: User) => void;
  activeEventFilter?: { eventId: string; name: string; participantUids: string[] } | null;
  onClearEventFilter?: () => void;
  onNavigateToRequests?: () => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  currentUser,
  onOpenSendSignal,
  onOpenChat,
  onOpenReport,
  activeEventFilter,
  onClearEventFilter,
  onNavigateToRequests,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nearbyUsers, setNearbyUsers] = useState<User[]>(() =>
    nearbyService.getNearbyUsers(activeEventFilter ? activeEventFilter.participantUids : undefined)
  );

  React.useEffect(() => {
    const updateUsers = () => {
      setNearbyUsers(
        nearbyService.getNearbyUsers(activeEventFilter ? activeEventFilter.participantUids : undefined)
      );
    };
    updateUsers();
    const unsub = nearbyService.subscribe(updateUsers);
    return () => unsub();
  }, [activeEventFilter, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    nearbyService.fetchNearbyUsers();
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Active Event Filter Banner */}
      {activeEventFilter && (
        <div className="w-full mb-6 p-3.5 rounded-2xl bg-[#141417] border border-zinc-700 flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Filter className="w-4 h-4 text-white" />
            <span>Filtering radar for attendees of: <strong className="text-white font-semibold">{activeEventFilter.name}</strong></span>
          </div>
          <button
            onClick={onClearEventFilter}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-zinc-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Show All Nearby</span>
          </button>
        </div>
      )}

      {/* Ghost Mode Active Banner */}
      {currentUser.ghostMode && (
        <div className="w-full mb-6 p-3.5 rounded-2xl bg-[#141417] border border-zinc-700 flex items-center justify-between text-xs text-zinc-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Ghost className="w-4 h-4 text-white" />
            <span><strong>Ghost Mode Active:</strong> You can browse people around you, but your profile is hidden from their radars.</span>
          </div>
          <button
            onClick={() => {
              authService.setGhostMode(false);
              handleRefresh();
            }}
            className="text-xs text-white underline hover:text-zinc-300 font-medium"
          >
            Turn Off
          </button>
        </div>
      )}


      {/* Main Dual-Column Spacious Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Main Column: The Signature Circular Proximity Radar */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Proximity Radar</span>
                <span className="text-xs font-normal text-zinc-400">({nearbyUsers.length} nearby)</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Centered on you. Approximate distances with zero geographic tracking.
              </p>
            </div>

          </div>

          {/* Radar Container */}
          <div className="relative w-full aspect-square max-w-[390px] sm:max-w-[460px] my-2 select-none flex items-center justify-center">
            
            <div className="relative w-full h-full rounded-full bg-[#111114] border border-zinc-800 p-2 flex items-center justify-center shadow-subtle overflow-hidden">
              
              {/* Concentric Proximity Rings */}
              <div className="radar-ring w-[24%] h-[24%] border-zinc-700/60" />
              <div className="radar-ring w-[44%] h-[44%] border-zinc-800" />
              <div className="radar-ring w-[64%] h-[64%] border-zinc-800/80" />
              <div className="radar-ring w-[84%] h-[84%] border-zinc-900" />
              <div className="radar-ring w-[98%] h-[98%] border-zinc-900/60" />

              {/* Gentle Monochrome Sweep Beam */}
              {currentUser.isDiscoverable && (
                <div className="radar-sweep-beam animate-radar-sweep" />
              )}

              {/* Distance Labels */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center">
                <span className="absolute top-[39%] text-[9px] text-zinc-500 font-mono font-medium tracking-wider">~20m</span>
                <span className="absolute top-[29%] text-[9px] text-zinc-600 font-mono font-medium tracking-wider">~40m</span>
                <span className="absolute top-[19%] text-[9px] text-zinc-700 font-mono font-medium tracking-wider">~60m</span>
                <span className="absolute top-[9%] text-[9px] text-zinc-800 font-mono font-medium tracking-wider">~80m</span>
              </div>

              {/* Center User Pin (YOU) */}
              <div className="relative z-20 flex flex-col items-center">
                <div className="relative cursor-pointer group" onClick={() => setSelectedUser(currentUser)}>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-2 ring-white p-0.5 bg-zinc-900 transition-transform group-hover:scale-105">
                    <img
                      src={currentUser.profilePhoto}
                      alt={currentUser.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#111114] rounded-full" />
                </div>
                <span className="mt-1 px-1.5 py-0.2 text-[8px] font-bold bg-white text-zinc-950 rounded uppercase tracking-wider shadow">
                  YOU
                </span>
              </div>

              {/* Surrounding Nearby Users Avatar Markers */}
              {currentUser.isDiscoverable && nearbyUsers.map((user) => {
                const theta = (user.radarAngleDeg - 90) * (Math.PI / 180);
                const radiusPercent = (user.radarDistancePct / 2) * 0.92;
                const x = 50 + radiusPercent * Math.cos(theta);
                const y = 50 + radiusPercent * Math.sin(theta);

                const commonCount = nearbyService.calculateCommonInterests(currentUser, user).length;

                return (
                  <div
                    key={user.uid}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedUser(user)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <div className="relative">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full ring-1 ring-zinc-700 p-0.5 bg-zinc-900 group-hover:ring-white transition-all">
                        <img
                          src={user.profilePhoto}
                          alt={user.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>

                      {/* Primary interest emoji */}
                      <span className="absolute -top-1 -right-1 text-xs bg-zinc-900 rounded-full px-1 border border-zinc-800">
                        {user.interests[0]?.split(' ')[0] || '👋'}
                      </span>

                      {/* Social availability dot */}
                      <span className="absolute bottom-0 right-0">
                        {getAvailabilityDot(user.socialAvailability || 'open')}
                      </span>
                    </div>

                    {/* Name & Approximate Distance Tag */}
                    <div className="mt-1 bg-zinc-900/95 px-2 py-0.5 rounded-md text-[10px] text-white border border-zinc-800 flex items-center gap-1 shadow whitespace-nowrap group-hover:border-zinc-500 transition-colors">
                      <span className="font-semibold">{user.displayName.split(' ')[0]}</span>
                      <span className="text-zinc-400 font-mono text-[9px]">{user.approximateDistance}</span>
                      {commonCount > 0 && (
                        <span className="text-[9px] text-zinc-300 font-bold">★{commonCount}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Hidden State Overlay */}
              {!currentUser.isDiscoverable && (
                <div className="absolute inset-0 z-30 backdrop-blur-md bg-black/75 rounded-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                    <Radio className="w-5 h-5 text-zinc-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    You are currently hidden
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-[210px] mb-4">
                    Turn on Discoverable to see people around you and let them connect.
                  </p>
                  <button
                    onClick={() => {
                      authService.setDiscoverable(true);
                      handleRefresh();
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors"
                  >
                    Turn On Discoverable
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Controls Container */}
          <div className="w-full mt-4">
            <RadarControls currentUser={currentUser} onRefresh={handleRefresh} />
          </div>

        </div>

        {/* Right Column: Spacious Desktop Quick Inspector / Feed */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <span>People in Your Proximity</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              Fuzzy radius
            </span>
          </div>

          {nearbyUsers.length === 0 ? (
            <div className="bg-[#141417] p-8 rounded-2xl border border-zinc-800 text-center">
              <p className="text-xs text-zinc-400">
                No one in your immediate radius right now.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {nearbyUsers.map((user) => {
                const common = nearbyService.calculateCommonInterests(currentUser, user);
                const isConn = connectionService.isConnectedWith(user.uid);

                return (
                  <div
                    key={user.uid}
                    onClick={() => setSelectedUser(user)}
                    className="bg-[#141417] hover:bg-[#1a1a1f] p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={user.profilePhoto}
                          alt={user.displayName}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-zinc-800 group-hover:ring-zinc-600 transition-colors"
                        />
                        <span className="absolute bottom-0 right-0">
                          {getAvailabilityDot(user.socialAvailability || 'open')}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-zinc-200">
                            {user.displayName}
                          </h4>
                          <span className="text-xs text-zinc-400 font-mono">
                            {user.approximateDistance}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                          {user.currentStatus}
                        </p>

                        {common.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-zinc-400 font-medium">Shared:</span>
                            {common.slice(0, 2).map((item) => (
                              <span
                                key={item}
                                className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConn ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat(user.uid);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSendSignal(user);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Signal</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}



        </div>

      </div>

      {/* User Profile Sheet Drawer */}
      {selectedUser && (
        <UserProfileSheet
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => setSelectedUser(null)}
          onOpenSendSignal={onOpenSendSignal}
          onOpenChat={onOpenChat}
          onOpenReport={onOpenReport}
        />
      )}

    </div>
  );
};

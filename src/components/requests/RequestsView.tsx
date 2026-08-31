import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle2, Clock, XCircle, ArrowRight, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { User } from '../../types/user';
import { ConnectionRequest, SignalEmoji } from '../../types/connection';
import { connectionService } from '../../services/connectionService';
import { authService } from '../../services/authService';
import { nearbyService } from '../../services/nearbyService';

interface RequestsViewProps {
  currentUser: User;
  onConnectionSuccess: (otherUser: User) => void;
  onOpenChat: (otherUid: string) => void;
  onNavigateToRadar: () => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  currentUser,
  onConnectionSuccess,
  onOpenChat,
  onNavigateToRadar,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'sent'>('incoming');
  const [incomingReqs, setIncomingReqs] = useState<ConnectionRequest[]>([]);
  const [sentReqs, setSentReqs] = useState<ConnectionRequest[]>([]);

  const loadRequests = () => {
    setIncomingReqs(connectionService.getIncomingRequests());
    setSentReqs(connectionService.getSentRequests());
  };

  useEffect(() => {
    loadRequests();
    const unsub = connectionService.subscribe(loadRequests);
    return () => unsub();
  }, []);

  const handleAccept = async (req: ConnectionRequest) => {
    await connectionService.respondToRequest(req.requestId, 'accept');
    loadRequests();
    let senderUser = authService.getUserByUid(req.senderUid);
    if (!senderUser) {
      senderUser = (await authService.fetchUserByUid(req.senderUid)) || undefined;
    }
    if (senderUser) {
      onConnectionSuccess(senderUser);
    }
  };

  const handleIgnore = async (req: ConnectionRequest) => {
    await connectionService.respondToRequest(req.requestId, 'ignore');
    loadRequests();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Signals & Requests</span>
            {incomingReqs.length > 0 && (
              <span className="text-[11px] bg-white text-zinc-950 font-bold px-2 py-0.2 rounded-full">
                {incomingReqs.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-400">
            Mutual consent is required before conversation unlocks.
          </p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800 mb-6">
        <button
          onClick={() => setActiveSubTab('incoming')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'incoming'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Incoming ({incomingReqs.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('sent')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'sent'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Sent ({sentReqs.length})</span>
        </button>
      </div>

      {/* Incoming Requests List */}
      {activeSubTab === 'incoming' && (
        <div className="space-y-3">
          {incomingReqs.length === 0 ? (
            <div className="bg-[#141417] p-8 rounded-2xl border border-zinc-800 text-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-lg">
                🔔
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No new signals</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
                People nearby who share common interests can send you an emoji signal.
              </p>
              <button
                onClick={onNavigateToRadar}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors"
              >
                Open Proximity Radar
              </button>
            </div>
          ) : (
            incomingReqs.map((req) => {
              const sender = authService.getUserByUid(req.senderUid);
              if (!sender) return null;
              const common = nearbyService.calculateCommonInterests(currentUser, sender);

              return (
                <div
                  key={req.requestId}
                  className="bg-[#141417] p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={sender.profilePhoto}
                        alt={sender.displayName}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-zinc-700"
                      />
                      <span className="absolute -bottom-1 -right-1 text-base bg-zinc-900 rounded-full px-1 border border-zinc-800">
                        {req.emoji}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{sender.displayName}</h4>
                        <span className="text-xs text-zinc-400 font-mono">
                          {sender.approximateDistance}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Sent you a {req.emoji} signal
                      </p>

                      {common.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] text-zinc-400 font-medium">Shared:</span>
                          {common.slice(0, 2).map((item) => (
                            <span key={item} className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Accept & Ignore */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleIgnore(req)}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleAccept(req)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>Reply & Connect</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sent Requests List */}
      {activeSubTab === 'sent' && (
        <div className="space-y-3">
          {sentReqs.length === 0 ? (
            <div className="bg-[#141417] p-8 rounded-2xl border border-zinc-800 text-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-lg">
                📤
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No signals sent yet</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">
                Select a person on your proximity radar to send a low-pressure signal.
              </p>
              <button
                onClick={onNavigateToRadar}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors"
              >
                Find People Nearby
              </button>
            </div>
          ) : (
            sentReqs.map((req) => {
              const receiver = authService.getUserByUid(req.receiverUid);
              if (!receiver) return null;

              return (
                <div
                  key={req.requestId}
                  className="bg-[#141417] p-4 rounded-2xl border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={receiver.profilePhoto}
                        alt={receiver.displayName}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-zinc-700"
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs bg-zinc-900 rounded-full px-1 border border-zinc-800">
                        {req.emoji}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{receiver.displayName}</h4>
                      <p className="text-xs text-zinc-400">
                        You sent {req.emoji} signal • {receiver.approximateDistance}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>Pending</span>
                      </span>
                    )}

                    {req.status === 'accepted' && (
                      <button
                        onClick={() => onOpenChat(receiver.uid)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected • Chat</span>
                      </button>
                    )}

                    {req.status === 'expired' && (
                      <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 text-xs font-medium border border-zinc-800">
                        Expired
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Radio, ChevronRight, MessageSquare } from 'lucide-react';
import { User } from '../../types/user';
import { Connection } from '../../types/connection';
import { connectionService } from '../../services/connectionService';
import { authService } from '../../services/authService';

interface ChatsListViewProps {
  currentUser: User;
  onSelectChat: (connectionId: string, otherUser: User) => void;
  onNavigateToRadar: () => void;
}

export const ChatsListView: React.FC<ChatsListViewProps> = ({
  currentUser,
  onSelectChat,
  onNavigateToRadar,
}) => {
  const [connections, setConnections] = useState<Connection[]>(() => connectionService.getConnections());

  useEffect(() => {
    connectionService.fetchConnections().then(conns => setConnections(conns));
    const unsub = connectionService.subscribe(() => {
      setConnections(connectionService.getConnections());
    });
    return () => unsub();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Connections</span>
          {connections.length > 0 && (
            <span className="text-[11px] bg-white text-zinc-950 font-bold px-2 py-0.2 rounded-full">
              {connections.length}
            </span>
          )}
        </h2>
        <p className="text-xs text-zinc-400">
          Mutual connections unlocked through positive signal responses.
        </p>
      </div>

      {connections.length === 0 ? (
        <div className="bg-[#141417] p-10 rounded-2xl border border-zinc-800 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-xl">
            💬
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">No connections yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5 leading-relaxed font-normal">
            Your conversations will appear here after a mutual connection. Discover people nearby and send your first signal.
          </p>
          <button
            onClick={onNavigateToRadar}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 mx-auto transition-colors shadow-sm"
          >
            <Radio className="w-4 h-4" />
            <span>Open Proximity Radar</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {connections.map((conn) => {
            const otherUid = conn.user1 === currentUser.uid ? conn.user2 : conn.user1;
            const otherUser = authService.getUserByUid(otherUid);
            if (!otherUser) return null;

            return (
              <div
                key={conn.connectionId}
                onClick={() => onSelectChat(conn.connectionId, otherUser)}
                className="bg-[#141417] hover:bg-[#1a1a1f] p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={otherUser.profilePhoto}
                      alt={otherUser.displayName}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-zinc-700"
                    />
                    {otherUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#141417] rounded-full" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-zinc-200">
                        {otherUser.displayName}
                      </h4>
                      <span className="text-xs text-zinc-400 font-mono">
                        {otherUser.approximateDistance}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 font-normal">
                      {conn.lastMessageSnippet || 'Connected! Start the conversation'}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1">
                      <span>Interests: {otherUser.interests.slice(0, 2).join(' • ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {conn.unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { Radio, Bell, MessageSquare, Calendar, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingRequestsCount: number;
  unreadChatsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingRequestsCount,
  unreadChatsCount,
}) => {
  const navItems = [
    { id: 'radar', label: 'Radar', icon: Radio, badge: 0 },
    { id: 'requests', label: 'Requests', icon: Bell, badge: pendingRequestsCount },
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadChatsCount },
    { id: 'events', label: 'Events', icon: Calendar, badge: 0 },
    { id: 'profile', label: 'Profile', icon: UserIcon, badge: 0 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d10]/95 backdrop-blur-md border-t border-zinc-800 pb-safe transition-all">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 py-1 relative transition-all rounded-lg ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105 text-white' : 'text-zinc-400'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-white text-zinc-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'text-white font-semibold' : 'text-zinc-400 font-normal'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

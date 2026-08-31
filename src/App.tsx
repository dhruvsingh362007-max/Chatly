import React, { useState, useEffect } from 'react';
import { User } from './types/user';
import { EventItem } from './types/event';
import { SignalEmoji } from './types/connection';
import { authService } from './services/authService';
import { connectionService } from './services/connectionService';

import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileSetupModal } from './components/auth/ProfileSetupModal';
import { RadarView } from './components/radar/RadarView';
import { SendSignalModal } from './components/signal/SendSignalModal';
import { ConnectionModal } from './components/signal/ConnectionModal';
import { RequestsView } from './components/requests/RequestsView';
import { ChatsListView } from './components/chat/ChatsListView';
import { ChatWindow } from './components/chat/ChatWindow';
import { EventsView } from './components/events/EventsView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsModal } from './components/profile/SettingsModal';
import { ReportModal } from './components/safety/ReportModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [showLanding, setShowLanding] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'requests' | 'chats' | 'events' | 'profile'>('radar');

  // Modals & Sheets
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reportTargetUser, setReportTargetUser] = useState<User | null>(null);

  // Signal & Connection Flow
  const [signalTargetUser, setSignalTargetUser] = useState<User | null>(null);
  const [celebrationUser, setCelebrationUser] = useState<User | null>(null);

  // Active Chat Window State
  const [activeChat, setActiveChat] = useState<{ connectionId: string; otherUser: User } | null>(null);

  // Active Event Filter for Radar
  const [activeEventFilter, setActiveEventFilter] = useState<{ eventId: string; name: string; participantUids: string[] } | null>(null);

  // Badges count
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    const unsubAuth = authService.subscribe((u) => {
      setCurrentUser(u);
    });

    const updateBadges = () => {
      setPendingRequestsCount(connectionService.getIncomingRequests().length);
      const conns = connectionService.getConnections();
      const unread = conns.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setUnreadChatsCount(unread);
    };

    updateBadges();
    const unsubConn = connectionService.subscribe(updateBadges);

    return () => {
      unsubAuth();
      unsubConn();
    };
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (isNewUser: boolean) => {
    setIsAuthOpen(false);
    setShowLanding(false);
    if (isNewUser) {
      setIsProfileSetupOpen(true);
    }
  };

  const handleConnectionSuccess = (otherUser: User) => {
    setCelebrationUser(otherUser);
  };

  const handleStartChatFromConnection = async (otherUid: string) => {
    let conn = connectionService.getConnectionByUserId(otherUid);
    if (!conn) {
      await connectionService.fetchConnections();
      conn = connectionService.getConnectionByUserId(otherUid);
    }
    let otherUser = authService.getUserByUid(otherUid);
    if (!otherUser) {
      otherUser = (await authService.fetchUserByUid(otherUid)) || undefined;
    }
    if (conn && otherUser) {
      setActiveChat({ connectionId: conn.connectionId, otherUser });
      setActiveTab('chats');
    }
  };

  const handleFilterRadarByEvent = (event: EventItem) => {
    setActiveEventFilter({
      eventId: event.eventId,
      name: event.name,
      participantUids: event.participantUids
    });
    setActiveTab('radar');
  };

  // If user explicitly chose to view the Landing Page or is logged out
  if (showLanding || !currentUser) {
    return (
      <>
        <LandingPage
          onGetStarted={() => handleOpenAuth('signup')}
          onLogin={() => handleOpenAuth('login')}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveChat(null);
          setActiveTab(tab as any);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfileSetup={() => setIsProfileSetupOpen(true)}
        onToggleDiscoverable={() => {
          authService.setDiscoverable(!currentUser.isDiscoverable);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-6 overflow-x-hidden">
        
        {/* Radar View */}
        {activeTab === 'radar' && (
          <RadarView
            currentUser={currentUser}
            onOpenSendSignal={(user) => setSignalTargetUser(user)}
            onOpenChat={(otherUid) => handleStartChatFromConnection(otherUid)}
            onOpenReport={(user) => setReportTargetUser(user)}
            activeEventFilter={activeEventFilter}
            onClearEventFilter={() => setActiveEventFilter(null)}
            onNavigateToRequests={() => setActiveTab('requests')}
          />
        )}

        {/* Requests View */}
        {activeTab === 'requests' && (
          <RequestsView
            currentUser={currentUser}
            onConnectionSuccess={handleConnectionSuccess}
            onOpenChat={(otherUid) => handleStartChatFromConnection(otherUid)}
            onNavigateToRadar={() => setActiveTab('radar')}
          />
        )}

        {/* Chats View */}
        {activeTab === 'chats' && (
          activeChat ? (
            <ChatWindow
              connectionId={activeChat.connectionId}
              otherUser={activeChat.otherUser}
              currentUser={currentUser}
              onBack={() => setActiveChat(null)}
              onOpenReport={(user) => setReportTargetUser(user)}
            />
          ) : (
            <ChatsListView
              currentUser={currentUser}
              onSelectChat={(connectionId, otherUser) => setActiveChat({ connectionId, otherUser })}
              onNavigateToRadar={() => setActiveTab('radar')}
            />
          )
        )}

        {/* Events & Groups View */}
        {activeTab === 'events' && (
          <EventsView
            onFilterRadarByEvent={handleFilterRadarByEvent}
          />
        )}

        {/* Profile View */}
        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenEditProfile={() => setIsProfileSetupOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={() => {
              authService.logout();
              setShowLanding(true);
            }}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveChat(null);
          setActiveTab(tab as any);
        }}
        pendingRequestsCount={pendingRequestsCount}
        unreadChatsCount={unreadChatsCount}
      />

      {/* Global Modals */}
      {/* 1. Profile Setup Wizard */}
      <ProfileSetupModal
        isOpen={isProfileSetupOpen}
        onComplete={() => setIsProfileSetupOpen(false)}
      />

      {/* 2. Send Signal Modal */}
      <SendSignalModal
        user={signalTargetUser}
        isOpen={!!signalTargetUser}
        onClose={() => setSignalTargetUser(null)}
        onSignalSent={(targetUser, emoji) => {
          // Signal sent
        }}
      />

      {/* 3. 🎉 Connection Celebration Modal */}
      <ConnectionModal
        isOpen={!!celebrationUser}
        connectedUser={celebrationUser}
        currentUser={currentUser}
        onClose={() => setCelebrationUser(null)}
        onStartChat={(targetUid) => {
          setCelebrationUser(null);
          handleStartChatFromConnection(targetUid);
        }}
      />

      {/* 4. Settings & Privacy Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        currentUser={currentUser}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={() => {
          setIsSettingsOpen(false);
          authService.logout();
          setShowLanding(true);
        }}
      />

      {/* 5. Report User Modal */}
      <ReportModal
        isOpen={!!reportTargetUser}
        targetUser={reportTargetUser}
        onClose={() => setReportTargetUser(null)}
      />

      {/* 6. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

    </div>
  );
};

export type SignalEmoji = 
  | '👋'
  | '🤝'
  | '💻'
  | '📚'
  | '🎮'
  | '🎵'
  | '🏎️'
  | '☕'
  | '🗣️';

export interface SignalOption {
  emoji: SignalEmoji;
  label: string;
  description: string;
}

export const AVAILABLE_SIGNALS: SignalOption[] = [
  { emoji: '👋', label: 'Say Hi', description: 'Friendly low-pressure wave' },
  { emoji: '🤝', label: 'Connect', description: 'Interested in networking' },
  { emoji: '💻', label: 'Coding', description: 'Talk dev, tech or projects' },
  { emoji: '📚', label: 'Study', description: 'Study partner or library buddy' },
  { emoji: '🎮', label: 'Gaming', description: 'Squad up or discuss games' },
  { emoji: '🎵', label: 'Music', description: 'Share playlists or artists' },
  { emoji: '🏎️', label: 'F1', description: 'Talk racing, qualifying & GPs' },
  { emoji: '☕', label: 'Hang Out', description: 'Grab a quick coffee or break' },
  { emoji: '🗣️', label: 'Talk', description: 'Up for a casual conversation' },
];

export type RequestStatus = 'pending' | 'accepted' | 'expired';

export interface ConnectionRequest {
  requestId: string;
  senderUid: string;
  receiverUid: string;
  emoji: SignalEmoji;
  status: RequestStatus;
  createdAt: number;
  expiresAt: number;
  sharedInterestsCount?: number;
}

export interface Connection {
  connectionId: string;
  user1: string; // current user or other user
  user2: string; // other user or current user
  otherUserUid: string;
  createdAt: number;
  lastMessageSnippet?: string;
  lastMessageTime?: number;
  unreadCount: number;
}

export type InterestCategory = 
  | '🏎️ F1'
  | '💻 Coding'
  | '🎮 Gaming'
  | '🎵 Music'
  | '⚽ Football'
  | '📚 Study'
  | '📸 Photography'
  | '🎬 Movies'
  | '📖 Books'
  | '🏋️ Fitness'
  | '🎨 Art';

export type UserStatus = 
  | '👋 Just saying hi'
  | '🤝 Making friends'
  | '💻 Looking for coding friends'
  | '📚 Looking for study partners'
  | '🎮 Looking for gaming squad'
  | '☕ Up for casual hangout'
  | '🏎️ Looking for F1 watch party'
  | '🗣️ Just want to talk';

export type SocialAvailability = 'open' | 'maybe' | 'busy';

export type SessionDuration = '30m' | '1h' | 'until_off';

export interface User {
  uid: string;
  username: string;
  displayName: string;
  profilePhoto: string;
  bio: string;
  interests: InterestCategory[];
  isDiscoverable: boolean;
  ghostMode: boolean;
  socialAvailability: SocialAvailability;
  locationSessionExpiresAt: number | null; // timestamp in ms or null if until_off
  sessionDurationType: SessionDuration;
  approximateDistance: '~20m' | '~40m' | '~60m' | '~80m' | '~100m';
  distanceMeters: number; // strictly internal, never exposed
  radarAngleDeg: number;  // Fuzzed angle (0-360)
  radarDistancePct: number; // 20% to 90%
  lastLocationUpdate: number;
  currentStatus: UserStatus;
  isOnline: boolean;
}

export interface UserSettings {
  discoverable: boolean;
  ghostMode: boolean;
  socialAvailability: SocialAvailability;
  approximateDistance: boolean;
  radarRandomization: boolean;
  sessionDuration: SessionDuration;
  blockedUserUids: string[];
}

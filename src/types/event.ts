export interface EventItem {
  eventId: string;
  name: string;
  description: string;
  locationArea: string;
  startTime: string;
  endTime: string;
  participantsCount: number;
  participantUids: string[];
  tag: string;
  icon: string;
  bannerGradient: string;
  isJoined?: boolean;
}

export interface GroupItem {
  groupId: string;
  name: string;
  description: string;
  category: string;
  creatorUid: string;
  currentMembers: number;
  maxMembers: number;
  memberUids: string[];
  icon: string;
  isJoined?: boolean;
}

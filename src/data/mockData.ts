import { User } from '../types/user';
import { ConnectionRequest, Connection } from '../types/connection';
import { Message } from '../types/chat';
import { EventItem, GroupItem } from '../types/event';

export const INITIAL_CURRENT_USER: User = {
  uid: 'user_me',
  username: 'alex_chen',
  displayName: 'Alex Chen',
  profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Tech enthusiast, McLaren F1 fan, and building web apps. Happy to chat tech, games or study!',
  interests: ['🏎️ F1', '💻 Coding', '🎮 Gaming', '🎵 Music'],
  isDiscoverable: true,
  ghostMode: false,
  socialAvailability: 'open',
  locationSessionExpiresAt: Date.now() + 45 * 60 * 1000,
  sessionDurationType: '1h',
  approximateDistance: '~20m',
  distanceMeters: 0,
  radarAngleDeg: 0,
  radarDistancePct: 0,
  lastLocationUpdate: Date.now(),
  currentStatus: '💻 Looking for coding friends',
  isOnline: true
};

export const MOCK_NEARBY_USERS: User[] = [
  {
    uid: 'user_priya',
    username: 'priya123',
    displayName: 'Priya Sharma',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Love music, coding and meeting new people. Big McLaren fan! 🏎️',
    interests: ['🏎️ F1', '💻 Coding', '🎵 Music'],
    isDiscoverable: true,
    ghostMode: false,
    socialAvailability: 'open',
    locationSessionExpiresAt: Date.now() + 3600000,
    sessionDurationType: '1h',
    approximateDistance: '~20m',
    distanceMeters: 18,
    radarAngleDeg: 42,
    radarDistancePct: 30,
    lastLocationUpdate: Date.now() - 120000,
    currentStatus: '💻 Looking for coding friends',
    isOnline: true
  },
  {
    uid: 'user_rahul',
    username: 'rahul_dev',
    displayName: 'Rahul Verma',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'CS student, competitive gamer, and always down for a study or coffee sprint.',
    interests: ['🎮 Gaming', '💻 Coding', '📚 Study'],
    isDiscoverable: true,
    ghostMode: false,
    socialAvailability: 'open',
    locationSessionExpiresAt: Date.now() + 1800000,
    sessionDurationType: '30m',
    approximateDistance: '~40m',
    distanceMeters: 38,
    radarAngleDeg: 285,
    radarDistancePct: 48,
    lastLocationUpdate: Date.now() - 60000,
    currentStatus: '📚 Looking for study partners',
    isOnline: true
  },
  {
    uid: 'user_arjun',
    username: 'arjun_k',
    displayName: 'Arjun Kapoor',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Football fanatic (Hala Madrid!), indie rock on repeat. Taking a breather between classes.',
    interests: ['⚽ Football', '🎵 Music'],
    isDiscoverable: true,
    ghostMode: false,
    socialAvailability: 'maybe',
    locationSessionExpiresAt: null,
    sessionDurationType: 'until_off',
    approximateDistance: '~60m',
    distanceMeters: 58,
    radarAngleDeg: 145,
    radarDistancePct: 65,
    lastLocationUpdate: Date.now() - 300000,
    currentStatus: '👋 Just saying hi',
    isOnline: true
  },
  {
    uid: 'user_aman',
    username: 'aman_clicks',
    displayName: 'Aman Patel',
    profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    bio: 'Street & motorsport photography. Always chasing great golden hour light.',
    interests: ['📸 Photography', '🏎️ F1'],
    isDiscoverable: true,
    ghostMode: false,
    socialAvailability: 'busy',
    locationSessionExpiresAt: Date.now() + 2400000,
    sessionDurationType: '1h',
    approximateDistance: '~80m',
    distanceMeters: 76,
    radarAngleDeg: 215,
    radarDistancePct: 82,
    lastLocationUpdate: Date.now() - 450000,
    currentStatus: '🏎️ Looking for F1 watch party',
    isOnline: false
  },
  {
    uid: 'user_maya',
    username: 'maya_design',
    displayName: 'Maya Sen',
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Digital illustrator, UI enthusiast & book lover. Chilling at the coffee counter.',
    interests: ['🎨 Art', '📖 Books', '🎬 Movies'],
    isDiscoverable: true,
    ghostMode: false,
    socialAvailability: 'open',
    locationSessionExpiresAt: Date.now() + 1200000,
    sessionDurationType: '30m',
    approximateDistance: '~40m',
    distanceMeters: 42,
    radarAngleDeg: 338,
    radarDistancePct: 50,
    lastLocationUpdate: Date.now() - 30000,
    currentStatus: '☕ Up for casual hangout',
    isOnline: true
  }
];

export const INITIAL_REQUESTS: ConnectionRequest[] = [
  {
    requestId: 'req_rahul_1',
    senderUid: 'user_rahul',
    receiverUid: 'user_me',
    emoji: '💻',
    status: 'pending',
    createdAt: Date.now() - 15 * 60 * 1000,
    expiresAt: Date.now() + 45 * 60 * 1000,
    sharedInterestsCount: 2
  }
];

export const INITIAL_CONNECTIONS: Connection[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const ICEBREAKER_TEMPLATES: Record<string, string[]> = {
  '🏎️ F1': [
    "🏎️ Who's your favorite F1 driver this season?",
    "🏎️ Did you catch the last qualifying session?",
    "🏎️ Are you rooting for McLaren, Ferrari, or Red Bull?"
  ],
  '💻 Coding': [
    "💻 What cool project or stack are you currently building?",
    "💻 Tabs or spaces? And more importantly: frontend or backend?",
    "💻 Working on anything fun today or tackling bugs?"
  ],
  '🎮 Gaming': [
    "🎮 What games are currently on your rotation?",
    "🎮 Up for teaming up sometime?",
    "🎮 PC, console or handheld?"
  ],
  '🎵 Music': [
    "🎵 What's your current song on repeat?",
    "🎵 Have you listened to any great live sets recently?",
    "🎵 Drop your top artist right now!"
  ],
  '📚 Study': [
    "📚 What subject or course are you grinding through right now?",
    "📚 Need a study partner or quiet focus buddy?",
    "📚 Pomodoro or marathon study sessions?"
  ],
  '📸 Photography': [
    "📸 What's your go-to camera or lens setup?",
    "📸 Spotted any great photo spots around here?"
  ],
  '⚽ Football': [
    "⚽ Who's taking the league this year?",
    "⚽ Do you play or mostly watch matches?"
  ],
  '☕ Up for casual hangout': [
    "☕ What's your go-to coffee order around here?",
    "☕ Taking a break from work or classes?"
  ],
  'General': [
    "👋 Hey! Saw we have some awesome interests in common.",
    "👋 Hey there! How is your day going so far?",
    "✨ Great connecting with someone nearby with similar vibes!"
  ]
};

export const MOCK_EVENTS: EventItem[] = [
  {
    eventId: 'event_techfest',
    name: 'TechFest Campus 2026',
    description: 'Annual campus tech summit featuring AI showcase, robotics arena & startup demo pods.',
    locationArea: 'Main Auditorium & Innovation Hall',
    startTime: '10:00 AM',
    endTime: '6:00 PM',
    participantsCount: 142,
    participantUids: ['user_priya', 'user_rahul', 'user_me'],
    tag: 'Campus Tech',
    icon: '🎪',
    bannerGradient: 'from-zinc-900 to-zinc-950',
    isJoined: true
  },
  {
    eventId: 'event_hackathon',
    name: '24-Hour Student Hackathon',
    description: 'Build fast, break boundaries! Find squad members, brainstorm ideas and ship.',
    locationArea: 'Design & Code Lab 3',
    startTime: 'Tomorrow, 9:00 AM',
    endTime: '24 Hours',
    participantsCount: 88,
    participantUids: ['user_priya', 'user_rahul'],
    tag: 'Hackathon',
    icon: '💻',
    bannerGradient: 'from-zinc-900 to-zinc-950',
    isJoined: false
  },
  {
    eventId: 'event_f1_watch',
    name: 'Grand Prix Live Watch Party',
    description: 'Big-screen projection of the Sunday GP race with live timing and commentary lounge.',
    locationArea: 'Student Commons Lounge',
    startTime: 'Sunday, 6:30 PM',
    endTime: '9:00 PM',
    participantsCount: 35,
    participantUids: ['user_priya', 'user_aman', 'user_me'],
    tag: 'Sports & Racing',
    icon: '🏎️',
    bannerGradient: 'from-zinc-900 to-zinc-950',
    isJoined: true
  },
  {
    eventId: 'event_gaming',
    name: 'Friday Smash & Valorant LAN',
    description: 'Casual bracket tournaments, snacks, and open multiplayer setups.',
    locationArea: 'Recreation Center B2',
    startTime: 'Friday, 5:00 PM',
    endTime: '10:00 PM',
    participantsCount: 56,
    participantUids: ['user_rahul'],
    tag: 'Gaming',
    icon: '🎮',
    bannerGradient: 'from-zinc-900 to-zinc-950',
    isJoined: false
  }
];

export const MOCK_GROUPS: GroupItem[] = [
  {
    groupId: 'group_valorant',
    name: 'Valorant Competitive Squad',
    description: 'Looking for 2 more players (Gold/Plat rank) for evening scrims.',
    category: 'Gaming',
    creatorUid: 'user_rahul',
    currentMembers: 3,
    maxMembers: 5,
    memberUids: ['user_rahul'],
    icon: '🎮',
    isJoined: false
  },
  {
    groupId: 'group_study',
    name: 'Algorithms & Systems Study Group',
    description: 'Daily 2-hour study sprints, LeetCode discussions and exam prep.',
    category: 'Study',
    creatorUid: 'user_rahul',
    currentMembers: 4,
    maxMembers: 6,
    memberUids: ['user_rahul', 'user_priya'],
    icon: '📚',
    isJoined: true
  },
  {
    groupId: 'group_f1',
    name: 'F1 Pitwall Discussion Club',
    description: 'Debating team telemetry, tire strategies, and driver moves each race weekend.',
    category: 'Motorsport',
    creatorUid: 'user_aman',
    currentMembers: 7,
    maxMembers: 12,
    memberUids: ['user_aman', 'user_priya'],
    icon: '🏎️',
    isJoined: false
  }
];

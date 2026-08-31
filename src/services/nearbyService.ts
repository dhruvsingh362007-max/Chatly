import { User } from '../types/user';
import { authService } from './authService';
import { safetyService } from './safetyService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

class NearbyService {
  private users: User[] = [];
  private listeners: Array<() => void> = [];
  private realtimeChannel: any = null;
  private pollInterval: any = null;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Initial fetch and trigger on auth user change
    authService.subscribe((user) => {
      if (user) {
        this.fetchNearbyUsers();
        this.setupRealtime();
      } else {
        this.users = [];
        this.notify();
      }
    });

    // 2. Setup periodic poll as a rock-solid fallback
    if (typeof window !== 'undefined') {
      this.pollInterval = setInterval(() => {
        if (!document.hidden && authService.isLoggedIn()) {
          this.fetchNearbyUsers();
        }
      }, 4000);

      window.addEventListener('focus', () => {
        if (authService.isLoggedIn()) {
          this.fetchNearbyUsers();
        }
      });
    }
  }

  private setupRealtime() {
    if (!isSupabaseConfigured() || this.realtimeChannel) return;

    try {
      this.realtimeChannel = supabase
        .channel('chatly_nearby_profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            if (payload.new) {
              const row = payload.new as any;
              const currentUid = authService.getCurrentUid();
              if (row.id !== currentUid) {
                const updatedUser = authService.mapRowToUser(row);
                authService.cacheUser(updatedUser);

                const idx = this.users.findIndex(u => u.uid === updatedUser.uid);
                if (idx !== -1) {
                  if (!updatedUser.isDiscoverable || updatedUser.ghostMode) {
                    this.users.splice(idx, 1);
                  } else {
                    this.users[idx] = updatedUser;
                  }
                } else if (updatedUser.isDiscoverable && !updatedUser.ghostMode) {
                  this.users.push(updatedUser);
                }
                this.notify();
              }
            }
            this.fetchNearbyUsers();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime channel error in nearbyService:', err);
    }
  }

  async fetchNearbyUsers(): Promise<User[]> {
    if (!isSupabaseConfigured()) {
      this.users = [];
      this.notify();
      return [];
    }

    try {
      const currentUid = authService.getCurrentUid();
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_discoverable', true)
        .eq('ghost_mode', false);

      if (currentUid) {
        query = query.neq('id', currentUid);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching nearby profiles from Supabase:', error);
        return this.users;
      }

      if (data) {
        this.users = data.map((row: any) => {
          const user = authService.mapRowToUser(row);
          authService.cacheUser(user);
          return user;
        });
        this.notify();
      }

      return this.users;
    } catch (err) {
      console.error('Failed to fetch nearby users:', err);
      return this.users;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  getNearbyUsers(filterEventParticipantUids?: string[]): User[] {
    const currentUid = authService.getCurrentUid();
    const blocked = new Set(safetyService.getBlockedUids());

    return this.users.filter(u => {
      // Don't show current user in nearby list
      if (currentUid && u.uid === currentUid) return false;
      // Don't show blocked users
      if (blocked.has(u.uid)) return false;
      // If filtering for an event, check participant membership
      if (filterEventParticipantUids && !filterEventParticipantUids.includes(u.uid)) {
        return false;
      }
      // Must be discoverable and not in ghost mode
      if (!u.isDiscoverable || u.ghostMode) return false;
      return true;
    });
  }

  calculateCommonInterests(userA: User, userB: User): string[] {
    if (!userA?.interests || !userB?.interests) return [];
    const setA = new Set(userA.interests);
    return userB.interests.filter(interest => setA.has(interest));
  }

  getUserById(uid: string): User | undefined {
    return authService.getUserByUid(uid) || this.users.find(u => u.uid === uid);
  }

  async fetchUserById(uid: string): Promise<User | null> {
    const cached = this.getUserById(uid);
    if (cached) return cached;
    return authService.fetchUserByUid(uid);
  }
}

export const nearbyService = new NearbyService();

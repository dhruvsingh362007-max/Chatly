import { User, UserStatus, SessionDuration, SocialAvailability } from '../types/user';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated: boolean = false;
  private listeners: Array<(user: User | null) => void> = [];
  private isInitialized: boolean = false;
  private usersCache: Map<string, User> = new Map();

  constructor() {
    this.initSession();
  }

  private async initSession() {
    if (!isSupabaseConfigured()) {
      this.isInitialized = true;
      this.notify();
      return;
    }

    try {
      // 1. Check existing active session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        await this.loadUserProfile(session.user.id, session.user.email);
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
      }
    } catch (err) {
      console.error('Failed to initialize Supabase session:', err);
    } finally {
      this.isInitialized = true;
      this.notify();
    }

    // 2. Listen to real-time auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await this.loadUserProfile(session.user.id, session.user.email);
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.notify();
      }
    });
  }

  private async loadUserProfile(userId: string, userEmail?: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
      }

      if (data) {
        this.currentUser = this.mapRowToUser(data);
        this.usersCache.set(this.currentUser.uid, this.currentUser);
        this.isAuthenticated = true;
        this.notify();
        return this.currentUser;
      } else {
        // Create fallback profile row from user metadata
        const { data: { user } } = await supabase.auth.getUser();
        const metadata = user?.user_metadata || {};
        const randAngle = Math.floor(Math.random() * 360);
        const randDistPct = Math.floor(25 + Math.random() * 50);
        const randApproxDist = randDistPct < 35 ? '~20m' : randDistPct < 50 ? '~40m' : randDistPct < 65 ? '~60m' : '~80m';

        const fallbackUser: User = {
          uid: userId,
          username: metadata.username || userEmail?.split('@')[0] || 'user_' + userId.slice(0, 5),
          displayName: metadata.display_name || userEmail?.split('@')[0] || 'Chatly Member',
          profilePhoto: metadata.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: metadata.bio || 'Exploring connections nearby.',
          interests: metadata.interests || ['🏎️ F1', '💻 Coding'],
          isDiscoverable: true,
          ghostMode: false,
          socialAvailability: metadata.social_availability || 'open',
          locationSessionExpiresAt: Date.now() + 60 * 60 * 1000,
          sessionDurationType: '1h',
          approximateDistance: randApproxDist as any,
          distanceMeters: 0,
          radarAngleDeg: randAngle,
          radarDistancePct: randDistPct,
          lastLocationUpdate: Date.now(),
          currentStatus: metadata.current_status || '👋 Just saying hi',
          isOnline: true
        };

        await this.upsertProfileRecord(fallbackUser);
        this.currentUser = fallbackUser;
        this.usersCache.set(fallbackUser.uid, fallbackUser);
        this.isAuthenticated = true;
        this.notify();
        return fallbackUser;
      }
    } catch (e) {
      console.error('loadUserProfile error:', e);
      return null;
    }
  }

  public mapRowToUser(row: any): User {
    const fallbackAngle = ((row.id?.charCodeAt(0) || 0) * 73 + (row.id?.charCodeAt(1) || 0) * 19) % 360;
    const fallbackDistPct = 25 + (((row.id?.charCodeAt(2) || 0) * 37) % 50);
    const radarDistPct = Number(row.radar_distance_pct) || fallbackDistPct;
    const fallbackApproxDist = radarDistPct < 35 ? '~20m' : radarDistPct < 50 ? '~40m' : radarDistPct < 65 ? '~60m' : '~80m';

    return {
      uid: row.id,
      username: row.username || 'user',
      displayName: row.display_name || 'Member',
      profilePhoto: row.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: row.bio || '',
      interests: Array.isArray(row.interests) ? row.interests : ['🏎️ F1', '💻 Coding'],
      isDiscoverable: row.is_discoverable ?? true,
      ghostMode: row.ghost_mode ?? false,
      socialAvailability: (row.social_availability as SocialAvailability) || 'open',
      locationSessionExpiresAt: row.location_session_expires_at ? new Date(row.location_session_expires_at).getTime() : null,
      sessionDurationType: (row.session_duration_type as SessionDuration) || '1h',
      approximateDistance: (row.approximate_distance as any) || fallbackApproxDist,
      distanceMeters: 0,
      radarAngleDeg: Number(row.radar_angle_deg) || fallbackAngle,
      radarDistancePct: radarDistPct,
      lastLocationUpdate: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
      currentStatus: (row.current_status as UserStatus) || '👋 Just saying hi',
      isOnline: row.is_online ?? true,
    };
  }

  private async upsertProfileRecord(user: User): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('profiles').upsert({
        id: user.uid,
        username: user.username,
        display_name: user.displayName,
        profile_photo: user.profilePhoto,
        bio: user.bio,
        interests: user.interests,
        current_status: user.currentStatus,
        social_availability: user.socialAvailability,
        is_discoverable: user.isDiscoverable,
        ghost_mode: user.ghostMode,
        session_duration_type: user.sessionDurationType,
        location_session_expires_at: user.locationSessionExpiresAt ? new Date(user.locationSessionExpiresAt).toISOString() : null,
        approximate_distance: user.approximateDistance,
        radar_angle_deg: user.radarAngleDeg,
        radar_distance_pct: user.radarDistancePct,
        is_online: user.isOnline,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to upsert profile record:', err);
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentUid(): string {
    return this.currentUser?.uid || '';
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated && Boolean(this.currentUser);
  }

  isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  /**
   * Real Supabase Authentication: Sign Up
   */
  async signup(data: {
    email: string;
    password?: string;
    displayName: string;
    username: string;
    bio?: string;
    interests?: User['interests'];
    profilePhoto?: string;
    currentStatus?: UserStatus;
    socialAvailability?: SocialAvailability;
  }): Promise<{ user: User | null; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { 
        user: null, 
        error: 'Supabase credentials are not configured in .env.local. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.' 
      };
    }

    try {
      const cleanUsername = data.username.replace(/^@/, '').trim().toLowerCase();
      const pwd = data.password || 'ChatlySecure123!';

      // 1. Check if username is already taken in profiles table
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        return { user: null, error: `The username @${cleanUsername} is already taken. Please choose another.` };
      }

      // 2. Call Supabase Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: pwd,
        options: {
          data: {
            username: cleanUsername,
            display_name: data.displayName.trim(),
            bio: data.bio || 'Exploring connections nearby.',
            interests: data.interests || ['🏎️ F1', '💻 Coding'],
            profile_photo: data.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            current_status: data.currentStatus || '👋 Just saying hi',
            social_availability: data.socialAvailability || 'open'
          }
        }
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create user account.' };
      }

      // 3. Upsert profile row directly to ensure instant availability
      const randAngle = Math.floor(Math.random() * 360);
      const randDistPct = Math.floor(25 + Math.random() * 50);
      const randApproxDist = randDistPct < 35 ? '~20m' : randDistPct < 50 ? '~40m' : randDistPct < 65 ? '~60m' : '~80m';

      const newUser: User = {
        uid: authData.user.id,
        username: cleanUsername,
        displayName: data.displayName.trim(),
        profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: data.bio || 'Exploring connections nearby.',
        interests: data.interests || ['🏎️ F1', '💻 Coding'],
        isDiscoverable: true,
        ghostMode: false,
        socialAvailability: data.socialAvailability || 'open',
        locationSessionExpiresAt: Date.now() + 60 * 60 * 1000,
        sessionDurationType: '1h',
        approximateDistance: randApproxDist as any,
        distanceMeters: 0,
        radarAngleDeg: randAngle,
        radarDistancePct: randDistPct,
        lastLocationUpdate: Date.now(),
        currentStatus: data.currentStatus || '👋 Just saying hi',
        isOnline: true
      };

      await this.upsertProfileRecord(newUser);
      this.currentUser = newUser;
      this.usersCache.set(newUser.uid, newUser);
      this.isAuthenticated = true;
      this.notify();

      return { user: newUser };
    } catch (err: any) {
      return { user: null, error: err.message || 'An unexpected error occurred during signup.' };
    }
  }

  /**
   * Real Supabase Authentication: Sign In
   */
  async login(emailOrUsername: string, password?: string): Promise<{ user: User | null; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { 
        user: null, 
        error: 'Supabase credentials are not configured in .env.local. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.' 
      };
    }

    try {
      const email = emailOrUsername.trim();
      const pwd = password || 'ChatlySecure123!';

      if (!email.includes('@')) {
        return { user: null, error: 'Please enter your email address to sign in.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'User not found.' };
      }

      const user = await this.loadUserProfile(data.user.id, data.user.email);
      return { user };
    } catch (err: any) {
      return { user: null, error: err.message || 'An unexpected error occurred during sign in.' };
    }
  }

  /**
   * Real Supabase Profile Update
   */
  async updateProfile(updates: Partial<User>): Promise<User | null> {
    if (!this.currentUser) return null;

    this.currentUser = {
      ...this.currentUser,
      ...updates
    };
    this.usersCache.set(this.currentUser.uid, this.currentUser);

    if (isSupabaseConfigured()) {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.username !== undefined) dbUpdates.username = updates.username.replace(/^@/, '').toLowerCase();
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto;
      if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
      if (updates.currentStatus !== undefined) dbUpdates.current_status = updates.currentStatus;
      if (updates.socialAvailability !== undefined) dbUpdates.social_availability = updates.socialAvailability;
      if (updates.isDiscoverable !== undefined) dbUpdates.is_discoverable = updates.isDiscoverable;
      if (updates.ghostMode !== undefined) dbUpdates.ghost_mode = updates.ghostMode;
      if (updates.sessionDurationType !== undefined) dbUpdates.session_duration_type = updates.sessionDurationType;
      if (updates.locationSessionExpiresAt !== undefined) {
        dbUpdates.location_session_expires_at = updates.locationSessionExpiresAt 
          ? new Date(updates.locationSessionExpiresAt).toISOString() 
          : null;
      }

      await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', this.currentUser.uid);
    }

    this.notify();
    return this.currentUser;
  }

  async updateStatus(status: UserStatus): Promise<User | null> {
    return this.updateProfile({ currentStatus: status });
  }

  async setSocialAvailability(socialAvailability: SocialAvailability): Promise<User | null> {
    return this.updateProfile({ socialAvailability });
  }

  async setDiscoverable(isDiscoverable: boolean): Promise<User | null> {
    const sessionExpires = isDiscoverable 
      ? (this.currentUser?.sessionDurationType === 'until_off' ? null : Date.now() + (this.currentUser?.sessionDurationType === '30m' ? 30 : 60) * 60 * 1000)
      : null;

    return this.updateProfile({ 
      isDiscoverable,
      locationSessionExpiresAt: sessionExpires
    });
  }

  async setGhostMode(ghostMode: boolean): Promise<User | null> {
    return this.updateProfile({ ghostMode });
  }

  async setSessionDuration(duration: SessionDuration): Promise<User | null> {
    const sessionExpires = duration === 'until_off' 
      ? null 
      : Date.now() + (duration === '30m' ? 30 : 60) * 60 * 1000;

    return this.updateProfile({ 
      sessionDurationType: duration,
      locationSessionExpiresAt: sessionExpires,
      isDiscoverable: true
    });
  }

  getUserByUid(uid: string): User | undefined {
    if (this.currentUser && (uid === this.currentUser.uid || uid === 'user_me')) {
      return this.currentUser;
    }
    return this.usersCache.get(uid);
  }

  cacheUser(user: User): void {
    if (user && user.uid) {
      this.usersCache.set(user.uid, user);
    }
  }

  async fetchUserByUid(uid: string): Promise<User | null> {
    if (this.currentUser && (uid === this.currentUser.uid || uid === 'user_me')) {
      return this.currentUser;
    }
    if (this.usersCache.has(uid)) {
      return this.usersCache.get(uid)!;
    }
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error || !data) return null;
      const user = this.mapRowToUser(data);
      this.usersCache.set(user.uid, user);
      return user;
    } catch (e) {
      return null;
    }
  }

  /**
   * Real Supabase Authentication: Sign Out
   */
  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    this.currentUser = null;
    this.isAuthenticated = false;
    this.notify();
  }
}

export const authService = new AuthService();

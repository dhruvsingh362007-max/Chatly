import { authService } from './authService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY_BLOCKED = 'nearby_blocked_users';
const STORAGE_KEY_REPORTS = 'nearby_user_reports';

export interface ReportSubmission {
  reportId: string;
  targetUid: string;
  category: 'Harassment' | 'Spam' | 'Fake profile' | 'Inappropriate behavior' | 'Other';
  notes: string;
  timestamp: number;
}

class SafetyService {
  private blockedUids: Set<string>;
  private reports: ReportSubmission[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    const savedBlocked = localStorage.getItem(STORAGE_KEY_BLOCKED);
    if (savedBlocked) {
      try {
        this.blockedUids = new Set(JSON.parse(savedBlocked));
      } catch (e) {
        this.blockedUids = new Set();
      }
    } else {
      this.blockedUids = new Set();
    }

    const savedReports = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (savedReports) {
      try {
        this.reports = JSON.parse(savedReports);
      } catch (e) {
        this.reports = [];
      }
    }

    authService.subscribe((user) => {
      if (user) {
        this.fetchBlockedUsersFromSupabase();
      }
    });
  }

  private async fetchBlockedUsersFromSupabase() {
    const currentUid = authService.getCurrentUid();
    if (!currentUid || !isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', currentUid);

      if (!error && data) {
        data.forEach((row: any) => this.blockedUids.add(row.blocked_id));
        this.persist();
      }
    } catch (err) {
      console.warn('Failed to fetch blocked users from Supabase:', err);
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY_BLOCKED, JSON.stringify(Array.from(this.blockedUids)));
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(this.reports));
    this.listeners.forEach(fn => fn());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  isBlocked(uid: string): boolean {
    return this.blockedUids.has(uid);
  }

  getBlockedUids(): string[] {
    return Array.from(this.blockedUids);
  }

  async blockUser(uid: string): Promise<void> {
    this.blockedUids.add(uid);
    this.persist();

    const currentUid = authService.getCurrentUid();
    if (currentUid && isSupabaseConfigured()) {
      try {
        await supabase.from('blocked_users').insert({
          blocker_id: currentUid,
          blocked_id: uid
        });
      } catch (err) {
        console.warn('Failed to record block in Supabase:', err);
      }
    }
  }

  async unblockUser(uid: string): Promise<void> {
    this.blockedUids.delete(uid);
    this.persist();

    const currentUid = authService.getCurrentUid();
    if (currentUid && isSupabaseConfigured()) {
      try {
        await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUid)
          .eq('blocked_id', uid);
      } catch (err) {
        console.warn('Failed to remove block in Supabase:', err);
      }
    }
  }

  async reportUser(targetUid: string, category: ReportSubmission['category'], notes: string): Promise<ReportSubmission> {
    const newReport: ReportSubmission = {
      reportId: 'rep_' + Date.now().toString(36),
      targetUid,
      category,
      notes,
      timestamp: Date.now()
    };
    this.reports.push(newReport);
    this.persist();

    const currentUid = authService.getCurrentUid();
    if (currentUid && isSupabaseConfigured()) {
      try {
        await supabase.from('reports').insert({
          reporter_id: currentUid,
          reported_id: targetUid,
          category,
          notes
        });
      } catch (err) {
        console.warn('Failed to record report in Supabase:', err);
      }
    }

    return newReport;
  }

  hideMeEmergency(): void {
    authService.setDiscoverable(false);
  }

  getSafeMeetGuidelines(): string[] {
    return [
      "Meet in a well-lit, public location (e.g. campus cafeteria, student union, busy coffee shop).",
      "Stay in public areas and keep personal boundaries comfortable.",
      "Let a friend or roommate know where you are going.",
      "Nearby never shares your exact GPS or routes with anyone.",
      "You can block or report anyone at any time with zero awkwardness."
    ];
  }
}

export const safetyService = new SafetyService();

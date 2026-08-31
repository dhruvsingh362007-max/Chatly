import { ConnectionRequest, Connection, SignalEmoji } from '../types/connection';
import { authService } from './authService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

class ConnectionService {
  private requests: ConnectionRequest[] = [];
  private connections: Connection[] = [];
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
        this.fetchAll();
        this.setupRealtime();
      } else {
        this.requests = [];
        this.connections = [];
        this.notify();
      }
    });

    // 2. Setup periodic poll as a rock-solid fallback
    if (typeof window !== 'undefined') {
      this.pollInterval = setInterval(() => {
        if (!document.hidden && authService.isLoggedIn()) {
          this.fetchAll();
        }
      }, 4000);

      window.addEventListener('focus', () => {
        if (authService.isLoggedIn()) {
          this.fetchAll();
        }
      });
    }
  }

  private setupRealtime() {
    if (!isSupabaseConfigured() || this.realtimeChannel) return;

    try {
      this.realtimeChannel = supabase
        .channel('chatly_connections_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'connection_requests' },
          () => {
            this.fetchAll();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'connections' },
          () => {
            this.fetchAll();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime channel error in connectionService:', err);
    }
  }

  async fetchAll(): Promise<void> {
    await Promise.all([this.fetchRequests(), this.fetchConnections()]);
  }

  async fetchRequests(): Promise<ConnectionRequest[]> {
    const currentUid = authService.getCurrentUid();
    if (!currentUid || !isSupabaseConfigured()) {
      this.requests = [];
      this.notify();
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select('*')
        .or(`sender_id.eq.${currentUid},receiver_id.eq.${currentUid}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching connection requests:', error);
        return this.requests;
      }

      if (data) {
        this.requests = data.map((row: any) => ({
          requestId: row.id,
          senderUid: row.sender_id,
          receiverUid: row.receiver_id,
          emoji: row.emoji as SignalEmoji,
          status: row.status as any,
          createdAt: new Date(row.created_at).getTime(),
          expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : Date.now() + 60 * 60 * 1000
        }));

        // Preload any missing profiles
        this.requests.forEach(r => {
          const otherId = r.senderUid === currentUid ? r.receiverUid : r.senderUid;
          authService.fetchUserByUid(otherId);
        });

        this.notify();
      }

      return this.requests;
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      return this.requests;
    }
  }

  async fetchConnections(): Promise<Connection[]> {
    const currentUid = authService.getCurrentUid();
    if (!currentUid || !isSupabaseConfigured()) {
      this.connections = [];
      this.notify();
      return [];
    }

    try {
      // 1. Fetch from connections table
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`user1_id.eq.${currentUid},user2_id.eq.${currentUid}`)
        .order('created_at', { ascending: false });

      const loadedConns: Connection[] = [];
      const seenOtherUids = new Set<string>();

      if (!error && data) {
        data.forEach((row: any) => {
          const otherUid = row.user1_id === currentUid ? row.user2_id : row.user1_id;
          seenOtherUids.add(otherUid);
          loadedConns.push({
            connectionId: row.id,
            user1: row.user1_id,
            user2: row.user2_id,
            otherUserUid: otherUid,
            createdAt: new Date(row.created_at).getTime(),
            lastMessageSnippet: row.last_message_snippet || 'Connected! Say hi 🎉',
            lastMessageTime: row.last_message_time ? new Date(row.last_message_time).getTime() : Date.now(),
            unreadCount: 0
          });
        });
      }

      // 2. Also check accepted requests as fallback
      const acceptedReqs = this.requests.filter(
        r => r.status === 'accepted' && (r.senderUid === currentUid || r.receiverUid === currentUid)
      );

      acceptedReqs.forEach(req => {
        const otherUid = req.senderUid === currentUid ? req.receiverUid : req.senderUid;
        if (!seenOtherUids.has(otherUid)) {
          seenOtherUids.add(otherUid);
          loadedConns.push({
            connectionId: req.requestId,
            user1: req.senderUid,
            user2: req.receiverUid,
            otherUserUid: otherUid,
            createdAt: req.createdAt,
            lastMessageSnippet: 'Mutual connection made! 🎉',
            lastMessageTime: req.createdAt,
            unreadCount: 0
          });
        }
      });

      this.connections = loadedConns;

      // Preload user profiles for all connections
      this.connections.forEach(c => {
        authService.fetchUserByUid(c.otherUserUid);
      });

      this.notify();
      return this.connections;
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      return this.connections;
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

  getIncomingRequests(): ConnectionRequest[] {
    const currentUid = authService.getCurrentUid();
    if (!currentUid) return [];
    return this.requests.filter(r => r.receiverUid === currentUid && r.status === 'pending');
  }

  getSentRequests(): ConnectionRequest[] {
    const currentUid = authService.getCurrentUid();
    if (!currentUid) return [];
    return this.requests.filter(r => r.senderUid === currentUid);
  }

  hasPendingRequestWith(targetUid: string): boolean {
    const currentUid = authService.getCurrentUid();
    if (!currentUid) return false;
    return this.requests.some(
      r => r.status === 'pending' &&
      ((r.senderUid === currentUid && r.receiverUid === targetUid) ||
       (r.senderUid === targetUid && r.receiverUid === currentUid))
    );
  }

  async sendSignal(targetUid: string, emoji: SignalEmoji): Promise<{ success: boolean; request?: ConnectionRequest; error?: string }> {
    const currentUid = authService.getCurrentUid();
    if (!currentUid) {
      return { success: false, error: 'You must be signed in to send a signal.' };
    }
    
    if (this.hasPendingRequestWith(targetUid)) {
      return { success: false, error: 'A pending connection request already exists with this user.' };
    }

    if (this.isConnectedWith(targetUid)) {
      return { success: false, error: 'You are already connected with this user.' };
    }

    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: currentUid,
          receiver_id: targetUid,
          emoji,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const newRequest: ConnectionRequest = {
        requestId: data.id,
        senderUid: data.sender_id,
        receiverUid: data.receiver_id,
        emoji: data.emoji as SignalEmoji,
        status: data.status as any,
        createdAt: new Date(data.created_at).getTime(),
        expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 60 * 60 * 1000
      };

      this.requests.unshift(newRequest);
      this.notify();
      return { success: true, request: newRequest };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send signal.' };
    }
  }

  async respondToRequest(requestId: string, action: 'accept' | 'ignore'): Promise<{ connection?: Connection; request?: ConnectionRequest; error?: string }> {
    const req = this.requests.find(r => r.requestId === requestId);
    const newStatus = action === 'accept' ? 'accepted' : 'expired';

    try {
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
      }

      if (req) {
        req.status = newStatus;
      }

      let connectionResult: Connection | undefined;

      if (action === 'accept' && req) {
        const currentUid = authService.getCurrentUid();
        
        // Attempt insert into connections table
        try {
          const { data: connData, error: connError } = await supabase
            .from('connections')
            .insert({
              user1_id: req.senderUid,
              user2_id: req.receiverUid,
              last_message_snippet: 'Connected! Say hi 🎉'
            })
            .select()
            .maybeSingle();

          if (connData) {
            connectionResult = {
              connectionId: connData.id,
              user1: connData.user1_id,
              user2: connData.user2_id,
              otherUserUid: req.senderUid === currentUid ? req.receiverUid : req.senderUid,
              createdAt: new Date(connData.created_at).getTime(),
              lastMessageSnippet: connData.last_message_snippet || 'Connected! Say hi 🎉',
              lastMessageTime: Date.now(),
              unreadCount: 0
            };
          }
        } catch (insertErr) {
          console.warn('Direct connection insert failed, will use request fallback:', insertErr);
        }

        if (!connectionResult) {
          connectionResult = {
            connectionId: req.requestId,
            user1: req.senderUid,
            user2: req.receiverUid,
            otherUserUid: req.senderUid === currentUid ? req.receiverUid : req.senderUid,
            createdAt: Date.now(),
            lastMessageSnippet: 'Connected! Say hi 🎉',
            lastMessageTime: Date.now(),
            unreadCount: 0
          };
        }

        this.connections.unshift(connectionResult);
      }

      await this.fetchAll();
      return { connection: connectionResult, request: req };
    } catch (err: any) {
      console.error('respondToRequest failed:', err);
      return { error: err.message };
    }
  }

  getConnections(): Connection[] {
    const currentUid = authService.getCurrentUid();
    if (!currentUid) return [];
    return this.connections.filter(c => c.user1 === currentUid || c.user2 === currentUid);
  }

  isConnectedWith(targetUid: string): boolean {
    const currentUid = authService.getCurrentUid();
    if (!currentUid) return false;
    return this.connections.some(c => 
      (c.user1 === currentUid && c.user2 === targetUid) || 
      (c.user2 === currentUid && c.user1 === targetUid)
    );
  }

  getConnectionById(connectionId: string): Connection | undefined {
    return this.connections.find(c => c.connectionId === connectionId);
  }

  getConnectionByUserId(otherUid: string): Connection | undefined {
    const currentUid = authService.getCurrentUid();
    if (!currentUid) return undefined;
    return this.connections.find(c => 
      (c.user1 === currentUid && c.user2 === otherUid) || 
      (c.user2 === currentUid && c.user1 === otherUid)
    );
  }
}

export const connectionService = new ConnectionService();

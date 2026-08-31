import { Message } from '../types/chat';
import { User } from '../types/user';
import { authService } from './authService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

class ChatService {
  private messagesByConnection: Record<string, Message[]> = {};
  private listeners: Array<() => void> = [];
  private activeChannel: any = null;
  private activeConnectionId: string | null = null;
  private pollInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.pollInterval = setInterval(() => {
        if (!document.hidden && this.activeConnectionId && authService.isLoggedIn()) {
          this.fetchMessages(this.activeConnectionId);
        }
      }, 3000);
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  setActiveConnection(connectionId: string | null) {
    if (this.activeConnectionId === connectionId) return;

    if (this.activeChannel) {
      try {
        supabase.removeChannel(this.activeChannel);
      } catch (e) {}
      this.activeChannel = null;
    }

    this.activeConnectionId = connectionId;

    if (connectionId && isSupabaseConfigured()) {
      this.fetchMessages(connectionId);

      try {
        this.activeChannel = supabase
          .channel(`chat_${connectionId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `connection_id=eq.${connectionId}`
            },
            (payload) => {
              const newRow = payload.new;
              if (newRow) {
                const msg: Message = {
                  messageId: newRow.id,
                  connectionId: newRow.connection_id,
                  senderUid: newRow.sender_id,
                  message: newRow.message,
                  createdAt: new Date(newRow.created_at).getTime(),
                  isDelivered: true,
                  isRead: newRow.is_read
                };

                if (!this.messagesByConnection[connectionId]) {
                  this.messagesByConnection[connectionId] = [];
                }

                // Check duplicate
                if (!this.messagesByConnection[connectionId].some(m => m.messageId === msg.messageId)) {
                  this.messagesByConnection[connectionId].push(msg);
                  this.notify();
                }
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel error in chatService:', err);
      }
    }
  }

  async fetchMessages(connectionId: string): Promise<Message[]> {
    if (!isSupabaseConfigured()) {
      return this.messagesByConnection[connectionId] || [];
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        this.messagesByConnection[connectionId] = data.map((row: any) => ({
          messageId: row.id,
          connectionId: row.connection_id,
          senderUid: row.sender_id,
          message: row.message,
          createdAt: new Date(row.created_at).getTime(),
          isDelivered: true,
          isRead: row.is_read
        }));
        this.notify();
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }

    return this.messagesByConnection[connectionId] || [];
  }

  getMessages(connectionId: string): Message[] {
    return this.messagesByConnection[connectionId] || [];
  }

  async sendMessage(connectionId: string, text: string): Promise<Message | null> {
    const currentUid = authService.getCurrentUid();
    const cleanText = text.trim();
    if (!currentUid || !cleanText) return null;

    const tempId = 'temp_' + Date.now();
    const optimisticMessage: Message = {
      messageId: tempId,
      connectionId,
      senderUid: currentUid,
      message: cleanText,
      createdAt: Date.now(),
      isDelivered: false,
      isRead: false
    };

    if (!this.messagesByConnection[connectionId]) {
      this.messagesByConnection[connectionId] = [];
    }
    this.messagesByConnection[connectionId].push(optimisticMessage);
    this.notify();

    if (!isSupabaseConfigured()) {
      optimisticMessage.isDelivered = true;
      return optimisticMessage;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          sender_id: currentUid,
          message: cleanText
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to insert message into Supabase:', error);
        optimisticMessage.isDelivered = true;
        return optimisticMessage;
      }

      if (data) {
        optimisticMessage.messageId = data.id;
        optimisticMessage.createdAt = new Date(data.created_at).getTime();
        optimisticMessage.isDelivered = true;

        // Try updating last message snippet on connection
        try {
          await supabase
            .from('connections')
            .update({
              last_message_snippet: cleanText,
              last_message_time: new Date().toISOString()
            })
            .eq('id', connectionId);
        } catch (e) {}

        this.notify();
      }

      return optimisticMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      optimisticMessage.isDelivered = true;
      return optimisticMessage;
    }
  }

  getIcebreakers(otherUser: User, commonInterests: string[]): string[] {
    const starters: string[] = [];

    if (commonInterests.includes('🏎️ F1')) {
      starters.push("🏎️ Hey! Saw you're an F1 fan too. Which team are you backing this season?");
    }
    if (commonInterests.includes('💻 Coding')) {
      starters.push("💻 Hi! What projects or tech stacks are you hacking on lately?");
    }
    if (commonInterests.includes('🎮 Gaming')) {
      starters.push("🎮 Hey! What games are you playing at the moment?");
    }
    if (commonInterests.includes('📚 Study')) {
      starters.push("📚 Hey there! Studying anything exciting or prepping for exams?");
    }
    if (commonInterests.includes('🎵 Music')) {
      starters.push("🎵 Hey! Any great music or playlist recommendations today?");
    }

    if (starters.length === 0) {
      starters.push(`👋 Hey ${otherUser.displayName.split(' ')[0]}! Saw you nearby on Chatly.`);
      starters.push(`☕ Hey! Noticed we're both in the area right now.`);
    }

    return starters.slice(0, 3);
  }
}

export const chatService = new ChatService();

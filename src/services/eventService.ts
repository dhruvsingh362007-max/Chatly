import { EventItem } from '../types/event';
import { MOCK_EVENTS } from '../data/mockData';
import { authService } from './authService';

const STORAGE_KEY_EVENTS = 'chatly_events';

class EventService {
  private events: EventItem[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS) || localStorage.getItem('nearby_events');
    if (saved) {
      try {
        this.events = JSON.parse(saved);
      } catch (e) {
        this.events = [...MOCK_EVENTS];
      }
    } else {
      this.events = [...MOCK_EVENTS];
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(this.events));
    this.notify();
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

  getEvents(): EventItem[] {
    const currentUid = authService.getCurrentUid();
    return this.events.map(ev => ({
      ...ev,
      isJoined: Boolean(currentUid && ev.participantUids.includes(currentUid))
    }));
  }

  toggleJoinEvent(eventId: string): EventItem {
    const currentUid = authService.getCurrentUid();
    const ev = this.events.find(e => e.eventId === eventId);
    if (!ev) throw new Error('Event not found');

    if (!currentUid) return ev;

    const index = ev.participantUids.indexOf(currentUid);
    if (index === -1) {
      ev.participantUids.push(currentUid);
      ev.participantsCount += 1;
      ev.isJoined = true;
    } else {
      ev.participantUids.splice(index, 1);
      ev.participantsCount = Math.max(0, ev.participantsCount - 1);
      ev.isJoined = false;
    }

    this.persist();
    return ev;
  }

  getEventById(eventId: string): EventItem | undefined {
    return this.events.find(e => e.eventId === eventId);
  }
}

export const eventService = new EventService();

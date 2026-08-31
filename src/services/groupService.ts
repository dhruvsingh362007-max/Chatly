import { GroupItem } from '../types/event';
import { MOCK_GROUPS } from '../data/mockData';
import { authService } from './authService';

const STORAGE_KEY_GROUPS = 'chatly_groups';

class GroupService {
  private groups: GroupItem[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY_GROUPS) || localStorage.getItem('nearby_groups');
    if (saved) {
      try {
        this.groups = JSON.parse(saved);
      } catch (e) {
        this.groups = [...MOCK_GROUPS];
      }
    } else {
      this.groups = [...MOCK_GROUPS];
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(this.groups));
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

  getGroups(): GroupItem[] {
    const currentUid = authService.getCurrentUid();
    return this.groups.map(g => ({
      ...g,
      isJoined: Boolean(currentUid && g.memberUids.includes(currentUid))
    }));
  }

  toggleJoinGroup(groupId: string): GroupItem {
    const currentUid = authService.getCurrentUid();
    const g = this.groups.find(item => item.groupId === groupId);
    if (!g) throw new Error('Group not found');

    if (!currentUid) return g;

    const index = g.memberUids.indexOf(currentUid);
    if (index === -1) {
      if (g.currentMembers < g.maxMembers) {
        g.memberUids.push(currentUid);
        g.currentMembers += 1;
        g.isJoined = true;
      }
    } else {
      g.memberUids.splice(index, 1);
      g.currentMembers = Math.max(1, g.currentMembers - 1);
      g.isJoined = false;
    }

    this.persist();
    return g;
  }
}

export const groupService = new GroupService();

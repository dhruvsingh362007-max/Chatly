import React, { useState, useEffect } from 'react';
import { Calendar, Users, Radio, Check, Plus } from 'lucide-react';
import { EventItem, GroupItem } from '../../types/event';
import { eventService } from '../../services/eventService';
import { groupService } from '../../services/groupService';

interface EventsViewProps {
  onFilterRadarByEvent: (event: EventItem) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onFilterRadarByEvent }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'groups'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);

  const loadData = () => {
    setEvents(eventService.getEvents());
    setGroups(groupService.getGroups());
  };

  useEffect(() => {
    loadData();
    const unsubE = eventService.subscribe(loadData);
    const unsubG = groupService.subscribe(loadData);
    return () => {
      unsubE();
      unsubG();
    };
  }, []);

  const handleToggleJoinEvent = (eventId: string) => {
    eventService.toggleJoinEvent(eventId);
    loadData();
  };

  const handleToggleJoinGroup = (groupId: string) => {
    groupService.toggleJoinGroup(groupId);
    loadData();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Campus & Event Spaces</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Discover attendees in specific campus events or join shared squads.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'events'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events & Meetups</span>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'groups'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Squads & Groups</span>
        </button>
      </div>

      {/* Events List */}
      {activeTab === 'events' && (
        <div className="space-y-3.5">
          {events.map((ev) => (
            <div
              key={ev.eventId}
              className="bg-[#141417] p-5 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shrink-0">
                  {ev.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {ev.tag}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {ev.startTime}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{ev.name}</h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed max-w-xl font-normal">
                    {ev.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                    <span>📍 {ev.locationArea}</span>
                    <span>👥 {ev.participantsCount} participants</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleToggleJoinEvent(ev.eventId)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    ev.isJoined
                      ? 'bg-zinc-800 text-white border-zinc-700'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
                  }`}
                >
                  {ev.isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Join Space</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onFilterRadarByEvent(ev)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Filter the radar to only show attendees of this event"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Event Radar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Groups List */}
      {activeTab === 'groups' && (
        <div className="space-y-3.5">
          {groups.map((g) => (
            <div
              key={g.groupId}
              className="bg-[#141417] p-5 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shrink-0">
                  {g.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {g.category}
                    </span>
                    <span className="text-xs font-medium text-emerald-400">
                      {g.currentMembers} / {g.maxMembers} members
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{g.name}</h3>
                  <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed font-normal">
                    {g.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleJoinGroup(g.groupId)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border shrink-0 transition-colors ${
                  g.isJoined
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'bg-white hover:bg-zinc-200 text-zinc-950 font-semibold border-transparent shadow-sm'
                }`}
              >
                {g.isJoined ? 'Member' : 'Request to Join'}
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

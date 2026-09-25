import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers,
  Users,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  fetchAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchProgrammes,
  createProgramme,
  updateProgramme,
  deleteProgramme,
  type PublicEvent,
  type WeeklyProgramme,
  EVENT_TYPE_LABELS,
} from '@/features/events/events.api';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function EventsProgrammesAdmin() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'programmes'>('events');

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<PublicEvent> | null>(null);

  // Programme Modal State
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Partial<WeeklyProgramme> | null>(null);

  // Notification / Feedback banner
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Queries
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: fetchAllEvents,
  });

  const { data: programmes = [], isLoading: progsLoading } = useQuery({
    queryKey: ['admin-programmes'],
    queryFn: fetchProgrammes,
  });

  // Event Mutations
  const saveEventMutation = useMutation({
    mutationFn: async (eventData: Partial<PublicEvent>) => {
      const payload = {
        ...eventData,
        venue: eventData.venue || eventData.location || 'Main Sanctuary',
        location: eventData.location || eventData.venue || 'Main Sanctuary',
        category: eventData.category || 'Fellowship',
        event_type: eventData.event_type || 'fellowship',
        status: eventData.status || 'approved',
        start_at: eventData.date ? `${eventData.date}T${eventData.start_time || '17:00'}:00.000Z` : new Date().toISOString(),
        end_at: eventData.date ? `${eventData.date}T${eventData.end_time || '19:00'}:00.000Z` : new Date().toISOString(),
      };

      if (eventData.id) {
        return updateEvent(eventData.id, payload);
      } else {
        return createEvent(payload);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEventModalOpen(false);
      setEditingEvent(null);
      showFeedback(vars.id ? 'Event updated successfully!' : 'Event created successfully!');
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to save event', true);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showFeedback('Event deleted successfully!');
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to delete event', true);
    },
  });

  // Programme Mutations
  const saveProgMutation = useMutation({
    mutationFn: async (progData: Partial<WeeklyProgramme>) => {
      if (progData.id) {
        return updateProgramme(progData.id, progData);
      } else {
        return createProgramme(progData);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-programmes'] });
      queryClient.invalidateQueries({ queryKey: ['programmes'] });
      setIsProgModalOpen(false);
      setEditingProg(null);
      showFeedback(vars.id ? 'Weekly programme updated successfully!' : 'Weekly programme created successfully!');
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to save programme', true);
    },
  });

  const deleteProgMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteProgramme(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-programmes'] });
      queryClient.invalidateQueries({ queryKey: ['programmes'] });
      showFeedback('Weekly programme removed successfully!');
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || err.message || 'Failed to delete programme', true);
    },
  });

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-900 shadow-xs animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <CalendarDays className="text-[#006633]" size={20} />
            Events & Weekly Programmes Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, update, and manage official TUMCU campus events and recurring weekly service schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => setActiveSubTab('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'events'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Special Events ({events.length})
            </button>
            <button
              onClick={() => setActiveSubTab('programmes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeSubTab === 'programmes'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Programmes ({programmes.length})
            </button>
          </div>

          {activeSubTab === 'events' ? (
            <Button
              onClick={() => {
                setEditingEvent({
                  title: '',
                  day_of_week: 'Sunday',
                  date: new Date().toISOString().split('T')[0],
                  start_time: '17:00',
                  end_time: '19:30',
                  venue: 'Main Sanctuary',
                  category: 'Fellowship',
                  event_type: 'fellowship',
                  status: 'approved',
                  description: '',
                });
                setIsEventModalOpen(true);
              }}
              className="text-xs font-bold gap-1.5 bg-[#006633] text-white hover:bg-[#005229]"
            >
              <Plus size={14} /> New Event
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditingProg({
                  day: 'Tuesday',
                  title: '',
                  time: '5:00 PM – 6:30 PM',
                  venue: 'Main Sanctuary',
                  leader: 'TUMCU Ministry',
                  programme_type: 'fellowship',
                  description: '',
                });
                setIsProgModalOpen(true);
              }}
              className="text-xs font-bold gap-1.5 bg-[#006633] text-white hover:bg-[#005229]"
            >
              <Plus size={14} /> New Programme
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB: EVENTS LIST                                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          {eventsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">No events scheduled</p>
              <p className="text-xs text-slate-500 mt-1">Click "New Event" above to create an event.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        {EVENT_TYPE_LABELS[evt.event_type] || evt.event_type || 'Event'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          evt.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {evt.status || 'approved'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {evt.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-[#006633] shrink-0" />
                        <span>
                          {evt.day_of_week ? `${evt.day_of_week}, ` : ''}
                          {evt.date || (evt.start_at ? new Date(evt.start_at).toLocaleDateString() : 'TBD')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-amber-700 shrink-0" />
                        <span>
                          {evt.start_time || '17:00'}
                          {evt.end_time ? ` – ${evt.end_time}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-indigo-700 shrink-0" />
                        <span className="truncate">{evt.venue || evt.location || 'Main Sanctuary'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEvent({ ...evt });
                        setIsEventModalOpen(true);
                      }}
                      className="text-xs font-semibold gap-1.5 text-slate-700 hover:text-slate-900"
                    >
                      <Edit2 size={12} /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${evt.title}"?`)) {
                          deleteEventMutation.mutate(evt.id);
                        }
                      }}
                      className="text-xs font-semibold gap-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: WEEKLY PROGRAMMES LIST                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'programmes' && (
        <div className="space-y-4">
          {progsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading weekly programmes...</div>
          ) : programmes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Layers className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">No weekly programmes configured</p>
              <p className="text-xs text-slate-500 mt-1">Click "New Programme" above to set up the weekly schedule.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programmes.map((prog) => (
                <div
                  key={prog.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-900 border border-indigo-200">
                        {prog.day}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {prog.programme_type || 'service'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {prog.description || 'Regular spiritual gathering and campus fellowship.'}
                    </p>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-amber-700 shrink-0" />
                        <span>{prog.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-indigo-700 shrink-0" />
                        <span className="truncate">{prog.venue}</span>
                      </div>
                      {prog.leader && (
                        <div className="flex items-center gap-2">
                          <Users size={13} className="text-[#006633] shrink-0" />
                          <span className="truncate">{prog.leader}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProg({ ...prog });
                        setIsProgModalOpen(true);
                      }}
                      className="text-xs font-semibold gap-1.5 text-slate-700 hover:text-slate-900"
                    >
                      <Edit2 size={12} /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${prog.title}"?`)) {
                          deleteProgMutation.mutate(prog.id);
                        }
                      }}
                      className="text-xs font-semibold gap-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / CREATE EVENT                                                */}
      {/* ========================================================================= */}
      {isEventModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <button
              onClick={() => {
                setIsEventModalOpen(false);
                setEditingEvent(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingEvent.id ? 'Edit Event' : 'Create New Event'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Update the event details below. Changes are reflected across the Christian Union hub immediately.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingEvent.title?.trim()) {
                  showFeedback('Event title is required', true);
                  return;
                }
                saveEventMutation.mutate(editingEvent);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="e.g. Annual Campus Worship Night"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={editingEvent.event_type || 'fellowship'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, event_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={editingEvent.day_of_week || 'Sunday'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, day_of_week: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingEvent.date || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="17:00"
                    value={editingEvent.start_time || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="19:30"
                    value={editingEvent.end_time || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, end_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={editingEvent.venue || editingEvent.location || ''}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        venue: e.target.value,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. Main Assembly Hall"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingEvent.status || 'approved'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  >
                    <option value="approved">Approved & Published</option>
                    <option value="draft">Draft / Tentative</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="Details, guest speaker, themes, or preparation guidelines..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEventModalOpen(false);
                    setEditingEvent(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveEventMutation.isPending}
                  className="text-xs font-bold bg-[#006633] text-white hover:bg-[#005229]"
                >
                  {saveEventMutation.isPending ? 'Saving...' : 'Save Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / CREATE PROGRAMME                                            */}
      {/* ========================================================================= */}
      {isProgModalOpen && editingProg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
            <button
              onClick={() => {
                setIsProgModalOpen(false);
                setEditingProg(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingProg.id ? 'Edit Weekly Programme' : 'New Weekly Programme'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Set the standard schedule for weekly Christian Union recurring fellowships.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingProg.title?.trim()) {
                  showFeedback('Programme title is required', true);
                  return;
                }
                saveProgMutation.mutate(editingProg);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Programme Title *</label>
                <input
                  type="text"
                  required
                  value={editingProg.title || ''}
                  onChange={(e) => setEditingProg({ ...editingProg, title: e.target.value })}
                  placeholder="e.g. Power Hour & Intercession Service"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={editingProg.day || 'Sunday'}
                    onChange={(e) => setEditingProg({ ...editingProg, day: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Schedule</label>
                  <input
                    type="text"
                    required
                    value={editingProg.time || ''}
                    onChange={(e) => setEditingProg({ ...editingProg, time: e.target.value })}
                    placeholder="e.g. 5:00 PM – 7:00 PM"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Room</label>
                  <input
                    type="text"
                    required
                    value={editingProg.venue || ''}
                    onChange={(e) => setEditingProg({ ...editingProg, venue: e.target.value })}
                    placeholder="e.g. Main Sanctuary"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ministry / Leader in Charge</label>
                  <input
                    type="text"
                    value={editingProg.leader || ''}
                    onChange={(e) => setEditingProg({ ...editingProg, leader: e.target.value })}
                    placeholder="e.g. Bible Study Ministry"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Focus</label>
                <textarea
                  rows={3}
                  value={editingProg.description || ''}
                  onChange={(e) => setEditingProg({ ...editingProg, description: e.target.value })}
                  placeholder="Spiritual objectives, format, and who should attend..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsProgModalOpen(false);
                    setEditingProg(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveProgMutation.isPending}
                  className="text-xs font-bold bg-[#006633] text-white hover:bg-[#005229]"
                >
                  {saveProgMutation.isPending ? 'Saving...' : 'Save Programme'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

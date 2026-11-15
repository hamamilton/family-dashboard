import { useState, useMemo } from 'react';
import { useCalendar, getEventMetadata } from '../../hooks/useCalendar';
import { ChoreCard } from '../features/ChoreCard';
import { LocationAutocomplete } from '../features/LocationAutocomplete';
import { WeatherDayBadge } from '../features/WeatherDayBadge';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  X, 
  ClipboardList, 
  CalendarDays,
  LayoutGrid,
  List,
  AlignJustify,
  Filter,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const PROFILE_COLORS = ['bg-cyan-500', 'bg-fuchsia-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-blue-500'];

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isAllDay(event) {
  if (event.isAllDay) return true;
  const start = new Date(event.start);
  const end = new Date(event.end);
  const diffHours = (end - start) / (1000 * 60 * 60);
  return diffHours >= 23;
}

export function CombinedBoard({
  sortedGroupEntries = [],
  profiles = [],
  toggleChore,
  skipChore,
  rotateAssignee,
  birthdayProfiles = []
}) {
  const { events, addEvent, addEvents, updateEvent, deleteEvent } = useCalendar();

  const [cardLayout, setCardLayout] = useState(() => {
    return localStorage.getItem('combinedCardLayout') || 'compact';
  });

  const [activeFilters, setActiveFilters] = useState(['ALL']);

  const toggleFilter = (name) => {
    setActiveFilters(prev => {
      if (name === 'ALL') return ['ALL'];
      let current = prev.filter(n => n !== 'ALL');
      if (current.includes(name)) {
        current = current.filter(n => n !== name);
        return current.length === 0 ? ['ALL'] : current;
      } else {
        return [...current, name];
      }
    });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEventData, setModalEventData] = useState({
    id: null,
    title: '',
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    assigned_to: ['Everyone'],
    location: '',
    isRecurring: false,
    recurUntil: null,
    selectedDays: [],
    readonly: false,
    isHoliday: false,
    isBirthday: false
  });
  const [submitStatus, setSubmitStatus] = useState({ state: 'idle', message: '' });
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitStatus({ state: 'idle', message: '' });
    setShowDeleteOptions(false);
  };

  const handleLayoutChange = (layout) => {
    setCardLayout(layout);
    localStorage.setItem('combinedCardLayout', layout);
  };

  // Build next 7 days list
  const next7Days = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const dayName = dayNames[d.getDay()];
      const isToday = i === 0;
      const isTomorrow = i === 1;

      // Match chore group key from useChores
      const choreKey = isToday ? `Today (${dayName})` : dayName;

      days.push({
        index: i,
        dateObj: d,
        dayName,
        choreKey,
        isToday,
        isTomorrow,
        formattedShort: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        formattedFull: isToday 
          ? `Today (${dayName}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` 
          : isTomorrow 
            ? `Tomorrow (${dayName}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
            : `${dayName}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      });
    }

    return days;
  }, []);

  // Quick lookup map for chores by day key (filtered by active member)
  const choresByDay = useMemo(() => {
    const map = {};
    const personFiltersActive = activeFilters.some(f => f !== 'Holidays' && f !== 'Birthdays');

    sortedGroupEntries.forEach(([groupName, items]) => {
      if (activeFilters.includes('ALL') || activeFilters.length === 0) {
        map[groupName] = items;
      } else if (!personFiltersActive) {
        // Only holiday or birthday filtered, regular chores hidden
        map[groupName] = [];
      } else {
        map[groupName] = items.filter(c => activeFilters.includes(c.assigned_to));
      }
    });
    return map;
  }, [sortedGroupEntries, activeFilters]);

  // Quick lookup map for calendar events by day (filtered by active member/category)
  const eventsByDay = useMemo(() => {
    const map = {};

    next7Days.forEach(day => {
      const startOfDay = new Date(day.dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(day.dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      let dayEvents = (events || []).filter(e => {
        const eStart = new Date(e.start);
        const eEnd = new Date(e.end);
        return eStart <= endOfDay && eEnd >= startOfDay;
      });

      // Filter by activeFilters
      if (!activeFilters.includes('ALL') && activeFilters.length > 0) {
        const personFiltersActive = activeFilters.some(f => f !== 'Holidays' && f !== 'Birthdays');

        dayEvents = dayEvents.filter(evt => {
          if (evt.isHoliday) {
            return activeFilters.includes('Holidays');
          }
          if (evt.isBirthday) {
            if (activeFilters.includes('Birthdays')) return true;
            const person = Array.isArray(evt.assigned_to) ? evt.assigned_to[0] : evt.assigned_to;
            return activeFilters.includes(person);
          }
          const assignees = Array.isArray(evt.assigned_to) 
            ? evt.assigned_to 
            : (evt.assigned_to || 'Everyone').split(',').map(s => s.trim());
          if (assignees.includes('Everyone')) {
            return personFiltersActive;
          }
          return assignees.some(person => activeFilters.includes(person));
        });
      }

      // Sort by start time (all day first, then chronological)
      dayEvents.sort((a, b) => {
        const aAll = isAllDay(a);
        const bAll = isAllDay(b);
        if (aAll && !bAll) return -1;
        if (!aAll && bAll) return 1;
        return new Date(a.start) - new Date(b.start);
      });

      map[day.index] = dayEvents;
    });

    return map;
  }, [events, next7Days, activeFilters]);

  // Open modal for a new event pre-filled with this day's date
  const handleOpenAddEvent = (targetDate) => {
    const start = new Date(targetDate);
    start.setHours(12, 0, 0, 0);
    const end = new Date(start);
    end.setHours(13, 0, 0, 0);

    const defaultUntil = new Date(start);
    defaultUntil.setMonth(defaultUntil.getMonth() + 2);

    setModalEventData({
      id: null,
      title: '',
      start,
      end,
      assigned_to: ['Everyone'],
      location: '',
      isRecurring: false,
      seriesId: null,
      recurUntil: defaultUntil,
      selectedDays: [start.getDay()],
      readonly: false,
      isHoliday: false,
      isBirthday: false
    });
    setSubmitStatus({ state: 'idle', message: '' });
    setShowDeleteOptions(false);
    setIsModalOpen(true);
  };

  // Open modal to edit existing event
  const handleOpenEditEvent = (evt) => {
    const meta = getEventMetadata(evt);
    const isRecurring = !!meta?.seriesId;
    setModalEventData({
      id: evt.id,
      title: evt.title || '',
      start: new Date(evt.start),
      end: new Date(evt.end),
      assigned_to: Array.isArray(evt.assigned_to) 
        ? evt.assigned_to 
        : (evt.assigned_to || 'Everyone').split(',').map(s => s.trim()),
      location: meta?.location || '',
      isRecurring,
      seriesId: meta?.seriesId || null,
      recurUntil: meta?.recurUntil ? new Date(meta.recurUntil) : null,
      selectedDays: meta?.selectedDays || [],
      readonly: !!evt.readonly,
      isHoliday: !!evt.isHoliday,
      isBirthday: !!evt.isBirthday
    });
    setSubmitStatus({ state: 'idle', message: '' });
    setShowDeleteOptions(false);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalEventData.title.trim()) return;

    setSubmitStatus({
      state: 'submitting',
      message: modalEventData.id ? 'Saving changes...' : 'Creating event...'
    });

    try {
      const isEditingSeries = modalEventData.id && modalEventData.isRecurring;
      
      let colorObj = {};
      if (modalEventData.isRecurring) {
        colorObj = {
          seriesId: modalEventData.seriesId || `series-${Date.now()}`,
          recurUntil: modalEventData.recurUntil,
          selectedDays: modalEventData.selectedDays
        };
      }
      if (modalEventData.location) {
        colorObj.location = modalEventData.location;
      }
      const colorData = Object.keys(colorObj).length > 0 ? JSON.stringify(colorObj) : '';
      const assignedToJoined = Array.isArray(modalEventData.assigned_to) 
        ? modalEventData.assigned_to.join(', ') 
        : modalEventData.assigned_to;

      let confirmationMsg = modalEventData.id ? 'Changes saved successfully!' : 'Event created successfully!';

      if (modalEventData.id && !isEditingSeries) {
        await updateEvent(modalEventData.id, {
          title: modalEventData.title,
          start: modalEventData.start,
          end: modalEventData.end,
          assigned_to: assignedToJoined,
          color: colorData
        });
      } else if (modalEventData.isRecurring) {
        if (isEditingSeries) {
          if (!window.confirm('Update entire recurring series? This will regenerate all future instances.')) {
            await updateEvent(modalEventData.id, {
              title: modalEventData.title,
              start: modalEventData.start,
              end: modalEventData.end,
              assigned_to: assignedToJoined,
              color: ''
            });
            setSubmitStatus({ state: 'success', message: 'Event updated successfully!' });
            setTimeout(() => {
              closeModal();
            }, 1200);
            return;
          }
          await deleteEvent(modalEventData.id, true);
        }

        const startD = new Date(modalEventData.start);
        const endD = new Date(modalEventData.end);
        let daysToUse = modalEventData.selectedDays;
        if (!daysToUse || daysToUse.length === 0) {
          daysToUse = [startD.getDay()];
        }

        let untilD;
        if (modalEventData.recurUntil) {
          untilD = new Date(modalEventData.recurUntil);
        } else {
          untilD = new Date(startD);
          untilD.setMonth(untilD.getMonth() + 2);
        }
        untilD.setHours(23, 59, 59, 999);

        const generatedEvents = [];
        let current = new Date(startD);
        current.setHours(0, 0, 0, 0);

        while (current <= untilD) {
          if (daysToUse.includes(current.getDay())) {
            const eStart = new Date(current);
            eStart.setHours(startD.getHours(), startD.getMinutes(), 0, 0);
            const eEnd = new Date(current);
            eEnd.setHours(endD.getHours(), endD.getMinutes(), 0, 0);

            if (eStart <= untilD) {
              generatedEvents.push({
                title: modalEventData.title,
                start: eStart,
                end: eEnd,
                assigned_to: assignedToJoined,
                color: colorData
              });
            }
          }
          current.setDate(current.getDate() + 1);
        }

        if (generatedEvents.length > 0) {
          await addEvents(generatedEvents);
          confirmationMsg = `Recurring series created (${generatedEvents.length} appointments scheduled)!`;
        } else {
          await addEvent({
            title: modalEventData.title,
            start: modalEventData.start,
            end: modalEventData.end,
            assigned_to: assignedToJoined,
            color: colorData
          });
        }
      } else {
        await addEvent({
          title: modalEventData.title,
          start: modalEventData.start,
          end: modalEventData.end,
          assigned_to: assignedToJoined,
          color: colorData
        });
      }

      setSubmitStatus({ state: 'success', message: confirmationMsg });
      setTimeout(() => {
        closeModal();
      }, 1200);
    } catch (err) {
      console.error("Failed to save event:", err);
      setSubmitStatus({ state: 'error', message: 'Failed to save event. Please try again.' });
    }
  };

  const handleDeleteEvent = () => {
    if (!modalEventData.id) return;
    setShowDeleteOptions(true);
  };

  const confirmDeleteEvent = async (deleteEntireSeries = false) => {
    if (!modalEventData.id) return;
    setSubmitStatus({
      state: 'submitting',
      message: deleteEntireSeries ? 'Deleting entire series...' : 'Deleting event...'
    });
    try {
      await deleteEvent(modalEventData.id, deleteEntireSeries);
      closeModal();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setSubmitStatus({ state: 'error', message: 'Failed to delete event. Please try again.' });
    }
  };

  const toggleAssignee = (name) => {
    setModalEventData(prev => {
      let current = [...prev.assigned_to];
      if (name === 'Everyone') {
        current = current.includes('Everyone') ? [] : ['Everyone'];
      } else {
        current = current.filter(n => n !== 'Everyone');
        if (current.includes(name)) {
          current = current.filter(n => n !== name);
        } else {
          current.push(name);
        }
        if (current.length === 0) current = ['Everyone'];
      }
      return { ...prev, assigned_to: current };
    });
  };

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Top Header Bar for Combined View */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-20 flex-none">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList size={16} />
            <span>Mission</span>
            <span className="text-slate-500">×</span>
            <CalendarDays size={16} className="text-fuchsia-400" />
            <span className="text-fuchsia-400">Schedule</span>
          </span>
        </div>

        {/* Member & Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1">
            <Filter size={12} className="text-cyan-400" />
            <span>Filter:</span>
          </div>

          <button
            onClick={() => toggleFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider transition-all border ${
              activeFilters.includes('ALL')
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            All
          </button>

          {profiles.map((p, idx) => {
            const isActive = !activeFilters.includes('ALL') && activeFilters.includes(p.name);
            const colorClass = PROFILE_COLORS[idx % PROFILE_COLORS.length];
            return (
              <button
                key={p.id || p.name}
                onClick={() => toggleFilter(p.name)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider transition-all border ${
                  isActive
                    ? `${colorClass} text-white border-white/40 shadow-sm scale-105`
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : colorClass}`} />
                <span>{p.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => toggleFilter('Holidays')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider transition-all border ${
              !activeFilters.includes('ALL') && activeFilters.includes('Holidays')
                ? 'bg-amber-500 text-black border-amber-300 shadow-sm scale-105'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <span>🎉</span>
            <span>Holidays</span>
          </button>

          <button
            onClick={() => toggleFilter('Birthdays')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider transition-all border ${
              !activeFilters.includes('ALL') && activeFilters.includes('Birthdays')
                ? 'bg-pink-500 text-white border-pink-300 shadow-sm scale-105'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <span>🎂</span>
            <span>Birthdays</span>
          </button>
        </div>

        {/* Card Layout selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded border border-slate-700/60">
          <button
            onClick={() => handleLayoutChange('compact')}
            className={`p-1.5 rounded transition-all ${
              cardLayout === 'compact' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Compact Cards"
          >
            <AlignJustify size={14} />
          </button>
          <button
            onClick={() => handleLayoutChange('list')}
            className={`p-1.5 rounded transition-all ${
              cardLayout === 'list' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="List Layout"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Main Synchronized Day Rows Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {next7Days.map(day => {
          const dayChores = choresByDay[day.choreKey] || [];
          const dayEvents = eventsByDay[day.index] || [];
          const hasItems = dayChores.length > 0 || dayEvents.length > 0;

          return (
            <div 
              key={day.index} 
              className={`rounded-xl border transition-all overflow-hidden ${
                day.isToday 
                  ? 'border-cyan-400/80 bg-slate-900/70 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/30' 
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              {/* Day Section Header */}
              <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                day.isToday 
                  ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900/90 border-cyan-500/40' 
                  : 'bg-slate-950/40 border-slate-800/70'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${day.isToday ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                  <h3 className={`text-xs md:text-sm font-black uppercase tracking-widest ${
                    day.isToday ? 'text-cyan-300' : 'text-slate-200'
                  }`}>
                    {day.formattedFull}
                  </h3>
                  <WeatherDayBadge date={day.dateObj} />
                </div>

                {/* Day Summary Badges & Quick Add */}
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    {dayChores.length} {dayChores.length === 1 ? 'chore' : 'chores'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800/60">
                    {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                  </span>
                  <button
                    onClick={() => handleOpenAddEvent(day.dateObj)}
                    className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                    title={`Add event for ${day.dayName}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Side-by-Side Synchronized Columns for this Day */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
                
                {/* LEFT COLUMN: Mission Board (Chores for this day) */}
                <div className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-500/90 mb-0.5">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList size={13} />
                      Mission Board
                    </span>
                    <span className="text-[10px] text-slate-500">{dayChores.length} Tasks</span>
                  </div>

                  {dayChores.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-950/20 rounded border border-dashed border-slate-800/50">
                      No chores assigned for this day
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayChores.map(chore => (
                        <ChoreCard
                          key={chore.id}
                          chore={chore}
                          onToggle={toggleChore}
                          onSkip={skipChore}
                          onRotate={rotateAssignee}
                          layout={cardLayout}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Master Schedule (Appointments for this day) */}
                <div className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-fuchsia-400/90 mb-0.5">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      Master Schedule
                    </span>
                    <span className="text-[10px] text-slate-500">{dayEvents.length} Events</span>
                  </div>

                  {dayEvents.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 italic bg-slate-950/20 rounded border border-dashed border-slate-800/50 flex flex-col items-center gap-1">
                      <span>No appointments scheduled</span>
                      <button
                        onClick={() => handleOpenAddEvent(day.dateObj)}
                        className="text-[10px] text-cyan-400 hover:underline uppercase tracking-widest font-bold mt-0.5"
                      >
                        + Add Appointment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map(evt => {
                        const meta = getEventMetadata(evt);
                        const allDay = isAllDay(evt);
                        
                        // Assignee pill color
                        const assignees = Array.isArray(evt.assigned_to) 
                          ? evt.assigned_to 
                          : (evt.assigned_to || 'Everyone').split(',').map(s => s.trim());
                        let colorClass = 'bg-slate-700 text-slate-200';
                        if (evt.isHoliday) {
                          colorClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                        } else if (evt.isBirthday) {
                          colorClass = 'bg-pink-500/20 text-pink-300 border border-pink-500/40';
                        } else if (assignees.includes('Everyone') || assignees.length > 1) {
                          colorClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                        } else if (profiles && profiles.length > 0) {
                          const pIdx = profiles.findIndex(p => p.name === assignees[0]);
                          if (pIdx !== -1) {
                            colorClass = `${PROFILE_COLORS[pIdx % PROFILE_COLORS.length]} text-white`;
                          }
                        }

                        const pillText = evt.isHoliday 
                          ? 'Holiday' 
                          : evt.isBirthday 
                            ? 'Birthday' 
                            : assignees.join(', ');

                        return (
                          <div
                            key={evt.id}
                            onClick={() => handleOpenEditEvent(evt)}
                            className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:border-cyan-400/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col gap-1.5 shadow-sm group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              {/* Time Badge */}
                              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                                <Clock size={11} className="text-cyan-400" />
                                <span>{allDay ? 'All Day' : formatTime(evt.start)}</span>
                                {!allDay && evt.end && (
                                  <span className="text-slate-500 font-normal">→ {formatTime(evt.end)}</span>
                                )}
                              </div>

                              {/* Assignee Pill */}
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${colorClass}`}>
                                {pillText}
                              </span>
                            </div>

                            {/* Event Title */}
                            <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-cyan-300 transition-colors">
                              {evt.title}
                            </h4>

                            {/* Location (if present) */}
                            {meta?.location && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                                <MapPin size={10} className="text-fuchsia-400 shrink-0" />
                                <span className="truncate">{meta.location}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Top-Anchored Event Creation / Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div 
            className="bg-white dark:bg-slate-950 border-2 border-cyan-400 w-full max-w-lg shadow-[0_0_30px_rgba(34,211,238,0.3)] my-2 sm:my-4 flex flex-col relative animate-in fade-in slide-in-from-top-4 duration-300"
            style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-950 z-20 flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                {modalEventData.id ? 'Update Appointment' : 'Add Appointment'}
              </h3>
              <button 
                onClick={closeModal} 
                className="p-1.5 text-slate-400 hover:text-fuchsia-500 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
                title="Close"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
              {modalEventData.readonly && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/40 text-amber-500 dark:text-amber-400 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    {modalEventData.isHoliday
                      ? 'Read-Only: National Holiday is automated.'
                      : modalEventData.isBirthday
                        ? 'Read-Only: Family Birthday is automated.'
                        : 'External Calendar Feed: Event details are synced from the feed, but you can assign participants below for display.'}
                  </span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-500 mb-1.5">Appointment Title</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={modalEventData.title}
                  onChange={e => setModalEventData({...modalEventData, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-2.5 sm:p-3 text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                  placeholder="E.g., Soccer Practice"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-500 mb-1.5">Location / Address</label>
                <LocationAutocomplete 
                  value={modalEventData.location}
                  onChange={(val) => setModalEventData({...modalEventData, location: val})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-500 mb-1.5">Start Time</label>
                  <DatePicker 
                    selected={modalEventData.start}
                    onChange={(date) => setModalEventData({...modalEventData, start: date})}
                    showTimeSelect
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-2.5 sm:p-3 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-500 mb-1.5">End Time</label>
                  <DatePicker 
                    selected={modalEventData.end}
                    onChange={(date) => setModalEventData({...modalEventData, end: date})}
                    showTimeSelect
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-slate-800 p-2.5 sm:p-3 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-cyan-500 mb-1.5">Participant</label>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    type="button"
                    onClick={() => toggleAssignee('Everyone')}
                    className={`px-2.5 py-1 text-xs font-black uppercase border transition-colors ${
                      modalEventData.assigned_to.includes('Everyone')
                        ? 'border-amber-400 bg-amber-400/10 text-amber-500'
                        : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-amber-400'
                    }`}
                  >
                    Everyone
                  </button>
                  {profiles.map(p => {
                    const isSelected = modalEventData.assigned_to.includes(p.name);
                    return (
                      <button 
                        key={p.id} 
                        type="button"
                        onClick={() => toggleAssignee(p.name)}
                        className={`px-2.5 py-1 text-xs font-black uppercase border transition-colors ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400/10 text-cyan-500'
                            : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-cyan-400'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={modalEventData.isRecurring}
                    onChange={e => {
                      const isRec = e.target.checked;
                      const defaultUntil = new Date(modalEventData.start || new Date());
                      defaultUntil.setMonth(defaultUntil.getMonth() + 2);
                      const dayIdx = (modalEventData.start ? new Date(modalEventData.start) : new Date()).getDay();
                      setModalEventData(prev => ({
                        ...prev,
                        isRecurring: isRec,
                        selectedDays: prev.selectedDays?.length ? prev.selectedDays : [dayIdx],
                        recurUntil: prev.recurUntil || defaultUntil
                      }));
                    }}
                    className="w-4 h-4 text-cyan-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-cyan-800 rounded focus:ring-cyan-500 focus:ring-2 transition-all cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-cyan-500">Recurring Event</span>
                </label>
              </div>

              {modalEventData.isRecurring && (
                <div className="flex flex-col gap-3 border-l-2 border-cyan-500 pl-3 py-2 bg-slate-50 dark:bg-cyan-950/10">
                  <div className="flex flex-col">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-cyan-700 mb-1">Repeat Until</label>
                    <DatePicker 
                      selected={modalEventData.recurUntil}
                      onChange={(date) => setModalEventData({...modalEventData, recurUntil: date})}
                      dateFormat="MMM d, yyyy"
                      className="w-full bg-white dark:bg-black border border-slate-300 dark:border-slate-800 p-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 transition-colors"
                      placeholderText="Select end date"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-cyan-700 mb-1">On Days</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = modalEventData.selectedDays.includes(idx)
                              ? modalEventData.selectedDays.filter(d => d !== idx)
                              : [...modalEventData.selectedDays, idx];
                            setModalEventData({...modalEventData, selectedDays: days});
                          }}
                          className={`px-2 py-1 text-[11px] font-black uppercase tracking-wider border transition-colors ${
                            modalEventData.selectedDays.includes(idx) 
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-700 hover:border-cyan-500'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Notifications */}
              {submitStatus.state === 'success' && (
                <div className="p-3 bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider rounded flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span>{submitStatus.message}</span>
                </div>
              )}

              {submitStatus.state === 'error' && (
                <div className="p-3 bg-rose-500/15 border-2 border-rose-500 text-rose-400 text-xs sm:text-sm font-bold uppercase tracking-wider rounded flex items-center gap-2.5 animate-in fade-in duration-200">
                  <X size={18} className="text-rose-400 shrink-0" />
                  <span>{submitStatus.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              {modalEventData.readonly ? (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-slate-800 text-slate-200 font-black uppercase tracking-widest py-3 text-xs hover:bg-slate-700 transition-colors"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    Close
                  </button>
                  {typeof modalEventData.id === 'string' && modalEventData.id.startsWith('ical-') && (
                    <button
                      type="submit"
                      disabled={submitStatus.state === 'submitting' || submitStatus.state === 'success'}
                      className={`flex-1 font-black uppercase tracking-widest py-3 text-xs transition-all flex items-center justify-center gap-2 ${
                        submitStatus.state === 'success'
                          ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : submitStatus.state === 'submitting'
                            ? 'bg-cyan-600 text-black opacity-80 cursor-wait'
                            : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      }`}
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    >
                      {submitStatus.state === 'submitting' && <Loader2 size={14} className="animate-spin" />}
                      {submitStatus.state === 'success' && <CheckCircle2 size={14} />}
                      {submitStatus.state === 'submitting'
                        ? 'Saving...'
                        : submitStatus.state === 'success'
                          ? 'Saved!'
                          : 'Save Participant'}
                    </button>
                  )}
                </div>
              ) : showDeleteOptions ? (
                <div className="p-3 bg-rose-950/30 border-2 border-rose-500/60 rounded flex flex-col gap-2.5 animate-in fade-in duration-150">
                  <div className="text-xs font-black uppercase tracking-widest text-rose-400">
                    {modalEventData.isRecurring || modalEventData.seriesId
                      ? 'Delete Recurring Event — Choose Scope:'
                      : 'Confirm Delete Event?'}
                  </div>
                  {modalEventData.isRecurring || modalEventData.seriesId ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => confirmDeleteEvent(false)}
                        disabled={submitStatus.state === 'submitting'}
                        className="flex-1 bg-amber-500 text-black font-black uppercase tracking-widest py-2.5 px-3 text-[11px] hover:bg-amber-400 transition-colors disabled:opacity-40"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                      >
                        Delete This Event Only
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteEvent(true)}
                        disabled={submitStatus.state === 'submitting'}
                        className="flex-1 bg-rose-600 text-white font-black uppercase tracking-widest py-2.5 px-3 text-[11px] hover:bg-rose-500 transition-colors disabled:opacity-40"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                      >
                        Delete Entire Series
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteOptions(false)}
                        disabled={submitStatus.state === 'submitting'}
                        className="bg-slate-800 text-slate-200 font-black uppercase tracking-widest py-2.5 px-4 text-[11px] hover:bg-slate-700 transition-colors disabled:opacity-40"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmDeleteEvent(false)}
                        disabled={submitStatus.state === 'submitting'}
                        className="flex-1 bg-rose-600 text-white font-black uppercase tracking-widest py-2.5 px-3 text-xs hover:bg-rose-500 transition-colors disabled:opacity-40"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteOptions(false)}
                        disabled={submitStatus.state === 'submitting'}
                        className="flex-1 bg-slate-800 text-slate-200 font-black uppercase tracking-widest py-2.5 px-3 text-xs hover:bg-slate-700 transition-colors disabled:opacity-40"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  {modalEventData.id && (
                    <button 
                      type="button" 
                      onClick={handleDeleteEvent}
                      disabled={submitStatus.state === 'submitting' || submitStatus.state === 'success'}
                      className="flex-1 bg-transparent border-2 border-rose-500 text-rose-500 font-black uppercase tracking-widest py-3 text-xs hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-40"
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    >
                      Delete
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submitStatus.state === 'submitting' || submitStatus.state === 'success'}
                    className={`flex-1 font-black uppercase tracking-widest py-3 text-xs transition-all flex items-center justify-center gap-2 ${
                      submitStatus.state === 'success'
                        ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : submitStatus.state === 'submitting'
                          ? 'bg-cyan-600 text-black opacity-80 cursor-wait'
                          : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                    }`}
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    {submitStatus.state === 'submitting' && <Loader2 size={14} className="animate-spin" />}
                    {submitStatus.state === 'success' && <CheckCircle2 size={14} />}
                    {submitStatus.state === 'submitting'
                      ? 'Saving...'
                      : submitStatus.state === 'success'
                        ? 'Confirmed!'
                        : modalEventData.id ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

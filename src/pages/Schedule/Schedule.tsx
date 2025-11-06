import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, Button, Modal, Loading } from '../../components/common';
import { ShiftForm } from '../../components/forms/ShiftForm';
import { StudyForm } from '../../components/forms/StudyForm';
import { useShifts } from '../../hooks/useShifts';
import { useStudySessions } from '../../hooks/useStudySessions';
import { formatTime, formatDate, getRelativeDateLabel, calculateDuration } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import './Schedule.css';

type ViewMode = 'month' | 'week' | 'day';
type EventType = 'shift' | 'study';

interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  subtitle?: string;
  startTime: string;
  endTime: string;
  color: string;
  data: any;
}

export const Schedule: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalType, setModalType] = useState<'shift' | 'study' | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    switch (viewMode) {
      case 'day':
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek + 1); 
        end.setDate(start.getDate() + 6); 
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();
  const { shifts, isLoading: shiftsLoading } = useShifts(dateRange);
  const { studySessions, isLoading: studyLoading } = useStudySessions(dateRange);

  const events: CalendarEvent[] = [
    ...shifts.map(shift => ({
      id: `shift-${shift.id}`,
      type: 'shift' as EventType,
      title: shift.title,
      subtitle: shift.workplace?.name,
      startTime: shift.startDatetime,
      endTime: shift.endDatetime,
      color: shift.workplace?.color || '#3498db',
      data: shift,
    })),
    ...studySessions.map(session => ({
      id: `study-${session.id}`,
      type: 'study' as EventType,
      title: session.title,
      subtitle: session.subject,
      startTime: session.startDatetime,
      endTime: session.endDatetime,
      color: getPriorityColor(session.priority),
      data: session,
    })),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#3498db';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return formatDate(selectedDate.toISOString());
      case 'week':
        const weekStart = new Date(selectedDate);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${formatDate(weekStart.toISOString())} - ${formatDate(weekEnd.toISOString())}`;
      case 'month':
        return selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const openEventDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const closeModals = () => {
    console.log('Closing modals, resetting state');
    setModalType(null);
    setSelectedEvent(null);
    setShowEventDetails(false);
  };

  const handleAddShift = () => {
    console.log('💼 Opening Shift Modal');
    setModalType('shift');
  };

  const handleAddStudy = () => {
    console.log('📚 Opening Study Modal');
    setModalType('study');
  };

  if (shiftsLoading || studyLoading) {
    return <Loading fullScreen text="Loading your schedule..." />;
  }

  return (
    <>
      <PageHeader
        title="📅 Schedule"
        subtitle="View and manage your shifts and study sessions"
        actions={
          <div className="schedule-header-actions">
            <Button 
              variant="secondary" 
              size="small" 
              onClick={handleAddStudy}
            >
              📚 Add Study Session
            </Button>
            <Button 
              variant="primary" 
              size="small" 
              onClick={handleAddShift}
            >
              💼 Add Shift
            </Button>
          </div>
        }
      />

      <div className="schedule-container">
        <Card className="schedule-controls">
          <div className="schedule-controls__left">
            <div className="view-mode-toggle">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-controls__center">
            <button className="nav-btn" onClick={() => navigateDate('prev')}>
              ◀
            </button>
            <h2 className="view-title">{getViewTitle()}</h2>
            <button className="nav-btn" onClick={() => navigateDate('next')}>
              ▶
            </button>
          </div>

          <div className="schedule-controls__right">
            <Button variant="ghost" size="small" onClick={goToToday}>
              Today
            </Button>
          </div>
        </Card>

        {viewMode === 'day' && <DayView events={events} selectedDate={selectedDate} onEventClick={openEventDetails} />}
        {viewMode === 'week' && <WeekView events={events} selectedDate={selectedDate} onEventClick={openEventDetails} />}
        {viewMode === 'month' && <MonthView events={events} selectedDate={selectedDate} onEventClick={openEventDetails} />}

        <Card className="schedule-stats">
          <h3>📊 {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Summary</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{shifts.length}</span>
              <span className="stat-label">Shifts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{studySessions.length}</span>
              <span className="stat-label">Study Sessions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {shifts.reduce((total, shift) => total + calculateDuration(shift.startDatetime, shift.endDatetime), 0).toFixed(1)}h
              </span>
              <span className="stat-label">Work Hours</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {formatCurrency(shifts.reduce((total, shift) => {
                  const hours = calculateDuration(shift.startDatetime, shift.endDatetime);
                  return total + (hours * (shift.workplace?.hourlyRate || 0));
                }, 0))}
              </span>
              <span className="stat-label">Estimated Earnings</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Shift Modal */}
      <Modal
        isOpen={modalType === 'shift'}
        onClose={closeModals}
        title="💼 Add New Shift"
        size="medium"
      >
        <ShiftForm onSuccess={closeModals} onCancel={closeModals} />
      </Modal>

      {/* Study Session Modal */}
      <Modal
        isOpen={modalType === 'study'}
        onClose={closeModals}
        title="📚 Schedule Study Session"
        size="medium"
      >
        <StudyForm onSuccess={closeModals} onCancel={closeModals} />
      </Modal>

      {/* Event Details Modal */}
      <Modal
        isOpen={showEventDetails}
        onClose={closeModals}
        title={selectedEvent ? `${selectedEvent.type === 'shift' ? '💼' : '📚'} ${selectedEvent.title}` : ''}
        size="medium"
      >
        {selectedEvent && <EventDetails event={selectedEvent} onClose={closeModals} />}
      </Modal>
    </>
  );
};

const DayView: React.FC<{ events: CalendarEvent[]; selectedDate: Date; onEventClick: (event: CalendarEvent) => void }> = ({
  events, selectedDate, onEventClick
}) => {
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime).toDateString();
    return eventDate === selectedDate.toDateString();
  });

  return (
    <Card className="day-view">
      <div className="time-grid">
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="time-slot">
            <div className="time-label">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            <div className="time-content">
              {dayEvents
                .filter(event => new Date(event.startTime).getHours() === hour)
                .map(event => (
                  <div
                    key={event.id}
                    className="event-block"
                    style={{ backgroundColor: event.color }}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="event-title">{event.title}</div>
                    <div className="event-time">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const WeekView: React.FC<{ events: CalendarEvent[]; selectedDate: Date; onEventClick: (event: CalendarEvent) => void }> = ({
  events, selectedDate, onEventClick
}) => {
  const weekStart = new Date(selectedDate);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  return (
    <Card className="week-view">
      <div className="week-header">
        {weekDays.map(day => (
          <div key={day.toISOString()} className="day-header">
            <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="day-number">{day.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="week-content">
        {weekDays.map(day => {
          const dayEvents = events.filter(event => {
            const eventDate = new Date(event.startTime).toDateString();
            return eventDate === day.toDateString();
          });

          return (
            <div key={day.toISOString()} className="day-column">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="event-item"
                  style={{ borderLeft: `4px solid ${event.color}` }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="event-title">{event.title}</div>
                  <div className="event-time">{formatTime(event.startTime)}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Month View Component
const MonthView: React.FC<{ events: CalendarEvent[]; selectedDate: Date; onEventClick: (event: CalendarEvent) => void }> = ({
  events, selectedDate, onEventClick
}) => {
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay() + 1);

  const calendarDays = [];
  const current = new Date(startDate);
  
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    calendarDays.push(weekDays);
    if (current > monthEnd) break;
  }

  return (
    <Card className="month-view">
      <div className="month-header">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="weekday-header">{day}</div>
        ))}
      </div>
      <div className="month-grid">
        {calendarDays.map((week, weekIndex) => (
          <div key={weekIndex} className="week-row">
            {week.map(day => {
              const dayEvents = events.filter(event => {
                const eventDate = new Date(event.startTime).toDateString();
                return eventDate === day.toDateString();
              });

              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day.toISOString()}
                  className={`month-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                >
                  <div className="day-number">{day.getDate()}</div>
                  <div className="day-events">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="month-event"
                        style={{ backgroundColor: event.color }}
                        onClick={() => onEventClick(event)}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="more-events">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
};

// Event Details Component
const EventDetails: React.FC<{ event: CalendarEvent; onClose: () => void }> = ({ event, onClose }) => {
  const { data, type } = event;

  return (
    <div className="event-details">
      <div className="event-header">
        <div className="event-type-badge" style={{ backgroundColor: event.color }}>
          {type === 'shift' ? '💼 Work Shift' : '📚 Study Session'}
        </div>
      </div>

      <div className="event-info">
        <h3>{event.title}</h3>
        {event.subtitle && <p className="event-subtitle">{event.subtitle}</p>}
        
        <div className="event-details-grid">
          <div className="detail-item">
            <strong>Date:</strong>
            <span>{formatDate(event.startTime)}</span>
          </div>
          <div className="detail-item">
            <strong>Time:</strong>
            <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          </div>
          <div className="detail-item">
            <strong>Duration:</strong>
            <span>{calculateDuration(event.startTime, event.endTime).toFixed(1)} hours</span>
          </div>

          {type === 'shift' && (
            <>
              <div className="detail-item">
                <strong>Workplace:</strong>
                <span>{data.workplace?.name}</span>
              </div>
              <div className="detail-item">
                <strong>Hourly Rate:</strong>
                <span>{formatCurrency(data.workplace?.hourlyRate || 0)}</span>
              </div>
              <div className="detail-item">
                <strong>Estimated Earnings:</strong>
                <span>{formatCurrency(calculateDuration(event.startTime, event.endTime) * (data.workplace?.hourlyRate || 0))}</span>
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                <span className={`status ${data.isConfirmed ? 'confirmed' : 'pending'}`}>
                  {data.isConfirmed ? '✅ Confirmed' : '⏳ Pending'}
                </span>
              </div>
            </>
          )}

          {type === 'study' && (
            <>
              <div className="detail-item">
                <strong>Subject:</strong>
                <span>{data.subject || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Location:</strong>
                <span>{data.location || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Session Type:</strong>
                <span>{data.sessionType}</span>
              </div>
              <div className="detail-item">
                <strong>Priority:</strong>
                <span className={`priority priority-${data.priority}`}>
                  {data.priority.charAt(0).toUpperCase() + data.priority.slice(1)}
                </span>
              </div>
            </>
          )}
        </div>

        {data.notes && (
          <div className="event-notes">
            <strong>Notes:</strong>
            <p>{data.notes}</p>
          </div>
        )}
      </div>

      <div className="event-actions">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary">
          Edit {type === 'shift' ? 'Shift' : 'Session'}
        </Button>
      </div>
    </div>
  );
};
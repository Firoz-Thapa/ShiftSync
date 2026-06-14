import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { Shift } from '../../types';
import { formatTime } from '../../utils/dateUtils';
import { ToastContainer, useToast } from './Toast';

const SENT_REMINDERS_KEY = 'shiftsync_shift_reminders_sent';
const SHIFTS_KEY = 'shiftsync_shifts';
const CHECK_INTERVAL_MS = 30 * 1000;

type SentReminders = Record<string, string>;

const readStoredShifts = (): Shift[] => {
  try {
    const storedShifts = localStorage.getItem(SHIFTS_KEY);
    return storedShifts ? JSON.parse(storedShifts) : [];
  } catch {
    return [];
  }
};

const readSentReminders = (): SentReminders => {
  try {
    const storedReminders = localStorage.getItem(SENT_REMINDERS_KEY);
    return storedReminders ? JSON.parse(storedReminders) : {};
  } catch {
    return {};
  }
};

const writeSentReminders = (sentReminders: SentReminders) => {
  localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sentReminders));
};

const getReminderKey = (shift: Shift) =>
  `${shift.id}-${shift.startDatetime}-${shift.reminderMinutesBefore}`;

const getReminderMessage = (shift: Shift) => {
  const workplaceName = shift.workplace?.name || 'your workplace';
  return `${shift.title} at ${workplaceName} starts at ${formatTime(shift.startDatetime)}.`;
};

export const ShiftReminderNotifications: React.FC = () => {
  const { user } = useAuth();
  const { toasts, info, removeToast } = useToast();
  const toastRef = useRef(info);
  toastRef.current = info;

  useEffect(() => {
    if (!user) {
      return;
    }

    const checkShiftReminders = () => {
      const now = Date.now();
      const shifts = readStoredShifts();
      const sentReminders = readSentReminders();
      let sentRemindersChanged = false;

      shifts.forEach((shift) => {
        if (!shift.reminderEnabled || !shift.reminderMinutesBefore || shift.actualStartTime) {
          return;
        }

        const startTime = new Date(shift.startDatetime).getTime();
        const reminderTime = startTime - shift.reminderMinutesBefore * 60 * 1000;
        const reminderKey = getReminderKey(shift);

        if (sentReminders[reminderKey] || now < reminderTime || now >= startTime) {
          return;
        }

        const title = 'Shift reminder';
        const message = getReminderMessage(shift);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            tag: reminderKey,
          });
        }

        toastRef.current(title, message, 10000);
        sentReminders[reminderKey] = new Date(now).toISOString();
        sentRemindersChanged = true;
      });

      Object.keys(sentReminders).forEach((key) => {
        const matchingShift = shifts.find((shift) => getReminderKey(shift) === key);
        if (matchingShift && new Date(matchingShift.startDatetime).getTime() + 24 * 60 * 60 * 1000 < now) {
          delete sentReminders[key];
          sentRemindersChanged = true;
        }
      });

      if (sentRemindersChanged) {
        writeSentReminders(sentReminders);
      }
    };

    checkShiftReminders();
    const intervalId = window.setInterval(checkShiftReminders, CHECK_INTERVAL_MS);
    window.addEventListener('storage', checkShiftReminders);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', checkShiftReminders);
    };
  }, [user]);

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
};

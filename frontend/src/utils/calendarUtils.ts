import { Shift } from '../types';

const formatIcsDate = (dateString: string): string => {
  return new Date(dateString).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

const escapeIcsText = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
};

const foldIcsLine = (line: string): string => {
  const limit = 75;
  const chunks: string[] = [];

  for (let index = 0; index < line.length; index += limit) {
    chunks.push(`${index === 0 ? '' : ' '}${line.slice(index, index + limit)}`);
  }

  return chunks.join('\r\n');
};

export const generateShiftCalendar = (shifts: Shift[]): string => {
  const now = formatIcsDate(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftSync//Shift Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...shifts.flatMap((shift) => {
      const workplace = shift.workplace?.name || 'Workplace not set';
      const descriptionParts = [
        `Workplace: ${workplace}`,
        `Start: ${new Date(shift.startDatetime).toLocaleString()}`,
        `End: ${new Date(shift.endDatetime).toLocaleString()}`,
      ];

      if (shift.notes) {
        descriptionParts.push(`Notes: ${shift.notes}`);
      }

      return [
        'BEGIN:VEVENT',
        `UID:shiftsync-shift-${shift.id}@shiftsync`,
        `DTSTAMP:${now}`,
        `DTSTART:${formatIcsDate(shift.startDatetime)}`,
        `DTEND:${formatIcsDate(shift.endDatetime)}`,
        `SUMMARY:${escapeIcsText(shift.title)}`,
        `LOCATION:${escapeIcsText(workplace)}`,
        `DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`,
        'END:VEVENT',
      ];
    }),
    'END:VCALENDAR',
  ];

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
};

export const downloadCalendarFile = (filename: string, calendarContent: string): void => {
  const blob = new Blob([calendarContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

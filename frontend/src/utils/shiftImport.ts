import { ShiftFormData, Workplace } from '../types';

/**
 * A shift parsed from an import file, held in the preview screen so the user
 * can review and correct it before it is saved.
 */
export interface ImportedShiftRow {
  rowId: string;
  /** Line number in the source file (1-based, header is line 1). */
  sourceLine: number;
  title: string;
  workplaceId: number;
  /** Workplace name as written in the file, kept so unmatched names can be shown. */
  workplaceName: string;
  /** `YYYY-MM-DDTHH:mm`, matching `<input type="datetime-local">`. Empty if unparseable. */
  startDatetime: string;
  endDatetime: string;
  breakDuration: number;
  notes: string;
}

export type ImportedShiftField = 'title' | 'workplaceId' | 'startDatetime' | 'endDatetime' | 'breakDuration';

export const SHIFT_IMPORT_TEMPLATE =
  'date,start,end,workplace,title,break,notes\n' +
  '2026-12-01,09:00,17:00,Cafe Central,Morning shift,30,Open store\n' +
  '2026-12-02,22:00,06:00,Warehouse,Night shift,45,';

const HEADER_ALIASES: Record<string, string> = {
  date: 'date',
  day: 'date',
  start: 'start',
  starttime: 'start',
  from: 'start',
  end: 'end',
  endtime: 'end',
  finish: 'end',
  to: 'end',
  workplace: 'workplace',
  location: 'workplace',
  site: 'workplace',
  title: 'title',
  role: 'title',
  position: 'title',
  break: 'break',
  breakminutes: 'break',
  breakduration: 'break',
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
};

/** Splits CSV text into rows of cells, honouring double-quoted fields. Also accepts tab-separated text. */
export const parseCsv = (text: string): string[][] => {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);

  return rows.filter(r => r.some(c => c.trim() !== ''));
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Accepts `YYYY-MM-DD` or `YYYY/MM/DD`. Returns `YYYY-MM-DD` or null. */
export const parseImportDate = (value: string): string | null => {
  const match = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!match) return null;

  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;

  return `${y}-${pad(m)}-${pad(d)}`;
};

/** Accepts `HH:mm`, `H:mm`, `9am`, `5:30 pm`. Returns `HH:mm` or null. */
export const parseImportTime = (value: string): string | null => {
  const match = value.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];

  if (!match[2] && !meridiem) return null;
  if (minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'am' && hours === 12) hours = 0;
    if (meridiem === 'pm' && hours !== 12) hours += 12;
  } else if (hours > 23) {
    return null;
  }

  return `${pad(hours)}:${pad(minutes)}`;
};

const addDays = (isoDate: string, days: number) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export interface ShiftImportResult {
  rows: ImportedShiftRow[];
  /** Problems that stop the whole file from being read (e.g. missing columns). */
  error?: string;
}

export const parseShiftImport = (text: string, workplaces: Workplace[]): ShiftImportResult => {
  const table = parseCsv(text.trim());
  if (table.length < 2) {
    return { rows: [], error: 'Add a header row and at least one shift.' };
  }

  const columns = table[0].map(h => HEADER_ALIASES[h.trim().toLowerCase().replace(/[\s_-]/g, '')]);
  const required = ['date', 'start', 'end'];
  const missing = required.filter(col => !columns.includes(col));
  if (missing.length > 0) {
    return { rows: [], error: `Missing required column(s): ${missing.join(', ')}.` };
  }

  const workplaceByName = new Map(workplaces.map(w => [w.name.trim().toLowerCase(), w.id]));

  const rows = table.slice(1).map((cells, index): ImportedShiftRow => {
    const get = (col: string) => {
      const i = columns.indexOf(col);
      return i >= 0 ? (cells[i] ?? '').trim() : '';
    };

    const date = parseImportDate(get('date'));
    const start = parseImportTime(get('start'));
    const end = parseImportTime(get('end'));
    const workplaceName = get('workplace');
    const breakMinutes = Number(get('break'));

    // An end time earlier than the start time is treated as an overnight shift.
    const endDate = date && start && end && end <= start ? addDays(date, 1) : date;

    return {
      rowId: `import-${index}-${Math.random().toString(36).slice(2, 8)}`,
      sourceLine: index + 2,
      title: get('title') || 'Shift',
      workplaceId: workplaceByName.get(workplaceName.toLowerCase()) ?? 0,
      workplaceName,
      startDatetime: date && start ? `${date}T${start}` : '',
      endDatetime: endDate && end ? `${endDate}T${end}` : '',
      breakDuration: Number.isFinite(breakMinutes) && breakMinutes > 0 ? Math.round(breakMinutes) : 0,
      notes: get('notes'),
    };
  });

  return { rows };
};

/** Returns field errors for a row; an empty object means the row can be saved. */
export const validateImportedShift = (row: ImportedShiftRow): Partial<Record<ImportedShiftField, string>> => {
  const errors: Partial<Record<ImportedShiftField, string>> = {};

  if (!row.title.trim()) errors.title = 'Title is required';
  if (!row.workplaceId) errors.workplaceId = 'Choose a workplace';
  if (!row.startDatetime) errors.startDatetime = 'Start time is required';
  if (!row.endDatetime) errors.endDatetime = 'End time is required';
  if (row.startDatetime && row.endDatetime && new Date(row.endDatetime) <= new Date(row.startDatetime)) {
    errors.endDatetime = 'End must be after start';
  }
  if (row.breakDuration < 0) errors.breakDuration = 'Break cannot be negative';

  return errors;
};

export const toShiftFormData = (row: ImportedShiftRow): ShiftFormData => ({
  workplaceId: row.workplaceId,
  title: row.title.trim(),
  startDatetime: row.startDatetime,
  endDatetime: row.endDatetime,
  breakDuration: row.breakDuration,
  notes: row.notes.trim() || undefined,
  isConfirmed: false,
});

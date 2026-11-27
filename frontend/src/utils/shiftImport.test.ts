import { Workplace } from '../types';
import {
  parseCsv,
  parseImportDate,
  parseImportTime,
  parseShiftImport,
  toShiftFormData,
  validateImportedShift,
} from './shiftImport';

const workplace = (id: number, name: string): Workplace => ({
  id,
  userId: 1,
  name,
  color: '#000',
  hourlyRate: 20,
  isRecurring: false,
  createdAt: '',
  updatedAt: '',
});

const workplaces = [workplace(1, 'Cafe Central'), workplace(2, 'Warehouse')];

describe('parseCsv', () => {
  it('handles quoted fields with commas and escaped quotes', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });

  it('accepts tab-separated text and skips blank lines', () => {
    expect(parseCsv('a\tb\r\n\r\n1\t2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('date and time parsing', () => {
  it('parses ISO-style dates and rejects invalid ones', () => {
    expect(parseImportDate('2026-1-5')).toBe('2026-01-05');
    expect(parseImportDate('2026/12/31')).toBe('2026-12-31');
    expect(parseImportDate('2026-02-30')).toBeNull();
    expect(parseImportDate('05/01/2026')).toBeNull();
  });

  it('parses 24h and am/pm times', () => {
    expect(parseImportTime('9:05')).toBe('09:05');
    expect(parseImportTime('17:30')).toBe('17:30');
    expect(parseImportTime('9am')).toBe('09:00');
    expect(parseImportTime('12:15 AM')).toBe('00:15');
    expect(parseImportTime('5:30 pm')).toBe('17:30');
    expect(parseImportTime('25:00')).toBeNull();
    expect(parseImportTime('9')).toBeNull();
  });
});

describe('parseShiftImport', () => {
  it('maps rows to shifts and matches workplaces case-insensitively', () => {
    const { rows, error } = parseShiftImport(
      'Date,Start,End,Workplace,Title,Break,Notes\n2026-12-01,09:00,17:00,cafe central,Morning,30,Open',
      workplaces
    );

    expect(error).toBeUndefined();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sourceLine: 2,
      title: 'Morning',
      workplaceId: 1,
      startDatetime: '2026-12-01T09:00',
      endDatetime: '2026-12-01T17:00',
      breakDuration: 30,
      notes: 'Open',
    });
  });

  it('rolls overnight shifts into the next day', () => {
    const { rows } = parseShiftImport('date,start,end\n2026-12-31,22:00,06:00', workplaces);
    expect(rows[0].endDatetime).toBe('2027-01-01T06:00');
  });

  it('keeps unparseable values blank so the user can fix them in the preview', () => {
    const { rows } = parseShiftImport('date,start,end,workplace\nnext monday,9,17:00,Unknown Site', workplaces);

    expect(rows[0].startDatetime).toBe('');
    expect(rows[0].endDatetime).toBe('');
    expect(rows[0].workplaceId).toBe(0);
    expect(rows[0].workplaceName).toBe('Unknown Site');
    expect(validateImportedShift(rows[0])).toEqual({
      workplaceId: 'Choose a workplace',
      startDatetime: 'Start time is required',
      endDatetime: 'End time is required',
    });
  });

  it('reports missing required columns', () => {
    expect(parseShiftImport('date,workplace\n2026-12-01,Warehouse', workplaces).error).toBe(
      'Missing required column(s): start, end.'
    );
    expect(parseShiftImport('date,start,end', workplaces).error).toBe('Add a header row and at least one shift.');
  });
});

describe('validateImportedShift / toShiftFormData', () => {
  const { rows } = parseShiftImport('date,start,end,workplace,title\n2026-12-01,09:00,17:00,Warehouse,Pick', workplaces);

  it('accepts a complete row and converts it to form data', () => {
    expect(validateImportedShift(rows[0])).toEqual({});
    expect(toShiftFormData(rows[0])).toEqual({
      workplaceId: 2,
      title: 'Pick',
      startDatetime: '2026-12-01T09:00',
      endDatetime: '2026-12-01T17:00',
      breakDuration: 0,
      notes: undefined,
      isConfirmed: false,
    });
  });

  it('flags an end time that is not after the start', () => {
    const edited = { ...rows[0], endDatetime: '2026-12-01T08:00' };
    expect(validateImportedShift(edited).endDatetime).toBe('End must be after start');
  });
});

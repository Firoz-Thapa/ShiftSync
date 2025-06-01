export const SESSION_TYPES = [
  { value: 'lecture', label: 'Lecture', icon: '🎓' },
  { value: 'exam', label: 'Exam', icon: '📝' },
  { value: 'assignment', label: 'Assignment', icon: '📋' },
  { value: 'study_group', label: 'Study Group', icon: '👥' },
  { value: 'lab', label: 'Lab', icon: '🔬' },
  { value: 'other', label: 'Other', icon: '📚' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low', icon: '🟢' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'high', label: 'High', icon: '🟠' },
  { value: 'urgent', label: 'Urgent', icon: '🔴' },
];

export const APP_CONFIG = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  appName: 'ShiftSync',
  version: '1.0.0',
};
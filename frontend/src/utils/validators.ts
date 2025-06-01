export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateHourlyRate = (rate: number): string | null => {
  if (rate < 0) {
    return 'Hourly rate cannot be negative';
  }
  if (rate > 1000) {
    return 'Hourly rate seems too high';
  }
  return null;
};

export const validateDateRange = (startDate: string, endDate: string): string | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return 'End time must be after start time';
  }
  
  return null;
};
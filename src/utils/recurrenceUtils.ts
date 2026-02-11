/**
 * Utility functions for handling recurring shifts and study sessions
 */

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface RecurringItem {
  startDatetime: string;
  endDatetime: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string;
}

export interface GeneratedInstance {
  startDatetime: string;
  endDatetime: string;
}

/**
 * Generate recurring instances based on the recurrence pattern
 * @param item - The recurring item with start/end times and pattern
 * @param maxInstances - Maximum number of instances to generate (default: 52 for a year)
 * @returns Array of generated instances with updated datetimes
 */
export function generateRecurringInstances(
  item: RecurringItem,
  maxInstances: number = 52
): GeneratedInstance[] {
  if (!item.isRecurring || !item.recurrencePattern) {
    return [{
      startDatetime: item.startDatetime,
      endDatetime: item.endDatetime
    }];
  }

  const instances: GeneratedInstance[] = [];
  const startDate = new Date(item.startDatetime);
  const endDate = new Date(item.endDatetime);
  const duration = endDate.getTime() - startDate.getTime();

  let currentDate = new Date(startDate);
  const recurrenceEnd = item.recurrenceEndDate 
    ? new Date(item.recurrenceEndDate)
    : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year

  let count = 0;

  while (currentDate <= recurrenceEnd && count < maxInstances) {
    const instanceStart = new Date(currentDate);
    const instanceEnd = new Date(instanceStart.getTime() + duration);

    instances.push({
      startDatetime: instanceStart.toISOString(),
      endDatetime: instanceEnd.toISOString()
    });

    // Increment based on pattern
    switch (item.recurrencePattern) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }

    count++;
  }

  return instances;
}

/**
 * Get the next occurrence of a recurring item
 * @param item - The recurring item
 * @returns The next instance, or null if recurrence has ended
 */
export function getNextOccurrence(item: RecurringItem): GeneratedInstance | null {
  if (!item.isRecurring || !item.recurrencePattern) {
    const start = new Date(item.startDatetime);
    const now = new Date();
    
    if (start > now) {
      return {
        startDatetime: item.startDatetime,
        endDatetime: item.endDatetime
      };
    }
    return null;
  }

  const instances = generateRecurringInstances(item, 1);
  const now = new Date();

  // Find first instance in the future
  for (const instance of instances) {
    if (new Date(instance.startDatetime) > now) {
      return instance;
    }
  }

  // Generate more instances to find future ones
  const allInstances = generateRecurringInstances(item, 365);
  for (const instance of allInstances) {
    if (new Date(instance.startDatetime) > now) {
      return instance;
    }
  }

  return null;
}

/**
 * Format recurrence pattern for display
 * @param pattern - The recurrence pattern
 * @returns Human-readable format
 */
export function formatRecurrencePattern(pattern: RecurrencePattern | undefined): string {
  if (!pattern) return 'No recurrence';
  
  const patterns: Record<RecurrencePattern, string> = {
    daily: 'Every Day',
    weekly: 'Every Week',
    monthly: 'Every Month'
  };

  return patterns[pattern];
}

/**
 * Check if an item is currently recurring
 * @param item - The item to check
 * @returns True if the item is recurring and has not ended
 */
export function isCurrentlyRecurring(item: RecurringItem): boolean {
  if (!item.isRecurring) return false;
  
  if (item.recurrenceEndDate) {
    const endDate = new Date(item.recurrenceEndDate);
    return new Date() <= endDate;
  }

  return true;
}

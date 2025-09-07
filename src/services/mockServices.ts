import { Shift, StudySession, Workplace } from "../types";

const mockWorkplaces: Workplace[] = [
  {
    id: 1,
    userId: 1,
    name: 'Campus Coffee',
    color: '#3498db',
    hourlyRate: 15.50,
    address: '123 University Ave',
    contactInfo: 'manager@campuscoffee.com',
    notes: 'Flexible hours, great team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    name: 'Local Bookstore',
    color: '#2ecc71',
    hourlyRate: 14.00,
    address: '456 Main St',
    contactInfo: '(555) 123-4567',
    notes: 'Quiet environment, perfect for studying',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockShifts: Shift[] = [
  {
    id: 1,
    userId: 1,
    workplaceId: 1,
    workplace: mockWorkplaces[0],
    title: 'Morning Shift',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T09:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T17:00:00'),
    breakDuration: 30,
    notes: 'Regular morning shift',
    isConfirmed: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    workplaceId: 2,
    workplace: mockWorkplaces[1],
    title: 'Evening Shift',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T18:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T22:00:00'),
    breakDuration: 15,
    notes: 'Evening shift at bookstore',
    isConfirmed: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockStudySessions: StudySession[] = [
  {
    id: 1,
    userId: 1,
    title: 'Database Systems Review',
    subject: 'Computer Science',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T14:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T16:00:00'),
    location: 'Library Room 201',
    sessionType: 'study_group',
    priority: 'high',
    isCompleted: false,
    notes: 'Prepare for midterm exam',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    userId: 1,
    title: 'Math Assignment',
    subject: 'Mathematics',
    startDatetime: new Date().toISOString().replace(/T.*/, 'T19:00:00'),
    endDatetime: new Date().toISOString().replace(/T.*/, 'T21:00:00'),
    location: 'Home',
    sessionType: 'assignment',
    priority: 'medium',
    isCompleted: true,
    notes: 'Calculus homework due tomorrow',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock service implementations
export const mockShiftService = {
  async getTodayShifts(): Promise<Shift[]> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return mockShifts;
  },

  async createShift(data: any): Promise<Shift> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newShift: Shift = {
      id: Date.now(),
      userId: 1,
      workplaceId: data.workplaceId,
      workplace: mockWorkplaces.find(w => w.id === data.workplaceId),
      title: data.title,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      breakDuration: data.breakDuration || 0,
      notes: data.notes,
      isConfirmed: data.isConfirmed || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockShifts.push(newShift);
    return newShift;
  }
};

export const mockStudyService = {
  async getTodayStudySessions(): Promise<StudySession[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockStudySessions;
  },

  async createStudySession(data: any): Promise<StudySession> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newSession: StudySession = {
      id: Date.now(),
      userId: 1,
      title: data.title,
      subject: data.subject,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      location: data.location,
      sessionType: data.sessionType || 'other',
      priority: data.priority || 'medium',
      isCompleted: false,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockStudySessions.push(newSession);
    return newSession;
  }
};

export const mockWorkplaceService = {
  async getUserWorkplaces(): Promise<Workplace[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockWorkplaces;
  },

  async createWorkplace(data: any): Promise<Workplace> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newWorkplace: Workplace = {
      id: Date.now(),
      userId: 1,
      name: data.name,
      color: data.color,
      hourlyRate: data.hourlyRate,
      address: data.address,
      contactInfo: data.contactInfo,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockWorkplaces.push(newWorkplace);
    return newWorkplace;
  }
};
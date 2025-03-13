export interface User {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  status?: string;
  eventCount?: number;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  speaker?: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  assignedTo?: string;
}

export interface EventDetail {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  location?: string;
  description?: string;
  type: 'meeting' | 'course' | 'social' | 'other';
  color?: string;
  organizers: User[];
  attendees: User[];
  agenda: AgendaItem[];
  checklist: ChecklistItem[];
}

export interface EventListProps {
  events: EventDetail[];
  users: User[];
  selectedUsers: Set<string>;
  onEventClick: (event: EventDetail) => void;
  currentDate: Date;
}

export interface CreateEventProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventDetail: EventDetail) => void;
  users: User[];
}

export interface EventDetailsProps {
  event: EventDetail;
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onUpdate: (event: EventDetail) => void;
  users: User[];
} 
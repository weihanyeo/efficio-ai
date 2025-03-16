'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useEventQueries } from '../hooks/useEventQueries';
import { EventDetail, User } from '../types/event';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';

interface EventContextType {
  events: EventDetail[];
  users: User[];
  selectedUsers: Set<string>;
  currentDate: Date;
  loading: boolean;
  error: Error | null;
  setSelectedUsers: (users: Set<string>) => void;
  setCurrentDate: (date: Date) => void;
  createEvent: (eventData: Omit<EventDetail, 'id'>) => Promise<string>;
  updateEvent: (eventId: string, eventData: Partial<EventDetail>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { fetchEvents, fetchWorkspaceUsers, createEvent: createEventQuery, updateEvent: updateEventQuery, deleteEvent: deleteEventQuery } = useEventQueries();
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentWorkspace?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch events and users in parallel
        const [eventsData, usersData] = await Promise.all([
          fetchEvents(currentWorkspace.id),
          fetchWorkspaceUsers(currentWorkspace.id)
        ]);

        setEvents(eventsData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load events'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentWorkspace?.id, fetchEvents, fetchWorkspaceUsers]);

  const createEvent = async (eventData: Omit<EventDetail, 'id'>) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!currentWorkspace?.id) throw new Error('No workspace selected');

    try {
      setError(null);
      const eventResult = await createEventQuery(currentWorkspace.id, eventData);
      // Use the complete event data returned from createEventQuery
      const newEvent: EventDetail = { 
        ...eventData, 
        id: eventResult.id 
      };
      console.log("Adding new event to state:", newEvent);
      setEvents(prev => [...prev, newEvent]);
      return newEvent.id;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create event'));
      throw err;
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<EventDetail>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);
      await updateEventQuery(eventId, eventData);
      setEvents(prev =>
        prev.map(event =>
          event.id === eventId ? { ...event, ...eventData } : event
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update event'));
      throw err;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);
      await deleteEventQuery(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete event'));
      throw err;
    }
  };

  return (
    <EventContext.Provider
      value={{
        events,
        users,
        selectedUsers,
        currentDate,
        loading,
        error,
        setSelectedUsers,
        setCurrentDate,
        createEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}; 
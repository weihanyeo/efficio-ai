'use client';
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Calendar } from "./schedule/Calendar";
import { UserFilter } from "./schedule/UserFilter";
import { EventList } from "./schedule/EventList";
import { EventDetails } from "./schedule/EventDetails";
import { CreateEvent } from "./schedule/CreateEvent";
import { parseEventDate, isSameDate } from "./utils/dateUtils";
import { useEvents } from "../contexts/EventContext";
import type { EventDetail } from "../types/event";

export const SchedulePage = () => {
  const { events, users, selectedUsers, setSelectedUsers, currentDate, setCurrentDate, createEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const handleEventClick = (event: EventDetail) => {
    setSelectedEvent(event);
  };

  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventDetail) => {
    try {
      await updateEvent(updatedEvent.id, updatedEvent);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleCreateEvent = async (newEvent: Omit<EventDetail, "id">) => {
    try {
      await createEvent(newEvent);
      setIsCreateEventOpen(false);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const filteredEvents = events.filter((event) => {
    const eventDate = parseEventDate(event.date);
    const isDateMatch = isSameDate(eventDate, currentDate);

    const userMatch =
      selectedUsers.size === 0 ||
      [...event.organizers, ...event.attendees].some((person) =>
        selectedUsers.has(person.id)
      );

    return isDateMatch && userMatch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#161616] text-white relative max-w-full overflow-hidden whitespace-nowrap">
      {/* Calendar Section */}
      <Calendar events={events} onDateChange={setCurrentDate} />
      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* User Filter Sidebar */}
          <div className="w-70 border-r border-gray-800 p-4">
            <UserFilter
              users={users}
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              events={events}
              selectedEvents={selectedEvents}
              onEventSelection={setSelectedEvents}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-hidden">
            <EventList
              events={filteredEvents}
              users={users}
              selectedUsers={selectedUsers}
              onEventClick={handleEventClick}
              currentDate={currentDate}
            />
          </div>
        </div>

        {/* Floating Create Event Button */}
        <button
          onClick={() => setIsCreateEventOpen(true)}
          className="fixed bottom-6 left-6 z-20 flex items-center gap-2 px-4 py-3 bg-purple-600 rounded-full hover:bg-purple-400 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          <span>Create Event</span>
        </button>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCloseEventDetails}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <EventDetails
                event={selectedEvent}
                onClose={handleCloseEventDetails}
                onDelete={handleDeleteEvent}
                onUpdate={handleUpdateEvent}
                users={users}
              />
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        <CreateEvent
          isOpen={isCreateEventOpen}
          onClose={() => setIsCreateEventOpen(false)}
          onSubmit={handleCreateEvent}
          users={users}
        />
      </div>
    </div>
  );
};

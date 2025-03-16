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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      toast.success("Event deleted successfully!", {
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error("Failed to delete event. Please try again.", {
        autoClose: 5000,
      });
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventDetail) => {
    try {
      await updateEvent(updatedEvent.id, updatedEvent);
      
      // Update the selected event instead of closing the detail view
      setSelectedEvent(updatedEvent);
      
      // Show a success toast for the update
      toast.success("Event updated successfully!", {
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Failed to update event:', error);
      
      // Show error toast
      toast.error("Failed to update event. Please try again.", {
        autoClose: 5000,
      });
    }
  };

  const handleCreateEvent = async (newEvent: Omit<EventDetail, "id">) => {
    try {
      // Log the event being created
      console.log('Creating new event:', newEvent);
      
      await createEvent(newEvent);
      
      // Show success toast after event is created
      toast.success("Event created successfully!", {
        autoClose: 5000, // 5 seconds duration
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: "rgba(30, 30, 30, 0.9)",
          backdropFilter: "blur(12px)",
          color: "#ffffff",
          borderLeft: "4px solid #10b981",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontWeight: 500,
          borderRadius: "8px",
          padding: "16px",
        },
      });
      
      // Force a refresh of the current date to trigger event list update
      const refreshDate = new Date(currentDate);
      setCurrentDate(refreshDate);
    } catch (error) {
      console.error('Failed to create event:', error);
      
      // Show error toast
      toast.error("Failed to create event. Please try again.", {
        autoClose: 5000,
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: "rgba(30, 30, 30, 0.9)",
          backdropFilter: "blur(12px)",
          color: "#ffffff",
          borderLeft: "5px solid #ef4444",
          boxShadow: "0 6px 20px rgba(255, 50, 50, 0.4)",
          fontWeight: 600,
          borderRadius: "12px",
        },
      });
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
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

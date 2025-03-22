"use-client";
import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash,
  MapPin,
  CheckSquare,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { EventDetail, User, ChecklistItem } from "../../types/event";
import { formatEventDate } from "../utils/dateUtils";

interface CreateEventProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventDetail: Omit<EventDetail, "id">) => void;
  users: User[];
}

export const CreateEvent = ({
  isOpen,
  onClose,
  onSubmit,
  users,
}: CreateEventProps) => {
  // Get the current user (assuming the first user in the list is the creator)
  const currentUser = users.length > 0 ? users[0] : null;

  const [eventDetail, setEventDetail] = useState<Omit<EventDetail, "id">>({
    title: "",
    startTime: "",
    endTime: "",
    date: formatEventDate(new Date()),
    location: "Singapore", // Prefill location with Singapore
    description: "",
    type: "meeting",
    color: "bg-indigo-600", // Default color set to blue
    organizers: currentUser ? [
      {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: "creator",
        status: "confirmed",
      }
    ] : [],
    attendees: currentUser ? [
      {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: "creator",
        status: "confirmed",
      }
    ] : [], // Add creator as default attendee
    agenda: [],
    checklist: [],
  });

  const [newTask, setNewTask] = useState("");
  const [warnings, setWarnings] = useState<{
    date?: string;
    time?: string;
    businessHours?: string;
    title?: string;
    pastEvent?: string;
    duration?: string;
  }>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Validate form inputs whenever they change
  useEffect(() => {
    validateForm();
  }, [
    eventDetail.date,
    eventDetail.startTime,
    eventDetail.endTime,
    eventDetail.title,
  ]);

  const validateForm = () => {
    const newWarnings: {
      date?: string;
      time?: string;
      businessHours?: string;
      title?: string;
      pastEvent?: string;
      duration?: string;
    } = {};

    // Title validation
    if (eventDetail.title.trim().length === 0) {
      newWarnings.title = "Title is required";
    } else if (eventDetail.title.trim().length < 3) {
      newWarnings.title = "Title should be at least 3 characters";
    }

    // Date validation - check if date is more than 2 years in the future
    const selectedDate = new Date(eventDetail.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

    if (selectedDate < today) {
      newWarnings.pastEvent = "Event cannot be scheduled in the past";
    } else if (selectedDate > twoYearsFromNow) {
      newWarnings.date = "Date cannot be more than 2 years in the future";
    }

    // Time validation - check if start time is before end time
    if (eventDetail.startTime && eventDetail.endTime) {
      const startTime = new Date(
        `${eventDetail.date}T${eventDetail.startTime}`
      );
      const endTime = new Date(`${eventDetail.date}T${eventDetail.endTime}`);

      if (startTime >= endTime) {
        newWarnings.time = "Start time must be before end time";
      }

      // Check event duration (optional warning)
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      if (durationHours > 8) {
        newWarnings.duration = "Event duration exceeds 8 hours";
      }

      // Check if event is in the past
      const now = new Date();
      if (
        startTime < now &&
        selectedDate.toDateString() === today.toDateString()
      ) {
        newWarnings.pastEvent = "Event cannot be scheduled in the past";
      }
    }

    // Business hours validation - check if event is outside 7 AM - 10 PM
    if (eventDetail.startTime || eventDetail.endTime) {
      const startHour = eventDetail.startTime
        ? parseInt(eventDetail.startTime.split(":")[0])
        : null;
      const endHour = eventDetail.endTime
        ? parseInt(eventDetail.endTime.split(":")[0])
        : null;

      if (
        (startHour !== null && (startHour < 7 || startHour >= 21)) ||
        (endHour !== null && (endHour < 7 || endHour > 21))
      ) {
        newWarnings.businessHours =
          "Event is scheduled outside business hours (7 AM - 9 PM)";
      }
    }

    setWarnings(newWarnings);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Set form as submitted to show validation styling
    setFormSubmitted(true);

    // Validate form before submission
    validateForm();

    // Check for critical errors that should prevent submission
    const criticalErrors = [];

    if (warnings.title) criticalErrors.push(warnings.title);
    if (warnings.time) criticalErrors.push(warnings.time);
    if (warnings.pastEvent) criticalErrors.push(warnings.pastEvent);
    if (warnings.date) criticalErrors.push(warnings.date);

    // If there are critical errors, prevent submission
    if (criticalErrors.length > 0) {
      return;
    }

    // Validate required fields before submission
    const requiredFieldsValid = validateRequiredFields();
    if (!requiredFieldsValid) {
      return;
    }

    // Submit the event data to parent component
    onSubmit(eventDetail);
    
    // Close the modal immediately after submission
    onClose();
  };

  // Helper function to check if event is outside business hours
  const checkBusinessHours = (startTime: string, endTime: string): string | null => {
    if (!startTime || !endTime) return null;
    
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');
    
    if (startParts.length !== 2 || endParts.length !== 2) return null;
    
    const startHour = parseInt(startParts[0]);
    const endHour = parseInt(endParts[0]);
    
    // Define business hours (9 AM to 6 PM)
    const businessStartHour = 9;
    const businessEndHour = 18;
    
    if (startHour < businessStartHour || endHour > businessEndHour) {
      return "This event is scheduled outside of regular business hours (9 AM - 6 PM).";
    }
    
    return null;
  };

  // Validate required fields and set appropriate warnings
  const validateRequiredFields = () => {
    const requiredFields = {
      title: "Event title is required",
      date: "Event date is required",
      startTime: "Start time is required",
      endTime: "End time is required",
    };

    const errors: string[] = [];
    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!eventDetail[field as keyof typeof eventDetail]) {
        errors.push(message);
      }
    });

    if (errors.length > 0) {
      return false;
    }

    // Check if end time is after start time
    if (eventDetail.startTime && eventDetail.endTime) {
      const startParts = eventDetail.startTime.split(':');
      const endParts = eventDetail.endTime.split(':');
      
      if (startParts.length === 2 && endParts.length === 2) {
        const startHour = parseInt(startParts[0]);
        const startMinute = parseInt(startParts[1]);
        const endHour = parseInt(endParts[0]);
        const endMinute = parseInt(endParts[1]);
        
        if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
          return false;
        }
      }
    }

    // Check for business hours warning
    const warnings = {
      businessHours: checkBusinessHours(eventDetail.startTime, eventDetail.endTime)
    };

    return true;
  };

  // Helper component for displaying warnings
  const WarningMessage = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 text-warning text-sm mt-1 animate-fadeIn">
      <AlertTriangle size={14} />
      <span>{message}</span>
    </div>
  );

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center gap-2 text-destructive text-sm mt-1 animate-fadeIn">
      <AlertTriangle size={14} />
      <span>{message}</span>
    </div>
  );

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task: ChecklistItem = {
        id: `task-${Date.now()}`,
        task: newTask,
        completed: false,
      };
      setEventDetail({
        ...eventDetail,
        checklist: [...eventDetail.checklist, task],
      });
      setNewTask("");
    }
  };

  const handleRemoveTask = (taskId: string) => {
    setEventDetail({
      ...eventDetail,
      checklist: eventDetail.checklist.filter((item) => item.id !== taskId),
    });
  };

  const handleUserSelect = (user: User) => {
    const isOrganizer = eventDetail.organizers.some(
      (org) => org.id === user.id
    );
    const isAttendee = eventDetail.attendees.some((att) => att.id === user.id);

    if (!isOrganizer && !isAttendee) {
      setEventDetail({
        ...eventDetail,
        attendees: [
          ...eventDetail.attendees,
          {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            role: "attendee",
            status: "pending",
          },
        ],
      });
    }
  };

  const handleRemoveUser = (userId: string) => {
    // Check if the user is the creator (first user in the list)
    const isCreator = currentUser && userId === currentUser.id;
    
    // If it's the creator, don't allow removal
    if (isCreator) {
      return;
    }
    
    // Otherwise proceed with removal
    setEventDetail({
      ...eventDetail,
      organizers: eventDetail.organizers.filter((org) => org.id !== userId),
      attendees: eventDetail.attendees.filter((att) => att.id !== userId),
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-black/50 overflow-y-auto py-6"
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <form onSubmit={handleSubmit}>
              {/* Header - Fixed */}
              <div className="sticky top-0 z-10 bg-card flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">
                  Create Event
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Title
                    </label>
                    <input
                      type="text"
                      value={eventDetail.title}
                      onChange={(e) =>
                        setEventDetail({
                          ...eventDetail,
                          title: e.target.value,
                        })
                      }
                      className={`w-full bg-muted rounded-lg p-3 border ${
                        formSubmitted && warnings.title
                          ? "border-warning"
                          : "border-border"
                      } text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors`}
                      required
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">
                        Date
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="date"
                            value={eventDetail.date}
                            onChange={(e) =>
                              setEventDetail({
                                ...eventDetail,
                                date: e.target.value,
                              })
                            }
                            className={`w-full bg-muted rounded-lg p-3 pl-10 border ${
                              formSubmitted && warnings.date
                                ? "border-warning"
                                : "border-border"
                            } text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors`}
                            required
                          />
                          <Calendar
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">
                        Start Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={eventDetail.startTime}
                          onChange={(e) =>
                            setEventDetail({
                              ...eventDetail,
                              startTime: e.target.value,
                            })
                          }
                          className={`w-full bg-muted rounded-lg p-3 pl-10 border ${
                            formSubmitted && (warnings.time || warnings.businessHours)
                              ? "border-warning"
                              : "border-border"
                          } text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors`}
                          required
                        />
                        <Clock
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">
                        End Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={eventDetail.endTime}
                          onChange={(e) =>
                            setEventDetail({
                              ...eventDetail,
                              endTime: e.target.value,
                            })
                          }
                          className={`w-full bg-muted rounded-lg p-3 pl-10 border ${
                            formSubmitted && (warnings.time || warnings.businessHours)
                              ? "border-warning"
                              : "border-border"
                          } text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors`}
                          required
                        />
                        <Clock
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {warnings.time && <WarningMessage message={warnings.time} />}
                    {warnings.businessHours && <WarningMessage message={warnings.businessHours} />}
                    {warnings.duration && <WarningMessage message={warnings.duration} />}
                    {warnings.pastEvent && <WarningMessage message={warnings.pastEvent} />}
                    {warnings.date && <WarningMessage message={warnings.date} />}
                    {warnings.title && <WarningMessage message={warnings.title} />}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Location
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={eventDetail.location}
                        onChange={(e) =>
                          setEventDetail({
                            ...eventDetail,
                            location: e.target.value,
                          })
                        }
                        className="w-full bg-muted rounded-lg p-3 pl-10 border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      />
                      <MapPin
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Description
                    </label>
                    <textarea
                      value={eventDetail.description}
                      onChange={(e) =>
                        setEventDetail({
                          ...eventDetail,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full bg-muted rounded-lg p-3 border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Event Type
                    </label>
                    <select
                      value={eventDetail.type}
                      onChange={(e) =>
                        setEventDetail({
                          ...eventDetail,
                          type: e.target.value as EventDetail["type"],
                        })
                      }
                      className="w-full bg-muted rounded-lg p-3 border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="course">Course</option>
                      <option value="social">Social</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {[
                        "bg-indigo-600",
                        "bg-purple-600",
                        "bg-pink-600",
                        "bg-red-600",
                        "bg-orange-600",
                        "bg-green-600",
                        "bg-yellow-600",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setEventDetail({ ...eventDetail, color })
                          }
                          className={`w-8 h-8 rounded-full ${color} ${
                            eventDetail.color === color
                              ? "ring-2 ring-offset-2 ring-offset-card ring-foreground"
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Attendees */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Attendees
                    </label>
                    <div className="relative">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {eventDetail.attendees.map((attendee) => (
                          <div
                            key={attendee.id}
                            className="flex items-center gap-2 bg-muted rounded-full pl-2 pr-3 py-1"
                          >
                            <img
                              src={attendee.avatar}
                              alt={attendee.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm">{attendee.name}</span>
                            {/* Only show remove button if not the creator */}
                            {(!currentUser || attendee.id !== currentUser.id) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(attendee.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            const user = users.find(
                              (u) => u.id === e.target.value
                            );
                            if (user) handleUserSelect(user);
                          }}
                          value=""
                          className="w-full bg-muted rounded-lg p-3 pl-10 border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        >
                          <option value="">Add attendee</option>
                          {users
                            .filter(
                              (user) =>
                                !eventDetail.attendees.some(
                                  (att) => att.id === user.id
                                ) &&
                                !eventDetail.organizers.some(
                                  (org) => org.id === user.id
                                )
                            )
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                        </select>
                        <Users
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Checklist
                    </label>
                    <div className="space-y-2">
                      {eventDetail.checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 bg-muted rounded-lg p-2"
                        >
                          <CheckSquare
                            size={16}
                            className={
                              item.completed
                                ? "text-green-500"
                                : "text-muted-foreground"
                            }
                          />
                          <span className="flex-1">{item.task}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(item.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleAddTask()
                          }
                          className="flex-1 bg-muted rounded-lg p-2 border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="Add task"
                        />
                        <button
                          type="button"
                          onClick={handleAddTask}
                          className="p-2 bg-muted hover:bg-muted-foreground rounded-lg transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="sticky bottom-0 z-10 bg-card flex items-center justify-end gap-3 p-6 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-foreground transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </>
  );
};

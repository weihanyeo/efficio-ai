import { useState } from "react";
import {
  X,
  Clock,
  MapPin,
  Plus,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EventDetail, User } from "../../types/event";

interface EventDetailsProps {
  event: EventDetail;
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onUpdate: (event: EventDetail) => void;
  users: User[];
}

export const EventDetails = ({
  event,
  onClose,
  onDelete,
  onUpdate,
  users,
}: EventDetailsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);

  const handleAddTask = () => {
    if (newTask.trim()) {
      const updatedEvent = {
        ...event,
        checklist: [
          ...event.checklist,
          {
            id: `task-${Date.now()}`,
            task: newTask,
            completed: false,
          },
        ],
      };
      onUpdate(updatedEvent);
      setNewTask("");
    }
  };

  const handleToggleTask = (taskId: string) => {
    const updatedChecklist = event.checklist.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    onUpdate({ ...event, checklist: updatedChecklist });
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  const handleConfirmDelete = () => {
    onDelete(event.id);
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  const handleUserClick = (user: User) => {
    setSelectedUserDetails(user);
  };

  const handleCloseUserDetails = () => {
    setSelectedUserDetails(null);
  };

  return (
    <div className="bg-[#161616] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#262626]">
        <h2 className="text-xl font-semibold text-white">{event.title}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
        <div className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Date</div>
                <div className="text-white">{event.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Time</div>
                <div className="text-white">
                  {event.startTime} - {event.endTime}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-gray-400" />
              <div>
                <div className="text-sm text-gray-400">Location</div>
                <div className="text-white">{event.location}</div>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Description</h3>
              <p className="text-white">{event.description}</p>
            </div>
          )}

          {/* Organizers */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Organizers</h3>
            <div className="flex flex-wrap gap-2">
              {event.organizers.map((organizer) => (
                <button
                  key={organizer.id}
                  onClick={() => handleUserClick(organizer)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#262626] rounded-full hover:bg-[#363636] transition-colors"
                >
                  <img
                    src={organizer.avatar}
                    alt={organizer.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-sm text-white">{organizer.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Attendees */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Attendees</h3>
            <div className="flex flex-wrap gap-2">
              {event.attendees.map((attendee) => (
                <button
                  key={attendee.id}
                  onClick={() => handleUserClick(attendee)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#262626] rounded-full hover:bg-[#363636] transition-colors"
                >
                  <img
                    src={attendee.avatar}
                    alt={attendee.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-sm text-white">{attendee.name}</span>
                  {attendee.status && (
                    <span className={`text-xs ${
                      attendee.status === "accepted" ? "text-green-400" :
                      attendee.status === "pending" ? "text-yellow-400" :
                      attendee.status === "declined" ? "text-red-400" :
                      "text-gray-400"
                    }`}>
                      {attendee.status}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Agenda */}
          {event.agenda.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Agenda</h3>
              <div className="space-y-2">
                {event.agenda.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#262626] rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="text-sm text-gray-400">{item.time}</div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400">{item.description}</p>
                    )}
                    {item.speaker && (
                      <div className="text-sm text-gray-400">
                        Speaker: {item.speaker}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Checklist</h3>
            <div className="space-y-2">
              {event.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-[#262626] rounded-lg"
                >
                  <button
                    onClick={() => handleToggleTask(item.id)}
                    className={`p-1 rounded-md transition-colors ${
                      item.completed
                        ? "bg-indigo-500 text-white"
                        : "bg-[#363636] text-gray-400 hover:bg-[#464646]"
                    }`}
                  >
                    <CheckSquare size={16} />
                  </button>
                  <span
                    className={`flex-1 ${
                      item.completed ? "line-through text-gray-400" : "text-white"
                    }`}
                  >
                    {item.task}
                  </span>
                  {item.assignedTo && (
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          users.find((u) => u.id === item.assignedTo)?.avatar ||
                          ""
                        }
                        alt={
                          users.find((u) => u.id === item.assignedTo)?.name || ""
                        }
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm text-gray-400">
                        {users.find((u) => u.id === item.assignedTo)?.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a task..."
                  className="flex-1 bg-[#262626] rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                />
                <button
                  onClick={handleAddTask}
                  className="p-3 bg-[#262626] hover:bg-[#363636] rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-4 p-6 border-t border-[#262626]">
        <button
          onClick={handleDeleteClick}
          className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Delete Event
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#161616] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-white">Delete Event</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this event? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 hover:bg-[#262626] rounded-lg transition-colors text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Sliding Panel */}
      <AnimatePresence>
        {selectedUserDetails && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-80 bg-[#161616] border-l border-[#262626] shadow-xl z-50"
          >
            <div className="p-6">
              <button
                onClick={handleCloseUserDetails}
                className="absolute top-4 right-4 p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center text-center">
                <img
                  src={selectedUserDetails.avatar}
                  alt={selectedUserDetails.name}
                  className="w-20 h-20 rounded-full mb-4"
                />
                <h3 className="text-lg font-semibold mb-1 text-white">
                  {selectedUserDetails.name}
                </h3>
                <div className="text-sm text-gray-400">
                  {selectedUserDetails.eventCount || 0} events
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

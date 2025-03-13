import { useState } from "react";
import {
  X,
  Plus,
  Trash,
  MapPin,
  CheckSquare,
  Calendar,
  Clock,
  Users,
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
  const [eventDetail, setEventDetail] = useState<Omit<EventDetail, "id">>({
    title: "",
    startTime: "",
    endTime: "",
    date: formatEventDate(new Date()),
    location: "",
    description: "",
    type: "meeting",
    color: "#3B82F6",
    organizers: [],
    attendees: [],
    agenda: [],
    checklist: [],
  });

  const [newTask, setNewTask] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(eventDetail);
  };

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
    const isOrganizer = eventDetail.organizers.some((org) => org.id === user.id);
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
    setEventDetail({
      ...eventDetail,
      organizers: eventDetail.organizers.filter((org) => org.id !== userId),
      attendees: eventDetail.attendees.filter((att) => att.id !== userId),
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-[#161616] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#262626]">
            <h2 className="text-xl font-semibold text-white">Create Event</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
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
                  className="w-full bg-[#1E1E1E] rounded-lg p-3 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
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
                        className="w-full bg-[#1E1E1E] rounded-lg p-3 pl-10 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        required
                      />
                      <Calendar
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
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
                      className="w-full bg-[#1E1E1E] rounded-lg p-3 pl-10 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      required
                    />
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
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
                      className="w-full bg-[#1E1E1E] rounded-lg p-3 pl-10 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      required
                    />
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
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
                    className="w-full bg-[#1E1E1E] rounded-lg p-3 pl-10 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
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
                  className="w-full bg-[#1E1E1E] rounded-lg p-3 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
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
                  className="w-full bg-[#1E1E1E] rounded-lg p-3 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="meeting">Meeting</option>
                  <option value="course">Course</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
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
                    "bg-blue-600",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setEventDetail({ ...eventDetail, color })
                      }
                      className={`w-8 h-8 rounded-full ${color} ${
                        eventDetail.color === color
                          ? "ring-2 ring-offset-2 ring-offset-[#161616] ring-white"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Attendees
                </label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {eventDetail.attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center gap-2 bg-[#262626] rounded-full pl-2 pr-3 py-1"
                      >
                        <img
                          src={attendee.avatar}
                          alt={attendee.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm">{attendee.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(attendee.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const user = users.find((u) => u.id === e.target.value);
                        if (user) handleUserSelect(user);
                      }}
                      value=""
                      className="w-full bg-[#1E1E1E] rounded-lg p-3 pl-10 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
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
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Checklist
                </label>
                <div className="space-y-2">
                  {eventDetail.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-[#262626] rounded-lg p-2"
                    >
                      <CheckSquare
                        size={16}
                        className={item.completed ? "text-green-500" : "text-gray-400"}
                      />
                      <span className="flex-1">{item.task}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(item.id)}
                        className="text-gray-400 hover:text-white"
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
                      onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                      className="flex-1 bg-[#1E1E1E] rounded-lg p-2 border border-[#363636] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="Add task"
                    />
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="p-2 bg-[#262626] hover:bg-[#363636] rounded-lg transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

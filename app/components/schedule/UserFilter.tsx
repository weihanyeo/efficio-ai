"use-client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { User, EventDetail } from "../../types/event";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

type DateFilterOption =
  | "all"
  | "week"
  | "fortnight"
  | "month"
  | "year"
  | "custom";

interface UserFilterProps {
  users: User[];
  selectedUsers: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  events: EventDetail[];
  selectedEvents: Set<string>;
  onEventSelection: (selected: Set<string>) => void;
  onEventClick: (event: EventDetail) => void;
}

export const UserFilter = ({
  users,
  selectedUsers,
  onSelectionChange,
  events,
  selectedEvents,
  onEventClick,
}: UserFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "events">("users");
  const [eventTypeFilter, setEventTypeFilter] = useState<
    Set<EventDetail["type"]>
  >(new Set());
  const [dateFilterOption, setDateFilterOption] =
    useState<DateFilterOption>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });

  const handleEventClick = (event: EventDetail) => {
    onEventClick(event);
  };

  const eventTypes: EventDetail["type"][] = [
    "meeting",
    "course",
    "social",
    "other",
  ];

  const parseEventDate = (dateString: string): Date => {
    try {
      // First, try parsing the date in the format "DD-MM-YYYY"
      const [day, month, year] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      // Validate the date
      if (isValidDate(date)) {
        return date;
      }

      // Fallback to standard date parsing
      const parsedDate = new Date(dateString);
      if (isValidDate(parsedDate)) {
        return parsedDate;
      }

      throw new Error("Invalid date format");
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
      return new Date(); // Return current date as fallback
    }
  };

  // Helper function to validate date
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const getDateRange = (option: DateFilterOption): DateRange => {
    const today = new Date();

    switch (option) {
      case "week": {
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        return { from: start, to: end };
      }
      case "fortnight": {
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = new Date(start);
        end.setDate(start.getDate() + 13);
        return { from: start, to: endOfDay(end) };
      }
      case "month": {
        const start = startOfDay(new Date()); // Today
        const end = new Date(start);
        end.setDate(start.getDate() + 30); // 30 days from today
        return {
          from: start,
          to: endOfDay(end),
        };
      }
      case "year": {
        return {
          from: startOfYear(today),
          to: endOfYear(today),
        };
      }
      case "custom": {
        return {
          from: customDateRange.from ? startOfDay(customDateRange.from) : null,
          to: customDateRange.to ? endOfDay(customDateRange.to) : null,
        };
      }
      default:
        return { from: null, to: null };
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        eventTypeFilter.size === 0 || eventTypeFilter.has(event.type);

      let matchesDate = true;
      if (dateFilterOption !== "all") {
        const dateRange = getDateRange(dateFilterOption);

        if (dateRange.from && dateRange.to) {
          const eventDate = parseEventDate(event.date);

          matchesDate = isWithinInterval(eventDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [events, searchQuery, eventTypeFilter, dateFilterOption, customDateRange]);

  const handleCustomDateChange = (type: "from" | "to", dateString: string) => {
    try {
      const date = dateString ? new Date(dateString) : null;
      if (date && isValidDate(date)) {
        setCustomDateRange((prev: DateRange) => ({
          ...prev,
          [type]: type === "from" ? startOfDay(date) : endOfDay(date),
        }));
      }
    } catch (error) {
      console.error("Error parsing custom date:", error);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    onSelectionChange(newSelected);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#262626]">
        <h2 className="text-lg font-semibold">Filter</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-[#262626] rounded-lg transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#262626]">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "users"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "events"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Events
            </button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-2 bg-[#1E1E1E] border border-[#363636] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "users" ? (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      selectedUsers.has(user.id)
                        ? "bg-purple-500/20 text-white"
                        : "hover:bg-[#262626] text-gray-400 hover:text-white"
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-400">
                        {user.eventCount || 0} events
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Event Type Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Filter size={16} className="text-gray-400" />
                    <h3 className="text-sm font-medium">Event Type</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {eventTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          const newFilter = new Set(eventTypeFilter);
                          if (newFilter.has(type)) {
                            newFilter.delete(type);
                          } else {
                            newFilter.add(type);
                          }
                          setEventTypeFilter(newFilter);
                        }}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          eventTypeFilter.has(type)
                            ? "bg-purple-500/20 text-white"
                            : "bg-[#262626] text-gray-400 hover:text-white"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-gray-400" />
                    <h3 className="text-sm font-medium">Date Range</h3>
                  </div>
                  <div className="space-y-2">
                    <select
                      value={dateFilterOption}
                      onChange={(e) =>
                        setDateFilterOption(e.target.value as DateFilterOption)
                      }
                      className="w-full bg-[#262626] rounded-lg p-2 text-white border border-[#363636] focus:outline-none focus:border-purple-500"
                    >
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="fortnight">Next 2 Weeks</option>
                      <option value="month">Next 30 Days</option>
                      <option value="year">This Year</option>
                      <option value="custom">Custom Range</option>
                    </select>

                    <AnimatePresence>
                      {dateFilterOption === "custom" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pt-2 border-t border-[#363636]"
                        >
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">
                              From
                            </label>
                            <input
                              type="date"
                              className="w-full bg-[#1E1E1E] rounded-lg p-2 text-white border border-[#363636] focus:outline-none focus:border-purple-500"
                              value={
                                customDateRange.from
                                  ? format(customDateRange.from, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={(e) =>
                                handleCustomDateChange("from", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">
                              To
                            </label>
                            <input
                              type="date"
                              className="w-full bg-[#1E1E1E] rounded-lg p-2 text-white border border-[#363636] focus:outline-none focus:border-purple-500"
                              value={
                                customDateRange.to
                                  ? format(customDateRange.to, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={(e) =>
                                handleCustomDateChange("to", e.target.value)
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {dateFilterOption !== "all" &&
                      dateFilterOption !== "custom" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-gray-400 pt-2 border-t border-[#363636]"
                        >
                          <p>Showing events from:</p>
                          <p className="text-white">
                            {getDateRange(dateFilterOption).from &&
                            getDateRange(dateFilterOption).to ? (
                              <>
                                {format(
                                  getDateRange(dateFilterOption).from as Date,
                                  "dd MMM yyyy"
                                )}{" "}
                                -{" "}
                                {format(
                                  getDateRange(dateFilterOption).to as Date,
                                  "dd MMM yyyy"
                                )}
                              </>
                            ) : (
                              "Invalid date range"
                            )}
                          </p>
                        </motion.div>
                      )}
                  </div>
                </div>

                {/* Filtered Events */}
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleEventClick(event)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedEvents.has(event.id)
                          ? "bg-purple-500/20"
                          : "bg-[#262626] hover:bg-[#363636]"
                      }`}
                    >
                      <div className="font-medium mb-2">{event.title}</div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" />
                          {event.date}
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-2" />
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-2" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

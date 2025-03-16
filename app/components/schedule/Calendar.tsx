"use-client"
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { EventDetail } from "../../types/event";
import { parseEventDate, isSameDate } from "../utils/dateUtils";

interface CalendarProps {
  events: EventDetail[];
  onDateChange: (date: Date) => void; // Add this prop to communicate date changes
}

interface Holiday {
  date: Date;
  name: string;
}

const holidays: Holiday[] = [
  { date: new Date(2024, 0, 1), name: "New Year's Day" },
  // Add more holidays here
];

export const Calendar = ({ events, onDateChange }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isMonthOpen, setIsMonthOpen] = useState<boolean>(false);
  const [isYearOpen, setIsYearOpen] = useState<boolean>(false);

  const hasEvents = (date: Date): boolean => {
    return events.some((event) => {
      const eventDate = parseEventDate(event.date);
      return isSameDate(eventDate, date);
    });
  };

  // Generate week dates
  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (date: Date): boolean => {
    return holidays.some(
      (holiday) => holiday.date.toDateString() === date.toDateString()
    );
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const weekDates = getWeekDates(currentDate);
  const months: string[] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years: number[] = Array.from(
    { length: 10 },
    (_, i) => currentDate.getFullYear() - 5 + i
  );

  const navigateWeek = (direction: "prev" | "next"): void => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
  };

  const handleMonthSelect = (monthIndex: number): void => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setIsMonthOpen(false);
  };

  const handleYearSelect = (year: number): void => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setIsYearOpen(false);
  };

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    onDateChange(date); // Notify parent component about date change
  };

  return (
    <motion.div
      className="bg-black text-white p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-2">
        <motion.button
          onClick={() => navigateWeek("prev")}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div className="flex items-center space-x-4">
          {/* Month Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => {
                setIsMonthOpen(!isMonthOpen);
                setIsYearOpen(false);
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CalendarIcon size={16} />
              <span>{months[currentDate.getMonth()]}</span>
            </motion.button>
            <AnimatePresence>
              {isMonthOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <div className="max-h-60 overflow-y-auto flex flex-col">
                    {months.map((month, index) => (
                      <motion.button
                        key={month}
                        onClick={() => handleMonthSelect(index)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                        whileHover={{ backgroundColor: "#374151" }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        {month}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => {
                setIsYearOpen(!isYearOpen);
                setIsMonthOpen(false);
              }}
              className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentDate.getFullYear()}
            </motion.button>
            <AnimatePresence>
              {isYearOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <div className="max-h-60 overflow-y-auto flex flex-col">
                    {years.map((year, index) => (
                      <motion.button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                        whileHover={{ backgroundColor: "#374151" }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        {year}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <motion.button
          onClick={() => navigateWeek("next")}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      <motion.div
        className="flex justify-between items-start px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {weekDates.map((date, index) => {
          const isToday = new Date().toDateString() === date.toDateString();
          const isPast = isPastDate(date);
          const isWeekendDay = isWeekend(date);
          const isHolidayDate = isHoliday(date);
          const isSelected =
            selectedDate.toDateString() === date.toDateString();
          const dateHasEvents = hasEvents(date);

          return (
            <motion.div
              key={date.toISOString()}
              className={`text-center cursor-pointer`}
              onClick={() => handleDateSelect(date)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={!isPast ? { scale: 1.1 } : {}}
            >
              <motion.div className="text-sm text-gray-400 mb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
              </motion.div>
              <motion.div
                className={`
                w-8 h-8 flex items-center justify-center rounded-lg
                ${isPast ? "text-gray-600" : ""}
                ${isSelected ? "bg-purple-600" : ""}
                ${(isWeekendDay || isHolidayDate) ? "bg-red-500/20" : ""}
                ${isToday ? "text-purple-400" : ""}
                hover:bg-gray-700
                `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {date.getDate()}
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

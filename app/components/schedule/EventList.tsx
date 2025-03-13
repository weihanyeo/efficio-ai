import { useRef, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { EventDetail, User } from "../../types/event";

interface AvailabilityIndicatorProps {
  events: EventDetail[];
  users: User[];
}

interface EventListProps {
  events: EventDetail[];
  users: User[];
  selectedUsers: Set<string>;
  onEventClick: (event: EventDetail) => void;
  currentDate: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 AM to 11 PM
const HOUR_HEIGHT = 100; // pixels per hour

const AvailabilityIndicator = ({
  events,
  users,
}: AvailabilityIndicatorProps) => {
  const checkAvailability = (hour: number, minute: number) => {
    const timeToCheck = `${hour % 12 || 12}:${minute
      .toString()
      .padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;

    return users.every((user) => {
      return !events
        .filter(
          (event) =>
            event.organizers.some((org) => org.id === user.id) ||
            event.attendees.some((att) => att.id === user.id)
        )
        .some((event) => {
          const eventStart = new Date(
            `2024-01-01 ${event.startTime}`
          ).getTime();
          const eventEnd = new Date(`2024-01-01 ${event.endTime}`).getTime();
          const checkTime = new Date(`2024-01-01 ${timeToCheck}`).getTime();
          return checkTime >= eventStart && checkTime < eventEnd;
        });
    });
  };

  // Generate availability slots
  const availabilitySlots = HOURS.flatMap((hour) => {
    const slots = [];
    for (let minute = 0; minute < 60; minute += 15) {
      // Check every 15 minutes
      if (checkAvailability(hour, minute)) {
        slots.push({
          hour,
          minute,
          position: hour * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT,
        });
      }
    }
    return slots;
  });

  // Combine consecutive slots
  const combinedSlots = availabilitySlots.reduce((acc, curr, index, array) => {
    if (
      index === 0 ||
      curr.position !== array[index - 1].position + (15 / 60) * HOUR_HEIGHT
    ) {
      acc.push({
        start: curr.position,
        height: (15 / 60) * HOUR_HEIGHT,
      });
    } else {
      acc[acc.length - 1].height += (15 / 60) * HOUR_HEIGHT;
    }
    return acc;
  }, [] as Array<{ start: number; height: number }>);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {combinedSlots.map((slot, index) => (
        <div
          key={index}
          className="absolute left-0 right-0 bg-green-500/10"
          style={{
            top: `${slot.start}px`,
            height: `${slot.height}px`,
          }}
        />
      ))}
    </div>
  );
};

export const EventList = ({
  events,
  users,
  selectedUsers,
  onEventClick,
}: EventListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getEventPosition = (timeStr: string) => {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let adjustedHours = hours;
    if (period === "PM" && hours !== 12) {
      adjustedHours += 12;
    } else if (period === "AM" && hours === 12) {
      adjustedHours = 0;
    }

    const minutesFraction = minutes / 60;
    return Math.max(0, (adjustedHours + minutesFraction) * HOUR_HEIGHT);
  };

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date());

      if (scrollContainerRef.current) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeProgress = currentHour + currentMinute / 60;
        const position = timeProgress * HOUR_HEIGHT;

        const containerHeight = scrollContainerRef.current.clientHeight;
        scrollContainerRef.current.scrollTop = Math.max(
          0,
          position - containerHeight / 2
        );
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeUsers = users.filter((user) => selectedUsers.has(user.id));
  const hasSelectedUsers = selectedUsers.size > 0;
  const displayUsers = hasSelectedUsers ? activeUsers : users;

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalHours = hours + minutes / 60;
    return totalHours * HOUR_HEIGHT;
  };

  const getEventsForUser = (userId: string) => {
    return events.filter(
      (event) =>
        event.organizers.some((org) => org.id === userId) ||
        event.attendees.some((att) => att.id === userId)
    );
  };

  return (
    <div
      className="h-full overflow-hidden w-full relative"
      ref={scrollContainerRef}
      style={{ height: "calc(100vh - 100px)" }}
    >
      <div className="overflow-auto h-full">
        <div className="min-w-max">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-[#161616]">
            <div className="flex">
              <div className="w-20 flex-shrink-0 h-14 border-b border-[#262626]" />
              <div className="flex-1">
                <div className="flex border-b border-[#262626]">
                  {displayUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex-1 min-w-[200px] border-l border-[#262626]"
                    >
                      <div className="flex items-center gap-2 p-4">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex relative">
            {/* Time Column */}
            <div className="w-20 flex-shrink-0 sticky left-0 bg-[#161616] z-20">
              <AvailabilityIndicator
                events={events}
                users={displayUsers}
              />
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[100px] relative border-b border-[#262626]/50"
                >
                  <div className="absolute left-4 top-0 -translate-y-2 text-gray-400 text-sm">
                    {hour % 12 || 12}
                    {hour >= 12 ? "PM" : "AM"}
                  </div>
                </div>
              ))}
            </div>

            {/* Event Grid */}
            <div className="flex-1 relative">
              <div
                className="flex relative"
                style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
              >
                {displayUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex-1 min-w-[200px] border-l border-[#262626] relative"
                  >
                    {/* Hour Grid Lines */}
                    {HOURS.map((hour, index) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-b border-[#262626]/50"
                        style={{
                          top: `${index * HOUR_HEIGHT}px`,
                          height: `${HOUR_HEIGHT}px`,
                        }}
                      />
                    ))}

                    {/* Events */}
                    {getEventsForUser(user.id).map((event) => {
                      const top = getEventPosition(event.startTime);
                      const bottom = getEventPosition(event.endTime);
                      const height = Math.max(bottom - top, 25);

                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`absolute left-0 right-0 mx-1 rounded-lg p-2 z-10 
                            cursor-pointer ${event.color || 'bg-indigo-600'} hover:brightness-110 
                            transition-all shadow-md hover:shadow-lg border border-[#363636]`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: "25px",
                          }}
                        >
                          <div className="font-medium text-sm mb-1 truncate text-white">
                            {event.title}
                          </div>
                          {event.location && (
                            <div className="flex items-center text-xs text-white/80">
                              <MapPin size={12} className="mr-1" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Current Time Line */}
                <div
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-30"
                  style={{ top: `${getCurrentTimePosition()}px` }}
                >
                  <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

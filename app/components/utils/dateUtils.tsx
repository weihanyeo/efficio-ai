// utils/dateUtils.ts
export const parseEventDate = (dateString: string): Date => {
  try {
    // First try parsing as YYYY-MM-DD
    const yyyyMMddMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (yyyyMMddMatch) {
      const [, year, month, day] = yyyyMMddMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (isValidDate(date)) {
        return date;
      }
    }

    // Then try parsing as DD-MM-YYYY
    const ddMMyyyyMatch = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddMMyyyyMatch) {
      const [, day, month, year] = ddMMyyyyMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (isValidDate(date)) {
        return date;
      }
    }

    // Fallback to standard date parsing
    const parsedDate = new Date(dateString);
    if (isValidDate(parsedDate)) {
      return parsedDate;
    }

    throw new Error(`Invalid date format: ${dateString}`);
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return new Date(); // Return current date as fallback
  }
};

// Helper function to validate date
const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const formatEventDate = (date: Date): string => {
  // Format date as YYYY-MM-DD for HTML date input
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isSameDate = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

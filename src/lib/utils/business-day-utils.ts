import { addDays, format, getDay } from 'date-fns';

/**
 * Holiday configuration for business day calculations
 */
export interface Holiday {
  date: string; // ISO date string (YYYY-MM-DD)
  name: string;
  recurring?: boolean; // If true, this holiday occurs every year
}

/**
 * Default Indian holidays for business day calculations
 */
export const DEFAULT_INDIAN_HOLIDAYS: Holiday[] = [
  { date: '2024-01-01', name: 'New Year', recurring: true },
  { date: '2024-01-26', name: 'Republic Day', recurring: true },
  { date: '2024-08-15', name: 'Independence Day', recurring: true },
  { date: '2024-10-02', name: 'Gandhi Jayanti', recurring: true },
  { date: '2024-12-25', name: 'Christmas', recurring: true },
  // Add more holidays as needed
];

/**
 * Configuration for business day calculations
 */
export interface BusinessDayConfig {
  holidays?: Holiday[];
  customWeekendDays?: number[]; // 0=Sunday, 1=Monday, etc. Default: [0, 6] (Sat, Sun)
}

/**
 * Check if a date is a weekend
 */
export function isBusinessDayWeekend(date: Date, weekendDays: number[] = [0, 6]): boolean {
  const dayOfWeek = getDay(date);
  return weekendDays.includes(dayOfWeek);
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, holidays: Holiday[] = DEFAULT_INDIAN_HOLIDAYS): boolean {
  const dateString = format(date, 'yyyy-MM-dd');
  const year = date.getFullYear();
  
  return holidays.some(holiday => {
    if (holiday.recurring) {
      // For recurring holidays, check month and day only
      const holidayDate = new Date(holiday.date);
      const holidayMonth = holidayDate.getMonth();
      const holidayDay = holidayDate.getDate();
      
      const recurringHolidayThisYear = new Date(year, holidayMonth, holidayDay);
      return format(recurringHolidayThisYear, 'yyyy-MM-dd') === dateString;
    } else {
      // For non-recurring holidays, exact match
      return holiday.date === dateString;
    }
  });
}

/**
 * Check if a date is a business day (not weekend and not holiday)
 */
export function isBusinessDay(date: Date, config: BusinessDayConfig = {}): boolean {
  const { holidays = DEFAULT_INDIAN_HOLIDAYS, customWeekendDays = [0, 6] } = config;
  
  return !isBusinessDayWeekend(date, customWeekendDays) && !isHoliday(date, holidays);
}

/**
 * Add business days to a date, skipping weekends and holidays
 */
export function addBusinessDays(date: Date, businessDaysToAdd: number, config: BusinessDayConfig = {}): Date {
  if (businessDaysToAdd === 0) return date;
  
  let currentDate = new Date(date);
  let remainingDays = Math.abs(businessDaysToAdd);
  const direction = businessDaysToAdd > 0 ? 1 : -1;
  
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, direction);
    
    if (isBusinessDay(currentDate, config)) {
      remainingDays--;
    }
  }
  
  return currentDate;
}

/**
 * Get the next business day from a given date
 */
export function getNextBusinessDay(date: Date, config: BusinessDayConfig = {}): Date {
  return addBusinessDays(date, 1, config);
}

/**
 * Get the previous business day from a given date
 */
export function getPreviousBusinessDay(date: Date, config: BusinessDayConfig = {}): Date {
  return addBusinessDays(date, -1, config);
}

/**
 * Adjust a date to the next business day if it falls on a weekend or holiday
 */
export function adjustToBusinessDay(date: Date, config: BusinessDayConfig = {}): Date {
  if (isBusinessDay(date, config)) {
    return date;
  }
  return getNextBusinessDay(date, config);
}

/**
 * Calculate the number of business days between two dates
 */
export function businessDaysBetween(startDate: Date, endDate: Date, config: BusinessDayConfig = {}): number {
  if (startDate > endDate) {
    return -businessDaysBetween(endDate, startDate, config);
  }
  
  let count = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    currentDate = addDays(currentDate, 1);
    if (isBusinessDay(currentDate, config)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Format business day information for display
 */
export function formatBusinessDayInfo(date: Date, config: BusinessDayConfig = {}): {
  isBusinessDay: boolean;
  reason?: string;
  nextBusinessDay?: Date;
} {
  const isBusiness = isBusinessDay(date, config);
  const { holidays = DEFAULT_INDIAN_HOLIDAYS, customWeekendDays = [0, 6] } = config;
  
  if (isBusiness) {
    return { isBusinessDay: true };
  }
  
  let reason = '';
  if (isBusinessDayWeekend(date, customWeekendDays)) {
    reason = 'Weekend';
  } else if (isHoliday(date, holidays)) {
    const holiday = holidays.find(h => {
      if (h.recurring) {
        const holidayDate = new Date(h.date);
        return holidayDate.getMonth() === date.getMonth() && 
               holidayDate.getDate() === date.getDate();
      }
      return h.date === format(date, 'yyyy-MM-dd');
    });
    reason = holiday ? `Holiday: ${holiday.name}` : 'Holiday';
  }
  
  return {
    isBusinessDay: false,
    reason,
    nextBusinessDay: getNextBusinessDay(date, config)
  };
}

import { describe, it, expect } from 'vitest';
import { 
  isBusinessDay,
  addBusinessDays,
  businessDaysBetween,
  adjustToBusinessDay,
  formatBusinessDayInfo,
  type Holiday,
  type BusinessDayConfig
} from '../../../lib/utils/business-day-utils';

describe('Business Day Utils', () => {
  const testHolidays: Holiday[] = [
    { date: '2024-01-01', name: 'New Year', recurring: true },
    { date: '2024-12-25', name: 'Christmas', recurring: true },
    { date: '2024-07-04', name: 'Independence Day (Test)', recurring: false },
  ];

  const config: BusinessDayConfig = {
    holidays: testHolidays,
    customWeekendDays: [0, 6], // Sunday and Saturday
  };

  describe('isBusinessDay', () => {
    it('should return true for weekdays', () => {
      const monday = new Date('2024-01-08'); // Monday
      const tuesday = new Date('2024-01-09'); // Tuesday
      const friday = new Date('2024-01-12'); // Friday
      
      expect(isBusinessDay(monday, config)).toBe(true);
      expect(isBusinessDay(tuesday, config)).toBe(true);
      expect(isBusinessDay(friday, config)).toBe(true);
    });

    it('should return false for weekends', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const sunday = new Date('2024-01-07'); // Sunday
      
      expect(isBusinessDay(saturday, config)).toBe(false);
      expect(isBusinessDay(sunday, config)).toBe(false);
    });

    it('should return false for holidays', () => {
      const newYear = new Date('2024-01-01'); // New Year
      const christmas = new Date('2024-12-25'); // Christmas
      const independenceDay = new Date('2024-07-04'); // Non-recurring holiday
      
      expect(isBusinessDay(newYear, config)).toBe(false);
      expect(isBusinessDay(christmas, config)).toBe(false);
      expect(isBusinessDay(independenceDay, config)).toBe(false);
    });

    it('should handle recurring holidays in different years', () => {
      const newYear2023 = new Date('2023-01-01');
      const newYear2025 = new Date('2025-01-01');
      
      expect(isBusinessDay(newYear2023, config)).toBe(false);
      expect(isBusinessDay(newYear2025, config)).toBe(false);
    });
  });

  describe('addBusinessDays', () => {
    it('should add business days correctly', () => {
      const friday = new Date('2024-01-05'); // Friday
      const result = addBusinessDays(friday, 1, config);
      
      // Should skip weekend and land on Monday
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(8); // January 8th
    });

    it('should skip holidays when adding business days', () => {
      const monday = new Date('2024-12-23'); // Monday before Christmas
      const result = addBusinessDays(monday, 2, config);
      
      // Should skip Christmas (Dec 25) and weekend (Dec 28-29) and land on Dec 24, then Dec 26
      expect(result.getDate()).toBe(26); // December 26th
    });

    it('should handle negative business days', () => {
      const tuesday = new Date('2024-01-09'); // Tuesday
      const result = addBusinessDays(tuesday, -1, config);
      
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(8); // January 8th
    });

    it('should return same date when adding 0 business days', () => {
      const date = new Date('2024-01-09');
      const result = addBusinessDays(date, 0, config);
      
      expect(result.getTime()).toBe(date.getTime());
    });
  });

  describe('businessDaysBetween', () => {
    it('should calculate business days between two dates', () => {
      const friday = new Date('2024-01-05');
      const tuesday = new Date('2024-01-09');
      
      const result = businessDaysBetween(friday, tuesday, config);
      expect(result).toBe(2); // Monday and Tuesday are business days between Friday and Tuesday
    });

    it('should handle negative range', () => {
      const tuesday = new Date('2024-01-09');
      const friday = new Date('2024-01-05');
      
      const result = businessDaysBetween(tuesday, friday, config);
      expect(result).toBe(-2);
    });

    it('should exclude holidays in calculation', () => {
      const beforeNewYear = new Date('2023-12-29'); // Friday
      const afterNewYear = new Date('2024-01-03'); // Wednesday
      
      const result = businessDaysBetween(beforeNewYear, afterNewYear, config);
      // Should exclude weekend (Dec 30-31) and New Year (Jan 1), and Jan 2
      expect(result).toBe(2); // Jan 2 and Jan 3
    });
  });

  describe('adjustToBusinessDay', () => {
    it('should return same date if already a business day', () => {
      const monday = new Date('2024-01-08'); // Monday
      const result = adjustToBusinessDay(monday, config);
      
      expect(result.getTime()).toBe(monday.getTime());
    });

    it('should adjust weekend to next business day', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const result = adjustToBusinessDay(saturday, config);
      
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(8); // January 8th
    });

    it('should adjust holiday to next business day', () => {
      const newYear = new Date('2024-01-01'); // New Year (Monday)
      const result = adjustToBusinessDay(newYear, config);
      
      expect(result.getDay()).toBe(2); // Tuesday
      expect(result.getDate()).toBe(2); // January 2nd
    });
  });

  describe('formatBusinessDayInfo', () => {
    it('should return business day info for business day', () => {
      const monday = new Date('2024-01-08'); // Monday
      const result = formatBusinessDayInfo(monday, config);
      
      expect(result.isBusinessDay).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.nextBusinessDay).toBeUndefined();
    });

    it('should return weekend info', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const result = formatBusinessDayInfo(saturday, config);
      
      expect(result.isBusinessDay).toBe(false);
      expect(result.reason).toBe('Weekend');
      expect(result.nextBusinessDay).toBeDefined();
    });

    it('should return holiday info', () => {
      const newYear = new Date('2024-01-01'); // New Year
      const result = formatBusinessDayInfo(newYear, config);
      
      expect(result.isBusinessDay).toBe(false);
      expect(result.reason).toBe('Holiday: New Year');
      expect(result.nextBusinessDay).toBeDefined();
    });
  });
});

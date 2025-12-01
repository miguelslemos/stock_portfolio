import { describe, it, expect } from 'vitest';
import { DateParser } from '../DateParser';

describe('DateParser', () => {
  describe('parse', () => {
    it('should parse MM/DD/YYYY format', () => {
      const date = DateParser.parse('01/15/2023');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
    });

    it('should parse MM/DD/YY format', () => {
      const date = DateParser.parse('01/15/23');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should parse MM-DD-YYYY format', () => {
      const date = DateParser.parse('01-15-2023');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should parse MM-DD-YY format', () => {
      const date = DateParser.parse('01-15-23');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should parse YYYY-MM-DD format', () => {
      const date = DateParser.parse('2023-01-15');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should parse YYYY/MM/DD format', () => {
      const date = DateParser.parse('2023/01/15');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should handle single digit month and day', () => {
      const date = DateParser.parse('1/5/2023');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(5);
    });

    it('should trim whitespace', () => {
      const date = DateParser.parse('  01/15/2023  ');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should throw error for invalid format', () => {
      expect(() => DateParser.parse('invalid')).toThrow('Invalid date format');
      expect(() => DateParser.parse('2023')).toThrow('Invalid date format');
      expect(() => DateParser.parse('01-15')).toThrow('Invalid date format');
    });

    it('should throw error for invalid month', () => {
      expect(() => DateParser.parse('13/15/2023')).toThrow('Invalid month: 13');
      expect(() => DateParser.parse('00/15/2023')).toThrow('Invalid month: 0');
    });

    it('should throw error for invalid day', () => {
      expect(() => DateParser.parse('01/32/2023')).toThrow('Invalid day: 32');
      expect(() => DateParser.parse('01/00/2023')).toThrow('Invalid day: 0');
    });

    it('should handle leap year dates', () => {
      const date = DateParser.parse('02/29/2024');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    });

    it('should handle end of year dates', () => {
      const date = DateParser.parse('12/31/2023');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });

    it('should handle beginning of year dates', () => {
      const date = DateParser.parse('01/01/2023');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it('should parse different months correctly', () => {
      const dates = [
        { input: '01/15/2023', month: 0 },
        { input: '02/15/2023', month: 1 },
        { input: '03/15/2023', month: 2 },
        { input: '04/15/2023', month: 3 },
        { input: '05/15/2023', month: 4 },
        { input: '06/15/2023', month: 5 },
        { input: '07/15/2023', month: 6 },
        { input: '08/15/2023', month: 7 },
        { input: '09/15/2023', month: 8 },
        { input: '10/15/2023', month: 9 },
        { input: '11/15/2023', month: 10 },
        { input: '12/15/2023', month: 11 }
      ];

      dates.forEach(({ input, month }) => {
        const date = DateParser.parse(input);
        expect(date.getMonth()).toBe(month);
      });
    });
  });

  describe('format', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const formatted = DateParser.format(date);
      expect(formatted).toBe('2023-01-15');
    });

    it('should pad single digit month and day', () => {
      const date = new Date(2023, 0, 5); // January 5, 2023
      const formatted = DateParser.format(date);
      expect(formatted).toBe('2023-01-05');
    });

    it('should handle December correctly', () => {
      const date = new Date(2023, 11, 31); // December 31, 2023
      const formatted = DateParser.format(date);
      expect(formatted).toBe('2023-12-31');
    });

    it('should handle leap year dates', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      const formatted = DateParser.format(date);
      expect(formatted).toBe('2024-02-29');
    });

    it('should round-trip correctly', () => {
      const original = '2023-06-15';
      const parsed = DateParser.parse(original);
      const formatted = DateParser.format(parsed);
      expect(formatted).toBe(original);
    });

    it('should handle different year formats', () => {
      const date1 = new Date(2000, 0, 1);
      expect(DateParser.format(date1)).toBe('2000-01-01');

      const date2 = new Date(2099, 11, 31);
      expect(DateParser.format(date2)).toBe('2099-12-31');
    });
  });

  describe('parse and format integration', () => {
    it('should be able to parse formatted dates', () => {
      const original = new Date(2023, 5, 15);
      const formatted = DateParser.format(original);
      const parsed = DateParser.parse(formatted);
      
      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
    });

    it('should handle multiple format conversions', () => {
      const inputs = [
        '01/15/2023',
        '2023-01-15',
        '2023/01/15',
        '01-15-2023'
      ];

      const results = inputs.map(input => {
        const parsed = DateParser.parse(input);
        return DateParser.format(parsed);
      });

      // All should result in the same formatted string
      results.forEach(result => {
        expect(result).toBe('2023-01-15');
      });
    });
  });
});


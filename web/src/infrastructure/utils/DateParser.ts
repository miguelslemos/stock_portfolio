/**
 * Utility class for parsing dates from various formats
 * Extracted from PDFOperationRepository for reusability
 */
export class DateParser {
  private static readonly formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,        // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,         // MM/DD/YY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,           // MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{2})$/,           // MM-DD-YY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,           // YYYY-MM-DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,         // YYYY/MM/DD
  ];

  /**
   * Parse a date string in various formats
   * @param dateStr - Date string to parse
   * @returns Parsed Date object
   * @throws Error if date format is not recognized
   */
  static parse(dateStr: string): Date {
    const cleanDateStr = dateStr.trim();
    
    for (let i = 0; i < this.formats.length; i++) {
      const format = this.formats[i]!;
      const match = cleanDateStr.match(format);
      
      if (match) {
        let month: number, day: number, year: number;
        
        if (i === 4 || i === 5) {
          // YYYY-MM-DD or YYYY/MM/DD format
          year = parseInt(match[1]!);
          month = parseInt(match[2]!);
          day = parseInt(match[3]!);
        } else {
          // MM/DD/YYYY, MM-DD-YYYY formats
          month = parseInt(match[1]!);
          day = parseInt(match[2]!);
          const yearStr = match[3]!;
          year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
        }
        
        // Validate date components
        if (month < 1 || month > 12) {
          throw new Error(`Invalid month: ${month} in date ${cleanDateStr}`);
        }
        if (day < 1 || day > 31) {
          throw new Error(`Invalid day: ${day} in date ${cleanDateStr}`);
        }
        
        return new Date(year, month - 1, day);
      }
    }

    throw new Error(
      `Invalid date format: ${cleanDateStr}. Supported formats: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD`
    );
  }

  /**
   * Format a Date object to YYYY-MM-DD string
   * @param date - Date to format
   * @returns Formatted date string
   */
  static format(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

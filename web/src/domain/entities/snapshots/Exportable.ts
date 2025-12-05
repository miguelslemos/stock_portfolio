/**
 * Interface for entities that can be exported to CSV
 */
export interface CSVExportable {
  /**
   * Convert to CSV row
   * @returns Array of strings representing CSV columns
   */
  toCSVRow(): string[];
  
  /**
   * Get CSV headers
   * @returns Array of header names
   */
  getCSVHeaders(): string[];
}

/**
 * Interface for entities that can be exported to PDF
 */
export interface PDFExportable {
  /**
   * Convert to PDF section data
   */
  toPDFSection(): PDFSection;
}

/**
 * PDF Section structure
 */
export interface PDFSection {
  title: string;
  date: Date;
  type: 'vesting' | 'trade';
  fields: PDFField[];
}

export interface PDFField {
  label: string;
  value: string | number;
  format?: 'currency' | 'number' | 'date' | 'percentage';
  currency?: 'USD' | 'BRL';
}

/**
 * Interface for entities that can be serialized to JSON
 */
export interface JSONExportable {
  /**
   * Convert to plain JSON object
   */
  toJSON(): Record<string, unknown>;
}



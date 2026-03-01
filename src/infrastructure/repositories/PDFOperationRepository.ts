import { Money, StockQuantity } from '../../domain/entities';
import { PortfolioOperation, VestingOperation, TradeOperation } from '../../domain/operations';
import { IOperationRepository } from '../../application/interfaces';
import { DateParser } from '../utils/DateParser';
import * as pdfjsLib from 'pdfjs-dist';

// Define minimal interface for PDF text items
interface TextItem {
  str: string;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export class PDFOperationRepository implements IOperationRepository {
  constructor(
    private readonly tradePDFs: File[],
    private readonly releasePDFs: File[],
    private readonly onProgress?: (current: number, total: number) => void
  ) {}

  async getAllOperations(): Promise<PortfolioOperation[]> {
    const totalPDFs = this.tradePDFs.length + this.releasePDFs.length;
    
    let processedCount = 0;
    const operations: PortfolioOperation[] = [];

    // Process trade PDFs in parallel
    const tradePromises = this.tradePDFs.map(async (file) => {
      try {
        const trade = await this.extractTradeOperation(file);
        processedCount++;
        this.onProgress?.(processedCount, totalPDFs);
        
        if (trade) {
          return trade;
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error processing trade PDF ${file.name}:`, error);
        processedCount++;
        this.onProgress?.(processedCount, totalPDFs);
        return null;
      }
    });

    // Process release PDFs in parallel
    const releasePromises = this.releasePDFs.map(async (file) => {
      try {
        const vesting = await this.extractVestingOperation(file);
        processedCount++;
        this.onProgress?.(processedCount, totalPDFs);
        
        if (vesting) {
          return vesting;
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error processing vesting PDF ${file.name}:`, error);
        processedCount++;
        this.onProgress?.(processedCount, totalPDFs);
        return null;
      }
    });

    // Wait for all PDFs to be processed in parallel
    const [tradeResults, releaseResults] = await Promise.all([
      Promise.all(tradePromises),
      Promise.all(releasePromises)
    ]);

    // Collect all successful operations
    operations.push(...tradeResults.filter((op): op is TradeOperation => op !== null));
    operations.push(...releaseResults.filter((op): op is VestingOperation => op !== null));

    return operations;
  }

  private async extractTradeOperation(file: File): Promise<TradeOperation | null> {
    const text = await this.extractTextFromPDF(file);
    console.log(text);

    const modernPattern =
      /Trade Date\s+Settlement Date\s+Quantity\s+Price\s+Settlement Amount[\s\S]*?([\d\/\-]+)\s+([\d\/\-]+)\s+([\d,.]+)\s+([\d,.]+)/;

    const legacyPattern =
      /TRADE\s+DATE\s+SETL\s+DATE\s+MKT\s+\/\s+CPT\s+SYMBOL\s+\/\s+CUSIP\s+BUY\s+\/\s+SELL\s+QUANTITY\s+PRICE\s+ACCT\s+TYPE[\s\n]+([\d\/\-]+)\s+([\d\/\-]+)\s+[\d,\w,\s]+\s+([\d,.]+)\s+([\d,.,$]+)/;

    let match = text.match(modernPattern);
    
    if (!match) {
      match = text.match(legacyPattern);
    }

    if (match) {
      const dateStr = match[1]!.trim();
      const settlementDateStr = match[2]!.trim();
      const quantityStr = match[3]!.trim().replace(/,/g, '');
      const priceStr = match[4]!.replace(/[$,]/g, '').trim();


      const date = DateParser.parse(dateStr);
      const settlementDate = DateParser.parse(settlementDateStr);
      const quantity = new StockQuantity(Math.floor(parseFloat(quantityStr)));
      const price = new Money(parseFloat(priceStr), 'USD');

      let operation = new TradeOperation(date, quantity, price, settlementDate);
      console.log(operation);
      return operation;
    }

    console.warn(`Could not extract trade operation from file: ${file.name}`);
    return null;
  }

  private async extractVestingOperation(file: File): Promise<VestingOperation | null> {
    const text = await this.extractTextFromPDF(file);

    const releaseDateMatch = text.match(/Release Date\s+([\d\-\/]+)/);
    const sharesIssuedMatch = text.match(/Shares Issued\s+([\d,.]+)/);
    const marketValueMatch = text.match(/Market Value Per Share\s+\$?\s*([\d,.]+)/);

    if (!releaseDateMatch || !sharesIssuedMatch || !marketValueMatch) {
      console.warn(`Could not extract vesting operation from file: ${file.name}`);
      return null;
    }

    const dateStr = releaseDateMatch[1]!.trim();
    const quantityStr = sharesIssuedMatch[1]!.replace(/,/g, '').trim();
    const priceStr = marketValueMatch[1]!.replace(/,/g, '').trim();


    const date = DateParser.parse(dateStr);
    const quantity = new StockQuantity(Math.floor(parseFloat(quantityStr)));
    const price = new Money(parseFloat(priceStr), 'USD');

    return new VestingOperation(date, quantity, price);
  }

  private async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: unknown) => {
              if (item && typeof item === 'object' && 'str' in item) {
                return (item as TextItem).str;
              }
              return '';
            })
            .join(' ');
          fullText += pageText + '\n';
        } catch (pageError) {
          console.warn(
            `Skipping page ${pageNum}/${pdf.numPages} of "${file.name}": ${pageError instanceof Error ? pageError.message : String(pageError)}`
          );
        }
      }
    } finally {
      await pdf.destroy();
    }

    return fullText;
  }

}

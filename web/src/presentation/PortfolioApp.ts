import { PortfolioSnapshot } from '../domain/entities';
import { ProcessPortfolioUseCase, ProcessPortfolioResponse } from '../application/usecases';
import { PortfolioCalculationService, PortfolioAnalyticsService } from '../domain/services';
import { BCBExchangeRateService, CSVExportService } from '../infrastructure/services';
import {
  JSONOperationRepository,
  PDFOperationRepository,
  CompositeOperationRepository,
} from '../infrastructure/repositories';
import { IOperationRepository } from '../application/interfaces';
import { BRLFormatter, USDFormatter, DateFormatter } from './formatters';
import { ModalBuilder } from './ModalBuilder';
import { YearDetailsBuilder } from './YearDetailsBuilder';
import { JSONSchemaBuilder } from './JSONSchemaBuilder';

export class PortfolioApp {
  private tradePDFs: File[] = [];
  private releasePDFs: File[] = [];
  private jsonFile: File | null = null;
  private snapshots: PortfolioSnapshot[] = [];

  constructor(
    private readonly tradeInput: HTMLInputElement,
    private readonly tradeButton: HTMLButtonElement,
    private readonly tradeCount: HTMLElement,
    private readonly releaseInput: HTMLInputElement,
    private readonly releaseButton: HTMLButtonElement,
    private readonly releaseCount: HTMLElement,
    private readonly jsonInput: HTMLInputElement,
    private readonly processButton: HTMLButtonElement,
    private readonly exportButton: HTMLButtonElement,
    private readonly clearButton: HTMLButtonElement,
    private readonly resultsContainer: HTMLElement,
    private readonly uploadSection: HTMLElement,
    private readonly resetSection: HTMLElement,
    private readonly resetButton: HTMLButtonElement
  ) {
    this.setupEventListeners();
    this.setupJSONSchemaDisplay();
  }

  private setupJSONSchemaDisplay(): void {
    const jsonGroup = document.querySelector('.upload-group:has(#json-file)');
    if (jsonGroup) {
      const schemaSection = JSONSchemaBuilder.createSchemaSection();
      jsonGroup.appendChild(schemaSection);
    }
  }

  private setupEventListeners(): void {
    this.tradeButton.addEventListener('click', () => {
      this.tradeInput.click();
    });

    this.tradeInput.addEventListener('change', () => {
      const files = Array.from(this.tradeInput.files ?? []);
      this.tradePDFs = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
      this.updateFileCount(this.tradeCount, this.tradePDFs.length);
      this.updateButtonStates();
      this.showTotalFileCount();
    });

    this.releaseButton.addEventListener('click', () => {
      this.releaseInput.click();
    });

    this.releaseInput.addEventListener('change', () => {
      const files = Array.from(this.releaseInput.files ?? []);
      this.releasePDFs = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
      this.updateFileCount(this.releaseCount, this.releasePDFs.length);
      this.updateButtonStates();
      this.showTotalFileCount();
    });

    this.jsonInput.addEventListener('change', () => {
      this.jsonFile = this.jsonInput.files?.[0] ?? null;
      this.updateButtonStates();
      
      const jsonCount = document.getElementById('json-count');
      if (jsonCount) {
        if (this.jsonFile) {
          jsonCount.textContent = this.jsonFile.name;
          jsonCount.style.color = '#28a745';
        } else {
          jsonCount.textContent = '';
        }
      }
    });

    this.processButton.addEventListener('click', () => {
      void this.processPortfolio();
    });

    this.exportButton.addEventListener('click', () => {
      void this.processPortfolio(true);
    });

    this.clearButton.addEventListener('click', () => {
      this.clearAll();
    });

    this.resetButton.addEventListener('click', () => {
      this.resetAndShowUpload();
    });
  }

  private updateFileCount(element: HTMLElement, count: number): void {
    if (count > 0) {
      element.textContent = `${count} file${count > 1 ? 's' : ''} selected`;
      element.style.color = '#28a745';
    } else {
      element.textContent = '';
    }
  }

  private showTotalFileCount(): void {
    const totalFiles = this.tradePDFs.length + this.releasePDFs.length;
    if (totalFiles > 0) {
      const tradeFolders = this.getUniqueFolders(this.tradePDFs);
      const releaseFolders = this.getUniqueFolders(this.releasePDFs);
      
      let folderInfo = '';
      if (tradeFolders.size > 1 || releaseFolders.size > 1) {
        folderInfo = '<br><small style="color: #6c757d;">Including files from subfolders</small>';
      }
      
      this.resultsContainer.innerHTML = `
        <div class="info-message">
          <strong>📁 Files loaded:</strong> 
          ${this.tradePDFs.length} trade confirmation(s), 
          ${this.releasePDFs.length} release confirmation(s)
          ${folderInfo}
        </div>
      `;
    }
  }

  private getUniqueFolders(files: File[]): Set<string> {
    const folders = new Set<string>();
    files.forEach(file => {
      const path = file.webkitRelativePath || file.name;
      const folder = path.substring(0, path.lastIndexOf('/'));
      if (folder) {
        folders.add(folder);
      }
    });
    return folders;
  }

  private updateButtonStates(): void {
    const hasData =
      this.tradePDFs.length > 0 || this.releasePDFs.length > 0 || this.jsonFile !== null;
    this.processButton.disabled = !hasData;
    this.exportButton.disabled = !hasData;
  }

  private async processPortfolio(exportData = false): Promise<void> {
    try {
      this.showLoading();

      const repositories: IOperationRepository[] = [];
      const totalSteps = 3; // JSON + PDFs + Processing
      let currentStep = 0;

      // Step 1: Load JSON
      if (this.jsonFile) {
        this.updateProgress(currentStep, totalSteps, 'Carregando arquivo JSON...');
        const jsonContent = await this.readFileAsText(this.jsonFile);
        repositories.push(new JSONOperationRepository(jsonContent));
        currentStep++;
      }

      // Step 2: Load PDFs with progress
      if (this.tradePDFs.length > 0 || this.releasePDFs.length > 0) {
        const totalPDFs = this.tradePDFs.length + this.releasePDFs.length;
        this.updateProgress(currentStep, totalSteps, `Carregando ${totalPDFs} arquivos PDF...`);
        
        // Create PDF repository with progress callback
        const pdfRepo = new PDFOperationRepository(
          this.tradePDFs, 
          this.releasePDFs,
          (current, total) => {
            this.updateProgress(currentStep, totalSteps, `Processando PDFs: ${current}/${total}`);
          }
        );
        repositories.push(pdfRepo);
        currentStep++;
      }

      // Step 3: Process operations
      this.updateProgress(currentStep, totalSteps, 'Calculando portfólio...');
      
      const operationRepository = new CompositeOperationRepository(repositories);
      const exchangeRateService = new BCBExchangeRateService();
      const calculationService = new PortfolioCalculationService(exchangeRateService);
      const analyticsService = new PortfolioAnalyticsService();
      const exportService = exportData ? new CSVExportService() : undefined;

      const useCase = new ProcessPortfolioUseCase(
        operationRepository,
        calculationService,
        analyticsService,
        exportService
      );

      const response = await useCase.execute({ exportData });

      this.snapshots = response.snapshots;
      this.displayResults(response);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private showLoading(): void {
    this.resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Processando operações do portfólio...</p>
        <div class="progress-container">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <p class="progress-text" id="progressText">Inicializando...</p>
      </div>
    `;
  }

  private updateProgress(current: number, total: number, message: string): void {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
      const percentage = total > 0 ? (current / total) * 100 : 0;
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${message} (${current}/${total})`;
    }
  }

  private showError(message: string): void {
    this.resultsContainer.innerHTML = `
      <div class="error">
        <strong>Erro:</strong> ${this.escapeHtml(message)}
      </div>
    `;
  }

  private displayResults(response: ProcessPortfolioResponse): void {
    const { finalPosition, snapshots, totalOperations, totalReturnBrl } = response;

    // Hide upload section and show reset button
    this.uploadSection.classList.add('hidden');
    this.resetSection.style.display = 'block';

    const yearlySnapshots = this.getYearlySnapshots(snapshots);

    this.resultsContainer.innerHTML = `
      <div class="results">
        <h2>Resumo do Portfólio</h2>
        
        <div class="summary-cards">
          <div class="card">
            <h3>Total de Operações</h3>
            <div class="value">${totalOperations}</div>
          </div>
          
          <div class="card">
            <h3>Posição Atual</h3>
            <div class="value">${finalPosition.quantity.value} ações</div>
          </div>
          
          <div class="card">
            <h3>Preço Médio (USD)</h3>
            <div class="value">${USDFormatter.format(finalPosition.averagePriceUsd.amount)}</div>
          </div>
          
          <div class="card">
            <h3>Retorno Total (BRL)</h3>
            <div class="value ${totalReturnBrl.amount >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(totalReturnBrl.amount)}
            </div>
          </div>
        </div>

        <h2>Resumo Anual <small style="color: #6c757d;">(Clique em qualquer ano para ver detalhes)</small></h2>
        <div class="operations-table">
          ${this.renderYearlyTable(yearlySnapshots)}
        </div>

        <h2>Histórico de Operações <small style="color: #6c757d;">(Clique em qualquer linha para ver detalhes)</small></h2>
        <div class="operations-table">
          ${this.renderOperationsTable(snapshots)}
        </div>
      </div>
    `;

    this.attachOperationClickHandlers();
    this.attachYearClickHandlers();
  }

  private attachOperationClickHandlers(): void {
    const rows = this.resultsContainer.querySelectorAll('tbody tr[data-operation-index]');
    rows.forEach((row) => {
      row.addEventListener('click', () => {
        const index = parseInt(row.getAttribute('data-operation-index') || '0');
        this.showOperationDetails(index);
      });
    });
  }

  private attachYearClickHandlers(): void {
    const rows = this.resultsContainer.querySelectorAll('tbody tr[data-year]');
    rows.forEach((row) => {
      row.addEventListener('click', () => {
        const year = parseInt(row.getAttribute('data-year') || '0');
        this.showYearDetails(year);
      });
    });
  }

  private getYearlySnapshots(snapshots: PortfolioSnapshot[]): Map<number, PortfolioSnapshot> {
    const yearlyMap = new Map<number, PortfolioSnapshot>();

    for (const snapshot of snapshots) {
      const year = snapshot.position.lastUpdated.getFullYear();
      const existing = yearlyMap.get(year);

      if (!existing || snapshot.position.lastUpdated >= existing.position.lastUpdated) {
        yearlyMap.set(year, snapshot);
      }
    }

    return yearlyMap;
  }

  private renderYearlyTable(yearlySnapshots: Map<number, PortfolioSnapshot>): string {
    const sortedYears = Array.from(yearlySnapshots.keys()).sort((a, b) => a - b);

    const rows = sortedYears
      .map((year) => {
        const snapshot = yearlySnapshots.get(year)!;
        const position = snapshot.position;
        return `
        <tr data-year="${year}" style="cursor: pointer;">
          <td>${year}</td>
          <td>${position.quantity.value}</td>
          <td>${USDFormatter.format(position.totalCostUsd.amount)}</td>
          <td>${USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}</td>
          <td>${BRLFormatter.format(position.totalCostBrl.amount)}</td>
          <td>${BRLFormatter.formatWithPrecision(position.averagePriceBrl().amount)}</td>
          <td class="${position.grossProfitBrl.amount >= 0 ? 'positive' : 'negative'}">
            ${BRLFormatter.format(position.grossProfitBrl.amount)}
          </td>
        </tr>
      `;
      })
      .join('');

    return `
      <table>
        <thead>
          <tr>
            <th>Ano</th>
            <th>Quantidade</th>
            <th>Custo Total (USD)</th>
            <th>Preço Médio (USD)</th>
            <th>Custo Total (BRL)</th>
            <th>Preço Médio (BRL)</th>
            <th>Lucro Bruto (BRL)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  private renderOperationsTable(snapshots: PortfolioSnapshot[]): string {
    const rows = snapshots
      .map((snapshot, index) => {
        const position = snapshot.position;
        const metadata = snapshot.metadata;
        const operationDesc = snapshot.getOperationDescription();

        return `
        <tr data-operation-index="${index}">
          <td>${DateFormatter.format(metadata.operationDate)}</td>
          <td>${operationDesc}</td>
          <td>${position.quantity.value}</td>
          <td>${USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}</td>
          <td>${BRLFormatter.formatWithPrecision(position.averagePriceBrl().amount)}</td>
          <td class="${position.grossProfitBrl.amount >= 0 ? 'positive' : 'negative'}">
            ${BRLFormatter.format(position.grossProfitBrl.amount)}
          </td>
        </tr>
      `;
      })
      .join('');

    return `
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Operação</th>
            <th>Quantidade Final</th>
            <th>Preço Médio (USD)</th>
            <th>Preço Médio (BRL)</th>
            <th>Lucro Bruto (BRL)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  private showOperationDetails(index: number): void {
    const snapshot = this.snapshots[index];
    if (!snapshot) return;

    const modal = ModalBuilder.createOperationModal(snapshot);
    this.showModal(modal);
  }

  private showYearDetails(year: number): void {
    // Get all snapshots for the year
    const yearSnapshots = this.snapshots.filter(
      s => s.position.lastUpdated.getFullYear() === year
    );

    if (yearSnapshots.length === 0) return;

    const modal = YearDetailsBuilder.createYearModal(year, yearSnapshots);
    this.showModal(modal);
  }

  private showModal(modal: HTMLElement): void {
    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;
    
    document.body.appendChild(modal);

    // Set ARIA attributes
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const closeBtn = modal.querySelector('.modal-close') as HTMLElement;
    const overlay = modal;

    // Focus the close button for keyboard accessibility
    if (closeBtn) {
      closeBtn.focus();
    }

    const closeModal = (): void => {
      modal.remove();
      // Restore focus to previously focused element
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };

    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  }


  private clearAll(): void {
    this.tradePDFs = [];
    this.releasePDFs = [];
    this.jsonFile = null;
    this.snapshots = [];
    this.tradeInput.value = '';
    this.releaseInput.value = '';
    this.jsonInput.value = '';
    this.tradeCount.textContent = '';
    this.releaseCount.textContent = '';
    
    const jsonCount = document.getElementById('json-count');
    if (jsonCount) {
      jsonCount.textContent = '';
    }
    
    this.resultsContainer.innerHTML = '';
    this.updateButtonStates();
  }

  private resetAndShowUpload(): void {
    // Clear all data
    this.clearAll();
    
    // Show upload section with smooth animation
    this.resetSection.style.display = 'none';
    this.uploadSection.classList.remove('hidden');
    
    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}


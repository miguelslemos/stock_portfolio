import { PortfolioApp } from './presentation/PortfolioApp';

document.addEventListener('DOMContentLoaded', () => {
  const tradeInput = document.getElementById('trade-pdfs') as HTMLInputElement;
  const tradeButton = document.getElementById('trade-btn') as HTMLButtonElement;
  const tradeCount = document.getElementById('trade-count') as HTMLElement;
  const releaseInput = document.getElementById('release-pdfs') as HTMLInputElement;
  const releaseButton = document.getElementById('release-btn') as HTMLButtonElement;
  const releaseCount = document.getElementById('release-count') as HTMLElement;
  const jsonInput = document.getElementById('json-file') as HTMLInputElement;
  const processButton = document.getElementById('process-btn') as HTMLButtonElement;
  const exportButton = document.getElementById('export-btn') as HTMLButtonElement;
  const clearButton = document.getElementById('clear-btn') as HTMLButtonElement;
  const resultsContainer = document.getElementById('results') as HTMLElement;
  const uploadSection = document.getElementById('upload-section') as HTMLElement;
  const resetSection = document.getElementById('reset-section') as HTMLElement;
  const resetButton = document.getElementById('reset-btn') as HTMLButtonElement;

  new PortfolioApp(
    tradeInput,
    tradeButton,
    tradeCount,
    releaseInput,
    releaseButton,
    releaseCount,
    jsonInput,
    processButton,
    exportButton,
    clearButton,
    resultsContainer,
    uploadSection,
    resetSection,
    resetButton
  );
});


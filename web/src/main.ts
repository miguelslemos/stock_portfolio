import { PortfolioApp } from './presentation/PortfolioApp';

document.addEventListener('DOMContentLoaded', () => {
  const tradeInput = document.getElementById('trade-pdfs') as HTMLInputElement;
  const tradeButton = document.getElementById('trade-btn') as HTMLButtonElement;
  const tradeCount = document.getElementById('trade-count') as HTMLElement;
  const releaseInput = document.getElementById('release-pdfs') as HTMLInputElement;
  const releaseButton = document.getElementById('release-btn') as HTMLButtonElement;
  const releaseCount = document.getElementById('release-count') as HTMLElement;
  const jsonInput = document.getElementById('json-file') as HTMLInputElement;
  const jsonButton = document.getElementById('json-btn') as HTMLButtonElement;
  const jsonCount = document.getElementById('json-count') as HTMLElement;
  const processButton = document.getElementById('process-btn') as HTMLButtonElement;
  const exportButton = document.getElementById('export-btn') as HTMLButtonElement;
  const clearButton = document.getElementById('clear-btn') as HTMLButtonElement;
  const resultsContainer = document.getElementById('results') as HTMLElement;
  const uploadSection = document.getElementById('upload-section') as HTMLElement;
  const resetSection = document.getElementById('reset-section') as HTMLElement;
  const resetButton = document.getElementById('reset-btn') as HTMLButtonElement;

  setupJsonButton(jsonButton, jsonInput, jsonCount);

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

  setupHelpToggle();
});

function setupJsonButton(
  jsonButton: HTMLButtonElement,
  jsonInput: HTMLInputElement,
  jsonCount: HTMLElement
): void {
  jsonButton.addEventListener('click', () => {
    jsonInput.click();
  });

  jsonInput.addEventListener('change', () => {
    if (jsonInput.files && jsonInput.files.length > 0) {
      const file = jsonInput.files[0]!;
      jsonCount.textContent = `${file.name}`;
      jsonCount.style.color = '#28a745';
    } else {
      jsonCount.textContent = '';
    }
  });
}

function setupHelpToggle(): void {
  const helpToggle = document.getElementById('help-toggle');
  const helpContent = document.getElementById('help-content');

  if (!helpToggle || !helpContent) return;

  helpToggle.addEventListener('click', () => {
    const isExpanded = helpToggle.getAttribute('aria-expanded') === 'true';
    
    helpToggle.setAttribute('aria-expanded', (!isExpanded).toString());
    helpContent.setAttribute('aria-hidden', isExpanded.toString());

    if (!isExpanded) {
      setTimeout(() => {
        helpContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  });
}


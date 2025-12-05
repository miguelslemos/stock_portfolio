/**
 * Builder for JSON Schema display component
 * Shows the expected JSON format for manual operations
 */
export class JSONSchemaBuilder {
  /**
   * Create a collapsible JSON schema display
   */
  static createSchemaSection(): HTMLElement {
    const schema = this.getJSONSchema();
    const example = this.getJSONExample();

    const section = document.createElement('div');
    section.className = 'json-schema-section';
    section.innerHTML = `
      <div class="schema-toggle" id="schema-toggle">
        <div class="schema-toggle-text">
          <span>📋</span>
          <span>Ver Schema JSON</span>
        </div>
        <span class="schema-icon" id="schema-icon">▼</span>
      </div>
      <div class="schema-content" id="schema-content">
        <div class="schema-tabs">
          <button class="schema-tab active" data-tab="schema">Schema</button>
          <button class="schema-tab" data-tab="example">Exemplo</button>
        </div>
        <div class="schema-code" id="schema-display">
          <button class="copy-schema-btn" id="copy-schema-btn">Copiar</button>
          <pre>${this.escapeHtml(schema)}</pre>
        </div>
      </div>
    `;

    // Add event listeners
    const toggle = section.querySelector('#schema-toggle') as HTMLElement;
    const content = section.querySelector('#schema-content') as HTMLElement;
    const icon = section.querySelector('#schema-icon') as HTMLElement;
    const display = section.querySelector('#schema-display pre') as HTMLElement;
    const copyBtn = section.querySelector('#copy-schema-btn') as HTMLElement;
    const tabs = section.querySelectorAll('.schema-tab');

    toggle.addEventListener('click', () => {
      const isOpen = content.classList.toggle('open');
      icon.classList.toggle('open', isOpen);
    });

    copyBtn.addEventListener('click', () => {
      const text = display.textContent || '';
      void navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => {
          copyBtn.textContent = 'Copiar';
        }, 2000);
      });
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabType = tab.getAttribute('data-tab');
        if (tabType === 'example') {
          display.textContent = example;
        } else {
          display.textContent = schema;
        }
      });
    });

    return section;
  }

  private static getJSONSchema(): string {
    return JSON.stringify({
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "array",
      "description": "Lista de operações de portfólio (vesting ou trade)",
      "items": {
        "oneOf": [
          {
            "type": "object",
            "description": "Operação de Vesting (aquisição de ações)",
            "required": ["type", "date", "quantity", "price_per_share_usd"],
            "properties": {
              "type": {
                "type": "string",
                "const": "vesting",
                "description": "Tipo da operação"
              },
              "date": {
                "type": "string",
                "format": "date",
                "description": "Data da operação (YYYY-MM-DD)"
              },
              "quantity": {
                "type": "integer",
                "minimum": 1,
                "description": "Quantidade de ações"
              },
              "price_per_share_usd": {
                "type": "number",
                "minimum": 0,
                "description": "Preço por ação em USD"
              }
            }
          },
          {
            "type": "object",
            "description": "Operação de Trade (venda de ações)",
            "required": ["type", "date", "quantity", "price_per_share_usd"],
            "properties": {
              "type": {
                "type": "string",
                "const": "trade",
                "description": "Tipo da operação"
              },
              "date": {
                "type": "string",
                "format": "date",
                "description": "Data da operação (YYYY-MM-DD)"
              },
              "settlement_date": {
                "type": "string",
                "format": "date",
                "description": "Data de liquidação (opcional, padrão = date)"
              },
              "quantity": {
                "type": "integer",
                "minimum": 1,
                "description": "Quantidade de ações vendidas"
              },
              "price_per_share_usd": {
                "type": "number",
                "minimum": 0,
                "description": "Preço de venda por ação em USD"
              }
            }
          }
        ]
      }
    }, null, 2);
  }

  private static getJSONExample(): string {
    return JSON.stringify([
      {
        "type": "vesting",
        "date": "2023-01-15",
        "quantity": 100,
        "price_per_share_usd": 8.50
      },
      {
        "type": "vesting",
        "date": "2023-04-15",
        "quantity": 100,
        "price_per_share_usd": 9.20
      },
      {
        "type": "trade",
        "date": "2023-06-10",
        "settlement_date": "2023-06-12",
        "quantity": 50,
        "price_per_share_usd": 10.75
      },
      {
        "type": "vesting",
        "date": "2023-07-15",
        "quantity": 100,
        "price_per_share_usd": 11.00
      },
      {
        "type": "trade",
        "date": "2023-12-20",
        "settlement_date": "2023-12-22",
        "quantity": 150,
        "price_per_share_usd": 12.50
      }
    ], null, 2);
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}


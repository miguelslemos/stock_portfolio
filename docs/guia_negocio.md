# Guia de Negócio do Gerenciador de Portfólio de Ações

## Visão Geral
Este projeto processa operações de ações (grants/vestings e trades/vendas), calcula preço médio, custo total em USD e BRL, lucro bruto em BRL e gera históricos e resumos anuais. As entradas podem vir de PDFs (E*TRADE) e/ou de um arquivo JSON. O sistema exporta resultados em CSV/XLSX e imprime o histórico e a posição atual.

## Moedas e Câmbio
- A moeda base das operações é USD. Também calculamos métricas em BRL.
- A cotação USD/BRL (PTAX) é obtida via serviço do Banco Central do Brasil (python-bcb) usando o preço de compra/venda (ask).
  - Tenta a cotação na data exata da liquidação da operação(Settlement Date).
  - Caso não exista (feriado/fim de semana), busca retroativamente até 7 dias para trás.

## Tipos de Operação
- Vesting (`VestingOperation`): entrada de ações com preço de referência (market value per share). Aumenta a quantidade e o custo total proporcionalmente.
- Trade (`TradeOperation`): saída/venda de ações. Reduz a quantidade e o custo total proporcionalmente.

As operações são ordenadas por data no processamento do portfólio.

## Estado Inicial
É possível iniciar um ano com um estado anterior (`InitialState`) contendo:
- `quantity`, `total_cost_usd`, `total_cost_brl`, `average_price_usd`, `average_price_brl`.

No início do processamento anual (`YearPortfolio`), é registrado um snapshot de abertura com data 31/12 do ano anterior e esses valores.

## Regras de Cálculo (método do custo médio)
Considere o estado antes da operação:
- Quantidade atual: Q
- Custo total USD: C_USD
- Custo total BRL: C_BRL
- Preço médio USD: PM_USD = C_USD / Q (se Q > 0)
- Preço médio BRL: PM_BRL = C_BRL / Q (se Q > 0)
- Cotação do dia: FX = USD/BRL (PTAX ask com fallback de até 7 dias)

### 1) Vesting
Dados da operação: quantidade `q`, preço em USD `p`.
- Novo custo total USD: C_USD' = C_USD + q * p
- Novo custo total BRL: C_BRL' = C_BRL + q * p * FX
- Nova quantidade: Q' = Q + q
- Novos preços médios: PM_USD' = C_USD' / Q' e PM_BRL' = C_BRL' / Q'

### 2) Trade (Venda)
Dados da operação: quantidade vendida `q` (deve ser q ≤ Q), preço em USD `p`.
- Fração da posição vendida: f = q / Q
- Novo custo total USD: C_USD' = C_USD * (1 − f)
- Novo custo total BRL: C_BRL' = C_BRL * (1 − f)
- Nova quantidade: Q' = Q − q
- Preços médios após a venda: PM_USD' = C_USD' / Q' e PM_BRL' = C_BRL' / Q' (se Q' > 0). Observação: pelo método de custo médio proporcional, o preço médio permanece o mesmo antes e depois da venda.

### Lucro Bruto em BRL
Acumulado no ano ao processar cada `TradeOperation`:
- Lucro da venda: L = q * (p * FX − PM_BRL)
- O projeto acumula `gross_profit_brl += L` ao longo do ano.
- Observação: como o método usa custo médio proporcional, PM_BRL após a venda é igual ao PM_BRL antes da venda; o código usa o PM_BRL do snapshot pós-operação, que é equivalente.

## Snapshots e Histórico
Cada operação gera um `PortfolioSnapshot` com:
- Operação, quantidade total, custo total USD/BRL, preço médio USD/BRL, lucro bruto acumulado em BRL, e a cotação `usd_brl_rate` usada no dia.

## Exportação
- Histórico de portfólio (transações) em `portfolio_history.csv` com cabeçalhos:
  - Date, Operation, Quantity, Stock Price at Date, USD Quote At Date, Total Cost USD, Average Price USD, Total Cost BRL, Average Price BRL
- Resumo anual em `yearly_summary.csv` com cabeçalhos:
  - Year, Total Operations, Final Quantity, Total Cost USD, Average Price USD, Total Cost BRL, Average Price BRL, Gross Profit BRL

## Exemplo Numérico Rápido
1) Vesting: Q=0, C_USD=0, C_BRL=0. Compra 100 a USD 10, FX=5.00.
- C_USD=1000, C_BRL=5000, Q=100, PM_USD=10.00, PM_BRL=50.00
2) Trade: vender 20 a USD 12, FX=5.10.
- f=20/100=0.2; C_USD'=800; C_BRL'=4000; Q'=80; PM_USD'=10.00; PM_BRL'=50.00
- Lucro da venda: 20 * (12*5.10 − 50.00) = 20 * (61.20 − 50.00) = 224.00 BRL

## Diagrama de Fluxo (alto nível)
```mermaid
flowchart LR
  A[Entrada de Dados]\nPDFs/JSON --> B[DataProvider]
  B --> C[YearPortfolio]
  C -->|processa operações| D[Snapshots]
  D --> E[Exporters CSV/XLSX]
  C --> F[Impressão de histórico/posição]
  G[CurrencyService\n(PTAX BCB)] --> C
```

## Boas Práticas e Observações
- O método é de custo médio; não há FIFO/LIFO: a remoção reduz custo total proporcionalmente.
- A cotação possui fallback de 7 dias para lidar com fins de semana/feriados.
- O resumo anual acumula lucro bruto apenas de vendas (`Trade`).
- Para iniciar com posição anterior, forneça `InitialState`.

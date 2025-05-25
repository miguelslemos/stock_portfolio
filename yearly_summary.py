from dataclasses import dataclass

@dataclass
class YearlySummary:
    year: int
    total_operations: int
    final_quantity: int
    total_cost_usd: float
    average_price_usd: float
    total_cost_brl: float
    average_price_brl: float
    gross_profit_brl: float 

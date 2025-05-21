from dataclasses import dataclass
from operation import Operation

@dataclass
class PortfolioSnapshot:
    operation: Operation
    total_quantity: int
    total_cost_usd: float
    average_price_usd: float
    total_cost_brl: float
    average_price_brl: float
    gross_profit_brl: float

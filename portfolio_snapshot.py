from dataclasses import dataclass
from datetime import datetime

@dataclass
class PortfolioSnapshot:
    date: datetime
    quantity: int
    total_cost: float
    average_price: float
    total_cost_brl: float
    average_price_brl: float

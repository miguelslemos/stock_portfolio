from dataclasses import dataclass

@dataclass
class InitialState:
    def __init__(self, quantity: int, total_cost_usd: float, total_cost_brl: float, average_price_usd: float, average_price_brl: float):
        self.quantity = quantity
        self.total_cost_usd = total_cost_usd
        self.total_cost_brl = total_cost_brl
        self.average_price_usd = average_price_usd
        self.average_price_brl = average_price_brl
from dataclasses import dataclass
from datetime import datetime
from abc import ABC, abstractmethod

@dataclass(frozen=True)
class ProcessResult:
    quantity: int
    total_cost: float
    total_cost_brl: float

class Transaction(ABC):
    date: datetime
    quantity: int
    price: float

    @abstractmethod
    def process(self, quantity: int, total_cost: float, total_cost_brl: float, usd_brl_ptax: float) -> ProcessResult:
        """Returns the new (quantity, total_cost) after applying this transaction."""
        pass

@dataclass(frozen=True)
class BuyTransaction(Transaction):
    date: datetime
    quantity: int
    price: float

    def process(self, quantity: int, total_cost: float, total_cost_brl: float, usd_brl_ptax: float) -> ProcessResult:
        new_total_cost = total_cost + self.quantity * self.price
        new_total_cost_brl = total_cost_brl + (self.quantity * self.price * usd_brl_ptax)
        new_quantity = quantity + self.quantity
        return ProcessResult(quantity=new_quantity, total_cost=new_total_cost, total_cost_brl=new_total_cost_brl)

@dataclass(frozen=True)
class SellTransaction(Transaction):
    date: datetime
    quantity: int
    price: float
    def process(self, quantity: int, total_cost: float, total_cost_brl: float, _: float) -> ProcessResult:
        if self.quantity > quantity:
            raise ValueError(
                f"Attempted to sell {self.quantity} shares but only have {quantity} available"
            )
        fraction = self.quantity / quantity
        new_total_cost = total_cost - total_cost * fraction
        new_total_cost_brl = total_cost_brl - total_cost_brl * fraction
        new_quantity = quantity - self.quantity
        return ProcessResult(quantity=new_quantity, total_cost=new_total_cost, total_cost_brl=new_total_cost_brl) 
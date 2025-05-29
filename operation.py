from dataclasses import dataclass
from datetime import datetime
from abc import ABC, abstractmethod

@dataclass(frozen=True)
class ProcessResult:
    quantity: int
    total_cost: float
    total_cost_brl: float

class Operation(ABC):
    date: datetime
    quantity: int
    price: float

    @abstractmethod
    def process(self, quantity: int, total_cost: float, total_cost_brl: float, usd_brl_ptax: float) -> ProcessResult:
        """Returns the new (quantity, total_cost) after applying this operation."""
        pass
    
    @abstractmethod
    def get_operation_type(self) -> str:
        pass
    @abstractmethod
    def get_symbol_type(self) -> str:
        pass

@dataclass(frozen=True)
class VestingOperation(Operation):
    date: datetime
    quantity: int
    price: float

    def process(self, quantity: int, total_cost: float, total_cost_brl: float, usd_brl_ptax: float) -> ProcessResult:
        new_total_cost = total_cost + self.quantity * self.price
        new_total_cost_brl = round(total_cost_brl + (self.quantity * self.price * usd_brl_ptax), 4)
        new_quantity = quantity + self.quantity
        # print(f"[DEBUG] VestingOperation.process: Adding {self.quantity} units at {self.price} USD each (ptax={usd_brl_ptax})")
        # print(f"[DEBUG] Previous: quantity={quantity}, total_cost={total_cost}, total_cost_brl={total_cost_brl}")
        # print(f"[DEBUG] New: quantity={new_quantity}, total_cost={new_total_cost}, total_cost_brl={new_total_cost_brl}")
        return ProcessResult(quantity=new_quantity, total_cost=new_total_cost, total_cost_brl=new_total_cost_brl)
    
    def get_operation_type(self) -> str:
        return "Vesting"
    
    def get_symbol_type(self) -> str:
        return "+"

@dataclass(frozen=True)
class SellOperation(Operation):
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
        # print(f"[DEBUG] SellOperation.process: Selling {self.quantity} units at {self.price} USD each")
        # print(f"[DEBUG] Previous: quantity={quantity}, total_cost={total_cost}, total_cost_brl={total_cost_brl}")
        # print(f"[DEBUG] Fraction of position sold: {fraction}")
        # print(f"[DEBUG] New: quantity={new_quantity}, total_cost={new_total_cost}, total_cost_brl={new_total_cost_brl}")
        return ProcessResult(quantity=new_quantity, total_cost=new_total_cost, total_cost_brl=new_total_cost_brl)
    
    def get_operation_type(self) -> str:
        return "Sell"    
    
    def get_symbol_type(self) -> str:
        return "-"

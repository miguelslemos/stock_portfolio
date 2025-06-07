from dataclasses import dataclass
from datetime import datetime
from abc import ABC, abstractmethod
import json
from typing import Dict, List
from date_utils import parse_date

@dataclass(frozen=True)
class ProcessResult:
    quantity: int
    total_cost: float
    total_cost_brl: float

class Operation(ABC):
    date: datetime
    quantity: int
    price: float
    
    @classmethod
    def create(cls, operations_data: Dict) -> 'Operation':
        if operations_data['type'] == 'vesting':
            return VestingOperation(
                date=parse_date(operations_data['date']),
                quantity=operations_data['quantity'],
                price=operations_data['price']
            )
        elif operations_data['type'] == 'sell':
            return SellOperation(
                date=parse_date(operations_data['date']),
                quantity=operations_data['quantity'],
                price=operations_data['price']
            )
        else:
            raise ValueError(f"Unsupported operation type: {operations_data['type']}")

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


def load_operations(operation_filepath: str) -> List['Operation']:
    try:
        with open(operation_filepath, 'r') as f:
            operations_data = json.load(f)
            operations = []
            for op in operations_data:
                operations.append(Operation.create(op))
        return operations
    except FileNotFoundError as e:
        raise ValueError(f"Error: {e}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Error parsing JSON file: {e}")

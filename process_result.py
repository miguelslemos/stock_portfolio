from dataclasses import dataclass

@dataclass
class ProcessResult:
    quantity: int
    total_cost: float
    total_cost_brl: float 
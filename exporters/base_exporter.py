from dataclasses import dataclass
from abc import ABC, abstractmethod
from typing import List

from portfolio_snapshot import PortfolioSnapshot

class BaseExporter(ABC):
    """Base class for exporters that handle the export of financial data."""
    def export(self, history: List[PortfolioSnapshot], yearly_summaries: List) -> None:
        pass

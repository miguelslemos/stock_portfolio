import csv
import os
from typing import List
from exporters.base_exporter import BaseExporter
from portfolio_snapshot import PortfolioSnapshot


class NoopExporter(BaseExporter):
    """Exporter for no operation."""
    
    @staticmethod
    def get_exporter_type() -> str:
        return "none"
    
    def export(self, _: List[PortfolioSnapshot], __: List) -> None:
        pass
    

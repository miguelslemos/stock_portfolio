from abc import abstractmethod
from exporters.base_exporter import BaseExporter
from utils import format_date
import unittest


class FileExporter(BaseExporter):
    @staticmethod
    def get_portfolio_headers():
        return [
            'Date', 'Operation', 'Quantity', 'Stock Price at Date', 'USD Quote At Date',
            'Total Cost USD', 'Average Price USD', 'Total Cost BRL', 'Average Price BRL'
        ]
    
    @staticmethod
    def get_yearly_headers():
        return [
            'Year', 'Total Operations', 'Final Quantity', 'Total Cost USD', 
            'Average Price USD', 'Total Cost BRL', 'Average Price BRL', 'Gross Profit BRL'
        ]

    @abstractmethod
    def _write_row(self, writer, row_data):
        pass

    def _write_portfolio_history(self, writer, history):
        portfolio_headers = self.get_portfolio_headers()
        self._write_row(writer, portfolio_headers)
        for snapshot in history:
            operation_type = snapshot.operation.get_operation_type()
            transaction_quantity = snapshot.operation.get_symbol_type() + str(snapshot.operation.quantity)
            row = [
                format_date(snapshot.operation.date),
                operation_type,
                transaction_quantity,
                snapshot.operation.price,
                snapshot.usd_brl_rate,
                snapshot.total_cost_usd,
                snapshot.average_price_usd,
                snapshot.total_cost_brl,
                snapshot.average_price_brl
            ]
            self._write_row(writer, row)

    def _write_yearly_summary(self, writer, yearly_summaries):
        yearly_headers = self.get_yearly_headers()
        self._write_row(writer, yearly_headers)
        for summary in yearly_summaries:
            row = [
                summary.year,
                summary.total_operations,
                summary.final_quantity,
                summary.total_cost_usd,
                summary.average_price_usd,
                summary.total_cost_brl,
                summary.average_price_brl,
                summary.gross_profit_brl
            ]
            self._write_row(writer, row)

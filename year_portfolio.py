from typing import List
from datetime import datetime

from initial_state import InitialState
from transaction import BuyTransaction, SellTransaction, Transaction
from portfolio_snapshot import PortfolioSnapshot
from currency_service import CurrencyService


class YearPortfolio:
    def __init__(self, transactions: List[Transaction], initial_state: InitialState = None):
        self._quantity: int = initial_state.quantity if initial_state else 0
        self._total_cost_usd: float = initial_state.total_cost_usd if initial_state else 0.0
        self._total_cost_brl: float = initial_state.total_cost_brl if initial_state else 0.0
        self.history: List[PortfolioSnapshot] = []
        self._gross_profit_brl: float = 0.0
        
        if transactions:
            self.transactions = sorted(transactions, key=lambda x: x.date)
            min_date = min(transaction.date for transaction in self.transactions)
            max_date = max(transaction.date for transaction in self.transactions)
            snapshot = PortfolioSnapshot(
                transaction=BuyTransaction(
                    date=datetime(min_date.year - 1, 12, 31),
                    quantity=self._quantity,
                    price=0
                ),
                total_quantity=self._quantity,
                total_cost_usd=self._total_cost_usd,
                average_price_usd=initial_state.average_price_usd if initial_state else 0.0,
                total_cost_brl=self._total_cost_brl,
                average_price_brl=initial_state.average_price_brl if initial_state else 0.0,
                gross_profit_brl=0)
            self.history.append(snapshot)
            
            currrency = CurrencyService.get_usd_rates(min_date, max_date)
            for transaction in self.transactions:
                usd_brl_ptax = CurrencyService.get_ask_price(transaction.date, currrency)
                result = transaction.process(self._quantity, self._total_cost_usd, self._total_cost_brl, usd_brl_ptax)
                self._quantity = result.quantity
                self._total_cost_usd = result.total_cost
                self._total_cost_brl = result.total_cost_brl
                average_price_usd = round(self._total_cost_usd / self._quantity,4) if self._quantity > 0 else 0.0
                average_price_brl = round(self._total_cost_brl / self._quantity,4) if self._quantity > 0 else 0.0
                # print(f"[DEBUG] Processing transaction: {transaction}")
                # print(f"[DEBUG] USD/BRL PTAX rate for {transaction.date.strftime('%Y-%m-%d')}: {usd_brl_ptax}")
                # print(f"[DEBUG] Portfolio state after transaction: quantity={self._quantity}, total_cost_usd={self._total_cost_usd}, total_cost_brl={self._total_cost_brl}")
                if isinstance(transaction, SellTransaction):
                    self._gross_profit_brl += round(transaction.quantity * (transaction.price * usd_brl_ptax - average_price_brl), 4)
                self._record_snapshot(transaction, average_price_usd, average_price_brl)

    def _record_snapshot(self, transaction: Transaction, average_price_usd: float, average_price_brl: float) -> None:
        
        # print(f"[DEBUG] Recording snapshot for date: {transaction.date.strftime('%Y-%m-%d')}")
        # print(f"[DEBUG] Snapshot state: quantity={self._quantity}, total_cost_usd={self._total_cost_usd}, average_price_usd={average_price_usd}, total_cost_brl={self._total_cost_brl}, average_price_brl={average_price_brl}")
        snapshot = PortfolioSnapshot(
            transaction=transaction,
            total_quantity=self._quantity,
            total_cost_usd=self._total_cost_usd,
            average_price_usd=average_price_usd,
            total_cost_brl=self._total_cost_brl,
            average_price_brl=average_price_brl,
            gross_profit_brl=self._gross_profit_brl,  
        )  
        self.history.append(snapshot)

    def get_history(self) -> List[PortfolioSnapshot]:
        return self.history
    
    def get_current_position(self) -> PortfolioSnapshot:
        if not self.history:
            raise ValueError("No transactions have been processed")
        return self.history[-1]

from dataclasses import dataclass
from typing import List
from datetime import datetime

from transaction import BuyTransaction, SellTransaction, Transaction
from portfolio_snapshot import PortfolioSnapshot
from currency_service import CurrencyService

@dataclass
class OperationCurrency:
    transaction: Transaction
    usd_brl_ptax: float
    
@dataclass
class ProcessParameters:
    operation_currency: OperationCurrency


class Portfolio:
    def __init__(self, transactions: List[Transaction] = None):
        self.quantity: int = 0
        self.total_cost: float = 0.0
        self.total_cost_brl: float = 0.0
        self.history: List[PortfolioSnapshot] = []
        self.proccess_parameter: List[ProcessParameters] = []
        self.transactions = []
        
        if transactions:
            self.transactions = sorted(transactions, key=lambda x: x.date)
            min_date = min(transaction.date for transaction in self.transactions)
            max_date = max(transaction.date for transaction in self.transactions)
            currrency = CurrencyService.get_usd_rates(min_date, max_date)
            for transaction in self.transactions:
                usd_brl_ptax = CurrencyService.get_ask_price(transaction.date, currrency)
                process_parameter = ProcessParameters(
                    operation_currency=OperationCurrency(transaction=transaction, usd_brl_ptax=usd_brl_ptax),
                )
                result = transaction.process(self.quantity, self.total_cost, self.total_cost_brl, usd_brl_ptax)
                self.quantity = result.quantity
                self.total_cost = result.total_cost
                self.total_cost_brl = result.total_cost_brl
                self.proccess_parameter.append(process_parameter)
                self._record_snapshot(transaction.date)

    def _record_snapshot(self, date: datetime) -> None:
        average_price = self.total_cost / self.quantity if self.quantity > 0 else 0.0
        average_price_brl = self.total_cost_brl / self.quantity if self.quantity > 0 else 0.0
        snapshot = PortfolioSnapshot(
            date=date,
            quantity=self.quantity,
            total_cost=self.total_cost,
            average_price=average_price,
            total_cost_brl=self.total_cost_brl,
            average_price_brl=average_price_brl
        )
        self.history.append(snapshot)

    def get_buy_operations_before_sell(self):
        """
        Returns a dictionary mapping each SellTransaction to a tuple:
        (list of (BuyTransaction, usd_brl_ptax) before the sell's date, usd_brl_ptax for the sell date)
        """
        sells = [
            (pp.operation_currency.transaction, pp.operation_currency.usd_brl_ptax)
            for pp in self.proccess_parameter
            if isinstance(pp.operation_currency.transaction, SellTransaction)
        ]
        buys = [
            (pp.operation_currency.transaction, pp.operation_currency.usd_brl_ptax)
            for pp in self.proccess_parameter
            if isinstance(pp.operation_currency.transaction, BuyTransaction)
        ]
        result = {}
        for sell, sell_rate in sells:
            prior_buys = [(buy, buy_rate) for buy, buy_rate in buys if buy.date < sell.date]
            result[sell] = (prior_buys, sell_rate)
        return result
        
    def get_current_position(self) -> PortfolioSnapshot:
        if not self.history:
            raise ValueError("No transactions have been processed")
        return self.history[-1]
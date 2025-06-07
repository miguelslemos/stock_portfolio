from collections import defaultdict
from typing import List

from data_provider import DataProvider
from initial_state import InitialState
from operation import Operation
from utils import print_current_position, print_portfolio_history
from yearly_summary import YearlySummary

class BenefitHistory:
    def __init__(self, data_provider: DataProvider, initial_state: InitialState = None):
        self._data_provider = data_provider
        self._operations_by_year = self._group_operations_by_year(data_provider.get_operations())
        self._transaction_snapshots = []  # Store only actual transaction snapshots for export
        self._yearly_summaries = []  # Store yearly summaries for export

        from year_portfolio import YearPortfolio  # Import here to avoid circular dependency
        previous_state = initial_state
        for year in sorted(self._operations_by_year):
            portfolio = YearPortfolio(operations=self._operations_by_year[year], initial_state=previous_state)
            current_position = portfolio.get_current_position()
            portfolio_history = portfolio.get_history()
            
            # Filter out initial state snapshots - only collect actual transaction snapshots
            # The first snapshot in each year's history is the initial state
            actual_transactions = portfolio_history[1:] if len(portfolio_history) > 1 else []
            self._transaction_snapshots.extend(actual_transactions)
            
            # Store yearly summary
            yearly_summary = YearlySummary(
                year=year,
                total_operations=len(self._operations_by_year[year]),
                final_quantity=current_position.total_quantity,
                total_cost_usd=current_position.total_cost_usd,
                average_price_usd=current_position.average_price_usd,
                total_cost_brl=current_position.total_cost_brl,
                average_price_brl=current_position.average_price_brl,
                gross_profit_brl=current_position.gross_profit_brl
            )
            self._yearly_summaries.append(yearly_summary)
            
            print_portfolio_history(portfolio_history)
            print_current_position(current_position)
            previous_state = InitialState(
                quantity=current_position.total_quantity,
                total_cost_usd=current_position.total_cost_usd,
                total_cost_brl=current_position.total_cost_brl,
                average_price_usd=current_position.average_price_usd,
                average_price_brl=current_position.average_price_brl
            )

    def get_transaction_snapshots(self):
        return self._transaction_snapshots

    def get_yearly_summaries(self):
        return self._yearly_summaries

    def _group_operations_by_year(self, operations: List[Operation]) -> dict:
        """
        Groups operations by year and returns a dictionary where keys are years and values are lists of operations.
        """
        operations_by_year = defaultdict(list)
        for operation in operations:
            year = getattr(operation, "date", None)
            if year is not None:
                year = year.year
                operations_by_year[year].append(operation)
        return dict(operations_by_year)
    
import unittest
from datetime import datetime

from data_provider import StaticDataProvider
from initial_state import InitialState
from year_portfolio import YearPortfolio
from operation import VestingOperation, SellOperation
from utils import parse_date


class PortfolioTest(unittest.TestCase):
    def test_init_empty(self):
        with self.assertRaises(ValueError):
            portfolio = YearPortfolio(operations=[])
            portfolio.get_current_position()

    def test_protifolio_with_buy_and_sell(self):
        operations = [
            SellOperation(
                date=parse_date("02/26/2023"),
                quantity=50,
                price=12
            ),
            SellOperation(
                date=parse_date("02/27/2023"),
                quantity=30,
                price=10
            ),             
            VestingOperation(
                date=parse_date("07/01/2023"),
                quantity=100,
                price=20
            ),
            VestingOperation(
                date=parse_date("03/27/2023"),
                quantity=50,
                price=15
            ),      
        ]
        
        portfolio = YearPortfolio(operations=operations,
                              initial_state=InitialState(
                                  quantity=100,
                                  total_cost_usd=1000,
                                  total_cost_brl=5000,
                                  average_price_usd=10,
                                  average_price_brl=50
                              ))
        
        current_position = portfolio.get_current_position()
   
        assert current_position.total_quantity == 170
        assert current_position.total_cost_usd == 2950.0000
        assert current_position.total_cost_brl == 14561.3500
        assert current_position.average_price_usd == 17.3529
        assert current_position.average_price_brl == 85.655
        assert len(portfolio.get_history()) == 5
        assert current_position.gross_profit_brl == 666.2600
        
        # # Mock CurrencyService
        # with mock.patch('portfolio.CurrencyService.get_usd_rates') as mock_get_rates, \
        #      mock.patch('portfolio.CurrencyService.get_ask_price') as mock_get_price:
        #     mock_get_rates.return_value = {'2023-01-01': 5.0, '2023-01-02': 5.1, '2023-01-03': 5.2}
        #     mock_get_price.side_effect = [5.0, 5.1, 5.2]
            
        #     portfolio = Portfolio(operations)
            
        #     assert portfolio.quantity == 7  # 10 + 5 - 8
        #     assert portfolio.total_cost == 700.0  # (10 * 100 + 5 * 110 - 8 * 100)
        #     assert portfolio.total_cost_brl == 3500.0  # 700 * 5.0
        #     assert len(portfolio.history) == 3
        #     assert len(portfolio.proccess_parameter) == 3
    def test_get_current_position_empty(self):
        portfolio = YearPortfolio(operations=[])
        with self.assertRaises(ValueError):
            portfolio.get_current_position() 

import unittest
from datetime import datetime
import unittest.mock as mock

from portfolio import Portfolio
from transaction import BuyTransaction, SellTransaction


class PortfolioTest(unittest.TestCase):
    def test_init_empty(self):
        portfolio = Portfolio()
        assert portfolio.quantity == 0
        assert portfolio.total_cost == 0.0
        assert portfolio.total_cost_brl == 0.0
        assert portfolio.history == []
        assert portfolio.proccess_parameter == []
        assert portfolio.transactions == []

    # def test_init_with_transactions(self):
    #     # Create mock transactions
    #     buy1 = BuyTransaction(date=datetime(2023, 1, 1), quantity=10, price=100.0)
    #     buy2 = BuyTransaction(date=datetime(2023, 1, 2), quantity=5, price=110.0)
    #     sell1 = SellTransaction(date=datetime(2023, 1, 3), quantity=8, price=120.0)
    #     transactions = [buy1, buy2, sell1]
        
    #     # Mock CurrencyService
    #     with mock.patch('portfolio.CurrencyService.get_usd_rates') as mock_get_rates, \
    #          mock.patch('portfolio.CurrencyService.get_ask_price') as mock_get_price:
    #         mock_get_rates.return_value = {'2023-01-01': 5.0, '2023-01-02': 5.1, '2023-01-03': 5.2}
    #         mock_get_price.side_effect = [5.0, 5.1, 5.2]
            
    #         portfolio = Portfolio(transactions)
            
    #         assert portfolio.quantity == 7  # 10 + 5 - 8
    #         assert portfolio.total_cost == 700.0  # (10 * 100 + 5 * 110 - 8 * 100)
    #         assert portfolio.total_cost_brl == 3500.0  # 700 * 5.0
    #         assert len(portfolio.history) == 3
    #         assert len(portfolio.proccess_parameter) == 3

    def test_get_buy_operations_before_sell(self):
        buy1 = BuyTransaction(date=datetime(2023, 1, 1), quantity=10, price=100.0)
        buy2 = BuyTransaction(date=datetime(2023, 1, 2), quantity=5, price=110.0)
        sell1 = SellTransaction(date=datetime(2023, 1, 3), quantity=8, price=120.0)
        transactions = [buy1, buy2, sell1]
        
        with mock.patch('portfolio.CurrencyService.get_usd_rates') as mock_get_rates, \
             mock.patch('portfolio.CurrencyService.get_ask_price') as mock_get_price:
            mock_get_rates.return_value = {'2023-01-01': 5.0, '2023-01-02': 5.1, '2023-01-03': 5.2}
            mock_get_price.side_effect = [5.0, 5.1, 5.2]
            
            portfolio = Portfolio(transactions)
            result = portfolio.get_buy_operations_before_sell()
            
            assert sell1 in result
            prior_buys, sell_rate = result[sell1]
            assert len(prior_buys) == 2
            assert prior_buys[0][0] == buy1
            assert prior_buys[1][0] == buy2
            assert sell_rate == 5.2

    def test_get_current_position(self):
        buy1 = BuyTransaction(date=datetime(2023, 1, 1), quantity=10, price=100.0)
        transactions = [buy1]
        
        with mock.patch('portfolio.CurrencyService.get_usd_rates') as mock_get_rates, \
             mock.patch('portfolio.CurrencyService.get_ask_price') as mock_get_price:
            mock_get_rates.return_value = {'2023-01-01': 5.0}
            mock_get_price.return_value = 5.0
            
            portfolio = Portfolio(transactions)
            current_position = portfolio.get_current_position()
            
            assert current_position.quantity == 10
            assert current_position.total_cost == 1000.0
            assert current_position.average_price == 100.0
            assert current_position.total_cost_brl == 5000.0
            assert current_position.average_price_brl == 500.0

    def test_get_current_position_empty(self):
        portfolio = Portfolio()
        with self.assertRaises(ValueError):
            portfolio.get_current_position() 
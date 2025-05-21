from datetime import datetime, timedelta
from bcb import currency

DAYS_BACK = 7
INDEX_ASK = ("USD", "ask")
class CurrencyService:
    @staticmethod
    def get_ask_price(transaction_date: datetime, x) -> float:
        current_date = transaction_date
        for _ in range(DAYS_BACK):  # Try up to 7 days back
            date_str = current_date.strftime("%Y-%m-%d")
            if (date_str) in x.index:
                return x.loc[date_str, INDEX_ASK]
            current_date -= timedelta(days=1)
        return None

    @staticmethod
    def get_usd_rates(min_date: datetime, max_date: datetime):
        
        min_date = (min_date - timedelta(days=DAYS_BACK)).strftime("%Y-%m-%d")
        max_date = max_date.strftime("%Y-%m-%d")
        return currency._get_symbol("USD", min_date, max_date) 
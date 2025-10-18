"""
Infrastructure adapters for exchange rate services.

This module contains concrete implementations of exchange rate services
that integrate with external APIs and data sources.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
import logging

from ..domain.entities import ExchangeRate
from ..domain.services import ExchangeRateService

logger = logging.getLogger(__name__)


class BCBExchangeRateService(ExchangeRateService):
    """
    Exchange rate service using Brazil's Central Bank (BCB) API.
    
    This service fetches USD/BRL exchange rates from the Brazilian Central Bank
    with automatic fallback for weekends and holidays.
    """
    
    FALLBACK_DAYS = 7
    
    def __init__(self):
        """Initialize the BCB exchange rate service."""
        try:
            from bcb import currency
            self._bcb_currency = currency
        except ImportError:
            raise ImportError(
                "python-bcb package is required for BCB exchange rate service. "
                "Install with: pip install python-bcb"
            )
    
    def get_rate(self, from_currency: str, to_currency: str, date: datetime) -> Optional[ExchangeRate]:
        """
        Get exchange rate from BCB API with fallback logic.
        
        Args:
            from_currency: Source currency (must be 'USD')
            to_currency: Target currency (must be 'BRL')
            date: Date for which to get the rate
            
        Returns:
            ExchangeRate object or None if not found
            
        Raises:
            ValueError: If currency pair is not supported
        """
        if from_currency != 'USD' or to_currency != 'BRL':
            raise ValueError(f"Unsupported currency pair: {from_currency}/{to_currency}")
        
        # Try to get rate for the exact date, then fallback up to FALLBACK_DAYS
        for days_back in range(self.FALLBACK_DAYS + 1):
            try_date = date - timedelta(days=days_back)
            
            try:
                rate_data = self._fetch_rate_from_bcb(try_date)
                if rate_data is not None:
                    logger.info(f"Found USD/BRL rate for {try_date}: {rate_data}")
                    return ExchangeRate(
                        from_currency='USD',
                        to_currency='BRL',
                        rate=Decimal(str(rate_data)),
                        date=try_date
                    )
            except Exception as e:
                logger.debug(f"Failed to fetch rate for {try_date}: {e}")
                continue
        
        logger.warning(f"Could not find USD/BRL rate for {date} (tried {self.FALLBACK_DAYS} days back)")
        return None
    
    def _fetch_rate_from_bcb(self, date: datetime) -> Optional[float]:
        """
        Fetch exchange rate from BCB API for a specific date.
        
        Args:
            date: Date to fetch rate for
            
        Returns:
            Exchange rate as float or None if not available
        """
        try:
            # Get rate data for a single day plus one day
            start_date = date.strftime("%Y-%m-%d")
            end_date = (date + timedelta(days=1)).strftime("%Y-%m-%d")
            
            rates_df = self._bcb_currency._get_symbol("USD", start_date, end_date)
            
            if rates_df is not None and not rates_df.empty:
                date_str = date.strftime("%Y-%m-%d")
                if date_str in rates_df.index:
                    # Use 'ask' price (selling rate)
                    return rates_df.loc[date_str, ('USD', 'ask')]
            
            return None
            
        except Exception as e:
            logger.debug(f"BCB API error for {date}: {e}")
            return None


class MockExchangeRateService(ExchangeRateService):
    """
    Mock exchange rate service for testing.
    
    This service returns fixed exchange rates for testing purposes.
    """
    
    def __init__(self, default_rate: float = 5.0):
        """
        Initialize mock service with a default rate.
        
        Args:
            default_rate: Default USD/BRL exchange rate
        """
        self._default_rate = Decimal(str(default_rate))
    
    def get_rate(self, from_currency: str, to_currency: str, date: datetime) -> Optional[ExchangeRate]:
        """Return a mock exchange rate."""
        if from_currency != 'USD' or to_currency != 'BRL':
            raise ValueError(f"Unsupported currency pair: {from_currency}/{to_currency}")
        
        return ExchangeRate(
            from_currency='USD',
            to_currency='BRL',
            rate=self._default_rate,
            date=date
        )


class CachedExchangeRateService(ExchangeRateService):
    """
    Cached exchange rate service decorator.
    
    This service wraps another exchange rate service and adds caching
    to reduce API calls and improve performance.
    """
    
    def __init__(self, underlying_service: ExchangeRateService):
        """
        Initialize cached service.
        
        Args:
            underlying_service: The actual exchange rate service to wrap
        """
        self._underlying_service = underlying_service
        self._cache = {}  # Simple in-memory cache
    
    def get_rate(self, from_currency: str, to_currency: str, date: datetime) -> Optional[ExchangeRate]:
        """Get exchange rate with caching."""
        cache_key = (from_currency, to_currency, date.strftime("%Y-%m-%d"))
        
        # Check cache first
        if cache_key in self._cache:
            logger.debug(f"Cache hit for {cache_key}")
            return self._cache[cache_key]
        
        # Fetch from underlying service
        rate = self._underlying_service.get_rate(from_currency, to_currency, date)
        
        # Cache the result (including None results to avoid repeated failed calls)
        self._cache[cache_key] = rate
        logger.debug(f"Cached result for {cache_key}: {rate}")
        
        return rate
    
    def clear_cache(self):
        """Clear the internal cache."""
        self._cache.clear()
        logger.info("Exchange rate cache cleared")

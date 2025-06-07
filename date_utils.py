from datetime import datetime

def parse_date(date_str: str) -> datetime:
    """Parse a date string in MM/DD/YYYY, MM/DD/YY and MM-DD-YYYY format."""
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%m-%d-%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError("Invalid date! Please use MM/DD/YYYY, MM/DD/YY or MM-DD-YYYY format.")

def format_date(date: datetime) -> str:
    """Format a datetime object to DD/MM/YYYY string."""
    return date.strftime("%d/%m/%Y") 
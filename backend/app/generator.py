import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List

USERS = [
    {"user_id": "USR-1001", "account_id": "ACC-9821-A", "default_loc": "New York, USA"},
    {"user_id": "USR-1002", "account_id": "ACC-4412-B", "default_loc": "San Francisco, USA"},
    {"user_id": "USR-1003", "account_id": "ACC-7833-C", "default_loc": "London, UK"},
    {"user_id": "USR-1004", "account_id": "ACC-1290-D", "default_loc": "Toronto, Canada"},
    {"user_id": "USR-1005", "account_id": "ACC-5561-E", "default_loc": "Sydney, Australia"},
    {"user_id": "USR-1006", "account_id": "ACC-6729-F", "default_loc": "Berlin, Germany"},
    {"user_id": "USR-1007", "account_id": "ACC-8914-G", "default_loc": "Singapore, SG"},
    {"user_id": "USR-1008", "account_id": "ACC-3310-H", "default_loc": "Tokyo, Japan"}
]

MERCHANTS = {
    "Groceries & Supermarket": ["Whole Foods Market", "Trader Joe's", "Walmart Supercenter", "Kroger"],
    "Dining & Restaurants": ["Starbucks Coffee", "Chipotle Mexican Grill", "Uber Eats", "Olive Garden"],
    "Electronics & Tech": ["Apple Store", "Amazon.com", "Best Buy", "Newegg Tech"],
    "Travel & Airlines": ["Delta Air Lines", "Airbnb Inc", "Uber Rides", "Booking.com"],
    "Cryptocurrency Exchange": ["Binance Global", "Coinbase Pro", "Kraken Exchange", "Crypto.com"],
    "Online Casino / Gambling": ["VegasBet Online", "Stake Casino", "Royal Poker Club", "SpinWin 777"],
    "Wire Transfer Service": ["Western Union Wire", "MoneyGram Direct", "Ria Money Transfer"],
    "Luxury Jewelry": ["Cartier Boutique", "Tiffany & Co.", "Rolex Watch Center"]
}

HIGH_RISK_LOCATIONS = [
    "Cayman Islands", "Nigeria", "Russia", "North Korea", "Unknown / Tor Proxy", "Seychelles", "Panama"
]

DEVICE_TYPES = ["iOS Mobile", "Android Mobile", "MacOS Desktop", "Windows PC", "API Bot"]

def generate_transaction(scenario: str = "RANDOM", user_index: int = None) -> Dict[str, Any]:
    user = USERS[user_index] if user_index is not None and 0 <= user_index < len(USERS) else random.choice(USERS)
    
    txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
    now = datetime.utcnow()
    
    # Defaults
    category = random.choice(list(MERCHANTS.keys())[:4]) # Normal categories
    merchant = random.choice(MERCHANTS[category])
    amount = round(random.uniform(5.50, 480.00), 2)
    location = user["default_loc"]
    device = random.choice(DEVICE_TYPES[:4])
    ip_address = f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}"
    
    if scenario == "HIGH_AMOUNT":
        category = random.choice(["Luxury Jewelry", "Electronics & Tech", "Travel & Airlines"])
        merchant = random.choice(MERCHANTS[category])
        amount = round(random.uniform(9500.00, 24500.00), 2)
        
    elif scenario == "VELOCITY_SPIKE":
        # Targeted to a single account with rapid small/medium hits
        category = "Electronics & Tech"
        merchant = "Apple Store Online"
        amount = round(random.uniform(850.00, 2500.00), 2)
        
    elif scenario == "FOREIGN_LOCATION":
        location = random.choice(HIGH_RISK_LOCATIONS)
        ip_address = f"185.{random.randint(10, 240)}.{random.randint(10, 240)}.{random.randint(1, 254)}"
        category = random.choice(["Cryptocurrency Exchange", "Wire Transfer Service"])
        merchant = random.choice(MERCHANTS[category])
        amount = round(random.uniform(3200.00, 8900.00), 2)
        
    elif scenario == "OFF_HOURS_SPIKE":
        # Force off-hours 02:30 AM
        now = now.replace(hour=2, minute=random.randint(10, 50))
        category = "Online Casino / Gambling"
        merchant = random.choice(MERCHANTS[category])
        amount = 9999.00 # Structuring round amount
        device = "API Bot"

    elif scenario == "RANDOM":
        # 75% chance normal, 25% chance various anomaly types
        roll = random.random()
        if roll > 0.88:
            return generate_transaction("HIGH_AMOUNT", user_index)
        elif roll > 0.76:
            return generate_transaction("FOREIGN_LOCATION", user_index)
        elif roll > 0.68:
            return generate_transaction("OFF_HOURS_SPIKE", user_index)

    return {
        "transaction_id": txn_id,
        "user_id": user["user_id"],
        "account_id": user["account_id"],
        "amount": amount,
        "currency": "USD",
        "merchant": merchant,
        "category": category,
        "location": location,
        "ip_address": ip_address,
        "device_type": device,
        "timestamp": now.isoformat()
    }

def generate_velocity_burst(count: int = 4) -> List[Dict[str, Any]]:
    """Generates an intentional burst of rapid transactions for a single user to trigger velocity rules"""
    user = random.choice(USERS)
    results = []
    base_time = datetime.utcnow()
    
    for i in range(count):
        txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
        amount = round(random.uniform(700.00, 1800.00), 2)
        results.append({
            "transaction_id": txn_id,
            "user_id": user["user_id"],
            "account_id": user["account_id"],
            "amount": amount,
            "currency": "USD",
            "merchant": "Apple Store Digital",
            "category": "Electronics & Tech",
            "location": user["default_loc"],
            "ip_address": "198.51.100.42",
            "device_type": "MacOS Desktop",
            "timestamp": (base_time + timedelta(seconds=i * 2)).isoformat()
        })
    return results

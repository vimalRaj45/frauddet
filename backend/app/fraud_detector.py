import time
from collections import defaultdict
from typing import Dict, List, Tuple
from datetime import datetime
from app.ip_geo_service import lookup_ip_geolocation

class FraudDetector:
    def __init__(self):
        # Sliding window memory for account velocity: account_id -> list of timestamps
        self.account_history = defaultdict(list)
        # Account last seen location: account_id -> location
        self.account_last_location: Dict[str, str] = {}
        
        # High-risk / unusual regions list
        self.high_risk_locations = {
            "Cayman Islands", "Nigeria", "Russia", "North Korea", 
            "Unknown / Tor Proxy", "Seychelles", "Panama", "Unknown"
        }
        
        # High-risk merchant categories
        self.high_risk_categories = {
            "Cryptocurrency Exchange", "Online Casino / Gambling", 
            "Wire Transfer Service", "Luxury Jewelry"
        }

    def evaluate(self, txn_data: dict) -> Tuple[int, str, List[str]]:
        """
        Evaluates a transaction dictionary and returns:
        (risk_score: int [0-100], status: str, fraud_reasons: List[str])
        """
        risk_score = 0
        reasons = []
        
        account_id = txn_data.get("account_id", "ACC-UNKNOWN")
        amount = float(txn_data.get("amount", 0.0))
        location = txn_data.get("location", "New York, USA")
        category = txn_data.get("category", "General Retail")
        ip_address = txn_data.get("ip_address", "127.0.0.1")
        
        raw_ts = txn_data.get("timestamp")
        if isinstance(raw_ts, str):
            try:
                txn_time = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            except Exception:
                txn_time = datetime.utcnow()
        elif isinstance(raw_ts, datetime):
            txn_time = raw_ts
        else:
            txn_time = datetime.utcnow()
            
        current_epoch = txn_time.timestamp()

        # ----------------------------------------------------
        # 1. IP Geolocation & Proxy / VPN Inspection
        # ----------------------------------------------------
        geo_info = lookup_ip_geolocation(ip_address)
        if geo_info.get("is_proxy") or geo_info.get("is_hosting"):
            risk_score += 25
            reasons.append(f"Proxy / VPN / Hosting Datacenter IP Detected: {ip_address} ({geo_info.get('country', 'Unknown')}) (+25)")

        ip_country = geo_info.get("country", "")
        if ip_country and ip_country not in ["Local / Private Network", "Unknown"]:
            # If IP country is significantly different from claimed transaction location string
            if ip_country.lower() not in location.lower() and not any(loc_part in location.lower() for loc_part in ["usa", "us", "uk", "internal"]):
                risk_score += 25
                reasons.append(f"IP Geo-Mismatch: IP originates from '{geo_info.get('resolved_location')}' but claimed '{location}' (+25)")

        # ----------------------------------------------------
        # 2. High Transaction Amount Check
        # ----------------------------------------------------
        if amount >= 10000:
            risk_score += 50
            reasons.append(f"Critical High Amount: ${amount:,.2f} exceeds $10,000 threshold (+50)")
        elif amount >= 5000:
            risk_score += 30
            reasons.append(f"High Amount: ${amount:,.2f} exceeds $5,000 threshold (+30)")
        elif amount >= 2500 and category in self.high_risk_categories:
            risk_score += 25
            reasons.append(f"Elevated Amount in High-Risk Category ({category}): ${amount:,.2f} (+25)")

        # ----------------------------------------------------
        # 3. Velocity Check (Too many transactions in short time)
        # ----------------------------------------------------
        timestamps = self.account_history[account_id]
        recent_timestamps = [t for t in timestamps if current_epoch - t <= 60]
        recent_timestamps.append(current_epoch)
        self.account_history[account_id] = recent_timestamps

        if len(recent_timestamps) >= 4:
            risk_score += 45
            reasons.append(f"High Velocity Spike: {len(recent_timestamps)} transactions in 60 seconds (+45)")
        elif len(recent_timestamps) == 3:
            risk_score += 30
            reasons.append(f"Velocity Anomaly: 3 transactions in 60 seconds (+30)")

        # ----------------------------------------------------
        # 4. Unusual / High-Risk Location & Impossible Travel
        # ----------------------------------------------------
        if any(hr_loc.lower() in location.lower() for hr_loc in self.high_risk_locations):
            risk_score += 35
            reasons.append(f"High-Risk Jurisdiction Detected: {location} (+35)")
        
        last_loc = self.account_last_location.get(account_id)
        if last_loc and last_loc != location:
            if len(recent_timestamps) > 1:
                risk_score += 30
                reasons.append(f"Impossible Travel: Rapid location change from '{last_loc}' to '{location}' (+30)")
        self.account_last_location[account_id] = location

        # ----------------------------------------------------
        # 5. Unusual Transaction Timing & Structuring
        # ----------------------------------------------------
        if 1 <= txn_time.hour <= 4:
            risk_score += 15
            reasons.append(f"Off-Hours Activity: Night window ({txn_time.strftime('%H:%M')} UTC) (+15)")

        if amount >= 1000 and (amount % 500 == 0 or (10000 - amount) in [1, 5, 10]):
            risk_score += 10
            reasons.append(f"Structuring Pattern: Suspicious threshold-skirting amount ${amount:,.2f} (+10)")

        # Cap score at 100
        risk_score = min(100, risk_score)

        # Classification
        if risk_score >= 70:
            status = "FRAUD"
        elif risk_score >= 40:
            status = "SUSPICIOUS"
        else:
            status = "NORMAL"

        return risk_score, status, reasons

# Singleton detector instance
fraud_detector = FraudDetector()

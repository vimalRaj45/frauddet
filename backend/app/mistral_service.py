import json
import logging
import requests
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("fraud_detector.mistral_ai")

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

class MistralAIService:
    def __init__(self):
        self.api_key = settings.MISTRAL_API_KEY
        self.model = settings.MISTRAL_MODEL or "mistral-small-latest"

    def analyze_transaction(self, txn_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends transaction details and rule engine triggers to Mistral AI
        for deep forensic reasoning, threat categorization, and remediation recommendations.
        """
        if not self.api_key:
            return {
                "summary": "Mistral AI API key not configured.",
                "threat_level": "UNKNOWN",
                "modus_operandi": "N/A",
                "recommended_action": "Manual review",
                "confidence_score": 0
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        system_prompt = (
            "You are an expert FinTech Forensic Fraud Investigator and CISO AI Analyst. "
            "Analyze financial transactions with risk scores, identify fraud patterns (e.g. Card-Not-Present, Account Takeover, Structuring, Money Laundering, Rapid Velocity, Geo-Spoofing), "
            "and output actionable recommendations in strict JSON format."
        )

        user_prompt = f"""
Analyze the following transaction flagged by the rule engine:

Transaction ID: {txn_data.get('transaction_id')}
User ID: {txn_data.get('user_id')}
Account ID: {txn_data.get('account_id')}
Amount: ${txn_data.get('amount')} {txn_data.get('currency', 'USD')}
Merchant: {txn_data.get('merchant')}
Category: {txn_data.get('category')}
Location: {txn_data.get('location')}
Device: {txn_data.get('device_type')}
IP Address: {txn_data.get('ip_address')}
Engine Risk Score: {txn_data.get('risk_score', 0)}/100
Engine Status: {txn_data.get('status')}
Triggered Reasons: {txn_data.get('fraud_reasons', 'None')}

Provide your response as a valid JSON object with the following keys:
{{
  "threat_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "Concise 2-sentence executive forensic assessment",
  "modus_operandi": "Identified attack vector or explanation of suspicious behavior",
  "recommended_action": "Specific remediation (e.g., 'Immediate Card Freeze & Step-up MFA', 'Whitelist & Release Hold', 'Request ID Proof')",
  "risk_factors": ["key bullet 1", "key bullet 2", "key bullet 3"],
  "compliance_note": "Short regulatory / AML / SAR filing guidance if applicable"
}}
"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(MISTRAL_API_URL, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                raw_content = response.json()["choices"][0]["message"]["content"]
                # Parse JSON
                try:
                    result = json.loads(raw_content)
                    result["model_used"] = self.model
                    return result
                except Exception:
                    return {
                        "threat_level": txn_data.get("status", "EVALUATED"),
                        "summary": raw_content,
                        "modus_operandi": "Rule engine violation",
                        "recommended_action": "Verify with cardholder",
                        "risk_factors": [txn_data.get("fraud_reasons", "Flagged transaction")],
                        "model_used": self.model
                    }
            else:
                logger.error(f"Mistral API Error {response.status_code}: {response.text}")
                return {
                    "threat_level": "ERROR",
                    "summary": f"Mistral API error {response.status_code}",
                    "modus_operandi": "API call failed",
                    "recommended_action": "Fallback to rule engine classification",
                    "risk_factors": []
                }
        except Exception as e:
            logger.error(f"Mistral request exception: {e}")
            return {
                "threat_level": "ERROR",
                "summary": f"Could not reach Mistral AI: {str(e)}",
                "modus_operandi": "Network error",
                "recommended_action": "Review locally",
                "risk_factors": []
            }

    def generate_portfolio_summary(self, stats: Dict[str, Any]) -> str:
        """Generates a high-level CISO daily executive threat briefing from stats"""
        if not self.api_key:
            return "Mistral AI API key not configured."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        prompt = f"""
Act as a FinTech Chief Risk Officer. Generate a concise 3-bullet executive summary of the current fraud landscape based on these real-time metrics:

Total Transactions: {stats.get('total_transactions', 0)}
Normal Transactions: {stats.get('normal_count', 0)}
Suspicious Transactions: {stats.get('suspicious_count', 0)}
Critical Fraud Transactions: {stats.get('fraud_count', 0)}
Total Volume Processed: ${stats.get('total_volume_usd', 0):,.2f}
Total Flagged Fraud Volume: ${stats.get('flagged_volume_usd', 0):,.2f}
Average Risk Score: {stats.get('average_risk_score', 0)}/100
Current Fraud Rate: {stats.get('fraud_rate_percentage', 0)}%

Provide 3 bullet points:
1. Operational Health & Attack Pressure
2. High Risk Exposure & Capital at Risk
3. Strategic Defensive Recommendations
"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a concise FinTech Risk Officer."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 300
        }

        try:
            response = requests.post(MISTRAL_API_URL, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            return "Unable to generate portfolio brief at this time."
        except Exception as e:
            return f"Error: {e}"

mistral_ai_service = MistralAIService()

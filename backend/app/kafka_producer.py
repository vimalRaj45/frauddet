import json
import logging
import os
import requests
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("fraud_detector.kafka_producer")
logging.getLogger("kafka").setLevel(logging.WARNING)

class KafkaProducerClient:
    def __init__(self):
        self.connected = False
        self.is_rest_mode = False
        self.rest_url = None
        self.rest_auth = None
        self.native_producer = None
        self._init_producer()

    def _init_producer(self):
        # 1. Check if configured as Aiven Kafka REST (Port 23485 or https / user-password)
        if settings.KAFKA_SASL_USERNAME and settings.KAFKA_SASL_PASSWORD and settings.KAFKA_BOOTSTRAP_SERVERS:
            host_clean = settings.KAFKA_BOOTSTRAP_SERVERS.replace("https://", "").replace("http://", "").split("/")[0]
            self.rest_url = f"https://{host_clean}/topics/{settings.KAFKA_TOPIC}"
            self.rest_auth = (settings.KAFKA_SASL_USERNAME, settings.KAFKA_SASL_PASSWORD)
            
            # Test REST handshake
            try:
                test_res = requests.get(f"https://{host_clean}/topics", auth=self.rest_auth, timeout=5)
                if test_res.status_code == 200:
                    self.is_rest_mode = True
                    self.connected = True
                    logger.info(f"Connected to Aiven Kafka REST Proxy at https://{host_clean}")
                    return
            except Exception as e:
                logger.info(f"Aiven Kafka REST handshake note: {e}")

        # 2. Fallback to Native Kafka Protocol if certificates or native broker specified
        try:
            from kafka import KafkaProducer
            import certifi
            kwargs = {
                "bootstrap_servers": [s.strip() for s in settings.KAFKA_BOOTSTRAP_SERVERS.split(",")],
                "value_serializer": lambda v: json.dumps(v).encode("utf-8"),
                "key_serializer": lambda k: k.encode("utf-8") if k else None,
                "request_timeout_ms": 4000,
                "max_block_ms": 3000,
                "api_version": (2, 8, 1),
                "retries": 1
            }

            protocol = settings.KAFKA_SECURITY_PROTOCOL.upper()
            if protocol in ["SSL", "SASL_SSL"]:
                kwargs["security_protocol"] = protocol
                if settings.KAFKA_SSL_CAFILE and os.path.exists(settings.KAFKA_SSL_CAFILE):
                    kwargs["ssl_cafile"] = settings.KAFKA_SSL_CAFILE
                else:
                    kwargs["ssl_cafile"] = certifi.where()

                if settings.KAFKA_SSL_CERTFILE and os.path.exists(settings.KAFKA_SSL_CERTFILE):
                    kwargs["ssl_certfile"] = settings.KAFKA_SSL_CERTFILE
                if settings.KAFKA_SSL_KEYFILE and os.path.exists(settings.KAFKA_SSL_KEYFILE):
                    kwargs["ssl_keyfile"] = settings.KAFKA_SSL_KEYFILE

            self.native_producer = KafkaProducer(**kwargs)
            self.connected = True
            logger.info("Connected to Native Kafka Broker.")
        except Exception:
            self.native_producer = None
            self.connected = False

    def send_transaction(self, txn_data: Dict[str, Any]) -> bool:
        """Publishes transaction to Aiven Kafka via REST or Native Kafka"""
        # REST Proxy delivery
        if self.is_rest_mode and self.rest_url:
            try:
                headers = {"Content-Type": "application/vnd.kafka.json.v2+json"}
                payload = {
                    "records": [
                        {
                            "key": txn_data.get("account_id"),
                            "value": txn_data
                        }
                    ]
                }
                res = requests.post(self.rest_url, auth=self.rest_auth, headers=headers, json=payload, timeout=4)
                if res.status_code in [200, 204]:
                    logger.info(f"Published txn {txn_data.get('transaction_id')} to Aiven Kafka topic '{settings.KAFKA_TOPIC}' via REST")
                    return True
                elif res.status_code == 404:
                    logger.warning(f"Kafka topic '{settings.KAFKA_TOPIC}' does not exist yet on Aiven. Please create topic in Aiven Console.")
                    return False
            except Exception as e:
                logger.warning(f"Aiven Kafka REST send error: {e}")
                return False

        # Native Kafka delivery
        if self.native_producer and self.connected:
            try:
                future = self.native_producer.send(
                    settings.KAFKA_TOPIC,
                    key=txn_data.get("account_id", ""),
                    value=txn_data
                )
                self.native_producer.flush(timeout=2)
                record_metadata = future.get(timeout=2)
                logger.info(f"Published txn {txn_data.get('transaction_id')} to Kafka topic {record_metadata.topic}")
                return True
            except Exception:
                return False

        return False

    def close(self):
        if self.native_producer:
            try:
                self.native_producer.close()
            except Exception:
                pass

kafka_producer_client = KafkaProducerClient()

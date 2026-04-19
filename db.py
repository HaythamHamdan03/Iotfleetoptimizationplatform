"""
MongoDB connection + collection helpers.
Call get_db() anywhere to get the database handle.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        uri = os.environ.get("MONGO_URI", "")
        if not uri:
            raise RuntimeError(
                "MONGO_URI is not set. Open .env and paste your MongoDB Atlas connection string."
            )
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    return _client


def get_db():
    db_name = os.environ.get("MONGO_DB", "fleet_optimizer")
    return get_client()[db_name]


# ── Convenience accessors ──────────────────────────────────────────────────────

def areas_col():
    return get_db()["areas"]

def vehicles_col():
    return get_db()["vehicles"]

def depot_col():
    return get_db()["depot"]

def config_col():
    return get_db()["optimization_config"]

def runs_col():
    return get_db()["optimization_runs"]

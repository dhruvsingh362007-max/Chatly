"""
ParkWise AI - Database Management Module
Handles SQLite connection lifecycle, request-scoped connections,
schema initialization, and foreign key constraints.
"""

import os
import sqlite3
from typing import Optional
from flask import g, has_app_context

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'parkwise.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """
    Returns a newly opened SQLite connection with foreign keys enabled
    and row factory set to sqlite3.Row for dict-like access.
    """
    target_path = db_path or DATABASE_PATH
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def get_db(db_path: Optional[str] = None) -> sqlite3.Connection:
    """
    Returns the request-scoped database connection if running within
    a Flask app context, otherwise creates a standalone connection.
    """
    target_path = db_path or DATABASE_PATH
    if has_app_context():
        if 'db' not in g:
            g.db = get_db_connection(target_path)
        return g.db
    return get_db_connection(target_path)


def init_db(db_path: Optional[str] = None, schema_file: Optional[str] = None) -> None:
    """
    Applies the schema.sql DDL to create tables and indexes.
    """
    schema_to_run = schema_file or SCHEMA_PATH
    if not os.path.exists(schema_to_run):
        raise FileNotFoundError(f"Schema file not found at: {schema_to_run}")

    with open(schema_to_run, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.executescript(schema_sql)
    finally:
        conn.close()

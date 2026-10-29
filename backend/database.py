
import os
import pyodbc



CONNECTION_STRING = os.getenv(
    "PROJECT_ATLAS_CONNECTION_STRING",
    (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        "SERVER=localhost;"
        "DATABASE=ProjectAtlas;"
        "Trusted_Connection=yes;"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
    )
)

def get_connection():
    return pyodbc.connect(
        CONNECTION_STRING,
        timeout=5
    )

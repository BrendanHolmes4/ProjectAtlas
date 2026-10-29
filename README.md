
# Project Atlas

### Enterprise Inventory Management System

Project Atlas is a full-stack inventory management application built to demonstrate enterprise software engineering, database development, API design, and modern frontend development.

## Technology Stack

- Frontend: React, TypeScript, Vite
- Backend: Python, FastAPI, Pydantic
- Database: Microsoft SQL Server
- Database Connectivity: pyodbc
- Testing: pytest, FastAPI TestClient
- Development Tools: Visual Studio Code, SQL Server Management Studio, Git

## Key Features

### Inventory Dashboard
- Company-wide inventory KPIs
- Warehouse performance metrics
- Inventory valuation
- Reorder alerts
- Inventory availability reporting

### Inventory Management
- Receive inventory
- Ship inventory
- Adjust inventory quantities
- Warehouse and product selection
- Transaction reference tracking
- Adjustment reason documentation

### Inventory Reporting
- Search inventory by SKU or product
- Filter inventory by warehouse
- Filter inventory by stock status
- View transaction history
- Filter transaction history by type

### Backend Architecture
- REST API built with FastAPI
- SQL Server stored procedures
- Parameterized SQL queries
- Pydantic request validation
- Transaction audit history
- Duplicate transaction protection

## Automated Testing

Project Atlas includes 13 passing automated backend tests covering:

- API request validation
- Database error handling
- Inventory filtering
- Successful receipt processing
- Successful shipment processing
- Successful inventory adjustments

Database interactions are mocked in applicable tests to prevent changes to live inventory data.

## Architecture

React + TypeScript
        |
        v
FastAPI REST API
        |
        v
Python / pyodbc
        |
        v
Microsoft SQL Server
        |
        v
Stored Procedures + Inventory Tables

## Project Status

Core inventory workflows and dashboard functionality are implemented.

Future improvements include authentication, role-based access control, expanded automated testing, deployment, and monitoring.

## Database Setup

Project Atlas uses Microsoft SQL Server for inventory storage,
transaction processing, and reporting.

### Requirements

- Microsoft SQL Server (Developer Edition recommended)
- SQL Server Management Studio (SSMS)
- ODBC Driver 18 for SQL Server

### Installation

1. Open SQL Server Management Studio.
2. Connect to your local SQL Server instance.
3. Create a database named `ProjectAtlas`:

   ```sql
   CREATE DATABASE ProjectAtlas;
   ```

4. Open and execute the following scripts in order:

   - `database/01_schema.sql`
   - `database/02_stored_procedures.sql`
   - `database/03_seed_data.sql`

5. Verify the installation:

   ```sql
   USE ProjectAtlas;

   SELECT COUNT(*) AS WarehouseCount
   FROM dbo.Warehouses;

   SELECT COUNT(*) AS ProductCount
   FROM dbo.Products;

   SELECT COUNT(*) AS InventoryCount
   FROM dbo.Inventory;
   ```

### Expected Sample Data

| Table | Records |
|---|---:|
| Warehouses | 4 |
| Products | 8 |
| Inventory | 32 |

### Inventory Operations

Inventory changes are processed through SQL Server stored
procedures:

- `usp_ReceiveInventory`
- `usp_ShipInventory`
- `usp_AdjustInventory`

These procedures use database transactions, validation,
and audit logging to protect inventory integrity.

### Important

Run the installation scripts against a new, empty database.

Do not rerun the schema or seed scripts against an existing
database containing inventory records.

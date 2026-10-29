
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

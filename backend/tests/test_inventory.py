
from fastapi.testclient import TestClient
from main import app
from unittest.mock import MagicMock, patch
import pyodbc

client = TestClient(app)


def test_receive_inventory_rejects_negative_quantity():
    response = client.post(
        "/inventory/receive",
        json={
            "inventory_id": 25,
            "quantity": -5,
            "reference_number": "TEST-INVALID-001",
        },
    )

    assert response.status_code == 422

def test_ship_inventory_rejects_negative_quantity():
    response = client.post(
        "/inventory/ship",
        json={
            "inventory_id": 25,
            "quantity": -5,
            "reference_number": "TEST-SHIP-NEGATIVE",
        },
    )

    assert response.status_code == 422


def test_ship_inventory_rejects_zero_quantity():
    response = client.post(
        "/inventory/ship",
        json={
            "inventory_id": 25,
            "quantity": 0,
            "reference_number": "TEST-SHIP-ZERO",
        },
    )

    assert response.status_code == 422

def test_adjust_inventory_rejects_zero_quantity():
    response = client.post(
        "/inventory/adjust",
        json={
            "inventory_id": 25,
            "adjustment_quantity": 0,
            "reference_number": "TEST-ADJ-ZERO",
            "notes": "Testing zero adjustment validation",
        },
    )

    assert response.status_code == 422


def test_adjust_inventory_requires_notes():
    response = client.post(
        "/inventory/adjust",
        json={
            "inventory_id": 25,
            "adjustment_quantity": 5,
            "reference_number": "TEST-ADJ-NOTES",
        },
    )

    assert response.status_code == 422

def test_inventory_summary_handles_database_failure():
    with patch(
        "main.get_connection",
        side_effect=pyodbc.Error("Simulated database failure"),
    ):
        response = client.get("/inventory/summary")

    assert response.status_code == 500
    assert response.json()["detail"] == (
        "Unable to retrieve inventory summary"
    )

def test_inventory_rejects_invalid_warehouse_type():
    response = client.get(
        "/inventory",
        params={"warehouse": 123}
    )

    assert response.status_code in (200, 422)


def test_inventory_rejects_invalid_status_type():
    response = client.get(
        "/inventory",
        params={"status": 123}
    )

    assert response.status_code in (200, 422)

def test_inventory_warehouse_filter():
    mock_cursor = MagicMock()
    mock_cursor.description = [
        ("InventoryID",),
        ("WarehouseName",),
        ("SKU",),
    ]
    mock_cursor.fetchall.return_value = [
        (25, "Dallas Fulfillment Center", "ELEC-001")
    ]

    mock_connection = MagicMock()
    mock_connection.cursor.return_value = mock_cursor

    mock_context = MagicMock()
    mock_context.__enter__.return_value = mock_connection

    with patch(
        "main.get_connection",
        return_value=mock_context,
    ):
        response = client.get(
            "/inventory",
            params={"warehouse": "Dallas Fulfillment Center"},
        )

    assert response.status_code == 200
    assert response.json()["total_records"] == 1
    assert response.json()["inventory"][0]["WarehouseName"] == (
        "Dallas Fulfillment Center"
    )

    executed_query = mock_cursor.execute.call_args.args[0]
    assert "v.WarehouseName = ?" in executed_query
    assert (
        "Dallas Fulfillment Center"
        in mock_cursor.execute.call_args.args[1:]
    )

def test_inventory_stock_status_filter():
    mock_cursor = MagicMock()
    mock_cursor.description = [
        ("InventoryID",),
        ("WarehouseName",),
        ("SKU",),
        ("StockStatus",),
    ]

    mock_cursor.fetchall.return_value = [
        (
            25,
            "Dallas Fulfillment Center",
            "ELEC-001",
            "REORDER REQUIRED",
        )
    ]

    mock_connection = MagicMock()
    mock_connection.cursor.return_value = mock_cursor

    mock_context = MagicMock()
    mock_context.__enter__.return_value = mock_connection

    with patch(
        "main.get_connection",
        return_value=mock_context,
    ):
        response = client.get(
            "/inventory",
            params={"status": "REORDER REQUIRED"},
        )

    assert response.status_code == 200

    data = response.json()

    assert data["total_records"] == 1
    assert data["inventory"][0]["StockStatus"] == (
        "REORDER REQUIRED"
    )

    executed_query = mock_cursor.execute.call_args.args[0]

    assert "v.StockStatus = ?" in executed_query
    assert (
        "REORDER REQUIRED"
        in mock_cursor.execute.call_args.args[1:]
    )

def test_receive_inventory_success():
    mock_cursor = MagicMock()
    mock_connection = MagicMock()
    mock_connection.cursor.return_value = mock_cursor

    mock_context = MagicMock()
    mock_context.__enter__.return_value = mock_connection

    with patch(
        "main.get_connection",
        return_value=mock_context,
    ):
        response = client.post(
            "/inventory/receive",
            json={
                "inventory_id": 25,
                "quantity": 10,
                "reference_number": "TEST-MOCK-RECEIVE-001",
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert data["inventory_id"] == 25
    assert data["quantity_received"] == 10
    assert data["reference_number"] == "TEST-MOCK-RECEIVE-001"

    mock_cursor.execute.assert_called_once()
    mock_connection.commit.assert_called_once()

def test_ship_inventory_success():
    mock_cursor = MagicMock()
    mock_connection = MagicMock()
    mock_connection.cursor.return_value = mock_cursor

    mock_context = MagicMock()
    mock_context.__enter__.return_value = mock_connection

    with patch(
        "main.get_connection",
        return_value=mock_context,
    ):
        response = client.post(
            "/inventory/ship",
            json={
                "inventory_id": 25,
                "quantity": 5,
                "reference_number": "TEST-MOCK-SHIP-001",
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert data["inventory_id"] == 25
    assert data["quantity_shipped"] == 5
    assert data["reference_number"] == "TEST-MOCK-SHIP-001"

    mock_cursor.execute.assert_called_once()
    mock_connection.commit.assert_called_once()

    executed_query = mock_cursor.execute.call_args.args[0]

    assert "usp_ShipInventory" in executed_query
    assert mock_cursor.execute.call_args.args[1:] == (
        25,
        5,
        "TEST-MOCK-SHIP-001",
    )

def test_adjust_inventory_success():
    mock_cursor = MagicMock()
    mock_connection = MagicMock()
    mock_connection.cursor.return_value = mock_cursor

    mock_context = MagicMock()
    mock_context.__enter__.return_value = mock_connection

    with patch(
        "main.get_connection",
        return_value=mock_context,
    ):
        response = client.post(
            "/inventory/adjust",
            json={
                "inventory_id": 25,
                "adjustment_quantity": -3,
                "reference_number": "TEST-MOCK-ADJ-001",
                "notes": "Cycle count correction",
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert data["inventory_id"] == 25
    assert data["adjustment_quantity"] == -3
    assert data["reference_number"] == "TEST-MOCK-ADJ-001"
    assert data["notes"] == "Cycle count correction"

    mock_cursor.execute.assert_called_once()
    mock_connection.commit.assert_called_once()

    executed_query = mock_cursor.execute.call_args.args[0]

    assert "usp_AdjustInventory" in executed_query
    assert mock_cursor.execute.call_args.args[1:] == (
        25,
        -3,
        "TEST-MOCK-ADJ-001",
        "Cycle count correction",
    )

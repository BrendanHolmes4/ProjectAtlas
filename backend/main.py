
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection
from pydantic import field_validator
from pydantic import BaseModel, Field
import pyodbc

app = FastAPI(
    title="Project Atlas API",
    description="Enterprise Inventory Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "project": "Project Atlas",
        "status": "running",
        "message": "Inventory Management API is online"
    }




@app.get("/inventory")
def get_inventory(
    warehouse: str | None = None,
    status: str | None = None
):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            query = """
                SELECT
                    i.InventoryID,
                    v.WarehouseName,
                    v.SKU,
                    v.ProductName,
                    v.Category,
                    v.QuantityOnHand,
                    v.QuantityReserved,
                    v.AvailableStock,
                    v.ReorderPoint,
                    v.InventoryValue,
                    v.StockStatus
                FROM dbo.vw_InventoryStatus AS v
                INNER JOIN dbo.Warehouses AS w
                    ON v.WarehouseName = w.WarehouseName
                INNER JOIN dbo.Products AS p
                    ON v.SKU = p.SKU
                INNER JOIN dbo.Inventory AS i
                    ON i.WarehouseID = w.WarehouseID
                    AND i.ProductID = p.ProductID
                WHERE 1 = 1
            """

            parameters = []
            
            if warehouse:
                query += " AND v.WarehouseName = ?"
                parameters.append(warehouse)

            if status:
                query += " AND v.StockStatus = ?"
                parameters.append(status)

            
            query += " ORDER BY v.WarehouseName, v.SKU"

            cursor.execute(query, *parameters)

            columns = [column[0] for column in cursor.description]

            inventory = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]

            return {
                "total_records": len(inventory),
                "inventory": inventory
            }

    except pyodbc.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve inventory from database"
        )

@app.get("/inventory/reorders")
def get_reorders():
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    WarehouseName,
                    SKU,
                    ProductName,
                    AvailableStock,
                    ReorderPoint,
                    ReorderPoint - AvailableStock AS UnitsToReorder,
UnitCost,
CAST(
    (ReorderPoint - AvailableStock) * UnitCost
    AS DECIMAL(14,2)
) AS ReplenishmentCost
                FROM dbo.vw_InventoryStatus
                WHERE StockStatus = 'REORDER REQUIRED'
                ORDER BY WarehouseName, SKU
            """)

            columns = [column[0] for column in cursor.description]

            reorders = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]

        
            return {
                "total_reorder_alerts": len(reorders),
                "total_units_to_reorder": sum(
                    item["UnitsToReorder"] for item in reorders
                ),
                "estimated_replenishment_cost": round(
                    sum(item["ReplenishmentCost"] for item in reorders),
                    2
                ),
                "reorders": reorders
            }

    except pyodbc.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve reorder information"
        )

    except pyodbc.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve inventory from database"
        )

class ReceiveInventoryRequest(BaseModel):
    inventory_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    reference_number: str = Field(
        min_length=1,
        max_length=50,
        pattern=r".*\S.*"
    )


@app.post("/inventory/receive")
def receive_inventory(request: ReceiveInventoryRequest):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                EXEC dbo.usp_ReceiveInventory
                    @InventoryID = ?,
                    @Quantity = ?,
                    @ReferenceNumber = ?
                """,
                request.inventory_id,
                request.quantity,
                request.reference_number
            )

            conn.commit()

            return {
                "status": "success",
                "message": "Inventory received successfully",
                "inventory_id": request.inventory_id,
                "quantity_received": request.quantity,
                "reference_number": request.reference_number
            }

    except pyodbc.Error as error:
        error_message = str(error)

        if "2627" in error_message or "2601" in error_message:
            raise HTTPException(
                status_code=409,
                detail="Duplicate inventory receipt. This reference number has already been processed."
            )

        raise HTTPException(
            status_code=500,
            detail="Unable to receive inventory"
        )


class ShipInventoryRequest(BaseModel):
    inventory_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    reference_number: str = Field(
        min_length=1,
        max_length=50,
        pattern=r".*\S.*"
    )


@app.post("/inventory/ship")
def ship_inventory(request: ShipInventoryRequest):
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                EXEC dbo.usp_ShipInventory
                    @InventoryID = ?,
                    @Quantity = ?,
                    @ReferenceNumber = ?
                """,
                request.inventory_id,
                request.quantity,
                request.reference_number
            )

            conn.commit()

            return {
                "status": "success",
                "message": "Inventory shipped successfully",
                "inventory_id": request.inventory_id,
                "quantity_shipped": request.quantity,
                "reference_number": request.reference_number
            }

    except pyodbc.Error as error:
        error_message = str(error)

        if "2627" in error_message or "2601" in error_message:
            raise HTTPException(
                status_code=409,
                detail="Duplicate inventory shipment. This reference number has already been processed."
            )

        raise HTTPException(
            status_code=500,
            detail="Unable to ship inventory"
        )    
class AdjustInventoryRequest(BaseModel):
    inventory_id: int = Field(gt=0)
    adjustment_quantity: int

    @field_validator("adjustment_quantity")
    @classmethod
    def validate_adjustment_quantity(cls, value: int) -> int:
        if value == 0:
            raise ValueError("Adjustment quantity cannot be zero")
        return value


    reference_number: str = Field(
        min_length=1,
        max_length=50,
        pattern=r".*\S.*"
    )
    notes: str = Field(
        min_length=1,
        max_length=255,
        pattern=r".*\S.*"
    )


@app.post("/inventory/adjust")
def adjust_inventory(request: AdjustInventoryRequest):
    if request.adjustment_quantity == 0:
        raise HTTPException(
            status_code=422,
            detail="Adjustment quantity cannot be zero"
        )

    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                EXEC dbo.usp_AdjustInventory
                    @InventoryID = ?,
                    @AdjustmentQuantity = ?,
                    @ReferenceNumber = ?,
                    @Notes = ?
                """,
                request.inventory_id,
                request.adjustment_quantity,
                request.reference_number,
                request.notes
            )

            conn.commit()

            return {
                "status": "success",
                "message": "Inventory adjusted successfully",
                "inventory_id": request.inventory_id,
                "adjustment_quantity": request.adjustment_quantity,
                "reference_number": request.reference_number,
                "notes": request.notes
            }

    except pyodbc.Error as error:
        error_message = str(error)

        if "2627" in error_message or "2601" in error_message:
            raise HTTPException(
                status_code=409,
                detail="Duplicate inventory adjustment. This reference number has already been processed."
            )

        raise HTTPException(
            status_code=500,
            detail="Unable to adjust inventory"
        )


@app.get("/inventory/transactions")

def get_inventory_transactions(
    inventory_id: int | None = None,
    transaction_type: str | None = None,
    limit: int = 50,
    offset: int = 0
):
    if inventory_id is not None and inventory_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Inventory ID must be greater than zero"
        )

    if transaction_type is not None:
        transaction_type = transaction_type.upper()

        if transaction_type not in (
            "RECEIPT",
            "SHIPMENT",
            "ADJUSTMENT"
        ):
            raise HTTPException(
                status_code=422,
                detail="Transaction type must be RECEIPT, SHIPMENT, or ADJUSTMENT"
            )
    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=422,
            detail="Limit must be between 1 and 500"
        )

    if offset < 0:
        raise HTTPException(
            status_code=422,
            detail="Offset must be zero or greater"
        )
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            query = """
                SELECT
                    t.TransactionID,
                    t.InventoryID,
                    p.SKU,
                    p.ProductName,
                    w.WarehouseName,
                    t.TransactionType,
                    t.Quantity,
                    t.TransactionDate,
                    t.ReferenceNumber,
                    t.Notes,
                    COUNT(*) OVER() AS TotalMatchingRecords
                FROM dbo.InventoryTransactions AS t
                INNER JOIN dbo.Inventory AS i
                    ON t.InventoryID = i.InventoryID
                INNER JOIN dbo.Products AS p
                    ON i.ProductID = p.ProductID
                INNER JOIN dbo.Warehouses AS w
                    ON i.WarehouseID = w.WarehouseID
                WHERE 1 = 1
            """

            parameters = []

            if inventory_id is not None:
                query += " AND t.InventoryID = ?"
                parameters.append(inventory_id)
	    
            if transaction_type:
                query += " AND t.TransactionType = ?"
                parameters.append(transaction_type.upper())
	
            query += """
                ORDER BY t.TransactionDate DESC, t.TransactionID DESC
                OFFSET ? ROWS
                FETCH NEXT ? ROWS ONLY
            """

            parameters.extend([offset, limit])

            cursor.execute(query, *parameters)

            columns = [column[0] for column in cursor.description]

            transactions = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]


            if transactions:
                total_matching_records = transactions[0]["TotalMatchingRecords"]
            else:
                count_query = """
                    SELECT COUNT(*)
                    FROM dbo.InventoryTransactions
                    WHERE 1 = 1
                """

                count_parameters = []

                if inventory_id is not None:
                    count_query += " AND InventoryID = ?"
                    count_parameters.append(inventory_id)

                if transaction_type:
                    count_query += " AND TransactionType = ?"
                    count_parameters.append(transaction_type)

                cursor.execute(count_query, *count_parameters)
                total_matching_records = cursor.fetchone()[0]


            for transaction in transactions:
                transaction.pop("TotalMatchingRecords", None)

            return {
                "total_records": len(transactions),
                "total_matching_records": total_matching_records,
                "limit": limit,
                "offset": offset,
                "has_next_page": (
                    offset + len(transactions) < total_matching_records
                ),
                "transactions": transactions
            }


    except pyodbc.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve inventory transactions"
        )

@app.get("/inventory/summary")
def get_inventory_summary():
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    WarehouseName,
                    COUNT(*) AS TotalProducts,
                    SUM(QuantityOnHand) AS TotalUnitsOnHand,
                    SUM(QuantityReserved) AS TotalUnitsReserved,
                    SUM(AvailableStock) AS TotalUnitsAvailable,
                    SUM(InventoryValue) AS TotalInventoryValue,
                    SUM(
                        CASE
                            WHEN StockStatus = 'REORDER REQUIRED'
                            THEN 1
                            ELSE 0
                        END
                    ) AS ReorderAlerts
                FROM dbo.vw_InventoryStatus
                GROUP BY WarehouseName
                ORDER BY WarehouseName
            """)

            columns = [column[0] for column in cursor.description]

            warehouses = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]

            for warehouse in warehouses:
                on_hand = warehouse["TotalUnitsOnHand"]
                available = warehouse["TotalUnitsAvailable"]

                warehouse["AvailabilityRate"] = round(
                    (available / on_hand) * 100, 2
                ) if on_hand > 0 else 0.0

                reserved = warehouse["TotalUnitsReserved"]

                warehouse["ReservationRate"] = round(
                    (reserved / on_hand) * 100, 2
                ) if on_hand > 0 else 0.0

                total_products = warehouse["TotalProducts"]
                reorder_alerts = warehouse["ReorderAlerts"]

                warehouse["ReorderAlertRate"] = round(
                    (reorder_alerts / total_products) * 100, 2
                ) if total_products > 0 else 0.0

                warehouse["HealthyInventoryRate"] = round(
                    100 - (reorder_alerts / total_products) * 100, 2
                ) if total_products > 0 else 0.0

            company_totals = {
                "total_products": sum(w["TotalProducts"] for w in warehouses),
                "total_units_on_hand": sum(w["TotalUnitsOnHand"] for w in warehouses),
                "total_units_reserved": sum(w["TotalUnitsReserved"] for w in warehouses),
                "total_units_available": sum(w["TotalUnitsAvailable"] for w in warehouses),
                "total_inventory_value": round(
                    sum(w["TotalInventoryValue"] for w in warehouses), 2
                ),
                "total_reorder_alerts": sum(w["ReorderAlerts"] for w in warehouses)
            }

            total_on_hand = company_totals["total_units_on_hand"]
            total_available = company_totals["total_units_available"]

            company_totals["inventory_availability_rate"] = round(
                (total_available / total_on_hand) * 100, 2
            ) if total_on_hand > 0 else 0.0


            total_reserved = company_totals["total_units_reserved"]

            company_totals["inventory_reservation_rate"] = round(
                (total_reserved / total_on_hand) * 100, 2
            ) if total_on_hand > 0 else 0.0

            total_products = company_totals["total_products"]
            total_alerts = company_totals["total_reorder_alerts"]

            company_totals["reorder_alert_rate"] = round(
                (total_alerts / total_products) * 100, 2
            ) if total_products > 0 else 0.0

            company_totals["healthy_inventory_rate"] = round(
                100 - (total_alerts / total_products) * 100, 2
            ) if total_products > 0 else 0.0

            company_totals["warehouses_with_reorder_alerts"] = sum(
                1 for warehouse in warehouses
                if warehouse["ReorderAlerts"] > 0
            )
            return {
                "total_warehouses": len(warehouses),
                "company_totals": company_totals,
                "warehouses": warehouses
            }

    except pyodbc.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve inventory summary"
        )


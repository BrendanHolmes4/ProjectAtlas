
import { useEffect, useState } from 'react'
import './App.css'


type InventoryItem = {
  InventoryID: number
  WarehouseName: string
  SKU: string
  ProductName: string
  Category: string
  QuantityOnHand: number
  QuantityReserved: number
  AvailableStock: number
  ReorderPoint: number
  InventoryValue: number
  StockStatus: string
}

type InventoryResponse = {
  total_records: number
  inventory: InventoryItem[]
}

type InventoryTransaction = {
  TransactionID: number
  InventoryID: number
  SKU: string
  ProductName: string
  WarehouseName: string
  TransactionType: string
  Quantity: number
  TransactionDate: string
  ReferenceNumber: string
  Notes: string | null
}

type TransactionResponse = {
  total_records: number
  total_matching_records: number
  limit: number
  offset: number
  has_next_page: boolean
  transactions: InventoryTransaction[]
}

type WarehouseSummary = {
  WarehouseName: string
  TotalProducts: number
  TotalUnitsOnHand: number
  TotalUnitsReserved: number
  TotalUnitsAvailable: number
  TotalInventoryValue: number
  ReorderAlerts: number
  AvailabilityRate: number
  ReservationRate: number
  ReorderAlertRate: number
  HealthyInventoryRate: number
}

type InventorySummary = {
  total_warehouses: number
  company_totals: {
    total_products: number
    total_units_on_hand: number
    total_units_available: number
    total_inventory_value: number
    total_reorder_alerts: number
  }
  warehouses: WarehouseSummary[]
}



function App() {
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [error, setError] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryError, setInventoryError] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('All Statuses')
  const [receiveWarehouse, setReceiveWarehouse] = useState('')
  const [receiveSKU, setReceiveSKU] = useState('')
  const [receiveQuantity, setReceiveQuantity] = useState('')
  const [receiveReference, setReceiveReference] = useState('')
  const [receiveMessage, setReceiveMessage] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [transactionError, setTransactionError] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('All Types')
  const [shipWarehouse, setShipWarehouse] = useState('')
  const [shipSKU, setShipSKU] = useState('')
  const [shipQuantity, setShipQuantity] = useState('')
  const [shipReference, setShipReference] = useState('')
  const [shipMessage, setShipMessage] = useState('')
  const [isShipping, setIsShipping] = useState(false)
  const [adjustWarehouse, setAdjustWarehouse] = useState('')
  const [adjustSKU, setAdjustSKU] = useState('')
  const [adjustQuantity, setAdjustQuantity] = useState('')
  const [adjustReference, setAdjustReference] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjustMessage, setAdjustMessage] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const selectedReceiveInventory = inventory.find(
    (item) =>
      item.WarehouseName === receiveWarehouse &&
      item.SKU === receiveSKU
)
  const selectedShipInventory = inventory.find(
    (item) =>
      item.WarehouseName === shipWarehouse &&
      item.SKU === shipSKU
)

  const selectedAdjustInventory = inventory.find(
    (item) =>
      item.WarehouseName === adjustWarehouse &&
      item.SKU === adjustSKU
)


  useEffect(() => {
    fetch('http://127.0.0.1:8000/inventory/summary')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to retrieve inventory summary')
        }
        return response.json()
      })
      .then((data: InventorySummary) => setSummary(data))
      .catch((err: Error) => setError(err.message))
  }, [refreshKey])
  useEffect(() => {
    fetch('http://127.0.0.1:8000/inventory')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to retrieve product inventory')
        }
        return response.json()
      })
      .then((data: InventoryResponse) => {
        setInventory(data.inventory)
      })
      .catch((err: Error) => {
        setInventoryError(err.message)
      })
  }, [refreshKey])
  
useEffect(() => {
  fetch('http://127.0.0.1:8000/inventory/transactions')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to retrieve transaction history')
      }

      return response.json()
    })
    .then((data: TransactionResponse) => {
      setTransactions(data.transactions)
      setTransactionError('')
    })
    .catch((error: Error) => {
      setTransactionError(error.message)
    })
}, [refreshKey])

  const selectedWarehouseData =
    selectedWarehouse === 'All Warehouses'
      ? null
      : summary?.warehouses.find(
          (warehouse) => warehouse.WarehouseName === selectedWarehouse
        )
  
const filteredInventory = inventory.filter((item) => {
  const matchesWarehouse =
    selectedWarehouse === 'All Warehouses' ||
    item.WarehouseName === selectedWarehouse

  const search = productSearch.trim().toLowerCase()

  const matchesSearch =
    item.SKU.toLowerCase().includes(search) ||
    item.ProductName.toLowerCase().includes(search) ||
    item.Category.toLowerCase().includes(search)

  const matchesStatus =
    stockFilter === 'All Statuses' ||
    item.StockStatus === stockFilter

  return matchesWarehouse && matchesSearch && matchesStatus
})

  const dashboardMetrics = {
    warehouses: selectedWarehouseData ? 1 : (summary?.total_warehouses ?? 0),
    records: selectedWarehouseData?.TotalProducts
      ?? summary?.company_totals.total_products ?? 0,
    onHand: selectedWarehouseData?.TotalUnitsOnHand
      ?? summary?.company_totals.total_units_on_hand ?? 0,
    available: selectedWarehouseData?.TotalUnitsAvailable
      ?? summary?.company_totals.total_units_available ?? 0,
    value: selectedWarehouseData?.TotalInventoryValue
      ?? summary?.company_totals.total_inventory_value ?? 0,
    alerts: selectedWarehouseData?.ReorderAlerts
      ?? summary?.company_totals.total_reorder_alerts ?? 0,
  }

  return (
    <div className="app">
      <header>
        <h1>PROJECT ATLAS</h1>
        <p>Enterprise Inventory Management System</p>
      </header>

      <main>
        <h2>Inventory Overview</h2>

        {error && <p>Error: {error}</p>}

        {!summary && !error && <p>Loading inventory data...</p>}

        
        {summary && (
          <>
          <section>
            
<h3>
  {selectedWarehouse === 'All Warehouses'
    ? 'Company Inventory Overview'
    : `${selectedWarehouse} — Inventory Overview`}
</h3>


        <div className="warehouse-filter">
          <label htmlFor="warehouse-select">Select Warehouse</label>

          <select
            id="warehouse-select"
            value={selectedWarehouse}
            onChange={(event) => setSelectedWarehouse(event.target.value)}
          >
            <option value="All Warehouses">All Warehouses</option>

{summary?.warehouses.map((warehouse) => (
  <option
    key={warehouse.WarehouseName}
    value={warehouse.WarehouseName}
  >
    {warehouse.WarehouseName}
  </option>
))}
          </select>
        </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Total Warehouses</span>
                <strong className="kpi-value">{dashboardMetrics.warehouses}</strong>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Inventory Records</span>
                <strong className="kpi-value">
                  {dashboardMetrics.records}
                </strong>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Units On Hand</span>
                <strong className="kpi-value">
                  {dashboardMetrics.onHand.toLocaleString()}
                </strong>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Available Units</span>
                <strong className="kpi-value">
                  {dashboardMetrics.available.toLocaleString()}
                </strong>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">Inventory Value</span>
                <strong className="kpi-value">
                  {dashboardMetrics.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </strong>
              </div>

              <div className="kpi-card alert-card">
                <span className="kpi-label">Reorder Alerts</span>
                <strong className="kpi-value">
                  {dashboardMetrics.alerts}
                </strong>
              </div>
            </div>
          
    </section>

    <section className="warehouse-section">
      <h3>Warehouse Performance</h3>

      <div className="table-container">
        <table className="warehouse-table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Units On Hand</th>
              <th>Available</th>
              <th>Inventory Value</th>
              <th>Reorder Alerts</th>
              <th>Availability</th>
            </tr>
          </thead>

          <tbody>
            
{summary.warehouses
  .filter(
    (warehouse) =>
      selectedWarehouse === 'All Warehouses' ||
      warehouse.WarehouseName === selectedWarehouse
  )
  .map((warehouse) => (

              <tr key={warehouse.WarehouseName}>
                <td>{warehouse.WarehouseName}</td>
                <td>{warehouse.TotalUnitsOnHand.toLocaleString()}</td>
                <td>{warehouse.TotalUnitsAvailable.toLocaleString()}</td>
                <td>
                  {warehouse.TotalInventoryValue.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  })}
                </td>
                <td>{warehouse.ReorderAlerts}</td>
                <td>{warehouse.AvailabilityRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
    
<section className="warehouse-section">
  <h3>Product Inventory</h3>
    
<div className="product-search">
  <label htmlFor="product-search-input">Search Inventory</label>

  <input
    id="product-search-input"
    type="search"
    placeholder="Search by SKU, product, or category..."
    value={productSearch}
    onChange={(event) => setProductSearch(event.target.value)}
  />
</div>

<div className="warehouse-filter">
  <label htmlFor="stock-filter">Stock Status</label>

  <select
    id="stock-filter"
    value={stockFilter}
    onChange={(event) => setStockFilter(event.target.value)}
  >
    <option value="All Statuses">All Statuses</option>
    <option value="HEALTHY">Healthy</option>
    <option value="REORDER REQUIRED">Reorder Required</option>
  </select>
</div>

  {inventoryError && (
    <p role="alert">Error: {inventoryError}</p>
  )}

  <div className="table-container">
    <table className="warehouse-table">
      <thead>
        <tr>
          <th>Warehouse</th>
          <th>SKU</th>
          <th>Product</th>
          <th>Category</th>
          <th>On Hand</th>
          <th>Reserved</th>
          <th>Available</th>
          <th>Reorder Point</th>
          <th>Status</th>
        </tr>
      </thead>

<tbody>
  {filteredInventory.map((item) => (
              <tr key={`${item.WarehouseName}-${item.SKU}`}>
              <td>{item.WarehouseName}</td>
              <td>{item.SKU}</td>
              <td>{item.ProductName}</td>
              <td>{item.Category}</td>
              <td>{item.QuantityOnHand}</td>
              <td>{item.QuantityReserved}</td>
              <td>{item.AvailableStock}</td>
              <td>{item.ReorderPoint}</td>
              
<td>
  <span
    className={
      item.StockStatus === 'REORDER REQUIRED'
        ? 'stock-badge stock-warning'
        : 'stock-badge stock-healthy'
    }
  >
    {item.StockStatus}
  </span>
</td>

            </tr>
          ))}
      </tbody>
    </table>
  </div>

<button
  type="button"
  className="clear-filters-button"
  onClick={() => {
    setSelectedWarehouse('All Warehouses')
    setProductSearch('')
    setStockFilter('All Statuses')
  }}
>
  Clear Filters
</button>

</section>

<section className="warehouse-section">
  <h3>Receive Inventory</h3>
  <p>Record incoming stock at a warehouse.</p>

  
<form
  className="inventory-form"
  onSubmit={async (event) => {
    event.preventDefault()

    if (isReceiving) return

    setReceiveMessage('')

    if (!selectedReceiveInventory) {
      setReceiveMessage('Please select a valid warehouse and product.')
      return
    }

    const quantity = Number(receiveQuantity)
    const reference = receiveReference.trim()

    if (!Number.isSafeInteger(quantity) || quantity <= 0 || !reference || reference.length > 50) {
      setReceiveMessage('Enter a positive whole-number quantity and a reference of 1–50 characters.')
      return
    }

    setIsReceiving(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/inventory/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory_id: selectedReceiveInventory.InventoryID,
          quantity,
          reference_number: reference,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof result.detail === 'string'
            ? result.detail
            : 'Unable to receive inventory'
        )
      }

      setReceiveMessage(result.message || 'Inventory received successfully')
      setRefreshKey((current) => current + 1)
      setReceiveQuantity('')
      setReceiveReference('')
    } catch (error) {
      setReceiveMessage(
        error instanceof Error ? error.message : 'Transaction failed'
      )
    } finally {
      setIsReceiving(false)
    }
  }}
>

    <div className="form-field">
      <label htmlFor="receive-warehouse">Warehouse</label>    
<select
  id="receive-warehouse"
  required
  value={receiveWarehouse}
  onChange={(event) => setReceiveWarehouse(event.target.value)}
>
  <option value="" disabled>Select warehouse</option>
  {summary.warehouses.map((warehouse) => (
    <option
      key={warehouse.WarehouseName}
      value={warehouse.WarehouseName}
    >
      {warehouse.WarehouseName}
    </option>
  ))}
</select>

    </div>

    <div className="form-field">
      <label htmlFor="receive-sku">Product SKU</label>
      
<select
  id="receive-sku"
  required
  value={receiveSKU}
  onChange={(event) => setReceiveSKU(event.target.value)}
>
  <option value="" disabled>Select product</option>
  {[...new Set(inventory.map((item) => item.SKU))].map((sku) => (
    <option key={sku} value={sku}>
      {sku}
    </option>
  ))}
</select>

    </div>

    <div className="form-field">
      <label htmlFor="receive-quantity">Quantity Received</label>
        <input
          id="receive-quantity"
          type="number"
          min="1"
          step="1"
          required
          placeholder="Enter quantity"
          value={receiveQuantity}
          onChange={(event) => setReceiveQuantity(event.target.value)}
        />
    </div>

    <div className="form-field">
      <label htmlFor="receive-reference">Reference Number</label>     
        <input
          id="receive-reference"
          type="text"
          required
          placeholder="e.g. PO-10001"
          value={receiveReference}
          onChange={(event) => setReceiveReference(event.target.value)}
        />
    </div>
    <div className="form-field">
      <label>Selected Inventory Record</label>
      <p>
        {selectedReceiveInventory
          ? `Inventory ID: ${selectedReceiveInventory.InventoryID}`
          : 'Select a warehouse and product'}
      </p>
    </div>
    <button
      type="submit"
      className="clear-filters-button"
      disabled={isReceiving || !selectedReceiveInventory}
    >
      {isReceiving ? 'Processing...' : 'Receive Inventory'}
    </button>

    {receiveMessage && (
      <p role="status">{receiveMessage}</p>
    )}
  </form>
</section>

<section className="warehouse-section">
  <h3>Ship Inventory</h3>
  <p>Record outgoing inventory from a warehouse.</p>

  <form
    className="inventory-form"
    
onSubmit={async (event) => {
  event.preventDefault()

  if (isShipping) return

  setShipMessage('')

  if (!selectedShipInventory) {
    setShipMessage('Please select a valid warehouse and product.')
    return
  }

  const quantity = Number(shipQuantity)
  const reference = shipReference.trim()

  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    setShipMessage('Enter a positive whole-number quantity.')
    return
  }

  if (quantity > selectedShipInventory.AvailableStock) {
    setShipMessage(
      `Insufficient stock. Only ${selectedShipInventory.AvailableStock} units available.`
    )
    return
  }

  if (!reference || reference.length > 50) {
    setShipMessage('Enter a reference number of 1–50 characters.')
    return
  }

  setIsShipping(true)

  try {
    const response = await fetch(
      'http://127.0.0.1:8000/inventory/ship',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory_id: selectedShipInventory.InventoryID,
          quantity,
          reference_number: reference,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        typeof result.detail === 'string'
          ? result.detail
          : 'Unable to ship inventory'
      )
    }

    setShipMessage(result.message || 'Inventory shipped successfully')
    setRefreshKey((current) => current + 1)
    setShipQuantity('')
    setShipReference('')
  } catch (error) {
    setShipMessage(
      error instanceof Error ? error.message : 'Shipment failed'
    )
  } finally {
    setIsShipping(false)
  }
}}

  >
    <div className="form-field">
      <label htmlFor="ship-warehouse">Warehouse</label>
      <select
        id="ship-warehouse"
        required
        value={shipWarehouse}
        onChange={(event) => {
          setShipWarehouse(event.target.value)
          setShipSKU('')
        }}
      >
        <option value="" disabled>Select warehouse</option>
        {summary.warehouses.map((warehouse) => (
          <option
            key={warehouse.WarehouseName}
            value={warehouse.WarehouseName}
          >
            {warehouse.WarehouseName}
          </option>
        ))}
      </select>
    </div>

    <div className="form-field">
      <label htmlFor="ship-sku">Product SKU</label>
      <select
        id="ship-sku"
        required
        value={shipSKU}
        onChange={(event) => setShipSKU(event.target.value)}
      >
        <option value="" disabled>Select product</option>
        {inventory
          .filter((item) => item.WarehouseName === shipWarehouse)
          .map((item) => (
            <option key={item.InventoryID} value={item.SKU}>
              {item.SKU} — {item.ProductName}
            </option>
          ))}
      </select>
    </div>

    <div className="form-field">
      <label htmlFor="ship-quantity">Quantity to Ship</label>
      <input
        id="ship-quantity"
        type="number"
        min="1"
        step="1"
        max={selectedShipInventory?.AvailableStock}
        required
        placeholder="Enter quantity"
        value={shipQuantity}
        onChange={(event) => setShipQuantity(event.target.value)}
      />
    </div>

    <div className="form-field">
      <label htmlFor="ship-reference">Reference Number</label>
      <input
        id="ship-reference"
        type="text"
        maxLength={50}
        required
        placeholder="e.g. SHIP-10001"
        value={shipReference}
        onChange={(event) => setShipReference(event.target.value)}
      />
    </div>

    <div className="form-field">
      <label>Available Stock</label>
      <p>
        {selectedShipInventory
          ? `${selectedShipInventory.AvailableStock} units available (Inventory ID: ${selectedShipInventory.InventoryID})`
          : 'Select a warehouse and product'}
      </p>
    </div>

    <button
      type="submit"
      className="clear-filters-button"
      disabled={
        isShipping ||
        !selectedShipInventory ||
        selectedShipInventory.AvailableStock <= 0
      }
    >
      {isShipping ? 'Processing...' : 'Ship Inventory'}
    </button>

    {shipMessage && <p role="status">{shipMessage}</p>}
  </form>
</section>

<section className="warehouse-section">
  <h3>Adjust Inventory</h3>
  <p>
    Correct inventory counts after audits, damage, or stock discrepancies.
  </p>

  <form
    className="inventory-form"
    
onSubmit={async (event) => {
  event.preventDefault()

  if (isAdjusting) return

  setAdjustMessage('')

  if (!selectedAdjustInventory) {
    setAdjustMessage('Select a valid warehouse and product.')
    return
  }

  const quantity = Number(adjustQuantity)
  const reference = adjustReference.trim()
  const notes = adjustNotes.trim()

  if (!Number.isSafeInteger(quantity) || quantity === 0) {
    setAdjustMessage('Enter a nonzero whole-number adjustment.')
    return
  }

  if (
    quantity < 0 &&
    selectedAdjustInventory.QuantityOnHand + quantity <
      selectedAdjustInventory.QuantityReserved
  ) {
    setAdjustMessage(
      'Adjustment cannot reduce stock below reserved quantity.'
    )
    return
  }

  if (!reference || reference.length > 50) {
    setAdjustMessage('Reference must contain 1–50 characters.')
    return
  }

  if (!notes || notes.length > 255) {
    setAdjustMessage('Reason must contain 1–255 characters.')
    return
  }

  setIsAdjusting(true)

  try {
    const response = await fetch(
      'http://127.0.0.1:8000/inventory/adjust',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory_id: selectedAdjustInventory.InventoryID,
          adjustment_quantity: quantity,
          reference_number: reference,
          notes,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        typeof result.detail === 'string'
          ? result.detail
          : 'Unable to adjust inventory'
      )
    }

    setAdjustMessage(
      result.message || 'Inventory adjusted successfully'
    )
    setRefreshKey((current) => current + 1)
    setAdjustQuantity('')
    setAdjustReference('')
    setAdjustNotes('')
  } catch (error) {
    setAdjustMessage(
      error instanceof Error ? error.message : 'Adjustment failed'
    )
  } finally {
    setIsAdjusting(false)
  }
}}

  >
    <div className="form-field">
      <label htmlFor="adjust-warehouse">Warehouse</label>
      <select
        id="adjust-warehouse"
        required
        value={adjustWarehouse}
        onChange={(event) => {
          setAdjustWarehouse(event.target.value)
          setAdjustSKU('')
        }}
      >
        <option value="" disabled>Select warehouse</option>
        {summary.warehouses.map((warehouse) => (
          <option
            key={warehouse.WarehouseName}
            value={warehouse.WarehouseName}
          >
            {warehouse.WarehouseName}
          </option>
        ))}
      </select>
    </div>

    <div className="form-field">
      <label htmlFor="adjust-sku">Product SKU</label>
      <select
        id="adjust-sku"
        required
        value={adjustSKU}
        onChange={(event) => setAdjustSKU(event.target.value)}
      >
        <option value="" disabled>Select product</option>
        {inventory
          .filter((item) => item.WarehouseName === adjustWarehouse)
          .map((item) => (
            <option key={item.InventoryID} value={item.SKU}>
              {item.SKU} — {item.ProductName}
            </option>
          ))}
      </select>
    </div>

    <div className="form-field">
      <label htmlFor="adjust-quantity">
        Adjustment Quantity
      </label>
      <input
        id="adjust-quantity"
        type="number"
        step="1"
        required
        placeholder="e.g. 5 or -5"
        value={adjustQuantity}
        onChange={(event) => setAdjustQuantity(event.target.value)}
      />
    </div>

    <div className="form-field">
      <label htmlFor="adjust-reference">Reference Number</label>
      <input
        id="adjust-reference"
        type="text"
        maxLength={50}
        required
        placeholder="e.g. ADJ-10001"
        value={adjustReference}
        onChange={(event) => setAdjustReference(event.target.value)}
      />
    </div>

    <div className="form-field">
      <label htmlFor="adjust-notes">Adjustment Reason</label>
      <textarea
        id="adjust-notes"
        maxLength={255}
        required
        placeholder="Explain why inventory is being adjusted"
        value={adjustNotes}
        onChange={(event) => setAdjustNotes(event.target.value)}
      />
    </div>

    <div className="form-field">
      <label>Current Inventory</label>
      <p>
        {selectedAdjustInventory
          ? `${selectedAdjustInventory.QuantityOnHand} units on hand (Inventory ID: ${selectedAdjustInventory.InventoryID})`
          : 'Select a warehouse and product'}
      </p>
    </div>

    <button
      type="submit"
      className="clear-filters-button"
      disabled={isAdjusting || !selectedAdjustInventory}
    >
      {isAdjusting ? 'Processing...' : 'Adjust Inventory'}
    </button>

    {adjustMessage && <p role="status">{adjustMessage}</p>}
  </form>
</section>

<section className="warehouse-section">
  <h3>Inventory Transaction History</h3>
  <p>Audit trail of inventory receipts, shipments, and adjustments.</p>
    
<div className="warehouse-filter">
  <label htmlFor="transaction-type-filter">
    Transaction Type
  </label>

  <select
    id="transaction-type-filter"
    value={transactionTypeFilter}
    onChange={(event) =>
      setTransactionTypeFilter(event.target.value)
    }
  >
    <option value="All Types">All Types</option>
    <option value="RECEIPT">Receipts</option>
    <option value="SHIPMENT">Shipments</option>
    <option value="ADJUSTMENT">Adjustments</option>
  </select>
</div>

  {transactionError && (
    <p role="alert">Error: {transactionError}</p>
  )}

  <div className="table-container">
    <table className="warehouse-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Warehouse</th>
          <th>SKU</th>
          <th>Transaction Type</th>
          <th>Quantity</th>
          <th>Reference</th>
          <th>Notes</th>
        </tr>
      </thead>

      <tbody>
        {transactions
          .filter(
            (transaction) =>
              selectedWarehouse === 'All Warehouses' ||
              transaction.WarehouseName === selectedWarehouse
          )
          .filter(
            (transaction) =>
              transactionTypeFilter === 'All Types' ||
              transaction.TransactionType === transactionTypeFilter
          )
          .map((transaction) => (
          <tr key={transaction.TransactionID}>
            <td>
              {new Date(transaction.TransactionDate).toLocaleString()}
            </td>
            <td>{transaction.WarehouseName}</td>
            <td>{transaction.SKU}</td>
            <td>
              <span
                className={
                  transaction.TransactionType === 'RECEIPT'
                    ? 'stock-badge stock-healthy'
                    : transaction.TransactionType === 'SHIPMENT'
                      ? 'stock-badge stock-warning'
                      : 'stock-badge'
                }
              >
                {transaction.TransactionType}
              </span>
            </td>
            <td>{transaction.Quantity}</td>
            <td>{transaction.ReferenceNumber}</td>
            <td>{transaction.Notes || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

  </>
)}
      </main>
    </div>
  )
}

export default App

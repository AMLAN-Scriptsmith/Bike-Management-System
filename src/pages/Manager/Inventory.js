import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import { inventoryApi } from '../../api/inventoryApi';
import './Inventory.scss';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'AC Parts',
    brand: '',
    model: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    supplier: '',
    location: '',
    description: ''
  });

  const categories = ['All', 'Bike Spare Parts'];
  const statuses = ['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock'];

  const loadInventory = async () => {
    const response = await inventoryApi.getAllItems();
    if (response.success) {
      setInventory(response.data || []);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAddItem = async () => {
    const response = await inventoryApi.addItem(newItem);
    if (response.success) {
      await loadInventory();
      setShowAddModal(false);
      setNewItem({
        name: '',
        category: 'AC Parts',
        brand: '',
        model: '',
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
        unitPrice: 0,
        supplier: '',
        location: '',
        description: ''
      });
    } else {
      alert(response.error || 'Failed to add item');
    }
  };

  const handleEditItem = async () => {
    const response = await inventoryApi.updateItem(selectedItem.id, selectedItem);
    if (response.success) {
      await loadInventory();
      setShowEditModal(false);
      setSelectedItem(null);
    } else {
      alert(response.error || 'Failed to update item');
    }
  };

  const handleRestockItem = async (itemId, quantity) => {
    const response = await inventoryApi.restockItem(itemId, quantity);
    if (response.success) {
      await loadInventory();
    } else {
      alert(response.error || 'Failed to restock item');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const categoryMatch = filterCategory === 'All' || item.category === filterCategory;
    const statusMatch = filterStatus === 'All' || item.status === filterStatus;
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryMatch && statusMatch && searchMatch;
  });

  const getTotalValue = () => {
    return inventory.reduce((sum, item) => sum + item.totalValue, 0);
  };

  const getStockStats = () => {
    return {
      total: inventory.length,
      inStock: inventory.filter(item => item.status === 'In Stock').length,
      lowStock: inventory.filter(item => item.status === 'Low Stock').length,
      critical: inventory.filter(item => item.status === 'Critical').length,
      outOfStock: inventory.filter(item => item.status === 'Out of Stock').length
    };
  };

  const stats = getStockStats();

  return (
    <ManagerLayout>
      <div className="inventory-management">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p>Manage spare parts inventory, track stock levels, and restock items</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>{stats.total}</h3>
            <p>Total Items</p>
          </div>
        </div>
        
        <div className="summary-card value">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>₹{getTotalValue().toLocaleString()}</h3>
            <p>Total Value</p>
          </div>
        </div>
        
        <div className="summary-card in-stock">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>{stats.inStock}</h3>
            <p>In Stock</p>
          </div>
        </div>
        
        <div className="summary-card low-stock">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <h3>{stats.lowStock}</h3>
            <p>Low Stock</p>
          </div>
        </div>
        
        <div className="summary-card critical">
          <div className="card-icon">🚨</div>
          <div className="card-content">
            <h3>{stats.critical}</h3>
            <p>Critical</p>
          </div>
        </div>
        
        <div className="summary-card out-stock">
          <div className="card-icon">❌</div>
          <div className="card-content">
            <h3>{stats.outOfStock}</h3>
            <p>Out of Stock</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="filters-search">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, brand, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filters">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="add-item-btn"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Add New Item
        </button>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item Details</th>
              <th>Category</th>
              <th>Stock Status</th>
              <th>Pricing</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => (
              <tr key={item.id}>
                <td className="item-details">
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-meta">
                      <span className="item-id">{item.id}</span>
                      <span className="item-brand">{item.brand} - {item.model}</span>
                    </div>
                    <div className="item-description">{item.description}</div>
                  </div>
                </td>
                
                <td>
                  <span className="category-badge">{item.category}</span>
                </td>
                
                <td className="stock-status">
                  <div className="stock-info">
                    <div className="current-stock">
                      Current: <strong>{item.currentStock}</strong>
                    </div>
                    <div className="stock-range">
                      Min: {item.minStock} | Max: {item.maxStock}
                    </div>
                    <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="stock-bar">
                    <div 
                      className="stock-fill"
                      style={{
                        width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </td>
                
                <td className="pricing">
                  <div className="unit-price">₹{item.unitPrice}/unit</div>
                  <div className="total-value">Total: ₹{item.totalValue.toLocaleString()}</div>
                </td>
                
                <td className="supplier-info">
                  <div className="supplier-name">{item.supplier}</div>
                  <div className="location">📍 {item.location}</div>
                  <div className="last-restocked">Last: {item.lastRestocked}</div>
                </td>
                
                <td className="actions">
                  <div className="action-buttons">
                    <button 
                      className="btn-restock"
                      onClick={() => {
                        const quantity = prompt('Enter restock quantity:');
                        if (quantity && !isNaN(quantity) && quantity > 0) {
                          handleRestockItem(item.id, parseInt(quantity));
                        }
                      }}
                    >
                      📦 Restock
                    </button>
                    <button 
                      className="btn-edit"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowEditModal(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Inventory Item</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  >
                    {categories.filter(cat => cat !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    value={newItem.brand}
                    onChange={(e) => setNewItem({...newItem, brand: e.target.value})}
                    placeholder="Enter brand name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={newItem.model}
                    onChange={(e) => setNewItem({...newItem, model: e.target.value})}
                    placeholder="Enter model number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Current Stock *</label>
                  <input
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({...newItem, currentStock: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Minimum Stock *</label>
                  <input
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Maximum Stock *</label>
                  <input
                    type="number"
                    value={newItem.maxStock}
                    onChange={(e) => setNewItem({...newItem, maxStock: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Supplier *</label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                    placeholder="Enter supplier name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Storage Location *</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    placeholder="Enter storage location"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Enter item description"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save"
                  onClick={handleAddItem}
                  disabled={!newItem.name || !newItem.brand || !newItem.model}
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Inventory Item</h3>
              <button onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={selectedItem.category}
                    onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
                  >
                    {categories.filter(cat => cat !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    value={selectedItem.brand}
                    onChange={(e) => setSelectedItem({...selectedItem, brand: e.target.value})}
                    placeholder="Enter brand name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={selectedItem.model}
                    onChange={(e) => setSelectedItem({...selectedItem, model: e.target.value})}
                    placeholder="Enter model number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Current Stock *</label>
                  <input
                    type="number"
                    value={selectedItem.currentStock}
                    onChange={(e) => setSelectedItem({...selectedItem, currentStock: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Minimum Stock *</label>
                  <input
                    type="number"
                    value={selectedItem.minStock}
                    onChange={(e) => setSelectedItem({...selectedItem, minStock: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Maximum Stock *</label>
                  <input
                    type="number"
                    value={selectedItem.maxStock}
                    onChange={(e) => setSelectedItem({...selectedItem, maxStock: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input
                    type="number"
                    value={selectedItem.unitPrice}
                    onChange={(e) => setSelectedItem({...selectedItem, unitPrice: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Supplier *</label>
                  <input
                    type="text"
                    value={selectedItem.supplier}
                    onChange={(e) => setSelectedItem({...selectedItem, supplier: e.target.value})}
                    placeholder="Enter supplier name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Storage Location *</label>
                  <input
                    type="text"
                    value={selectedItem.location}
                    onChange={(e) => setSelectedItem({...selectedItem, location: e.target.value})}
                    placeholder="Enter storage location"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={selectedItem.description}
                    onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                    placeholder="Enter item description"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save"
                  onClick={handleEditItem}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ManagerLayout>
  );
};

export default Inventory;

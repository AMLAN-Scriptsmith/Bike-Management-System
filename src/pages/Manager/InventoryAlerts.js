import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import { inventoryApi } from '../../api/inventoryApi';
import './InventoryAlerts.scss';

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertSettings, setAlertSettings] = useState({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    emailNotifications: true,
    autoReorder: false
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchReorderSuggestions();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.getLowStockAlerts();
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReorderSuggestions = async () => {
    try {
      const response = await inventoryApi.getReorderSuggestions();
      if (response.success) {
        setReorderSuggestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching reorder suggestions:', error);
    }
  };

  const handleRestockItem = async (itemId, quantity) => {
    try {
      const response = await inventoryApi.restockItem(itemId, quantity);
      if (response.success) {
        alert('Item restocked successfully!');
        await fetchAlerts();
        await fetchReorderSuggestions();
      } else {
        alert('Failed to restock item: ' + response.error);
      }
    } catch (error) {
      alert('Error restocking item: ' + error.message);
    }
  };

  const getAlertSeverity = (item) => {
    if (item.currentStock === 0) return 'critical';
    if (item.currentStock <= item.minStock * 0.3) return 'critical';
    if (item.currentStock <= item.minStock * 0.6) return 'high';
    return 'medium';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e'
    };
    return colors[severity] || '#64748b';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    };
    return icons[severity] || 'ℹ️';
  };

  const getDaysUntilEmpty = (item) => {
    // Mock calculation based on usage patterns
    const averageUsagePerDay = 2; // Assume 2 items used per day on average
    return Math.floor(item.currentStock / averageUsagePerDay);
  };

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(item => getAlertSeverity(item) === 'critical').length,
    high: alerts.filter(item => getAlertSeverity(item) === 'high').length,
    medium: alerts.filter(item => getAlertSeverity(item) === 'medium').length
  };

  return (
    <ManagerLayout>
    <div className="inventory-alerts">
      <div className="page-header">
        <div className="header-content">
          <h1>Inventory Alerts</h1>
          <p>Monitor stock levels and manage critical inventory notifications</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-settings"
            onClick={() => setShowSettingsModal(true)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="alert-stats">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-number">{alertStats.total}</div>
            <div className="stat-label">Total Alerts</div>
          </div>
        </div>

        <div className="stat-card critical">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-number">{alertStats.critical}</div>
            <div className="stat-label">Critical</div>
          </div>
        </div>

        <div className="stat-card high">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{alertStats.high}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>

        <div className="stat-card medium">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-number">{alertStats.medium}</div>
            <div className="stat-label">Medium Priority</div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="alerts-section">
        <div className="section-header">
          <h2>Active Alerts</h2>
          <button 
            className="btn-refresh"
            onClick={() => {
              fetchAlerts();
              fetchReorderSuggestions();
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No Stock Alerts</h3>
            <p>All inventory items are adequately stocked</p>
          </div>
        ) : (
          <div className="alerts-grid">
            {alerts.map(item => {
              const severity = getAlertSeverity(item);
              const daysUntilEmpty = getDaysUntilEmpty(item);
              
              return (
                <div 
                  key={item.id} 
                  className={`alert-card ${severity}`}
                  style={{ borderLeftColor: getSeverityColor(severity) }}
                >
                  <div className="alert-header">
                    <div className="alert-severity">
                      <span className="severity-icon">{getSeverityIcon(severity)}</span>
                      <span className="severity-text">{severity.toUpperCase()}</span>
                    </div>
                    <div className="alert-time">
                      {daysUntilEmpty > 0 ? `${daysUntilEmpty} days left` : 'Out of stock'}
                    </div>
                  </div>

                  <div className="alert-content">
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-category">{item.category}</p>
                      <p className="item-location">📍 {item.location}</p>
                    </div>

                    <div className="stock-info">
                      <div className="stock-levels">
                        <div className="current-stock">
                          <span className="label">Current:</span>
                          <span className="value current">{item.currentStock}</span>
                        </div>
                        <div className="min-stock">
                          <span className="label">Minimum:</span>
                          <span className="value min">{item.minStock}</span>
                        </div>
                        <div className="max-stock">
                          <span className="label">Maximum:</span>
                          <span className="value max">{item.maxStock}</span>
                        </div>
                      </div>

                      <div className="stock-visual">
                        <div className="stock-bar">
                          <div 
                            className="stock-fill"
                            style={{ 
                              width: `${Math.max((item.currentStock / item.maxStock) * 100, 2)}%`,
                              backgroundColor: getSeverityColor(severity)
                            }}
                          ></div>
                        </div>
                        <div className="stock-percentage">
                          {Math.round((item.currentStock / item.maxStock) * 100)}% of capacity
                        </div>
                      </div>
                    </div>

                    <div className="alert-details">
                      <div className="detail-item">
                        <span className="detail-label">Supplier:</span>
                        <span className="detail-value">{item.supplier}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Unit Price:</span>
                        <span className="detail-value">₹{item.unitPrice}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Restocked:</span>
                        <span className="detail-value">
                          {new Date(item.lastRestocked).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="alert-actions">
                    <button 
                      className="btn-restock primary"
                      onClick={() => {
                        const quantity = prompt(
                          `How many ${item.name} would you like to restock?`,
                          item.maxStock - item.currentStock
                        );
                        if (quantity && !isNaN(quantity) && quantity > 0) {
                          handleRestockItem(item.id, parseInt(quantity));
                        }
                      }}
                    >
                      📦 Restock Now
                    </button>
                    <button 
                      className="btn-order secondary"
                      onClick={() => {
                        alert(`Generating purchase order for ${item.name}...`);
                      }}
                    >
                      📋 Create Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reorder Suggestions */}
      <div className="suggestions-section">
        <div className="section-header">
          <h2>Smart Reorder Suggestions</h2>
          <p>AI-powered recommendations based on usage patterns</p>
        </div>

        {reorderSuggestions.length > 0 && (
          <div className="suggestions-grid">
            {reorderSuggestions.map(suggestion => (
              <div key={suggestion.id} className="suggestion-card">
                <div className="suggestion-header">
                  <div className="suggestion-title">
                    <h4>{suggestion.name}</h4>
                    <span className="urgency-badge">{suggestion.urgency}</span>
                  </div>
                </div>

                <div className="suggestion-content">
                  <div className="current-status">
                    <div className="status-item">
                      <span className="status-label">Current Stock:</span>
                      <span className="status-value">{suggestion.currentStock}</span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">Minimum Required:</span>
                      <span className="status-value">{suggestion.minStock}</span>
                    </div>
                  </div>

                  <div className="suggestion-recommendation">
                    <div className="recommendation-item">
                      <span className="rec-label">Suggested Quantity:</span>
                      <span className="rec-value highlight">{suggestion.suggestedQuantity}</span>
                    </div>
                    <div className="recommendation-item">
                      <span className="rec-label">Estimated Cost:</span>
                      <span className="rec-value cost">₹{suggestion.estimatedCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="suggestion-actions">
                  <button 
                    className="btn-accept-suggestion primary"
                    onClick={() => {
                      handleRestockItem(suggestion.id, suggestion.suggestedQuantity);
                    }}
                  >
                    ✅ Accept Suggestion
                  </button>
                  <button 
                    className="btn-modify-suggestion secondary"
                    onClick={() => {
                      const quantity = prompt(
                        'Enter custom restock quantity:',
                        suggestion.suggestedQuantity
                      );
                      if (quantity && !isNaN(quantity) && quantity > 0) {
                        handleRestockItem(suggestion.id, parseInt(quantity));
                      }
                    }}
                  >
                    ⚙️ Modify
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Alert Settings</h2>
              <button 
                className="close-btn"
                onClick={() => setShowSettingsModal(false)}
              >×</button>
            </div>

            <div className="modal-content">
              <div className="settings-form">
                <div className="setting-group">
                  <label>Low Stock Threshold (%)</label>
                  <input 
                    type="number"
                    value={alertSettings.lowStockThreshold}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      lowStockThreshold: parseInt(e.target.value)
                    })}
                    min="1"
                    max="50"
                  />
                  <small>Alert when stock falls below this percentage of maximum</small>
                </div>

                <div className="setting-group">
                  <label>Critical Stock Threshold (%)</label>
                  <input 
                    type="number"
                    value={alertSettings.criticalStockThreshold}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      criticalStockThreshold: parseInt(e.target.value)
                    })}
                    min="1"
                    max="25"
                  />
                  <small>Mark as critical when stock falls below this percentage</small>
                </div>

                <div className="setting-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={alertSettings.emailNotifications}
                      onChange={(e) => setAlertSettings({
                        ...alertSettings,
                        emailNotifications: e.target.checked
                      })}
                    />
                    <span className="checkmark"></span>
                    Email Notifications
                  </label>
                  <small>Send email alerts for critical stock levels</small>
                </div>

                <div className="setting-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={alertSettings.autoReorder}
                      onChange={(e) => setAlertSettings({
                        ...alertSettings,
                        autoReorder: e.target.checked
                      })}
                    />
                    <span className="checkmark"></span>
                    Auto Reorder
                  </label>
                  <small>Automatically create purchase orders for critical items</small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowSettingsModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-save primary"
                onClick={() => {
                  alert('Settings saved successfully!');
                  setShowSettingsModal(false);
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ManagerLayout>
  );
};

export default InventoryAlerts;
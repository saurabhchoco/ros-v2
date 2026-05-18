import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './Captain.css';

export default function Captain({ outlet }) {

  const [categories, setCategories] =
    useState([]);
  const [items, setItems] =
    useState([]);
  const [activeCategory, setActiveCategory] =
    useState(null);
  const [cart, setCart] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [placing, setPlacing] =
    useState(false);
  const [orderSuccess, setOrderSuccess] =
    useState(null);

  const [tableNumber, setTableNumber] =
    useState('');
  const [tokenNumber, setTokenNumber] =
    useState('');
  const [customerName, setCustomerName] =
    useState('');
  const [customerMobile, setCustomerMobile] =
    useState('');
  const [orderSource, setOrderSource] =
    useState('DINE_IN');

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res =
          await apiService.getCategories(
            outlet.organizationId,
            outlet.outletId
          );
        const cats = res.data.data || [];
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0].id);
        }
      } catch (err) {
        console.error(
          'Failed to load categories', err
        );
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [outlet]);

  // Load items when category changes
  useEffect(() => {
    if (!activeCategory) return;
    const loadItems = async () => {
      try {
        const res =
          await apiService.getMenuItems(
            outlet.organizationId,
            outlet.outletId,
            activeCategory
          );
        setItems(res.data.data || []);
      } catch (err) {
        console.error(
          'Failed to load items', err
        );
      }
    };
    loadItems();
  }, [activeCategory, outlet]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(
        c => c.id === item.id
      );
      if (existing) {
        return prev.map(c =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(
        c => c.id === itemId
      );
      if (existing?.quantity === 1) {
        return prev.filter(c => c.id !== itemId);
      }
      return prev.map(c =>
        c.id === itemId
          ? { ...c, quantity: c.quantity - 1 }
          : c
      );
    });
  };

  const getQuantity = (itemId) => {
    return cart.find(c => c.id === itemId)
      ?.quantity || 0;
  };

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + item.base_price * item.quantity,
    0
  );

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handlePlaceOrder = async () => {

    if (cart.length === 0) return;

    setPlacing(true);

    try {
      const res = await apiService.createOrder({
        organizationId: outlet.organizationId,
        outletId: outlet.outletId,
        orderSource,
        tableNumber: tableNumber || undefined,
        tokenNumber: tokenNumber || undefined,
        customerName: customerName || undefined,
        customerMobile:
          customerMobile || undefined,
        items: cart.map(item => ({
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.base_price)
        }))
      });

      setOrderSuccess(res.data.data);
      setCart([]);
      setTableNumber('');
      setTokenNumber('');
      setCustomerName('');
      setCustomerMobile('');

    } catch (err) {
      console.error('Failed to place order', err);
      alert('Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handleNewOrder = () => {
    setOrderSuccess(null);
  };

  if (loading) {
    return (
      <div className="loading">
        Loading menu...
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="order-success">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Order Placed!</h2>
          <div className="success-order-no">
            {orderSuccess.order_no}
          </div>
          {orderSuccess.table_number && (
            <div className="success-detail">
              🪑 Table {orderSuccess.table_number}
            </div>
          )}
          {orderSuccess.token_number && (
            <div className="success-detail">
              🎫 Token {orderSuccess.token_number}
            </div>
          )}
          {orderSuccess.customer_name && (
            <div className="success-detail">
              👤 {orderSuccess.customer_name}
            </div>
          )}
          <div className="success-total">
            ₹{parseFloat(
              orderSuccess.grand_total
            ).toFixed(2)}
          </div>
          <button
            className="new-order-btn"
            onClick={handleNewOrder}
          >
            + New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="captain-container">

      {/* Left — Menu */}
      <div className="menu-panel">

        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={
                activeCategory === cat.id
                  ? 'tab active'
                  : 'tab'
              }
              onClick={() =>
                setActiveCategory(cat.id)
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="items-grid">
          {items.map(item => {
            const qty = getQuantity(item.id);
            return (
              <div
                key={item.id}
                className="item-card"
              >
                <div className="item-veg">
                  {item.is_veg
                    ? '🟢'
                    : '🔴'}
                </div>
                <div className="item-name">
                  {item.name}
                </div>
                {item.description && (
                  <div className="item-desc">
                    {item.description}
                  </div>
                )}
                <div className="item-footer">
                  <div className="item-price">
                    ₹{parseFloat(
                      item.base_price
                    ).toFixed(0)}
                  </div>
                  <div className="item-controls">
                    {qty > 0 ? (
                      <>
                        <button
                          className="qty-btn minus"
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                        >
                          −
                        </button>
                        <span className="qty">
                          {qty}
                        </span>
                        <button
                          className="qty-btn plus"
                          onClick={() =>
                            addToCart(item)
                          }
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        className="add-btn"
                        onClick={() =>
                          addToCart(item)
                        }
                      >
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="empty-items">
              No items in this category
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart */}
      <div className="cart-panel">

        <div className="cart-header">
          <h3>Order</h3>
          <span className="cart-count">
            {cartCount} items
          </span>
        </div>

        {/* Order Type */}
        <div className="order-type">
          <select
            value={orderSource}
            onChange={e =>
              setOrderSource(e.target.value)
            }
          >
            <option value="DINE_IN">
              Dine In
            </option>
            <option value="TAKEAWAY">
              Takeaway
            </option>
            <option value="DELIVERY">
              Delivery
            </option>
          </select>
        </div>

        {/* Order Details */}
        <div className="order-details">
          <input
            type="text"
            placeholder="Table No."
            value={tableNumber}
            onChange={e =>
              setTableNumber(e.target.value)
            }
          />
          <input
            type="text"
            placeholder="Token No."
            value={tokenNumber}
            onChange={e =>
              setTokenNumber(e.target.value)
            }
          />
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={e =>
              setCustomerName(e.target.value)
            }
          />
          <input
            type="tel"
            placeholder="Phone (WhatsApp)"
            value={customerMobile}
            onChange={e =>
              setCustomerMobile(e.target.value)
            }
          />
        </div>

        {/* Cart Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              Add items from the menu
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="cart-item"
              >
                <div className="cart-item-name">
                  {item.name}
                </div>
                <div className="cart-item-right">
                  <div className="cart-controls">
                    <button
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        addToCart(item)
                      }
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    ₹{(
                      parseFloat(item.base_price) *
                      item.quantity
                    ).toFixed(0)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing
                ? 'Placing...'
                : `Place Order — ₹${cartTotal.toFixed(0)}`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
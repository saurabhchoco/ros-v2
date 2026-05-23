import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import Button from './ui/Button';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  total,
  onPlaceOrder,
  placing,
  // Order detail props
  orderSource,
  setOrderSource,
  tableNumber,
  setTableNumber,
  tokenNumber,
  setTokenNumber,
  customerName,
  setCustomerName,
  customerMobile,
  setCustomerMobile,
  // ✅ New: payment method
  paymentMethod,
  setPaymentMethod,
}) {
  if (!isOpen) return null;

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const safeTotal = typeof total === 'number' && !isNaN(total) ? total : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your Order</h2>
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Order Source & Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <select
                value={orderSource}
                onChange={(e) => setOrderSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
              >
                <option value="DINE_IN">Dine In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table No.</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token No.</label>
                <input
                  type="text"
                  value={tokenNumber}
                  onChange={(e) => setTokenNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile (WhatsApp)</label>
              <input
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
              />
            </div>

            {/* ✅ Payment Method Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>

          {/* Cart Items */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Items</h3>
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-4">Cart is empty</div>
              ) : (
                cart.map(item => {
                  const itemTotal = (item.quantity || 0) * parseFloat(item.base_price || 0);
                  return (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">₹{parseFloat(item.base_price || 0).toFixed(0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.quantity || 0}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="ml-4 w-16 text-right font-medium">
                        ₹{itemTotal.toFixed(0)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{safeTotal.toFixed(0)}</span>
            </div>
            <Button
              onClick={onPlaceOrder}
              loading={placing}
              disabled={placing}
              className="w-full py-3 text-lg"
            >
              Place Order • ₹{safeTotal.toFixed(0)}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
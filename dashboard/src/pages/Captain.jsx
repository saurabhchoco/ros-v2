import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getTenantContext } from '../utils/tenantContext';
import Skeleton from '../components/ui/Skeleton';
import { Plus, ShoppingCart, X, Search, Minus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import useMenuStore from '../store/menuStore';
import Button from '../components/ui/Button';

// --- Memoised Compact Menu Tile (Horizontal) ---
const MenuTile = React.memo(({ item, quantity, disabled, onAdd, onUpdate, isOutOfStock }) => {
  const price = parseFloat(item.base_price || 0);
  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-150 p-3 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-4 h-4 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <h3 className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</h3>
          </div>
          {item.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
          )}
          <span className="text-indigo-600 font-semibold text-base mt-1 inline-block">₹{price.toFixed(0)}</span>
        </div>
        <div className="ml-3">
          {isOutOfStock ? (
            <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">Out of stock</span>
          ) : quantity === 0 ? (
            <button
              onClick={() => onAdd(item)}
              disabled={disabled}
              className="px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-1 min-h-[44px] transition active:scale-95 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title={disabled ? 'Start shift to order' : ''}
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onUpdate(item.id, -1)}
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 transition text-gray-700 font-bold"
                disabled={disabled}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold text-gray-800 text-base">{quantity}</span>
              <button
                onClick={() => onUpdate(item.id, 1)}
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 transition text-gray-700 font-bold"
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function Captain() {
  const outlet = useAuthStore((s) => s.outlet);
  const { organizationId, outletId } = getTenantContext(outlet);

  // --- Global menu store ---
  const {
    categories,
    itemsByCategory,
    allItems,
    loadingItems,
    loadingAllItems,
    fetchCategories,
    fetchItems,
    fetchAllItems
  } = useMenuStore();

  // --- Local state ---
  const [activeCategory, setActiveCategory] = useState(null);
  // const [cart, setCart] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('captain_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved cart', e);
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasActiveShift, setHasActiveShift] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const searchInputRef = useRef(null);

  // --- Order form state ---
  const [tableNumber, setTableNumber] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  const tableNumberRef = useRef('');
  const tokenNumberRef = useRef('');
  const customerNameRef = useRef('');
  const customerMobileRef = useRef('');

  const [orderSource, setOrderSource] = useState('DINE_IN');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  // --- Discount state ---
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  // --- Tax rates ---
  const cgstRate = 0.025;
  const sgstRate = 0.025;

  // --- Determine if user is a manager (no shift required) ---
  const isManagerRole = ['OUTLET_MANAGER', 'ARM'].includes(outlet?.role);
  const canAddToCart = isManagerRole ? true : hasActiveShift;

  const getVisibleItems = (items) => {
    if (!items) return [];
    return items.filter(item => item.status !== 'hidden' && item.status !== 'draft');
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('captain_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    tableNumberRef.current = tableNumber;
    tokenNumberRef.current = tokenNumber;
    customerNameRef.current = customerName;
    customerMobileRef.current = customerMobile;
  }, [tableNumber, tokenNumber, customerName, customerMobile]);

  // --- Detect desktop ---
  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= 1024);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // --- Fetch categories & all items on mount ---
  useEffect(() => {
    if (!organizationId || !outletId) {
      setInitialLoading(false);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        await fetchCategories(organizationId, outletId, apiService);
        await fetchAllItems(organizationId, outletId, apiService);
        const cats = useMenuStore.getState().categories;
        if (cats.length > 0 && !activeCategory) {
          setActiveCategory(cats[0].id);
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load menu');
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };
    load();
  }, [organizationId, outletId, fetchCategories, fetchAllItems, activeCategory]);

  // --- Refresh menu when tab becomes visible ---
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && organizationId && outletId) {
        await fetchCategories(organizationId, outletId, apiService);
        await fetchAllItems(organizationId, outletId, apiService);
        // Also refresh current category items if they exist
        if (activeCategory) {
          await fetchItems(organizationId, outletId, activeCategory, apiService);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [organizationId, outletId, activeCategory, fetchCategories, fetchAllItems, fetchItems]);

  // --- Fetch items for selected category if not already loaded ---
  useEffect(() => {
    if (!activeCategory || !organizationId || !outletId) return;
    if (itemsByCategory[activeCategory]?.length > 0) return;
    fetchItems(organizationId, outletId, activeCategory, apiService);
  }, [activeCategory, organizationId, outletId, fetchItems, itemsByCategory]);

  // --- Search filtering ---
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const filtered = allItems.filter(item =>
      (item.name.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.sku && item.sku.toLowerCase().includes(term))) &&
      item.status !== 'hidden' &&
      item.status !== 'draft'
    );
    return filtered;
  }, [allItems, searchTerm]);

  const displayItems = searchTerm.trim()
    ? searchResults
    : getVisibleItems(itemsByCategory[activeCategory] || []);
  const categoryLoading = searchTerm.trim() ? false : (loadingItems[activeCategory] || false);
  const isGlobalLoading = loadingAllItems && loading;

  // --- Cart helpers ---
  const cartMap = useMemo(() => {
    const map = new Map();
    cart.forEach(item => map.set(item.id, item.quantity));
    return map;
  }, [cart]);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to cart`);
    if (!isDesktop && cart.length === 0) setIsCartOpen(true);
  }, [cart.length, isDesktop]);

  const updateQuantity = useCallback((itemId, delta) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter(i => i.id !== itemId);
      }
      return prev.map(i =>
        i.id === itemId ? { ...i, quantity: newQty } : i
      );
    });
  }, []);

  // --- Check active shift ---
  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiService.getActiveShift();
        setHasActiveShift(!!res.data.activeShift);
      } catch (err) { console.error(err); }
    };
    check();
  }, []);

  // --- Cart totals & tax ---
  const subtotal = useMemo(() => cart.reduce((s, i) => s + parseFloat(i.base_price) * i.quantity, 0), [cart]);
  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'percentage') return (subtotal * discountValue) / 100;
    return Math.min(discountValue, subtotal);
  }, [discountType, discountValue, subtotal]);
  const cgstAmount = subtotal * cgstRate;
  const sgstAmount = subtotal * sgstRate;
  const grandTotal = subtotal - discountAmount + cgstAmount + sgstAmount;
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  // --- Place order with loader ---
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await apiService.createOrder({
        organizationId,
        outletId,
        orderSource,
        tableNumber: tableNumber || undefined,
        tokenNumber: tokenNumber || undefined,
        customerName: customerName || undefined,
        customerMobile: customerMobile || undefined,
        paymentMethod,
        items: cart.map(i => ({
          itemName: i.name,
          quantity: i.quantity,
          unitPrice: parseFloat(i.base_price),
        })),
      });
      setOrderSuccess(res.data.data);
      setCart([]);
      setIsCartOpen(false);
      setTableNumber('');
      setTokenNumber('');
      setCustomerName('');
      setCustomerMobile('');
      tableNumberRef.current = '';
      tokenNumberRef.current = '';
      customerNameRef.current = '';
      customerMobileRef.current = '';
      setOrderSource('DINE_IN');
      toast.success('Order placed successfully!');
    } catch (e) {
      toast.error('Failed to place order');
      console.error(e);
    } finally {
      setPlacing(false);
    }
  };

  // --- Keyboard shortcut '/' to focus search ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clearSearch = () => setSearchTerm('');

  if (!outlet) return <div className="flex items-center justify-center h-full text-red-500">No outlet assigned</div>;
  if (initialLoading) return <div className="flex justify-center items-center h-full">Loading menu...</div>;

  if (orderSuccess) {
    const grandTotalVal = typeof orderSuccess.grand_total === 'number'
      ? orderSuccess.grand_total
      : parseFloat(orderSuccess.grand_total) || 0;
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="bg-green-50 rounded-full p-4 mb-4">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
        {orderSuccess.token_number && (
          <p className="text-gray-600 mb-4">
            Token: <span className="font-mono font-bold">{orderSuccess.token_number}</span>
          </p>
        )}
        <p className="text-gray-600 mb-6">
          Total: ₹{grandTotalVal.toFixed(2)}
        </p>
        <button
          onClick={() => {
            setOrderSuccess(null);
            setCart([]);
            setTableNumber('');
            setTokenNumber('');
            setCustomerName('');
            setCustomerMobile('');
            setOrderSource('DINE_IN');
            setPaymentMethod('CASH');
            setDiscountValue(0);
            setDiscountReason('');
            setShowCustomerDetails(false);
          }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  // --- Cart panel component (reused for desktop sidebar & mobile drawer) ---
  const CartPanel = ({ isDrawer = false }) => (
    <div className={`bg-white flex flex-col h-full ${!isDrawer ? 'border-l border-gray-200' : ''}`}>
      <div className={`flex items-center justify-between border-b p-4 ${isDrawer ? '' : 'sticky top-0 bg-white z-10'}`}>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Your Order</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        {isDrawer && (
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Order details */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select
              value={orderSource}
              onChange={(e) => setOrderSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="DINE_IN">Dine In</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <button
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            className="text-indigo-600 text-sm font-medium flex items-center gap-1 mt-2 hover:text-indigo-700 transition"
          >
            {showCustomerDetails ? '−' : '+'} Add customer details
          </button>

          {showCustomerDetails && (
            <div className="space-y-3 border-t border-gray-100 pt-3 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table No.</label>
                  <input
                    ref={tableNumberRef}
                    type="text"
                    defaultValue={tableNumber}
                    onBlur={(e) => setTableNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token No.</label>
                  <input
                    ref={tokenNumberRef}
                    type="text"
                    defaultValue={tokenNumber}
                    onBlur={(e) => setTokenNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  ref={customerNameRef}
                  type="text"
                  defaultValue={customerName}
                  onBlur={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile (WhatsApp)</label>
                <input
                  ref={customerMobileRef}
                  type="tel"
                  defaultValue={customerMobile}
                  onBlur={(e) => setCustomerMobile(e.target.value)}
                  onInput={(e) => {
                    // Remove non-digits and limit to 10 characters
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 10) value = value.slice(0, 10);
                    e.target.value = value;
                  }}
                  maxLength="10"
                  placeholder="Optional (10 digits)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800">Items</h3>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear Cart
              </button>
            )}
          </div>
          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-4">Cart is empty</div>
            ) : (
              cart.map(item => {
                const itemTotal = (item.quantity || 0) * parseFloat(item.base_price || 0);
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">₹{parseFloat(item.base_price || 0).toFixed(0)}</p>
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
                    <div className="ml-4 w-16 text-right font-medium text-sm">
                      ₹{itemTotal.toFixed(0)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="border-t p-4 space-y-3">
          {/* Discount controls */}
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Discount</span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-2 py-1 text-xs rounded-md transition ${discountType === 'percentage' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                    }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-2 py-1 text-xs rounded-md transition ${discountType === 'fixed' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                    }`}
                >
                  ₹
                </button>
              </div>
              <input
                type="number"
                min="0"
                step={discountType === 'percentage' ? 1 : 10}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder={discountType === 'percentage' ? '0%' : '0'}
                className="w-20 px-2 py-1 border border-gray-200 rounded-md text-sm text-right"
              />
            </div>
            <input
              type="text"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-500"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`})</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">CGST (2.5%)</span>
              <span>₹{cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST (2.5%)</span>
              <span>₹{sgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-1 border-t">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* FIX 1: Place order button with correct total */}
          <button
            onClick={handlePlaceOrder}
            disabled={placing || !canAddToCart}
            title={!canAddToCart ? "Start shift to place order" : ""}
            className="w-full py-3 text-lg bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {placing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Placing...
              </>
            ) : (
              `Place Order • ₹${grandTotal.toFixed(0)}`
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* LEFT: Menu Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isDesktop ? 'pr-[360px]' : ''}`}>
        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search menu items, SKU, category... (press '/' to focus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills (hidden during search) */}
        {!searchTerm && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-100 flex-shrink-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[36px] ${activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4 overflow-y-auto">
          {categoryLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                <Skeleton className="h-4 w-8 mb-2" />
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))
          ) : displayItems.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No menu items available</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {!outletId
                  ? "Your account is not linked to an outlet. Please contact your administrator."
                  : "This outlet currently has no menu items. Check back later."}
              </p>
            </div>
          ) : (
            displayItems.map(item => {
              const quantity = cartMap.get(item.id) || 0;
              const isOutOfStock = item.status === 'out_of_stock';
              const isDisabled = !canAddToCart || isOutOfStock;
              return (
                <MenuTile
                  key={item.id}
                  item={item}
                  quantity={quantity}
                  disabled={isDisabled}
                  isOutOfStock={isOutOfStock}
                  onAdd={addToCart}
                  onUpdate={updateQuantity}
                />
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Persistent Cart Sidebar (Desktop) */}
      {isDesktop && (
        <div className="fixed right-0 top-[64px] bottom-0 w-[360px] bg-white shadow-lg z-20 overflow-y-auto border-l border-gray-200">
          <CartPanel isDrawer={false} />
        </div>
      )}

      {/* Floating Button + Drawer (Mobile) */}
      {!isDesktop && !isCartOpen && cartCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2 z-30 hover:bg-indigo-700 transition-all min-h-[48px] min-w-[48px]"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-bold">{cartCount}</span>
        </button>
      )}

      {!isDesktop && isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl animate-slide-in-right">
            <CartPanel isDrawer={true} />
          </div>
        </div>
      )}
    </div>
  );
}
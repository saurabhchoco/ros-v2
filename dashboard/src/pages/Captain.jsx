import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getTenantContext } from '../utils/tenantContext';
import CartDrawer from '../components/CartDrawer';
import Skeleton from '../components/ui/Skeleton';
import { Plus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Captain() {
  const outlet = useAuthStore((s) => s.outlet);

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Order details
  const [tableNumber, setTableNumber] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [orderSource, setOrderSource] = useState('DINE_IN');

  // Fetch categories
  useEffect(() => {
    const { organizationId, outletId } = getTenantContext(outlet);
    if (!organizationId || !outletId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await apiService.getCategories(organizationId, outletId);
        const cats = res.data.data || [];
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [outlet]);

  // Fetch items when category changes
  useEffect(() => {
    const { organizationId, outletId } = getTenantContext(outlet);
    if (!activeCategory || !organizationId || !outletId) return;

    setCategoryLoading(true);
    const load = async () => {
      try {
        const res = await apiService.getMenuItems(organizationId, outletId, activeCategory);
        setItems(res.data.data || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load items');
      } finally {
        setCategoryLoading(false);
      }
    };
    load();
  }, [activeCategory, outlet]);

  const addToCart = (item) => {
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
    if (cart.length === 0) setIsCartOpen(true);
  };

  const updateQuantity = (itemId, delta) => {
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
  };

  const cartTotal = cart.reduce(
    (s, i) => s + parseFloat(i.base_price) * i.quantity,
    0
  );
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const { organizationId, outletId } = getTenantContext(outlet);
      const res = await apiService.createOrder({
        organizationId,
        outletId,
        orderSource,
        tableNumber: tableNumber || undefined,
        tokenNumber: tokenNumber || undefined,
        customerName: customerName || undefined,
        customerMobile: customerMobile || undefined,
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
      setOrderSource('DINE_IN');
      toast.success('Order placed successfully!');
    } catch (e) {
      toast.error('Failed to place order');
      console.error(e);
    } finally {
      setPlacing(false);
    }
  };

  if (!outlet) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        No outlet assigned
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 p-5">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl p-4">
                <Skeleton className="h-4 w-8 mb-2" />
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="w-80 bg-white p-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
          <p className="text-primary-500 font-bold text-xl mb-4">
            {orderSuccess.order_no}
          </p>
          {orderSuccess.table_number && (
            <p className="text-gray-500 mb-1">🪑 Table {orderSuccess.table_number}</p>
          )}
          {orderSuccess.token_number && (
            <p className="text-gray-500 mb-1">🎫 Token {orderSuccess.token_number}</p>
          )}
          {orderSuccess.customer_name && (
            <p className="text-gray-500 mb-1">👤 {orderSuccess.customer_name}</p>
          )}
          <p className="text-3xl font-extrabold text-gray-900 my-5">
            ₹{parseFloat(orderSuccess.grand_total).toFixed(2)}
          </p>
          <button
            onClick={() => setOrderSuccess(null)}
            className="w-full bg-primary-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-primary-600 transition"
          >
            + New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Category Tabs */}
        <div className="flex gap-2 px-5 py-4 overflow-x-auto bg-white border-b border-gray-200 flex-shrink-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary-500 text-white shadow'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid with Category Loading Skeletons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5 overflow-y-auto flex-1">
          {categoryLoading ? (
            // Show skeleton cards while switching category
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4">
                <Skeleton className="h-4 w-8 mb-2" />
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col"
              >
                <span className="text-xl mb-1">{item.is_veg ? '🟢' : '🔴'}</span>
                <p className="font-semibold text-gray-800 text-sm leading-tight flex-1">
                  {item.name}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-primary-600 font-bold text-xl">
                    ₹{parseFloat(item.base_price).toFixed(0)}
                  </span>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-3 py-1.5 bg-primary-500 text-white text-xs font-bold rounded-lg hover:bg-primary-600 transition flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> ADD
                  </button>
                </div>
              </div>
            ))
          )}
          {!categoryLoading && items.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-16">
              No items in this category
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button (visible when drawer closed and cart not empty) */}
      {!isCartOpen && cartCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2 z-30"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-bold">{cartCount}</span>
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        total={cartTotal}
        onPlaceOrder={handlePlaceOrder}
        placing={placing}
        // Order detail props
        orderSource={orderSource}
        setOrderSource={setOrderSource}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        tokenNumber={tokenNumber}
        setTokenNumber={setTokenNumber}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerMobile={customerMobile}
        setCustomerMobile={setCustomerMobile}
      />
    </div>
  );
}
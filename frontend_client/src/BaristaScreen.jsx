import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle, Clock, ShoppingBag, Coffee, 
  Utensils, LayoutGrid, Check, X, RefreshCw, ArrowLeft
} from 'lucide-react';

const ORDERS_API_URL = 'http://localhost:5000/api/v1/orders';
const MENU_API_URL = 'http://localhost:5000/api/v1/menu';

// 1. ГОЛОВНІ КАТЕГОРІЇ (КРОК 1)
const MAIN_CATEGORIES = [
  { 
    id: 'drinks', 
    name: 'Напої', 
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    id: 'dishes', 
    name: 'Страви', 
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800' 
  }
];

// 2. ПІДКАТЕГОРІЇ З ЗОБРАЖЕННЯМИ (КРОК 2)
const SUB_CATEGORIES = {
  drinks: [
    { 
      id: 'hot_drinks', 
      name: 'Гарячі напої', 
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=800' 
    },
    { 
      id: 'cold_drinks', 
      name: 'Холодні напої', 
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800' 
    }
  ],
  dishes: [
    { 
      id: 'desserts', 
      name: 'Десерти', 
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=800' 
    },
    { 
      id: 'lunches', 
      name: 'Ланчі', 
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800' 
    }
  ]
};

export default function BaristaScreen() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' або 'menu'
  
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Навігація по меню для баристи (Крок 1, 2, 3)
  const [menuStep, setMenuStep] = useState(1);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchMenu();

    const interval = setInterval(() => {
      fetchOrders();
      fetchMenu();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Завантаження замовлень
  const fetchOrders = async () => {
    let serverOrders = [];
    let hasServerError = false;

    try {
      const res = await axios.get(ORDERS_API_URL);
      if (Array.isArray(res.data)) {
        serverOrders = res.data;
      } else if (res.data && Array.isArray(res.data.orders)) {
        serverOrders = res.data.orders;
      } else if (res.data && Array.isArray(res.data.data)) {
        serverOrders = res.data.data;
      }
    } catch (err) {
      hasServerError = true;
    }

    let localOrders = [];
    try {
      const saved = localStorage.getItem('orders');
      if (saved) localOrders = JSON.parse(saved);
    } catch (e) {
      localOrders = [];
    }

    const combinedOrdersMap = new Map();

    localOrders.forEach((ord) => {
      const id = String(ord._id || ord.id);
      if (id) combinedOrdersMap.set(id, ord);
    });

    if (!hasServerError) {
      serverOrders.forEach((ord) => {
        const id = String(ord._id || ord.id);
        if (id) combinedOrdersMap.set(id, ord);
      });
    }

    const merged = Array.from(combinedOrdersMap.values());
    merged.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

    setOrders(merged);
  };

  // Завантаження меню
  const fetchMenu = async () => {
    try {
      const res = await axios.get(MENU_API_URL);
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && Array.isArray(res.data.menu)) {
        data = res.data.menu;
      } else if (res.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      }
      if (data.length > 0) {
        setMenuItems(data);
      }
    } catch (err) {
      console.error('Помилка завантаження меню:', err);
    }
  };

  // Зміна статусу замовлення
  const handleOrderStatusChange = async (orderId, newStatus) => {
    const completedAtIso = new Date().toISOString();

    const updatedOrders = orders.map((ord) => {
      const id = String(ord._id || ord.id);
      if (id === String(orderId)) {
        return {
          ...ord,
          status: newStatus,
          completedAt: newStatus === 'ready' ? completedAtIso : ord.completedAt
        };
      }
      return ord;
    });

    setOrders(updatedOrders);
    try {
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (e) {
      console.error('Помилка збереження в localStorage:', e);
    }

    try {
      await axios.put(`${ORDERS_API_URL}/${orderId}`, { 
        status: newStatus,
        completedAt: newStatus === 'ready' ? completedAtIso : undefined
      });
    } catch (err) {
      try {
        await axios.patch(`${ORDERS_API_URL}/${orderId}`, { 
          status: newStatus,
          completedAt: newStatus === 'ready' ? completedAtIso : undefined
        });
      } catch (patchErr) {
        console.error('Не вдалося оновити статус на сервері:', patchErr);
      }
    }

    fetchOrders();
  };

  // Перемикання наявності товару баристою
  const handleToggleAvailable = async (item) => {
    const itemId = item._id || item.id;
    const newStatus = item.isAvailable === false ? true : false;

    setMenuItems((prev) =>
      prev.map((i) => ((i._id || i.id) === itemId ? { ...i, isAvailable: newStatus } : i))
    );

    try {
      await axios.put(`${MENU_API_URL}/${itemId}`, { isAvailable: newStatus });
    } catch (err) {
      try {
        await axios.patch(`${MENU_API_URL}/${itemId}`, { isAvailable: newStatus });
      } catch (e) {
        console.error('Помилка зміни статусу в меню:', e);
      }
    }
    fetchMenu();
  };

  // Зміна кількості страв баристою
  const handleStockChange = async (item, newStock) => {
    const stockVal = Number(newStock);
    if (isNaN(stockVal) || stockVal < 0) return;
    const itemId = item._id || item.id;

    setMenuItems((prev) =>
      prev.map((i) =>
        (i._id || i.id) === itemId ? { ...i, stock: stockVal, isAvailable: stockVal > 0 } : i
      )
    );

    try {
      await axios.put(`${MENU_API_URL}/${itemId}`, {
        stock: stockVal,
        isAvailable: stockVal > 0
      });
    } catch (err) {
      try {
        await axios.patch(`${MENU_API_URL}/${itemId}`, {
          stock: stockVal,
          isAvailable: stockVal > 0
        });
      } catch (e) {
        console.error('Помилка оновлення кількості:', e);
      }
    }
    fetchMenu();
  };

  // Навігація по кроках меню
  const handleSelectMainCategory = (catId) => {
    setSelectedMainCategory(catId);
    setMenuStep(2);
  };

  const handleSelectSubCategory = (subId) => {
    setSelectedSubCategory(subId);
    setMenuStep(3);
  };

  const handleGoBackMenu = () => {
    if (menuStep === 3) {
      setSelectedSubCategory(null);
      setMenuStep(2);
    } else if (menuStep === 2) {
      setSelectedMainCategory(null);
      setMenuStep(1);
    }
  };

  // Ручне оновлення
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    await fetchMenu();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Фільтрація меню для кроку 3 (ідентична клієнтській)
  const filteredMenuItems = menuItems.filter((item) => {
    if (!selectedMainCategory) return true;

    const itemCat = item.category || item.type;
    const isDrink = itemCat === 'drinks' || itemCat === 'hot_drinks' || itemCat === 'cold_drinks';
    const isDish = itemCat === 'dishes' || itemCat === 'food' || itemCat === 'desserts' || itemCat === 'lunches';

    if (selectedMainCategory === 'drinks' && !isDrink) return false;
    if (selectedMainCategory === 'dishes' && !isDish) return false;

    if (selectedSubCategory) {
      const itemSub = item.subCategory || item.subCategoryName || item.category;
      if (itemSub && itemSub !== selectedSubCategory) {
        if (itemSub !== 'hot_drinks' && itemSub !== 'cold_drinks' && itemSub !== 'desserts' && itemSub !== 'lunches') {
          return true;
        }
        return false;
      }
    }

    return true;
  });

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'done' && o.status !== 'ready'
  ).length;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 md:p-8 font-sans" translate="no">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ВЕРХНЯ ШАПКА З ВКЛАДКАМИ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <Coffee className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-amber-500 tracking-tight">Екран Баристи</h1>
                <button 
                  onClick={handleManualRefresh}
                  title="Оновити дані"
                  className="p-1.5 text-stone-400 hover:text-amber-400 transition bg-stone-900 rounded-xl border border-stone-800"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-stone-400 text-xs">Прийом замовлень та керування наявністю</p>
            </div>
          </div>

          {/* ВКЛАДКИ */}
          <div className="flex bg-stone-900 border border-stone-800 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> 
              Замовлення ({activeOrdersCount})
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Меню / Наявність
            </button>
          </div>
        </div>

        {/* ================= ВКЛАДКА "ЗАМОВЛЕННЯ" ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-stone-200 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Активні замовлення
            </h2>

            {orders.length === 0 ? (
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-stone-600 mx-auto" />
                <p className="text-stone-400 font-bold text-sm">Немає нових замовлень</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order, idx) => {
                  const items = Array.isArray(order.items) 
                    ? order.items 
                    : Array.isArray(order.products) 
                    ? order.products 
                    : Array.isArray(order.cart) 
                    ? order.cart 
                    : [];

                  const orderId = order._id || order.id || idx;
                  const displayId = String(order.id || orderId).slice(-4);
                  const isReady = order.status === 'ready' || order.status === 'completed' || order.status === 'done';

                  return (
                    <div 
                      key={orderId} 
                      className={`bg-stone-900 border p-5 rounded-3xl flex flex-col justify-between space-y-4 transition ${
                        isReady ? 'border-emerald-500/30 opacity-75' : 'border-amber-500/30 shadow-lg'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                          <div>
                            <span className="font-black text-amber-400 text-base">
                              Замовлення #{displayId}
                            </span>
                            {order.userName && (
                              <span className="text-xs text-stone-400 block font-semibold">
                                Клієнт: {order.userName}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold uppercase ${
                            isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                          }`}>
                            {isReady ? 'Готово' : 'Готується'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {items.length === 0 ? (
                            <p className="text-xs text-stone-500 font-bold italic">Склад замовлення порожній</p>
                          ) : (
                            items.map((item, i) => {
                              const itemName = item.name || item.title || item.product?.name || 'Напій';
                              const itemMilk = item.milkName || item.milk;
                              const itemSize = item.size;

                              return (
                                <div key={i} className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-stone-200">
                                    {itemName} {itemSize ? `(${itemSize})` : ''} x{item.quantity || item.count || 1}
                                    {item.isFreeBonus && <span className="text-amber-400 ml-1">(🎁 Бонус)</span>}
                                  </span>
                                  {itemMilk && (
                                    <span className="text-[10px] text-amber-400 bg-stone-950 px-2 py-0.5 rounded-lg border border-stone-800">
                                      {itemMilk}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {order.comment && (
                          <div className="text-[11px] text-stone-400 bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                            <strong className="text-amber-500">Коментар:</strong> {order.comment}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
                        <div>
                          <div className="font-black text-sm text-stone-100">
                            {order.totalAmount || order.totalPrice || order.total || order.price || 0} ₴
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Оплата: {order.paymentMethod === 'card' ? 'Карткою' : 'Готівкою'}
                          </div>
                        </div>

                        {!isReady && (
                          <button
                            onClick={() => handleOrderStatusChange(orderId, 'ready')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                          >
                            <CheckCircle className="w-4 h-4" /> Позначити як Готово
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= ВКЛАДКА "МЕНЮ / НАЯВНІСТЬ" (ПОКРОКОВА ЯК У КЛІЄНТА) ================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6">

            {/* КНОПКА «НАЗАД» ДЛЯ КРОКІВ 2 ТА 3 */}
            {menuStep > 1 && (
              <button
                onClick={handleGoBackMenu}
                className="flex items-center gap-2 text-stone-200 font-extrabold bg-stone-900 px-5 py-2.5 rounded-2xl border border-stone-800 hover:bg-stone-800 transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-amber-500" />
                <span>Назад</span>
              </button>
            )}

            {/* КРОК 1: ДВІ ВЕЛИКІ КНОПКИ З КАРТИНКАМИ (Напої / Страви) */}
            {menuStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {MAIN_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectMainCategory(cat.id)}
                    className="group relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 text-left active:scale-98 border border-stone-800 cursor-pointer"
                  >
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent flex items-end p-8">
                      <span className="text-4xl font-black text-white tracking-wide group-hover:text-amber-400 transition-colors">
                        {cat.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* КРОК 2: ПІДКАТЕГОРІЇ З КАРТИНКАМИ */}
            {menuStep === 2 && selectedMainCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {SUB_CATEGORIES[selectedMainCategory].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubCategory(sub.id)}
                    className="group relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 text-left active:scale-98 border border-stone-800 cursor-pointer"
                  >
                    <img 
                      src={sub.image} 
                      alt={sub.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent flex items-end p-8">
                      <span className="text-3xl font-black text-white tracking-wide group-hover:text-amber-400 transition-colors">
                        {sub.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* КРОК 3: КАРТКИ ТОВАРІВ З КНОПКОЮ НАЯВНОСТІ */}
            {menuStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {filteredMenuItems.length === 0 ? (
                  <div className="col-span-full bg-stone-900 rounded-3xl p-12 text-center border border-stone-800 space-y-2">
                    <p className="text-stone-400 font-bold">У цій категорії поки немає товарів.</p>
                  </div>
                ) : (
                  filteredMenuItems.map((item) => {
                    const itemId = item._id || item.id;
                    const isAvailable = item.isAvailable !== false;
                    const cat = item.category || item.type;
                    const isFood = cat === 'food' || cat === 'dishes' || cat === 'desserts' || cat === 'lunches';

                    const itemPriceDisplay = item.prices 
                      ? (typeof item.prices === 'object' ? `від ${item.prices.small || Object.values(item.prices)[0]} ₴` : `${item.prices} ₴`)
                      : `${item.price || 0} ₴`;

                    return (
                      <div
                        key={itemId}
                        className={`bg-stone-900 rounded-3xl overflow-hidden border transition-all flex flex-col justify-between hover:border-stone-700 shadow-md ${
                          !isAvailable ? 'border-rose-900/50 bg-stone-900/60' : 'border-stone-800'
                        }`}
                      >
                        <div>
                          <div className="h-60 overflow-hidden relative group bg-stone-950">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                                  !isAvailable ? 'grayscale-[50%] opacity-50' : ''
                                }`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-600 font-bold">
                                Без фото
                              </div>
                            )}

                            {!isAvailable && (
                              <div className="absolute inset-0 bg-stone-950/70 flex items-center justify-center">
                                <span className="bg-rose-600/90 text-white text-xs font-black px-4 py-2 rounded-2xl uppercase tracking-wider shadow-lg border border-rose-500/30">
                                  Немає в наявності
                                </span>
                              </div>
                            )}

                            <span className="absolute bottom-4 right-4 bg-stone-950/90 text-amber-400 px-5 py-2 rounded-full font-black text-lg backdrop-blur-md shadow-md border border-stone-800">
                              {itemPriceDisplay}
                            </span>
                          </div>

                          <div className="p-6 space-y-3">
                            <h3 className="font-black text-2xl text-stone-100 leading-tight">{item.name}</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">{item.description}</p>
                            
                            {/* Редагування кількості для страв */}
                            {isFood && (
                              <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
                                <span className="text-xs text-stone-400 font-bold">Залишок в наявності:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.stock ?? 0}
                                  onChange={(e) => handleStockChange(item, e.target.value)}
                                  className="w-16 px-2 py-1 bg-stone-950 border border-stone-700 rounded-xl text-center text-sm font-black text-amber-400 focus:outline-none focus:border-amber-500"
                                />
                                <span className="text-xs text-stone-500 font-bold">шт.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* КНОПКА ЗМІНИ НАЯВНОСТІ (ЗАМІСТЬ ДОДАТИ У КОШИК) */}
                        <div className="p-6 pt-0">
                          <button
                            onClick={() => handleToggleAvailable(item)}
                            className={`w-full font-black py-4 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all text-base cursor-pointer active:scale-98 ${
                              isAvailable
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                          >
                            {isAvailable ? (
                              <>
                                <Check className="w-5 h-5 text-emerald-400" />
                                <span>В наявності (Натисніть щоб вимкнути)</span>
                              </>
                            ) : (
                              <>
                                <X className="w-5 h-5 text-rose-400" />
                                <span>Немає (Натисніть щоб увімкнути)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, Plus, Minus, Trash2, X, User, 
  ShoppingBag, CreditCard, Banknote, AlertCircle, CheckCircle2, Milk,
  Gift, Key, Check, ArrowLeft
} from 'lucide-react';

const ORDERS_API_URL = 'http://localhost:5000/api/v1/orders';
const MENU_API_URL = 'http://localhost:5000/api/v1/menu';

// Варіанти молока
const MILK_OPTIONS = [
  { id: 'regular', name: 'Ззвичайне', price: 0 },
  { id: 'oat', name: 'Вівсяне', price: 15 },
  { id: 'almond', name: 'Мигдалеве', price: 20 },
  { id: 'coconut', name: 'Кокосове', price: 20 },
  { id: 'lactoseFree', name: 'Безлактозне', price: 10 }
];

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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('items'); // 'items', 'orders', 'account'
  
  // Покрокова навігація по меню
  const [menuStep, setMenuStep] = useState(1);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Стан для динамічного меню з сервера
  const [menuItems, setMenuItems] = useState([]);

  // Отримання актуального меню з сервера
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
      setMenuItems(data);
    } catch (err) {
      console.error('Помилка завантаження меню з сервера:', err);
    }
  };

  // Користувач та замовлення
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [userOrders, setUserOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Отримання замовлень з сервера із синхронізацією статусів від баристи
  const fetchOrders = async () => {
    try {
      const res = await axios.get(ORDERS_API_URL);
      let serverOrders = [];
      if (Array.isArray(res.data)) {
        serverOrders = res.data;
      } else if (res.data && Array.isArray(res.data.orders)) {
        serverOrders = res.data.orders;
      } else if (res.data && Array.isArray(res.data.data)) {
        serverOrders = res.data.data;
      }

      let localOrders = [];
      try {
        const saved = localStorage.getItem('orders');
        if (saved) localOrders = JSON.parse(saved);
      } catch (e) {
        localOrders = [];
      }

      // Об'єднуємо замовлення, оновлюючи статуси з сервера
      const combinedMap = new Map();

      localOrders.forEach((ord) => {
        const key = String(ord._id || ord.id);
        if (key) combinedMap.set(key, ord);
      });

      serverOrders.forEach((ord) => {
        const key = String(ord._id || ord.id);
        if (key) {
          const existing = combinedMap.get(key);
          // Збереження або оновлення статусу та часу завершення
          combinedMap.set(key, {
            ...existing,
            ...ord,
            status: ord.status || existing?.status,
            completedAt: ord.completedAt || existing?.completedAt
          });
        }
      });

      const updatedList = Array.from(combinedMap.values());
      setUserOrders(updatedList);
      localStorage.setItem('orders', JSON.stringify(updatedList));
    } catch (err) {
      console.error('Помилка завантаження замовлень з сервера:', err);
    }
  };

  // ТАЙМЕР І АВТО-ОПИТУВАННЯ СЕРВЕРА КОЖНІ 2-3 СЕКУНДИ
  const [, setTick] = useState(0);
  useEffect(() => {
    fetchMenu();
    fetchOrders();

    // Оновлення таймера секундоміра щосекунди
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    // Автоматичне отримання оновлень статусів від баристи кожні 2.5 секунди
    const pollingInterval = setInterval(() => {
      fetchOrders();
      fetchMenu();
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(pollingInterval);
    };
  }, []);

  // Зміна пароля
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Кошик і модалки
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [modalSize, setModalSize] = useState('small');
  const [selectedMilk, setSelectedMilk] = useState(MILK_OPTIONS[0]);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Оформлення
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderComment, setOrderComment] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState('');

  // Авторизація
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', password: '' });

  // Навігація меню
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

  const resetMenuToHome = () => {
    setCurrentScreen('items');
    setMenuStep(1);
    setSelectedMainCategory(null);
    setSelectedSubCategory(null);
  };

  // Перевірка належності замовлення
  const isOrderBelongsToUser = (order, user) => {
    if (!order || !user) return false;

    const userId = user._id || user.id;
    const orderUserId = order.userId || order.user?._id || order.user?.id || order.user;

    if (userId && orderUserId && String(userId) === String(orderUserId)) {
      return true;
    }

    const orderUserName = order.userName || order.user?.name || order.name;
    if (user.name && orderUserName && String(user.name).trim().toLowerCase() === String(orderUserName).trim().toLowerCase()) {
      return true;
    }

    if (order.isLocal) {
      return true;
    }

    return false;
  };

  const getSizeLabel = (sizeKey) => {
    const labels = { small: 'Малий (S)', medium: 'Середній (M)', large: 'Великий (L)' };
    return labels[sizeKey] || sizeKey;
  };

  // РОЗРАХУНОК ТАЙМЕРА ТА СТАТУСУ В РЕАЛЬНОМУ ЧАСІ
  const getOrderTimer = (order) => {
    const isReadyStatus = order.status === 'ready' || order.status === 'completed' || order.status === 'done';

    if (!isReadyStatus && !order.completedAt) {
      return { status: 'Готується', timeString: '15:00', isReady: false, isExpired: false };
    }

    const readyTime = order.completedAt ? new Date(order.completedAt).getTime() : new Date().getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - readyTime) / 1000);
    const totalDurationSeconds = 15 * 60;

    if (elapsedSeconds >= totalDurationSeconds) {
      return { status: 'Завершено', timeString: '00:00', isReady: true, isExpired: true };
    }

    const remainingSeconds = totalDurationSeconds - elapsedSeconds;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const timeString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return { status: 'Готово! Заберіть', timeString, isReady: true, isExpired: false };
  };

  const handleStartOrderItem = (item) => {
    setSelectedItemForModal(item);
    setModalSize(item.prices ? Object.keys(item.prices)[0] : 'small');
    setSelectedMilk(MILK_OPTIONS[0]);
    setModalQuantity(1);
  };

  const addToCart = (item, size, milk, isFreeBonus = false, quantity = 1) => {
    const basePrice = item.prices ? item.prices[size] : item.price;
    const itemPrice = isFreeBonus ? 0 : basePrice + (milk && (item.category === 'drinks' || item.category === 'hot_drinks' || item.category === 'cold_drinks') ? milk.price : 0);
    const cartItemId = `${item._id || item.id}-${size}-${milk?.id || 'none'}-${isFreeBonus}`;

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prevCart.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prevCart,
        {
          cartItemId,
          id: item._id || item.id,
          name: item.name,
          size,
          milkName: (item.category === 'drinks' || item.category === 'hot_drinks' || item.category === 'cold_drinks') ? (milk ? milk.name : '') : '',
          price: itemPrice,
          quantity,
          isFreeBonus
        }
      ];
    });

    setSelectedItemForModal(null);
  };

  // Отримання бонусної кави
  const handleClaimBonus = () => {
    if (!currentUser || (currentUser.purchaseCount || 0) < 10) return;

    const bonusItem = menuItems.find((i) => i.category === 'drinks' || i.subCategory === 'hot_drinks') || menuItems[0];
    if (bonusItem) {
      addToCart(bonusItem, 'small', MILK_OPTIONS[0], true, 1);
    }

    const updatedUser = {
      ...currentUser,
      purchaseCount: currentUser.purchaseCount - 10
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenCheckout = () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setShowAuthModal(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  // НАДСИЛАННЯ НА СЕРВЕР І МИТТЄВЕ ЗБЕРЕЖЕННЯ В UI
  const handleFinalOrderSubmit = async () => {
    const newOrderId = Math.floor(1000 + Math.random() * 9000).toString();
    const orderData = {
      id: newOrderId,
      _id: 'ord_' + Date.now(),
      userId: currentUser._id || currentUser.id,
      userName: currentUser.name,
      items: cart,
      paymentMethod,
      comment: orderComment,
      totalAmount: calculateTotal(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'pending',
      isLocal: true
    };

    const updatedOrders = [orderData, ...userOrders];
    setUserOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));

    try {
      await axios.post(ORDERS_API_URL, orderData);

      const updatedUser = {
        ...currentUser,
        purchaseCount: (currentUser.purchaseCount || 0) + totalCartItemsCount
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setLastOrderNumber(newOrderId);
      setCart([]);
      setOrderComment('');
      setIsCheckoutModalOpen(false);
      setOrderSuccess(true);
      
      fetchOrders();
    } catch (err) {
      console.error('Помилка надсилання замовлення на сервер:', err);
      setLastOrderNumber(newOrderId);
      setCart([]);
      setOrderComment('');
      setIsCheckoutModalOpen(false);
      setOrderSuccess(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    resetMenuToHome();
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!authForm.name.trim() || !authForm.password.trim()) {
      setAuthError('Заповніть всі поля');
      return;
    }

    const mockUser = {
      _id: 'user_' + Date.now(),
      name: authForm.name,
      password: authForm.password,
      purchaseCount: 0
    };

    localStorage.setItem('user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    setShowAuthModal(false);
    setAuthError('');
    setAuthForm({ name: '', password: '' });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Заповніть усі поля' });
      return;
    }

    if (currentUser.password && passwordForm.oldPassword !== currentUser.password) {
      setPasswordMsg({ type: 'error', text: 'Невірний поточний пароль' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Нові паролі не збігаються' });
      return;
    }

    const updatedUser = { ...currentUser, password: passwordForm.newPassword };
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    setPasswordMsg({ type: 'success', text: 'Пароль успішно змінено!' });
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Фільтрація товарів
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

  // Замовлення поточного користувача
  const myOrders = userOrders.filter(o => isOrderBelongsToUser(o, currentUser));

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-28 font-sans">
      
      {/* ВЕРХНЯ ПАНЕЛЬ */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 
            onClick={resetMenuToHome}
            className="text-2xl font-black text-amber-950 cursor-pointer tracking-tight flex items-center gap-2"
          >
            🍕 Coffee & Food
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={resetMenuToHome}
              className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                currentScreen === 'items' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Меню
            </button>

            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    fetchOrders();
                    setCurrentScreen('orders');
                  }}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all relative ${
                    currentScreen === 'orders' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Замовлення
                  {myOrders.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-stone-900 text-amber-400 text-[10px] rounded-full font-black">
                      {myOrders.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentScreen('account')}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                    currentScreen === 'account' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Кабінет
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-2xl text-sm font-black transition shadow"
              >
                Увійти
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-stone-900 text-white p-2.5 rounded-2xl relative hover:bg-stone-800 transition ml-1 shadow-md"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-stone-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {totalCartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ОСНОВНА ЧАСТИНА */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        
        {currentScreen === 'items' && (
          <div className="space-y-6">

            {/* КНОПКА «НАЗАД» */}
            {menuStep > 1 && (
              <button
                onClick={handleGoBackMenu}
                className="flex items-center gap-2 text-stone-700 font-extrabold bg-white px-5 py-2.5 rounded-2xl border border-stone-200 shadow-sm hover:bg-stone-50 transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-amber-600" />
                <span>Назад</span>
              </button>
            )}

            {/* КРОК 1 */}
            {menuStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {MAIN_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectMainCategory(cat.id)}
                    className="group relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 text-left active:scale-98 border border-stone-200 cursor-pointer"
                  >
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
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

            {/* КРОК 2 */}
            {menuStep === 2 && selectedMainCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {SUB_CATEGORIES[selectedMainCategory].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubCategory(sub.id)}
                    className="group relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 text-left active:scale-98 border border-stone-200 cursor-pointer"
                  >
                    <img 
                      src={sub.image} 
                      alt={sub.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
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

            {/* КРОК 3 */}
            {menuStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {filteredMenuItems.length === 0 ? (
                  <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-2">
                    <p className="text-stone-500 font-bold">В цій категорії поки немає товарів.</p>
                  </div>
                ) : (
                  filteredMenuItems.map((item) => {
                    const isAvailable = item.isAvailable !== false && (item.category !== 'dishes' && item.category !== 'food' || (item.stock ?? 1) > 0);
                    const itemPriceDisplay = item.prices 
                      ? (typeof item.prices === 'object' ? `від ${item.prices.small || Object.values(item.prices)[0]} ₴` : `${item.prices} ₴`)
                      : `${item.price || 0} ₴`;

                    return (
                      <div
                        key={item._id || item.id}
                        className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200 transition-all flex flex-col justify-between hover:shadow-xl ${
                          !isAvailable ? 'opacity-60 grayscale-[30%]' : ''
                        }`}
                      >
                        <div>
                          <div className="h-60 overflow-hidden relative group bg-stone-100">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                                Без фото
                              </div>
                            )}
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center">
                                <span className="bg-rose-600 text-white text-xs font-black px-4 py-2 rounded-2xl uppercase tracking-wider shadow-lg">
                                  Немає в наявності
                                </span>
                              </div>
                            )}
                            <span className="absolute bottom-4 right-4 bg-stone-900/90 text-amber-400 px-5 py-2 rounded-full font-black text-lg backdrop-blur-md shadow-md">
                              {itemPriceDisplay}
                            </span>
                          </div>

                          <div className="p-6 space-y-2">
                            <h3 className="font-black text-2xl text-stone-900 leading-tight">{item.name}</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">{item.description}</p>
                            {(item.category === 'dishes' || item.category === 'food') && isAvailable && (
                              <p className="text-xs text-amber-700 font-bold pt-1">В наявності: {item.stock ?? 0} шт.</p>
                            )}
                          </div>
                        </div>

                        <div className="p-6 pt-0">
                          <button
                            disabled={!isAvailable}
                            onClick={() => handleStartOrderItem(item)}
                            className={`w-full font-black py-4 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all text-base ${
                              isAvailable
                                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-98 cursor-pointer'
                                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            }`}
                          >
                            <Plus className="w-5 h-5" />
                            {isAvailable ? 'Замовити' : 'Закінчилось'}
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

        {/* ЕКРАН ЗАМОВЛЕНЬ */}
        {currentScreen === 'orders' && currentUser && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-600" /> Мої замовлення
            </h2>

            {myOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-3">
                <p className="text-stone-500 font-medium">У вас поки немає оформлених замовлень.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((ord, idx) => {
                  const timerInfo = getOrderTimer(ord);
                  const orderId = ord._id || ord.id || idx;
                  const items = Array.isArray(ord.items) ? ord.items : (Array.isArray(ord.products) ? ord.products : []);

                  return (
                    <div key={orderId} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
                      <div className="flex justify-between items-start border-b pb-3 border-stone-100">
                        <div>
                          <span className="text-xs text-stone-400 font-bold uppercase block">Замовлення</span>
                          <span className="text-2xl font-black text-amber-950">#{String(ord.id || orderId).slice(-4)}</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                            timerInfo.isReady 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-950 border border-amber-300'
                          }`}>
                            {timerInfo.status}
                          </span>
                          
                          {timerInfo.isReady && !timerInfo.isExpired && (
                            <div className="text-xl font-black text-emerald-600 tracking-wider mt-1 font-mono">
                              ⏱️ {timerInfo.timeString}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 divide-y divide-stone-50">
                        {items.map((it, i) => (
                          <div key={i} className="flex justify-between text-sm py-1.5">
                            <span className="font-semibold text-stone-800">
                              {it.name || it.title} {it.size && `(${getSizeLabel(it.size).split(' ')[0]})`} {it.milkName || it.milk}
                              <span className="text-stone-400 font-normal"> x{it.quantity || 1}</span>
                            </span>
                            <span className="font-bold text-stone-900">
                              {it.isFreeBonus ? '0 ₴ (🎁)' : `${(it.price || 0) * (it.quantity || 1)} ₴`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {ord.comment && (
                        <p className="text-xs text-stone-500 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                          <strong>Коментар:</strong> {ord.comment}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-xs text-stone-500">
                        <span>Оплата: <strong className="text-stone-800">{ord.paymentMethod === 'card' ? 'Карткою' : 'Готівкою'}</strong></span>
                        <span className="text-lg font-black text-amber-950">Разом: {ord.totalAmount || ord.totalPrice || ord.total || 0} ₴</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ЕКРАН КАБІНЕТУ */}
        {currentScreen === 'account' && currentUser && (
          <div className="space-y-6 max-w-xl mx-auto">
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full text-amber-700">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-900">{currentUser.name}</h3>
                  <p className="text-xs text-stone-400 font-semibold">Клієнт кофейні</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs transition cursor-pointer"
              >
                Вийти
              </button>
            </div>

            {/* ПРОГРАМА ЛОЯЛЬНОСТІ */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-amber-600" />
                  <h4 className="text-lg font-black text-stone-900">Програма лояльності</h4>
                </div>
                <span className="text-sm font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {currentUser.purchaseCount || 0} / 10 позицій
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden p-0.5 border border-stone-200">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((currentUser.purchaseCount || 0) % 10) * 10)}%` }}
                  />
                </div>
                <p className="text-xs text-stone-500 font-medium text-right">
                  Залишилось придбати: <strong className="text-amber-800">{10 - ((currentUser.purchaseCount || 0) % 10)} позицій</strong> до бонусу
                </p>
              </div>

              {(currentUser.purchaseCount || 0) >= 10 ? (
                <div className="bg-gradient-to-r from-amber-500 to-amber-400 p-4 rounded-2xl text-stone-950 space-y-2 shadow-lg">
                  <p className="font-black text-sm flex items-center gap-2">
                    <Gift className="w-5 h-5" /> Вітаємо! Ви накопичили на бонус!
                  </p>
                  <button
                    onClick={handleClaimBonus}
                    className="w-full py-3 bg-stone-950 hover:bg-stone-800 text-white font-black rounded-xl text-sm transition shadow active:scale-98 cursor-pointer"
                  >
                    Забрати безкоштовний кавовий бонус 🎁
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  💡 Накопичуйте 10 куплених позицій і отримуйте **будь-яку каву в подарунок!**
                </p>
              )}
            </div>

            {/* ЗМІНА ПАРОЛЯ */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Key className="w-5 h-5 text-amber-600" />
                <h4 className="text-lg font-black text-stone-900">Зміна пароля</h4>
              </div>

              {passwordMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  passwordMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {passwordMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Поточний пароль</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Новий пароль</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Підтвердіть новий пароль</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl text-sm transition shadow cursor-pointer"
                >
                  Оновити пароль
                </button>
              </form>
            </div>

          </div>
        )}

      </main>

      {/* МОДАЛКА НАЛАШТУВАННЯ */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedItemForModal(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex gap-4 items-center border-b border-stone-100 pb-4">
              <img src={selectedItemForModal.image} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
              <div>
                <h3 className="font-black text-xl text-stone-900">{selectedItemForModal.name}</h3>
                <p className="text-xs text-stone-500 leading-snug">{selectedItemForModal.description}</p>
              </div>
            </div>

            {selectedItemForModal.prices && typeof selectedItemForModal.prices === 'object' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Розмір</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(selectedItemForModal.prices).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setModalSize(sz)}
                      className={`py-3 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                        modalSize === sz
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span>{getSizeLabel(sz)}</span>
                      <span className="text-[11px] text-stone-400">{selectedItemForModal.prices[sz]} ₴</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedItemForModal.category === 'drinks' || selectedItemForModal.category === 'hot_drinks' || selectedItemForModal.category === 'cold_drinks') && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                  <Milk className="w-4 h-4 text-amber-600" /> Молоко
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {MILK_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMilk(m)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition flex justify-between items-center cursor-pointer ${
                        selectedMilk.id === m.id
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-sm'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="text-[10px] text-stone-400 font-normal">{m.price > 0 ? `+${m.price}₴` : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3 bg-stone-100 rounded-2xl p-1.5">
                <button
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-stone-700 shadow-sm hover:bg-stone-50 active:scale-95 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-base w-5 text-center">{modalQuantity}</span>
                <button
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-stone-700 shadow-sm hover:bg-stone-50 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => addToCart(selectedItemForModal, modalSize, selectedMilk, false, modalQuantity)}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-6 py-3.5 rounded-2xl shadow-md transition text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Додати</span>
                <span>•</span>
                <span>
                  {((selectedItemForModal.prices ? (selectedItemForModal.prices[modalSize] || Number(selectedItemForModal.prices) || 0) : (selectedItemForModal.price || 0)) + ((selectedItemForModal.category === 'drinks' || selectedItemForModal.category === 'hot_drinks' || selectedItemForModal.category === 'cold_drinks') ? selectedMilk.price : 0)) * modalQuantity} ₴
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА КОШИКА */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-stone-100 pb-4 mb-4">
                <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" /> Кошик
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-stone-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto stroke-1" />
                  <p className="text-sm font-medium">Ваш кошик порожній</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between items-center bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm text-stone-900">{item.name}</h4>
                        <p className="text-[11px] text-stone-500">
                          {item.size && getSizeLabel(item.size).split(' ')[0]} {item.milkName}
                        </p>
                        <p className="text-xs font-black text-amber-700">
                          {item.isFreeBonus ? 'Безкоштовно (🎁)' : `${item.price * item.quantity} ₴`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-stone-100 pt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-black text-stone-900">
                  <span>До сплати:</span>
                  <span className="text-amber-600">{calculateTotal()} ₴</span>
                </div>
                <button
                  onClick={handleOpenCheckout}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-4 rounded-2xl shadow transition text-center text-base cursor-pointer"
                >
                  Оформити замовлення
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-stone-900">Деталі замовлення</h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase">Спосіб оплати</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-600" /> Карткою
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-600" /> Готівкою
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase">Коментар до замовлення</label>
                <textarea
                  rows="3"
                  placeholder="Наприклад: без солі..."
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  className="w-full p-3 text-sm rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl space-y-1">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Позицій:</span>
                  <span>{totalCartItemsCount} шт.</span>
                </div>
                <div className="flex justify-between text-base font-black text-stone-900 pt-1 border-t border-stone-200/60">
                  <span>Разом:</span>
                  <span className="text-amber-600">{calculateTotal()} ₴</span>
                </div>
              </div>

              <button
                onClick={handleFinalOrderSubmit}
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-4 rounded-2xl shadow transition cursor-pointer"
              >
                Підтвердити замовлення
              </button>
            </div>
          </div>
        </div>
      )}

      {/* АВТОРИЗАЦІЯ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-stone-900">Вхід в акаунт</h3>
            </div>

            {authError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Ім'я"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3.5 rounded-xl text-sm transition shadow cursor-pointer"
              >
                Увійти
              </button>
            </form>
          </div>
        </div>
      )}

      {/* УСПІШНЕ ЗАМОВЛЕННЯ */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-stone-900">Замовлення прийнято!</h3>
              <p className="text-xs text-stone-500">Номер замовлення:</p>
              <p className="text-3xl font-black text-amber-600">#{lastOrderNumber}</p>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Зворотний відлік на 15 хвилин запуститься, як тільки замовлення буде готове.
            </p>

            <button
              onClick={() => {
                setOrderSuccess(false);
                setCurrentScreen('orders');
              }}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-2xl text-sm transition cursor-pointer"
            >
              Перейти до замовлень
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
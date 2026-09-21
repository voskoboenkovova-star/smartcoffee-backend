import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Coffee, Utensils, Flame, Snowflake, Cake, 
  Milk, Image as ImageIcon, Trash2, Lock, BarChart3, LayoutGrid, ShoppingBag, TrendingUp, DollarSign, RefreshCw, Check, X, ArrowLeft, CheckCircle2, AlertTriangle
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/v1/menu';
const ORDERS_API_URL = 'http://localhost:5000/api/v1/orders';

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

export default function AdminPanel() {
  const [activeMainTab, setActiveMainTab] = useState('add'); // 'add', 'menu', 'stats'
  
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Стан для красивих модальних вікон
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);

  // Покрокова навігація по меню для адміна
  const [menuStep, setMenuStep] = useState(1);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Основні поля форми додавання
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('drinks');
  const [subCategory, setSubCategory] = useState('hot_drinks');

  // Ціни та параметри для страв
  const [foodPrice, setFoodPrice] = useState('');
  const [foodStock, setFoodStock] = useState('10');

  // Ціни та параметри для напоїв
  const [priceSmall, setPriceSmall] = useState('');
  const [priceMedium, setPriceMedium] = useState('');
  const [priceLarge, setPriceLarge] = useState('');
  const [hasMilkOptions, setHasMilkOptions] = useState(true);

  useEffect(() => {
    fetchMenu();
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
      fetchMenu();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    if (newCategory === 'drinks') {
      setSubCategory('hot_drinks');
    } else {
      setSubCategory('desserts');
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await axios.get(API_URL);
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
      console.error('Помилка завантаження меню:', err);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    let serverOrders = [];
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
      console.warn('Сервер замовлень недоступний, використовуємо localStorage');
    }

    let localOrders = [];
    try {
      const saved = localStorage.getItem('orders');
      if (saved) localOrders = JSON.parse(saved);
    } catch (e) {
      localOrders = [];
    }

    const combinedMap = new Map();
    localOrders.forEach(o => combinedMap.set(String(o._id || o.id), o));
    serverOrders.forEach(o => combinedMap.set(String(o._id || o.id), o));

    const finalOrders = Array.from(combinedMap.values());
    setOrders(finalOrders);
    setLoadingOrders(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !imageUrl) {
      return;
    }

    const payload = {
      name,
      description,
      image: imageUrl,
      category,
      subCategory,
      isAvailable: true,
    };

    if (category === 'drinks') {
      payload.prices = {
        small: Number(priceSmall) || 0,
        medium: Number(priceMedium) || 0,
        large: Number(priceLarge) || 0,
      };
      payload.price = Number(priceSmall) || 0;
      payload.hasMilkOptions = hasMilkOptions;
    } else {
      payload.price = Number(foodPrice) || 0;
      payload.stock = Number(foodStock) || 0;
      payload.prices = null;
      payload.hasMilkOptions = false;
    }

    try {
      await axios.post(API_URL, payload);
      
      setName('');
      setDescription('');
      setImageUrl('');
      setFoodPrice('');
      setPriceSmall('');
      setPriceMedium('');
      setPriceLarge('');
      
      setSuccessModalOpen(true);
      fetchMenu();
    } catch (err) {
      console.error('Помилка створення:', err);
    }
  };

  // Виклик модалки видалення
  const confirmDelete = (id) => {
    setItemToDeleteId(id);
    setDeleteModalOpen(true);
  };

  // Підтвердження видалення
  const executeDelete = async () => {
    if (!itemToDeleteId) return;
    try {
      await axios.delete(`${API_URL}/${itemToDeleteId}`);
      setDeleteModalOpen(false);
      setItemToDeleteId(null);
      fetchMenu();
    } catch (err) {
      console.error('Помилка видалення:', err);
      setDeleteModalOpen(false);
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      const itemId = item._id || item.id;
      const newStatus = item.isAvailable === false ? true : false;
      await axios.put(`${API_URL}/${itemId}`, {
        isAvailable: newStatus,
      });
      fetchMenu();
    } catch (err) {
      console.error('Помилка оновлення статусу:', err);
    }
  };

  const handleStockChange = async (item, newStock) => {
    const stockVal = Number(newStock);
    if (isNaN(stockVal) || stockVal < 0) return;

    try {
      const itemId = item._id || item.id;
      await axios.put(`${API_URL}/${itemId}`, {
        stock: stockVal,
        isAvailable: stockVal > 0
      });
      fetchMenu();
    } catch (err) {
      console.error('Помилка оновлення кількості:', err);
    }
  };

  const renderPriceText = (item) => {
    if (item.category === 'drinks' && item.prices) {
      const s = item.prices.small ?? 0;
      const m = item.prices.medium ?? 0;
      const l = item.prices.large ?? 0;
      return `S: ${s}₴ / M: ${m}₴ / L: ${l}₴`;
    }
    return `${item.price ?? 0} ₴`;
  };

  const calculateOrderTotal = (order) => {
    return Number(order.totalAmount || order.total || order.price || order.totalPrice || 0);
  };

  const totalRevenue = orders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-4 md:p-8 font-sans" translate="no">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ВЕРХНЯ ШАПКА ТА ПЕРЕМИКАННЯ ВКЛАДОК */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-amber-500 tracking-tight flex items-center gap-2">
              <Lock className="w-7 h-7 text-amber-500" /> Панель Управління Адміна
            </h1>
            <p className="text-stone-400 text-xs mt-1">Додавання товарів, керування асортиментом та статистика</p>
          </div>

          <div className="flex bg-stone-900 border border-stone-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveMainTab('add')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeMainTab === 'add'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Plus className="w-4 h-4" /> Додати товар
            </button>
            <button
              onClick={() => setActiveMainTab('menu')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeMainTab === 'menu'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Меню / Наявність
            </button>
            <button
              onClick={() => setActiveMainTab('stats')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeMainTab === 'stats'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Статистика
            </button>
          </div>
        </div>

        {/* ================= ВКЛАДКА "ДОДАТИ ТОВАР" ================= */}
        {activeMainTab === 'add' && (
          <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
            <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Додати нову позицію в меню
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-500" /> Фото товару:
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-xs text-stone-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-stone-950 hover:file:bg-amber-400 cursor-pointer bg-stone-950 rounded-2xl border border-stone-800 p-1"
                  />
                  <span className="text-stone-500 text-xs font-bold uppercase">Або URL:</span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full p-3 bg-stone-950 border border-stone-800 rounded-2xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {imageUrl && (
                  <div className="mt-2 h-24 w-24 rounded-2xl overflow-hidden border border-stone-700">
                    <img src={imageUrl} alt="Прев'ю" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Назва товару:</label>
                <input
                  type="text"
                  placeholder="Наприклад: Капучино, Сирники з джемом..."
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 bg-stone-950 border border-stone-800 rounded-2xl text-sm font-bold text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Тип товару:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('drinks')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      category === 'drinks'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                        : 'border-stone-800 bg-stone-950 text-stone-400'
                    }`}
                  >
                    <Coffee className="w-4 h-4" /> <span>Напої (drinks)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('food')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      category === 'food'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                        : 'border-stone-800 bg-stone-950 text-stone-400'
                    }`}
                  >
                    <Utensils className="w-4 h-4" /> <span>Страви (food)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Підкатегорія:</label>
                {category === 'drinks' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSubCategory('hot_drinks')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        subCategory === 'hot_drinks'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-stone-800 bg-stone-950 text-stone-400'
                      }`}
                    >
                      <Flame className="w-4 h-4 text-amber-500" /> <span>Гарячі напої</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubCategory('cold_drinks')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        subCategory === 'cold_drinks'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                          : 'border-stone-800 bg-stone-950 text-stone-400'
                      }`}
                    >
                      <Snowflake className="w-4 h-4 text-sky-400" /> <span>Холодні напої</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSubCategory('desserts')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        subCategory === 'desserts'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-stone-800 bg-stone-950 text-stone-400'
                      }`}
                    >
                      <Cake className="w-4 h-4 text-amber-400" /> <span>Десерти</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubCategory('lunches')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        subCategory === 'lunches'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-stone-800 bg-stone-950 text-stone-400'
                      }`}
                    >
                      <Utensils className="w-4 h-4 text-amber-400" /> <span>Ланчі</span>
                    </button>
                  </div>
                )}
              </div>

              {category === 'drinks' ? (
                <div className="space-y-4 md:col-span-2 bg-stone-950 p-4 rounded-2xl border border-stone-800">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Ціни по розмірах (₴):
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold block mb-1">S (Малий)</span>
                      <input
                        type="number"
                        placeholder="Ціна S"
                        required
                        value={priceSmall}
                        onChange={(e) => setPriceSmall(e.target.value)}
                        className="w-full p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold block mb-1">M (Середній)</span>
                      <input
                        type="number"
                        placeholder="Ціна M"
                        required
                        value={priceMedium}
                        onChange={(e) => setPriceMedium(e.target.value)}
                        className="w-full p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold block mb-1">L (Великий)</span>
                      <input
                        type="number"
                        placeholder="Ціна L"
                        required
                        value={priceLarge}
                        onChange={(e) => setPriceLarge(e.target.value)}
                        className="w-full p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="milkCheckbox"
                      checked={hasMilkOptions}
                      onChange={(e) => setHasMilkOptions(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <label htmlFor="milkCheckbox" className="text-xs font-bold text-stone-300 flex items-center gap-1.5 cursor-pointer">
                      <Milk className="w-4 h-4 text-amber-500" /> Дозволити вибір альтернативного молока в меню
                    </label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:col-span-2 bg-stone-950 p-4 rounded-2xl border border-stone-800">
                  <div>
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">Ціна (₴):</label>
                    <input
                      type="number"
                      placeholder="Ціна"
                      required
                      value={foodPrice}
                      onChange={(e) => setFoodPrice(e.target.value)}
                      className="w-full p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">Залишок (шт.):</label>
                    <input
                      type="number"
                      placeholder="Кількість"
                      required
                      value={foodStock}
                      onChange={(e) => setFoodStock(e.target.value)}
                      className="w-full p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Опис товару:</label>
                <textarea
                  placeholder="Опишіть інгредієнти, смакові якості чи алергени..."
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 bg-stone-950 border border-stone-800 rounded-2xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-4 rounded-2xl shadow-lg transition active:scale-95 text-center text-sm uppercase tracking-wider cursor-pointer"
            >
              Додати в меню
            </button>
          </form>
        )}

        {/* ================= ВКЛАДКА "МЕНЮ / НАЯВНІСТЬ ТА ВИДАЛЕННЯ" (ПОКРОКОВА) ================= */}
        {activeMainTab === 'menu' && (
          <div className="space-y-6">
            
            {menuStep > 1 && (
              <button
                onClick={handleGoBackMenu}
                className="flex items-center gap-2 text-stone-200 font-extrabold bg-stone-900 px-5 py-2.5 rounded-2xl border border-stone-800 hover:bg-stone-800 transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-amber-500" />
                <span>Назад</span>
              </button>
            )}

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

                            <span className="absolute bottom-4 right-4 bg-stone-950/90 text-amber-400 px-5 py-2 rounded-full font-black text-base backdrop-blur-md shadow-md border border-stone-800">
                              {renderPriceText(item)}
                            </span>
                          </div>

                          <div className="p-6 space-y-3">
                            <h3 className="font-black text-2xl text-stone-100 leading-tight">{item.name}</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">{item.description}</p>
                            
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

                        {/* КНОПКИ КЕРУВАННЯ НАЯВНІСТЮ ТА ВИДАЛЕННЯМ */}
                        <div className="p-6 pt-0 flex gap-2">
                          <button
                            onClick={() => handleToggleAvailable(item)}
                            className={`flex-1 font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all text-xs cursor-pointer active:scale-98 ${
                              isAvailable
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                          >
                            {isAvailable ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>В наявності</span>
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 text-rose-400" />
                                <span>Немає</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => confirmDelete(itemId)}
                            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 font-bold px-4 py-3 rounded-2xl transition flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                            title="Видалити позицію"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs">Видалити</span>
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

        {/* ================= ВКЛАДКА "СТАТИСТИКА" ================= */}
        {activeMainTab === 'stats' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl space-y-2">
                <div className="flex justify-between items-center text-amber-500">
                  <span className="text-xs font-bold uppercase text-stone-400">Загальна каса</span>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-amber-400">{totalRevenue} ₴</div>
                <p className="text-[11px] text-stone-500">Виручка з усіх замовлень</p>
              </div>

              <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl space-y-2">
                <div className="flex justify-between items-center text-emerald-500">
                  <span className="text-xs font-bold uppercase text-stone-400">Всього замовлень</span>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-emerald-400">{totalOrdersCount}</div>
                <p className="text-[11px] text-stone-500">Усі створені чеки</p>
              </div>

              <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl space-y-2">
                <div className="flex justify-between items-center text-sky-500">
                  <span className="text-xs font-bold uppercase text-stone-400">Середній чек</span>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-3xl font-black text-sky-400">{avgOrderValue} ₴</div>
                <p className="text-[11px] text-stone-500">Витрати на 1 замовлення</p>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-stone-200">Історія замовлень</h3>
                <button
                  onClick={fetchOrders}
                  className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-bold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} /> Оновити
                </button>
              </div>
              
              {orders.length === 0 ? (
                <p className="text-stone-500 text-xs text-center py-6">Замовлень у базі поки немає</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order, idx) => {
                    const orderItems = order.items || order.products || [];
                    const amount = calculateOrderTotal(order);
                    const status = order.status || 'готово';

                    return (
                      <div key={order._id || order.id || idx} className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-amber-400">Замовлення #{String(order.id || order._id || '').slice(-4) || idx + 1}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                              {status}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 mt-1">
                            {orderItems.length > 0
                              ? orderItems.map(i => `${i.name || 'Товар'} (${i.quantity || 1}шт)`).join(', ')
                              : 'Вміст замовлення'}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-stone-100 text-sm">{amount} ₴</span>
                          <span className="block text-[10px] text-stone-500">Оплачено</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ================= МОДАЛКА УСПІШНОГО ДОДАВАННЯ ================= */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-stone-100">Успішно!</h3>
              <p className="text-xs text-stone-400">Нову позицію успішно додано до меню кав'ярні.</p>
            </div>
            <button
              onClick={() => setSuccessModalOpen(false)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3 rounded-2xl text-xs transition cursor-pointer active:scale-98"
            >
              Чудово
            </button>
          </div>
        </div>
      )}

      {/* ================= МОДАЛКА ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ ================= */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-stone-100">Видалити позицію?</h3>
              <p className="text-xs text-stone-400">Цю дію неможливо скасувати. Товар зникне з меню клієнтів та баристи.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold py-3 rounded-2xl text-xs transition cursor-pointer active:scale-98"
              >
                Скасувати
              </button>
              <button
                onClick={executeDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-2xl text-xs transition cursor-pointer active:scale-98 shadow-md"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
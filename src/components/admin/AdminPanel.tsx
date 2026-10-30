'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Order, OrderStatus, Product, StoreSettings } from '@/types/database';
import { formatPrice } from '@/hooks/use-utils';
import { updateGlobalSettings } from '@/stores/settings';
import Link from 'next/link';
import { DEMO_CATEGORIES } from '@/lib/demo-data';
import {
  Package,
  ShoppingBag,
  Settings,
  BarChart3,
  LogOut,
  Bell,
  BellOff,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Save,
  Check,
  Eye,
  EyeOff,
  Lock,
  Edit3,
  Trash2,
  X,
  Star,
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Upload,
  Camera,
  Loader2,
} from 'lucide-react';

/* ── Web Audio Chime Synthesizer ─────────── */
function playOrderChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second tone (higher harmony)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio context may be blocked by autoplay policies until user interaction
  }
}

const IMAGE_PRESETS = [
  { label: 'Soda Citron', url: '/products/can-citrus.svg', icon: '🥤' },
  { label: 'Cola Frais', url: '/products/can-cola.svg', icon: '🥤' },
  { label: 'Ice Tea', url: '/products/can-ice-tea.svg', icon: '🧃' },
  { label: 'Energy Drink', url: '/products/can-energy.svg', icon: '⚡' },
  { label: 'Monster Vert', url: '/products/card-monster-original.jpg', icon: '🟢' },
  { label: 'Monster Blanc', url: '/products/card-monster-white.jpg', icon: '⚪' },
  { label: 'Monster Mango', url: '/products/card-monster-mango.jpg', icon: '🥭' },
  { label: 'Monster Fraise', url: '/products/card-monster-strawberry.jpg', icon: '🍓' },
  { label: 'Red Bull Canette', url: '/products/card-redbull-original.jpg', icon: '⚡' },
  { label: 'Red Bull Ruby', url: '/products/card-redbull-ruby.jpg', icon: '💎' },
  { label: 'Coca Canette', url: '/products/card-coca-original.jpg', icon: '🔴' },
  { label: 'Dr Pepper Coconut', url: '/products/card-drpepper-coconut.jpg', icon: '🥥' },
  { label: 'Takis Blue', url: '/products/card-takis-blue.jpg', icon: '🌶️' },
  { label: 'Chips Classic', url: '/products/snack-chips.svg', icon: '🍿' },
  { label: 'Doritos', url: '/products/snack-doritos.svg', icon: '🔺' },
  { label: 'Chocolat', url: '/products/candy-chocolate.svg', icon: '🍫' },
  { label: 'Haribo Bonbons', url: '/products/candy-haribo.svg', icon: '🍬' },
  { label: 'Sandwich Frais', url: '/products/fresh-sandwich.svg', icon: '🥪' },
  { label: 'Pasta Box', url: '/products/fresh-pastabox.svg', icon: '🍝' },
  { label: 'Nouilles', url: '/products/grocery-noodles.svg', icon: '🍜' },
  { label: 'Glace Tub', url: '/products/icecream-tub.svg', icon: '🍨' },
  { label: 'Glace Kinder', url: '/products/kinder-bueno-icecream.jpg', icon: '🍦' },
  { label: 'Chargeur', url: '/products/tech-charger.svg', icon: '🔌' },
  { label: 'Câble USB-C', url: '/products/tech-cable.svg', icon: '⚡' },
  { label: 'Bière Bouteille', url: '/products/drink-beer.svg', icon: '🍺' },
  { label: 'Vodka / Alcool', url: '/products/drink-vodka.svg', icon: '🍾' },
  { label: 'Cigarettes', url: '/products/tobacco-pack.svg', icon: '🚬' },
  { label: 'Puff Vape', url: '/products/tobacco-puff.svg', icon: '💨' },
];

/* ── Client-side Image Compression Helper ──── */
async function compressImageFile(
  file: File,
  maxDimension = 800,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Environnement non supporté'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Impossible d’initialiser le traitement de l’image'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve({ blob: jpegBlob, dataUrl });
                  } else {
                    reject(new Error('Échec de la compression de l’image'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Impossible de lire le fichier image sélectionné'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

export default function AdminPanel() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [sessionChecked, setSessionChecked] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'stats'>('orders');

  // Realtime Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'new' | 'active' | 'delivered'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const prevOrdersCount = useRef<number>(0);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productAvailabilityFilter, setProductAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Device Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Form state for Add / Edit
  const [productForm, setProductForm] = useState<{
    id?: string;
    nom: string;
    category_id: string;
    priceEuros: string;
    image_url: string;
    description: string;
    stock: number;
    is_available: boolean;
    is_featured: boolean;
    is_age_restricted: boolean;
  }>({
    nom: '',
    category_id: 'cat-sodas',
    priceEuros: '2.50',
    image_url: '/products/can-citrus.svg',
    description: '',
    stock: 25,
    is_available: true,
    is_featured: false,
    is_age_restricted: false,
  });

  // Store Settings
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Loading
  const [loading, setLoading] = useState(false);

  // Check existing session token on mount
  useEffect(() => {
    const token =
      sessionStorage.getItem('eleven-admin-token') ||
      localStorage.getItem('eleven-admin-token');

    if (token) {
      fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('eleven-admin-token');
            localStorage.removeItem('eleven-admin-token');
          }
        })
        .catch(() => {
          // If network issue, maintain local state
        })
        .finally(() => setSessionChecked(true));
    } else {
      setSessionChecked(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const emailToSend = authEmail.trim();
    const passwordToSend = authPassword.trim();

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, password: passwordToSend }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('eleven-admin-token', data.token);
        localStorage.setItem('eleven-admin-token', data.token);
        setIsAuthenticated(true);
        setAuthEmail('');
        setAuthPassword('');
      } else {
        setAuthError(data.message || 'Identifiants invalides.');
      }
    } catch {
      setAuthError('Erreur de connexion au serveur.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const token =
      sessionStorage.getItem('eleven-admin-token') ||
      localStorage.getItem('eleven-admin-token');

    try {
      if (token) {
        await fetch('/api/admin/auth', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Logout locally even if server call fails
    }

    sessionStorage.removeItem('eleven-admin-token');
    localStorage.removeItem('eleven-admin-token');
    localStorage.removeItem('eleven-admin-auth');
    setIsAuthenticated(false);
    setAuthEmail('');
    setAuthPassword('');
  };

  /* ── Fetch Data ──────────────────────────── */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        const newOrders: Order[] = data.orders || [];

        // Check if new order arrived and play sound
        if (
          prevOrdersCount.current > 0 &&
          newOrders.length > prevOrdersCount.current &&
          soundEnabled
        ) {
          playOrderChime();
        }
        prevOrdersCount.current = newOrders.length;
        setOrders(newOrders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [soundEnabled]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  // Poll orders every 6 seconds for live realtime updates
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
    fetchProducts();
    fetchSettings();

    const interval = setInterval(fetchOrders, 6000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchOrders, fetchProducts, fetchSettings]);

  /* ── Status Actions ──────────────────────── */
  const handleUpdateStatus = async (orderId: string, status: OrderStatus, driverName?: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assigned_driver: driverName }),
      });
      if (res.ok) {
        await fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status, assigned_driver: driverName || prev.assigned_driver } : null));
        }
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  /* ── Product Handlers ────────────────────── */
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 3500);
  };

  const handleToggleProduct = async (product: Product) => {
    const updated = { ...product, is_available: !product.is_available };
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      showToast(
        updated.is_available
          ? `"${product.nom}" est maintenant disponible`
          : `"${product.nom}" est marqué comme épuisé`,
        'success'
      );
    } catch (err) {
      console.error('Error toggling product:', err);
      showToast('Erreur lors du changement de disponibilité', 'error');
    }
  };

  /* ── Product Quick Price Save ────────────── */
  const handleSaveQuickPrice = async (product: Product) => {
    const raw = tempPriceInput.replace(',', '.').trim();
    const euros = parseFloat(raw);
    if (isNaN(euros) || euros < 0) {
      showToast('Veuillez entrer un prix valide (ex: 2.50)', 'error');
      return;
    }
    const newPriceCents = Math.round(euros * 100);
    const updated = { ...product, price_cents: newPriceCents };
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    setEditingPriceId(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        showToast(`Prix de "${product.nom}" mis à jour : ${(newPriceCents / 100).toFixed(2)} €`, 'success');
      } else {
        showToast('Erreur lors de la mise à jour du prix', 'error');
        fetchProducts();
      }
    } catch {
      showToast('Erreur réseau lors de la mise à jour', 'error');
      fetchProducts();
    }
  };

  /* ── Open Add Modal ──────────────────────── */
  const handleOpenAddModal = () => {
    setProductForm({
      nom: '',
      category_id: productCategoryFilter !== 'all' ? productCategoryFilter : 'cat-sodas',
      priceEuros: '2.50',
      image_url: '/products/can-citrus.svg',
      description: '',
      stock: 25,
      is_available: true,
      is_featured: false,
      is_age_restricted: false,
    });
    setIsAddModalOpen(true);
  };

  /* ── Open Edit Modal ─────────────────────── */
  const handleOpenEditModal = (product: Product) => {
    setProductForm({
      id: product.id,
      nom: product.nom,
      category_id: product.category_id,
      priceEuros: (product.price_cents / 100).toFixed(2),
      image_url: product.image_url,
      description: product.description || '',
      stock: product.stock ?? 25,
      is_available: product.is_available,
      is_featured: !!product.is_featured,
      is_age_restricted: !!product.is_age_restricted,
    });
    setIsEditModalOpen(true);
  };

  /* ── Import Image From Device ────────────── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so user can re-select the same file if needed
    e.target.value = '';

    setIsUploadingImage(true);
    try {
      // 1. Client-side compression to lightweight WebP (~30-60KB)
      const { blob, dataUrl } = await compressImageFile(file, 800, 0.82);

      // 2. Upload to /api/admin/upload
      const formData = new FormData();
      formData.append('file', blob, file.name.replace(/\.[^/.]+$/, '') + '.webp');
      formData.append('dataUrl', dataUrl);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'image");
      }

      setProductForm((prev) => ({
        ...prev,
        image_url: data.url,
      }));

      showToast('📸 Image importée et optimisée avec succès !', 'success');
    } catch (err: any) {
      console.error('[Upload error]', err);
      showToast(err.message || "Erreur lors de l'import de l'image", 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  /* ── Submit Add / Edit Form ──────────────── */
  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nom.trim()) {
      showToast('Le nom du produit est obligatoire', 'error');
      return;
    }
    const raw = productForm.priceEuros.replace(',', '.').trim();
    const euros = parseFloat(raw);
    if (isNaN(euros) || euros < 0) {
      showToast('Prix invalide (ex: 2.50)', 'error');
      return;
    }

    setIsSavingProduct(true);
    try {
      const payload: Partial<Product> = {
        id: productForm.id,
        nom: productForm.nom.trim(),
        category_id: productForm.category_id,
        price_cents: Math.round(euros * 100),
        image_url: productForm.image_url.trim() || '/products/can-citrus.svg',
        description: productForm.description.trim(),
        stock: Number(productForm.stock) || 20,
        is_available: productForm.is_available,
        is_featured: productForm.is_featured,
        is_age_restricted: productForm.is_age_restricted,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const savedProd = data.product;
        if (productForm.id) {
          setProducts((prev) => prev.map((p) => (p.id === savedProd.id ? savedProd : p)));
          showToast(`Produit "${savedProd.nom}" mis à jour avec succès !`, 'success');
        } else {
          setProducts((prev) => [savedProd, ...prev]);
          showToast(`Nouveau produit "${savedProd.nom}" ajouté au catalogue !`, 'success');
        }
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      } else {
        showToast('Erreur lors de l’enregistrement du produit', 'error');
      }
    } catch {
      showToast('Erreur de connexion', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  /* ── Delete Product ──────────────────────── */
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const targetId = productToDelete.id;
    const targetName = productToDelete.nom;
    try {
      const res = await fetch(`/api/admin/products?id=${targetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== targetId));
        showToast(`"${targetName}" a été supprimé du catalogue et des bases`, 'success');
        setProductToDelete(null);
      } else {
        showToast('Erreur lors de la suppression', 'error');
      }
    } catch {
      showToast('Erreur de connexion lors de la suppression', 'error');
    }
  };

  /* ── Save Settings ───────────────────────── */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        // Propagate to client-side settings store for instant sync across all components
        if (data.settings) {
          updateGlobalSettings(data.settings);
        } else {
          updateGlobalSettings(settings);
        }
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (ordersFilter === 'new') return o.status === 'new';
    if (ordersFilter === 'active') return o.status === 'taken' || o.status === 'delivering';
    if (ordersFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  // Calculate quick stats
  const totalRevenueCents = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_cents, 0);
  const avgOrderCents =
    orders.length > 0 ? Math.round(totalRevenueCents / orders.length) : 0;
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;

  /* ── 1. SESSION CHECK LOADING ────────────── */
  if (!sessionChecked) {
    return (
      <div className="admin-portal flex min-h-screen items-center justify-center px-4 py-16 bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-text-muted">Vérification de la session…</p>
        </div>
      </div>
    );
  }

  /* ── 2. LOGIN SCREEN ─────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="admin-portal flex min-h-screen items-center justify-center px-4 py-16 bg-[#0a0a0a]">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-elevated p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="font-display text-3xl tracking-wide text-white">
              ELEVEN ADMIN
            </h1>
            <p className="mt-1 text-xs text-text-muted">
              Accès réservé — Espace administration Eleven Shop.
            </p>
          </div>

          {authError && (
            <div className="mb-4 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="Adresse e-mail"
                autoComplete="email"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authPassword}
                  onChange={(e) => {
                    setAuthPassword(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 pr-12 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
                  tabIndex={-1}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn-pill btn-pill-primary w-full py-3.5 text-sm font-bold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connexion…
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft size={13} />
              <span>Retour au Catalogue Eleven Shop</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── 3. MAIN DASHBOARD ───────────────────── */
  return (
    <div className="admin-portal min-h-screen pb-20 md:pb-16 bg-[#0a0a0a]">
      {/* ── Top Bar ─────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0c0c]/95 backdrop-blur-md shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-display text-xl tracking-wider text-white hover:text-white/80 transition-colors"
            >
              ELEVEN<span className="text-primary">.</span>
            </Link>
            <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
              ADMIN
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Live Realtime
            </span>
            <Link
              href="/catalogue"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors ml-2"
              title="Voir la boutique dans un nouvel onglet"
            >
              <ExternalLink size={12} />
              <span>Boutique</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio chime toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
              title="Activer/Couper le son des nouvelles commandes"
            >
              {soundEnabled ? (
                <>
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Son actif</span>
                </>
              ) : (
                <>
                  <BellOff className="h-3.5 w-3.5 text-white/40" />
                  <span className="hidden sm:inline text-white/40">Muet</span>
                </>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all shadow-sm"
              title="Se déconnecter du panel admin"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────── */}
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6 overflow-x-auto no-scrollbar gap-2 pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-primary text-black font-bold shadow-glow'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Commandes</span>
            {newOrdersCount > 0 && (
              <span className="badge bg-secondary text-white text-[10px]">
                {newOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-primary text-black font-bold shadow-glow'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Produits ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-primary text-black font-bold shadow-glow'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Réglages & Zone</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-primary text-black font-bold shadow-glow'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistiques</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ══════════════════════════════════════
            TAB 1: COMMANDES
            ══════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-surface-elevated p-1">
                <button
                  onClick={() => setOrdersFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                    ordersFilter === 'all'
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Toutes ({orders.length})
                </button>
                <button
                  onClick={() => setOrdersFilter('new')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                    ordersFilter === 'new'
                      ? 'bg-secondary text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Nouvelles ({newOrdersCount})
                </button>
                <button
                  onClick={() => setOrdersFilter('active')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                    ordersFilter === 'active'
                      ? 'bg-primary text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  En cours ({orders.filter((o) => o.status === 'taken' || o.status === 'delivering').length})
                </button>
                <button
                  onClick={() => setOrdersFilter('delivered')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                    ordersFilter === 'delivered'
                      ? 'bg-success/20 text-success'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Livrées ({orders.filter((o) => o.status === 'delivered').length})
                </button>
              </div>

              <button
                onClick={fetchOrders}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Actualiser</span>
              </button>
            </div>

            {/* Orders list */}
            {filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-surface-elevated p-12 text-center text-text-muted">
                Aucune commande dans cette section pour le moment.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((o) => {
                  const isNew = o.status === 'new';
                  const isTaken = o.status === 'taken';
                  const isDelivered = o.status === 'delivered';

                  return (
                    <div
                      key={o.id}
                      className={`rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                        isNew
                          ? 'border-secondary/40 bg-secondary/5 shadow-lg'
                          : 'border-white/10 bg-surface-elevated hover:border-white/20'
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-sm font-bold text-primary">
                              #{o.public_code}
                            </span>
                            <div className="text-xs text-text-muted">
                              {new Date(o.created_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isNew
                                ? 'bg-secondary/20 text-secondary animate-pulse'
                                : isTaken
                                ? 'bg-primary/20 text-primary'
                                : isDelivered
                                ? 'bg-success/20 text-success'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {o.status === 'new'
                              ? 'NOUVELLE'
                              : o.status === 'taken'
                              ? `PRISE (${o.assigned_driver || 'Livreur'})`
                              : o.status === 'delivering'
                              ? 'EN ROUTE'
                              : o.status === 'delivered'
                              ? 'LIVRÉE'
                              : 'ANNULÉE'}
                          </span>
                        </div>

                        {/* Client info */}
                        <div className="mt-3 space-y-1 text-xs">
                          <p className="font-semibold text-white text-sm">
                            {o.client_name}
                          </p>
                          <a
                            href={`tel:${o.client_phone.replace(/\s+/g, '')}`}
                            className="font-mono text-primary flex items-center gap-1 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {o.client_phone}
                          </a>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${o.address}, ${o.postal_code} ${o.city}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/80 flex items-start gap-1 hover:text-primary mt-1"
                          >
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
                            <span>
                              {o.address}, {o.postal_code} {o.city}
                            </span>
                          </a>
                          {o.address_extra && (
                            <p className="text-white/60 italic">
                              Complément : {o.address_extra}
                            </p>
                          )}
                          {o.notes && (
                            <p className="rounded-xl bg-black/40 p-2 text-warning/90 mt-1">
                              Note : {o.notes}
                            </p>
                          )}
                        </div>

                        {/* Items recap */}
                        <div className="mt-3 border-t border-white/5 pt-2 text-xs text-white/70">
                          {o.items?.map((it, idx) => (
                            <div key={idx} className="truncate">
                              <strong>{it.quantity}×</strong> {it.product_name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 border-t border-white/10 pt-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-text-muted">
                            {o.payment_method === 'cash' ? '💵 Espèces' : '💳 Carte'}
                          </span>
                          <span className="font-mono text-base font-bold text-primary">
                            {formatPrice(o.total_cents)}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {o.status === 'new' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'taken', 'Patron')}
                              className="btn-pill btn-pill-primary w-full py-2 text-xs font-bold"
                            >
                              🛵 Prendre
                            </button>
                          )}
                          {o.status === 'taken' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'delivered')}
                              className="btn-pill bg-success text-black w-full py-2 text-xs font-bold"
                            >
                              ✅ Livrée
                            </button>
                          )}
                          {o.status !== 'delivered' && o.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-error"
                              title="Annuler la commande"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB 2: GESTION PRODUITS
            ══════════════════════════════════════ */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-surface-elevated p-4 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl tracking-wide text-white flex items-center gap-3">
                    <span>CATALOGUE PRODUITS</span>
                    <span className="rounded-full bg-primary/20 px-3 py-0.5 font-mono text-xs font-bold text-primary">
                      {products.length} articles
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Modifiez les prix en direct, ajoutez de nouvelles références ou supprimez des produits.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={fetchProducts}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    title="Actualiser la liste"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleOpenAddModal}
                    className="btn-pill btn-pill-primary py-2.5 px-5 text-xs font-bold shadow-glow flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Nouveau Produit</span>
                  </button>
                </div>
              </div>

              {/* Filters row */}
              <div className="grid gap-3 pt-3 border-t border-white/10 sm:grid-cols-12">
                {/* Search */}
                <div className="relative sm:col-span-5">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Rechercher par nom, référence..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:border-primary focus:outline-none"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Availability Pills */}
                <div className="flex items-center gap-1.5 sm:col-span-7 justify-start sm:justify-end overflow-x-auto py-0.5">
                  <button
                    onClick={() => setProductAvailabilityFilter('all')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      productAvailabilityFilter === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Tous ({products.length})
                  </button>
                  <button
                    onClick={() => setProductAvailabilityFilter('available')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      productAvailabilityFilter === 'available'
                        ? 'bg-success/20 text-success border border-success/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    En vente ({products.filter((p) => p.is_available).length})
                  </button>
                  <button
                    onClick={() => setProductAvailabilityFilter('unavailable')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      productAvailabilityFilter === 'unavailable'
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Épuisés ({products.filter((p) => !p.is_available).length})
                  </button>
                </div>
              </div>

              {/* Category Pills (horizontal scroll) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <button
                  onClick={() => setProductCategoryFilter('all')}
                  className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                    productCategoryFilter === 'all'
                      ? 'bg-primary text-black font-bold shadow-sm'
                      : 'border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  ⚡ Toutes catégories
                </button>
                {DEMO_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setProductCategoryFilter(cat.id)}
                    className={`flex-shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                      productCategoryFilter === cat.id
                        ? 'bg-primary text-black font-bold shadow-sm'
                        : 'border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{cat.icon || '📦'}</span> <span className="ml-1">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {(() => {
              const filteredList = products.filter((p) => {
                if (productCategoryFilter !== 'all' && p.category_id !== productCategoryFilter) {
                  return false;
                }
                if (productAvailabilityFilter === 'available' && !p.is_available) {
                  return false;
                }
                if (productAvailabilityFilter === 'unavailable' && p.is_available) {
                  return false;
                }
                if (productSearch.trim()) {
                  const q = productSearch.toLowerCase().trim();
                  return (
                    p.nom.toLowerCase().includes(q) ||
                    (p.description && p.description.toLowerCase().includes(q)) ||
                    (p.slug && p.slug.toLowerCase().includes(q))
                  );
                }
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="rounded-3xl border border-white/10 bg-surface-elevated p-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-white/20 mb-3" />
                    <h3 className="text-base font-bold text-white">Aucun produit trouvé</h3>
                    <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                      Aucun article ne correspond à vos filtres actuels. Modifiez votre recherche ou ajoutez un produit.
                    </p>
                    <button
                      onClick={handleOpenAddModal}
                      className="btn-pill btn-pill-primary py-2.5 px-5 text-xs font-bold mt-4 inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter un produit</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredList.map((p) => {
                    const catObj = DEMO_CATEGORIES.find((c) => c.id === p.category_id);
                    const isEditingThisPrice = editingPriceId === p.id;

                    return (
                      <div
                        key={p.id}
                        className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-surface-elevated/90 p-4 transition-all hover:border-white/20 hover:bg-surface-elevated shadow-lg"
                      >
                        <div>
                          {/* Badges */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 truncate max-w-[150px]">
                              {catObj?.icon} {catObj?.name || p.category_id}
                            </span>
                            <div className="flex items-center gap-1">
                              {p.is_featured && (
                                <span className="flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  <Star className="h-3 w-3 fill-primary" /> Star
                                </span>
                              )}
                              {p.is_age_restricted && (
                                <span className="rounded-full bg-error/20 border border-error/30 px-2 py-0.5 text-[10px] font-bold text-error">
                                  18+
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Image & Title */}
                          <div className="flex items-start gap-3 my-2">
                            <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-black/60 p-2 border border-white/5 flex items-center justify-center relative overflow-hidden">
                              <img
                                src={p.image_url}
                                alt={p.nom}
                                className="h-full w-full object-contain transition-transform group-hover:scale-105"
                              />
                              {!p.is_available && (
                                <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="text-[9px] font-extrabold uppercase text-white/70 tracking-wider">Épuisé</span>
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="text-xs font-bold text-white line-clamp-1 leading-snug" title={p.nom}>
                                {p.nom}
                              </h3>
                              {p.description ? (
                                <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">
                                  {p.description}
                                </p>
                              ) : (
                                <p className="text-[11px] text-white/30 italic mt-0.5">
                                  Pas de description
                                </p>
                              )}
                              <div className="mt-1 text-[11px] text-white/40">
                                Stock : <span className="font-mono font-medium text-white/70">{p.stock ?? 'Illimité'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="mt-3 pt-3 border-t border-white/10">
                          {/* Price Row with Inline Editor */}
                          <div className="flex items-center justify-between mb-3 bg-black/40 rounded-2xl p-2.5 border border-white/5">
                            <span className="text-xs text-text-muted font-medium">Prix :</span>

                            {isEditingThisPrice ? (
                              <div className="flex items-center gap-1.5 animate-fadeIn">
                                <input
                                  type="text"
                                  autoFocus
                                  value={tempPriceInput}
                                  onChange={(e) => setTempPriceInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveQuickPrice(p);
                                    if (e.key === 'Escape') setEditingPriceId(null);
                                  }}
                                  placeholder="0.00"
                                  className="w-16 rounded-xl border border-primary bg-black px-2 py-1 text-xs font-mono font-bold text-white text-right focus:outline-none"
                                />
                                <span className="text-xs font-mono text-primary font-bold">€</span>
                                <button
                                  onClick={() => handleSaveQuickPrice(p)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-success text-black hover:bg-success/90 transition-colors shadow-sm"
                                  title="Enregistrer (Entrée)"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                </button>
                                <button
                                  onClick={() => setEditingPriceId(null)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                                  title="Annuler (Échap)"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-extrabold text-primary">
                                  {formatPrice(p.price_cents)}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingPriceId(p.id);
                                    setTempPriceInput((p.price_cents / 100).toFixed(2));
                                  }}
                                  className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all"
                                  title="Modifier le prix de ce produit"
                                >
                                  <Edit3 size={11} />
                                  <span>Changer</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Availability, Edit Full, Delete */}
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleToggleProduct(p)}
                              className={`col-span-1 rounded-xl py-2 text-xs font-bold transition-all ${
                                p.is_available
                                  ? 'bg-success/15 text-success border border-success/30 hover:bg-success/25'
                                  : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                              }`}
                            >
                              {p.is_available ? '✓ En vente' : '✕ Épuisé'}
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all"
                              title="Modifier tous les détails"
                            >
                              <Edit3 size={13} />
                              <span>Éditer</span>
                            </button>

                            <button
                              onClick={() => setProductToDelete(p)}
                              className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-error/20 bg-error/10 py-2 text-xs font-semibold text-error hover:bg-error/20 hover:border-error/40 transition-all"
                              title="Supprimer ce produit"
                            >
                              <Trash2 size={13} />
                              <span>Suppr.</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB 3: RÉGLAGES DU MAGASIN
            ══════════════════════════════════════ */}
        {activeTab === 'settings' && settings && (
          <form
            onSubmit={handleSaveSettings}
            className="max-w-2xl rounded-3xl border border-white/10 bg-surface-elevated p-6 md:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-2xl tracking-wide text-white">
                  RÉGLAGES DU MAGASIN
                </h2>
                <p className="text-xs text-text-muted">
                  Horaires, zones de livraison et seuils de commande.
                </p>
              </div>

              {settingsSaved && (
                <span className="flex items-center gap-1 text-xs text-success font-bold">
                  <Check className="h-4 w-4" /> Enregistré !
                </span>
              )}
            </div>

            {/* Ouvert / Fermé */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
              <div>
                <div className="text-sm font-bold text-white">
                  Statut de l'épicerie
                </div>
                <div className="text-xs text-text-muted">
                  Basculez sur fermé en cas de rupture totale ou d'indisponibilité exceptionnelle.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, is_open: !settings.is_open })}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  settings.is_open
                    ? 'bg-success text-black'
                    : 'bg-error text-white'
                }`}
              >
                {settings.is_open ? 'OUVERT 24H/24' : 'FERMÉ TEMPORAIREMENT'}
              </button>
            </div>

            {/* Minimum et Frais */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Minimum de commande (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.min_order_cents / 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      min_order_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Frais de livraison standard (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.delivery_fee_cents / 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      delivery_fee_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Livraison offerte dès (€)
                </label>
                <input
                  type="number"
                  step="1"
                  value={settings.free_delivery_above_cents / 100}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      free_delivery_above_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Codes Postaux */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Codes postaux acceptés (séparés par des virgules)
              </label>
              <input
                type="text"
                value={settings.allowed_postal_codes.join(', ')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowed_postal_codes: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-white/40">
                Par défaut : 42300 (Roanne/Mably), 42120 (Le Coteau), 42153 (Riorges), 42370 (Renaison).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill btn-pill-primary w-full py-3.5 text-sm font-bold shadow-glow flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer les réglages</span>
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════
            TAB 4: STATISTIQUES
            ══════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6">
                <span className="text-xs uppercase tracking-wider text-text-muted">
                  Total Commandes
                </span>
                <p className="mt-2 font-display text-4xl text-white">
                  {orders.length}
                </p>
                <span className="text-xs text-primary font-semibold">
                  {newOrdersCount} nouvelle(s) en attente
                </span>
              </div>

              <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6">
                <span className="text-xs uppercase tracking-wider text-text-muted">
                  Chiffre d'affaires
                </span>
                <p className="mt-2 font-display text-4xl text-primary font-mono">
                  {formatPrice(totalRevenueCents)}
                </p>
                <span className="text-xs text-text-muted">
                  Commandes non annulées
                </span>
              </div>

              <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6">
                <span className="text-xs uppercase tracking-wider text-text-muted">
                  Panier Moyen
                </span>
                <p className="mt-2 font-display text-4xl text-white font-mono">
                  {formatPrice(avgOrderCents)}
                </p>
                <span className="text-xs text-text-muted">
                  Livraison incluse
                </span>
              </div>

              <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6">
                <span className="text-xs uppercase tracking-wider text-text-muted">
                  Statut Épicerie
                </span>
                <p className="mt-2 font-display text-3xl text-success">
                  OUVERT 24/7
                </p>
                <span className="text-xs text-text-muted">
                  Livraison Roanne (42300)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL: AJOUTER / MODIFIER UN PRODUIT
          ══════════════════════════════════════ */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#141414] p-6 sm:p-8 shadow-2xl space-y-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.2) transparent',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-2xl tracking-wide text-white">
                  {isEditModalOpen ? 'MODIFIER LE PRODUIT' : 'NOUVEAU PRODUIT'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {isEditModalOpen
                    ? 'Mettez à jour le prix, les détails et la disponibilité.'
                    : 'Ajoutez une nouvelle référence au catalogue de la boutique.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProductForm} className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Nom du produit <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productForm.nom}
                  onChange={(e) => setProductForm({ ...productForm, nom: e.target.value })}
                  placeholder="Ex: Monster Energy Zero Ultra 500ml"
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Catégorie & Prix */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Catégorie <span className="text-primary">*</span>
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs text-white focus:border-primary focus:outline-none appearance-none"
                  >
                    {DEMO_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#1c1c1c] text-white">
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Prix de vente (€) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={productForm.priceEuros}
                      onChange={(e) => setProductForm({ ...productForm, priceEuros: e.target.value })}
                      placeholder="2.50"
                      className="w-full rounded-2xl border border-white/10 bg-black/50 pl-4 pr-8 py-2.5 text-sm font-mono font-bold text-white placeholder-white/30 focus:border-primary focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-primary font-bold">
                      €
                    </span>
                  </div>
                </div>
              </div>

              {/* Image URL & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-white/80">
                    Image du produit
                  </label>
                  <span className="text-[11px] text-white/40">Appareil, URL ou presets</span>
                </div>

                {/* Import depuis l'appareil button & preview */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Image Preview with loader overlay */}
                    <div className="relative h-20 w-20 flex-shrink-0 mx-auto sm:mx-0 rounded-2xl bg-black/80 border border-white/15 p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={productForm.image_url || '/products/can-citrus.svg'}
                        alt="Aperçu"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as any).src = '/products/can-citrus.svg';
                        }}
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-center p-1">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-[9px] font-bold text-white">Envoi...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 px-4 py-2.5 text-xs font-bold text-primary transition-all shadow-sm shadow-primary/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Optimisation & Envoi en cours...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 text-primary" />
                            <Upload className="h-3.5 w-3.5 text-primary/70" />
                            <span>📸 Importer depuis l&apos;appareil (Photo / Galerie)</span>
                          </>
                        )}
                      </button>

                      <div className="relative">
                        <input
                          type="text"
                          value={productForm.image_url}
                          onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                          placeholder="/products/can-energy.svg ou URL https://..."
                          className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="mt-2 rounded-2xl border border-white/5 bg-black/30 p-2.5">
                  <div className="text-[11px] font-medium text-white/60 mb-2">Sélectionnez un modèle :</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          const updates: Partial<typeof productForm> = { image_url: preset.url };
                          if (preset.url === '/products/drink-beer.svg' || preset.url === '/products/drink-vodka.svg') {
                            updates.is_age_restricted = true;
                            if (productForm.category_id === 'cat-sodas') updates.category_id = 'cat-alcool';
                          } else if (preset.url === '/products/tobacco-pack.svg' || preset.url === '/products/tobacco-puff.svg') {
                            updates.is_age_restricted = true;
                            if (productForm.category_id === 'cat-sodas') updates.category_id = 'cat-tabac';
                          }
                          setProductForm({ ...productForm, ...updates });
                        }}
                        className={`flex flex-col items-center gap-1 rounded-xl p-1.5 text-center text-[10px] transition-all ${
                          productForm.image_url === preset.url
                            ? 'border border-primary bg-primary/20 text-white font-bold'
                            : 'border border-white/5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="h-7 w-7 flex items-center justify-center">
                          <img src={preset.url} alt={preset.label} className="h-full w-full object-contain" />
                        </div>
                        <span className="truncate w-full">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Description courte
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Notes de dégustation, saveur, caractéristiques..."
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Stock & Disponibilité */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Quantité en stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-xs font-mono text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={productForm.is_available}
                      onChange={(e) =>
                        setProductForm({ ...productForm, is_available: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-xs font-semibold text-white">
                      Disponible à la vente
                    </span>
                  </label>
                </div>
              </div>

              {/* Options Spéciales */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-white/10">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm({ ...productForm, is_featured: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-xs text-white/80 flex items-center gap-1">
                    <Star size={13} className="text-primary fill-primary" /> Mettre en avant (Star)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_age_restricted}
                    onChange={(e) =>
                      setProductForm({ ...productForm, is_age_restricted: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-error"
                  />
                  <span className="text-xs text-white/80 flex items-center gap-1">
                    <ShieldAlert size={13} className="text-error" /> Réservé 18+ (Majeurs)
                  </span>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="rounded-2xl border border-white/10 px-5 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="btn-pill btn-pill-primary px-6 py-2.5 text-xs font-bold shadow-glow flex items-center gap-2"
                >
                  {isSavingProduct ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 stroke-[3]" />
                  )}
                  <span>{isEditModalOpen ? 'Enregistrer les modifications' : 'Créer le produit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: CONFIRMATION SUPPRESSION
          ══════════════════════════════════════ */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-error/30 bg-[#161313] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-error/15 text-error">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl text-white">Supprimer ce produit ?</h3>
                <p className="text-xs text-text-muted mt-0.5">Cette action est définitive et irréversible.</p>
              </div>
            </div>

            {/* Product recap box */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 p-3">
              <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-black p-1 flex items-center justify-center">
                <img
                  src={productToDelete.image_url}
                  alt={productToDelete.nom}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{productToDelete.nom}</p>
                <p className="text-xs font-mono font-bold text-primary">{formatPrice(productToDelete.price_cents)}</p>
              </div>
            </div>

            <p className="text-xs text-white/60">
              Le produit sera immédiatement retiré du catalogue en ligne, des recherches, et tout élément associé.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="rounded-2xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-pill bg-error text-white hover:bg-error/90 px-5 py-2.5 text-xs font-bold shadow-glow flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Oui, supprimer définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TOAST NOTIFICATION FLOTTANTE
          ══════════════════════════════════════ */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#181818]/95 px-4 py-3 shadow-2xl backdrop-blur-xl animate-slideUp">
          <div
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl ${
              toastMessage.type === 'success'
                ? 'bg-success/20 text-success'
                : 'bg-error/20 text-error'
            }`}
          >
            {toastMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          </div>
          <span className="text-xs font-medium text-white">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/40 hover:text-white ml-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from '@/stores/settings';

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  image: string;
  quantity: number;
  isAgeRestricted?: boolean;
}

const CART_KEY = 'eleven-shop-cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota
  }
}

const listeners = new Set<() => void>();
let cartState: CartItem[] = [];
let drawerOpenState = false;

function notify() {
  listeners.forEach((fn) => fn());
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    cartState = loadCart();
    setItems([...cartState]);
    setIsDrawerOpen(drawerOpenState);
    setMounted(true);

    const handler = () => {
      setItems([...cartState]);
      setIsDrawerOpen(drawerOpenState);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const openDrawer = useCallback(() => {
    drawerOpenState = true;
    notify();
  }, []);

  const closeDrawer = useCallback(() => {
    drawerOpenState = false;
    notify();
  }, []);

  const toggleDrawer = useCallback(() => {
    drawerOpenState = !drawerOpenState;
    notify();
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, qty = 1, open = true) => {
      const idx = cartState.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        cartState[idx].quantity += qty;
      } else {
        cartState.push({ ...item, quantity: qty });
      }
      saveCart(cartState);
      if (open) {
        drawerOpenState = true;
      }
      notify();
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    cartState = cartState.filter((i) => i.id !== id);
    saveCart(cartState);
    notify();
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      cartState = cartState.filter((i) => i.id !== id);
    } else {
      const item = cartState.find((i) => i.id === id);
      if (item) item.quantity = qty;
    }
    saveCart(cartState);
    notify();
  }, []);

  const clearCart = useCallback(() => {
    cartState = [];
    saveCart(cartState);
    notify();
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0,
  );

  const { settings } = useSettings();

  const minOrderCents = settings.min_order_cents;
  const freeDeliveryAboveCents = settings.free_delivery_above_cents;
  const standardFeeCents = settings.delivery_fee_cents;

  const isMinOrderReached = subtotalCents >= minOrderCents;
  const missingForMinOrderCents = Math.max(0, minOrderCents - subtotalCents);

  const isFreeDelivery = subtotalCents >= freeDeliveryAboveCents;
  const deliveryFeeCents = totalItems === 0 ? 0 : isFreeDelivery ? 0 : standardFeeCents;
  const totalCents = subtotalCents + deliveryFeeCents;
  const missingForFreeDeliveryCents = Math.max(0, freeDeliveryAboveCents - subtotalCents);
  const freeDeliveryProgress = Math.min(
    100,
    Math.round((subtotalCents / freeDeliveryAboveCents) * 100)
  );

  const hasAgeRestricted = items.some((i) => i.isAgeRestricted);

  return {
    items,
    mounted,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    isMinOrderReached,
    missingForMinOrderCents,
    isFreeDelivery,
    missingForFreeDeliveryCents,
    freeDeliveryProgress,
    hasAgeRestricted,
    minOrderCents,
    freeDeliveryAboveCents,
  };
}

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Bus,
  Car,
  Coffee,
  CreditCard,
  DollarSign,
  Film,
  Fuel,
  Gift,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  Pizza,
  Plane,
  ShoppingBag,
  Smartphone,
  Tags,
  TrendingUp,
  Utensils,
  Wallet,
} from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  briefcase: Briefcase,
  bus: Bus,
  car: Car,
  coffee: Coffee,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  film: Film,
  fuel: Fuel,
  gift: Gift,
  "heart-pulse": HeartPulse,
  home: Home,
  landmark: Landmark,
  laptop: Laptop,
  "piggy-bank": PiggyBank,
  pizza: Pizza,
  plane: Plane,
  "shopping-bag": ShoppingBag,
  smartphone: Smartphone,
  tags: Tags,
  "trending-up": TrendingUp,
  utensils: Utensils,
  wallet: Wallet,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP);

export const categoryIcon = (name: string | null | undefined): LucideIcon => {
  if (!name) return Tags;
  return CATEGORY_ICON_MAP[name] ?? Tags;
};

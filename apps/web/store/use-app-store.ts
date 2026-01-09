"use client";

import { create } from "zustand";

export type UserData = {
  age: string;
  region: string;
  operatingTime: string;
  capital: string;
};

export type Industry = {
  id: string;
  name: string;
  category: string;
  icon: string;
  avgRevenue: string;
  growthRate: number;
  difficulty: string;
  requiredCapital: string;
};

export type Location = {
  id: string;
  name: string;
  district: string;
  category: string;
  revenue: string;
  growthRate: number;
  badge: string;
  badgeType: "explosive" | "rapid" | "stable";
  imageUrl: string;
  rank?: number;
  commercialScore: number;
  realEstateScore: number;
  monthlyFootTraffic: string;
  avgRent: string;
};

export type Property = {
  id: string;
  address: string;
  type: string;
  size: string;
  floor: string;
  deposit: string;
  monthlyRent: string;
  maintenanceFee: string;
  distance: string;
  condition: string;
  availableDate: string;
};

export const DEFAULT_LOCATION: Location = {
  id: "1",
  name: "성수동 카페거리",
  district: "서울 성동구",
  category: "카페",
  revenue: "₩315억 9,840만",
  growthRate: 2623.5,
  badge: "폭발 성장",
  badgeType: "explosive",
  imageUrl: "",
  rank: 1,
  commercialScore: 92,
  realEstateScore: 88,
  monthlyFootTraffic: "142만명",
  avgRent: "250만원",
};

export const DEFAULT_PROPERTY: Property = {
  id: "1",
  address: "성수동 1가 123-45",
  type: "상가",
  size: "45평 (148.5㎡)",
  floor: "1층",
  deposit: "5,000만원",
  monthlyRent: "250만원",
  maintenanceFee: "15만원",
  distance: "지하철역 200m",
  condition: "양호",
  availableDate: "즉시",
};

const normalizeLocation = (location: Partial<Location>): Location => ({
  ...DEFAULT_LOCATION,
  ...location,
  badgeType: location.badgeType ?? DEFAULT_LOCATION.badgeType,
});

const normalizeProperty = (property: Partial<Property>): Property => ({
  ...DEFAULT_PROPERTY,
  ...property,
});

type AppState = {
  userData: UserData | null;
  selectedIndustry: Industry | null;
  selectedLocation: Location | null;
  selectedProperty: Property | null;
  setUserData: (data: UserData) => void;
  setSelectedIndustry: (industry: Industry | null) => void;
  setSelectedLocation: (location: Partial<Location> | null) => void;
  setSelectedProperty: (property: Partial<Property> | null) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  userData: null,
  selectedIndustry: null,
  selectedLocation: null,
  selectedProperty: null,
  setUserData: (data) => set({ userData: data }),
  setSelectedIndustry: (industry) => set({ selectedIndustry: industry }),
  setSelectedLocation: (location) =>
    set({ selectedLocation: location ? normalizeLocation(location) : null }),
  setSelectedProperty: (property) =>
    set({ selectedProperty: property ? normalizeProperty(property) : null }),
  isSidebarOpen: true,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  reset: () =>
    set({
      userData: null,
      selectedIndustry: null,
      selectedLocation: null,
      selectedProperty: null,
    }),
}));

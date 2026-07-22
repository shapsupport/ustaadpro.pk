export type PaymentMethod = "cash" | "easypaisa" | "jazzcash";

export type AdminSettings = {
  inspectionFee: number;
  serviceTaxPercent: number;
  currency: string;
  supportPhone: string;
  shippingCost: number;
  rewardEnabled: boolean;
  rewardMinimumRedeem: number;
  rewardPointValue: number;
  serviceRewardMaxDiscountPercent: number;
  serviceRewardPointsOnCompletion: number;
  shopRewardEarnPercent: number;
  shopRewardMaxDiscountPercent: number;
};

export type FormData = {
  fullName: string;
  phone: string;
  houseNumber: string;
  landmark: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
};

export type BookingRecord = {
  id: string;
  serviceTitle: string;
  workTitle: string;
  servicePrice: number;
  paymentMethod: PaymentMethod;
  status: string;
  createdAt: string;
  userEmail: string;
  customerName: string;
  phone: string;
  address: string;
  preferredTime: string;
  notes: string;
  screenshotName: string;
  kind?: "service" | "shop";
  serviceId?: string;
  items?: Array<{ productId: string; title: string; quantity: number; price: number; imageUrl?: string }>;
};

export const DEFAULT_SETTINGS: AdminSettings = {
  inspectionFee: 500,
  serviceTaxPercent: 10,
  currency: "PKR",
  supportPhone: "+923001234567",
  shippingCost: 201,
  rewardEnabled: true,
  rewardMinimumRedeem: 100,
  rewardPointValue: 25,
  serviceRewardMaxDiscountPercent: 10,
  serviceRewardPointsOnCompletion: 1,
  shopRewardEarnPercent: 0.5,
  shopRewardMaxDiscountPercent: 5,
};

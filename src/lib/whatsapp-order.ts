const DEFAULT_WHATSAPP_NUMBER = "923719201273";

export const WHATSAPP_ORDER_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  process.env.NEXT_PUBLIC_WA_NUM ||
  DEFAULT_WHATSAPP_NUMBER
).replace(/\D/g, "");

export function createWhatsAppOrderUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppOrder(message: string): void {
  window.open(createWhatsAppOrderUrl(message), "_blank", "noopener,noreferrer");
}

export function money(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
}

export function normalizePakistaniMobile(value: string): string | null {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`;
  if (/^\+923\d{9}$/.test(compact)) return compact;
  if (/^923\d{9}$/.test(compact)) return `+${compact}`;
  if (/^3\d{9}$/.test(compact)) return `+92${compact}`;
  return null;
}


export const siteConfig = {
  name: "Ustaad Pro",
  tagline: "Pakistan's Trusted Home Services & Home Improvement Platform",
  description:
    "Book verified electricians, plumbers, AC technicians, painters, cleaners, carpenters, CCTV experts and more in minutes. Pakistan's #1 home services marketplace.",
  url: "https://ustaadpro.pk",
  email: "ustaadpro.official26@gmail.com",
  phone: "+92 371 9201273",
  address:
    "Sharplogicians Agile Center, Building # 153-M, Office # 32, 4th Floor, D-Block Civic Center, Phase 4, Bahria Town, Islamabad 46220, Pakistan",
  mapsUrl: "https://maps.app.goo.gl/N7Hn1o8pupSz3iQ69",
} as const;

export const appLinks = {
  googlePlay: "https://play.google.com/store/apps/details?id=app.sharplogicians.ustaadpro&pcampaignid=web_share",
  appStore: "https://apps.apple.com/pk/search?term=UstaadPro",
} as const;

export const whatsappUrl =
  "https://wa.me/923719201273?text=Hi%20Ustaad%20Pro%2C%20I%20want%20to%20book%20a%20service.";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Store", href: "/store" },
  { label: "Track Booking", href: "/track-booking" },
  { label: "Contact", href: "/contact" },
] as const;

export const quickAccessMenu = [
  { label: "My Profile", href: "/profile", icon: "User" },
  { label: "My Bookings", href: "/track-booking", icon: "Calendar" },
  { label: "My Store Orders", href: "/store/orders", icon: "Package" },
  { label: "Privacy Policy", href: "/privacy-policy", icon: "FileText" },
] as const;

export const socialLinks = [
  { label: "Facebook", href: "https://facebook.com/ustaadpro" },
  { label: "Instagram", href: "https://instagram.com/ustaadpro" },
  { label: "Twitter", href: "https://twitter.com/ustaadpro" },
  { label: "YouTube", href: "https://youtube.com/@ustaadpro" },
  { label: "LinkedIn", href: "https://linkedin.com/company/ustaadpro" },
 ] as const;

export const footerLinks = {
  quickLinks: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
  ],
  services: [
    { label: "Electrical", href: "/services#electrician" },
    { label: "Plumbing", href: "/services#plumbers" },
    { label: "AC & HVAC", href: "/services#ac-services" },
    { label: "Painting", href: "/services#painters" },
    { label: "Cleaning", href: "/services#home-cleaning" },
    { label: "View All", href: "/services" },
  ],
  store: [
    { label: "All Products", href: "/store" },
    { label: "Electrical", href: "/store/category/electrical" },
    { label: "Plumbing", href: "/store/category/plumbing" },
    { label: "Security", href: "/store/category/security" },
    { label: "Power Tools", href: "/store/category/carpentry" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Return & Refund Policy", href: "/return-refund-policy" },
    { label: "Shipping & Service Policy", href: "/shipping-service-policy" },
  ],
} as const;

export const stats = [
  { label: "Verified Professionals", value: 2500, suffix: "+" },
  { label: "Happy Customers", value: 50000, suffix: "+" },
  { label: "Cities Covered", value: 25, suffix: "+" },
  { label: "Customer Satisfaction", value: 98, suffix: "%" },
] as const;

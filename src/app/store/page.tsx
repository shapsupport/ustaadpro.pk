import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { MotionWrapper, StaggerContainer, StaggerItem } from "@/components/motion/MotionWrapper";
import { storeBrands } from "@/data/products";
import type { ApiProduct, ApiShopResponse } from "@/lib/api-types";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ShoppingBag,
  Star,
  Heart,
  Eye,
  Bell,
  Truck,
  Shield,
  RotateCcw,
  Package,
  Search,
  Sparkles,
  Layers3,
  BadgeCheck,
  Clock3,
  MoveRight,
} from "lucide-react";

function getIcon(iconName: string): LucideIcon {
  return (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] || LucideIcons.Package;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

const faqs = [
  {
    question: "When will the online store launch?",
    answer: "Our online store is currently in development and will launch soon with secure payments, nationwide delivery across Pakistan, and competitive pricing. Subscribe to our newsletter to be the first to know!",
  },
  {
    question: "What payment methods will be supported?",
    answer: "We will support Cash on Delivery (COD), Debit/Credit Cards, JazzCash, EasyPaisa, and bank transfers to make shopping convenient for everyone across Pakistan.",
  },
  {
    question: "Will you deliver nationwide?",
    answer: "Yes! We're building a nationwide delivery network to ensure products reach every corner of Pakistan. Major cities will have express delivery options available.",
  },
  {
    question: "Can I return products?",
    answer: "We will have a hassle-free return and refund policy. Details will be shared closer to the store launch date.",
  },
  {
    question: "Are all products genuine and branded?",
    answer: "Absolutely. We only source products from authorized distributors and verified brands. Every product comes with manufacturer warranty.",
  },
];

async function getShopData(): Promise<{ products: ApiProduct[]; categories: ApiShopResponse["categories"] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/shop/products?limit=20`, { next: { revalidate: 3600 } });
    if (!res.ok) return { products: [], categories: [] };
    const data = await res.json();
    const allProducts = Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [];
    return {
      products: allProducts,
      categories: Array.isArray(data?.categories) ? data.categories : [],
    };
  } catch (error) {
    console.error("Failed to fetch shop products:", error);
    return { products: [], categories: [] };
  }
}

export default async function StorePage() {
  const { products, categories } = await getShopData();

  const allProducts = Array.isArray(products) ? products : [];
  const validProducts: ApiProduct[] = allProducts.filter((p: ApiProduct) => p && p.id);
  const featuredProducts = validProducts.slice(0, 4);
  const bestSellers = validProducts.slice(4, 8);
  const newArrivals = validProducts.slice(8, 12);
  const apiCategories = categories || [];

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(132,204,22,0.18),_transparent_30%),linear-gradient(135deg,_#111827_0%,_#1f2937_55%,_#065f46_100%)] pt-24 pb-20 md:pt-28 md:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] opacity-30" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <MotionWrapper>
              <div className="max-w-3xl">
                <Badge className="mb-4 border-lime-400/20 bg-lime-500/10 text-sm text-lime-300">
                  <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                  Live store catalog
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                  Shop premium home essentials in one place.
                </h1>
                <p className="mt-4 text-lg leading-8 text-gray-300">
                  Browse curated tools, paints, hardware, and maintenance essentials from our live product catalog with fast support and reliable delivery.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="#catalog" className="inline-flex items-center gap-2 rounded-full bg-lime-500 px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-lime-400">
                    Explore products <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-gray-200 backdrop-blur">
                    <Shield className="h-4 w-4 text-lime-400" />
                    Verified products & secure checkout
                  </div>
                </div>
              </div>
            </MotionWrapper>

            <MotionWrapper>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/30 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-300">Store highlights</p>
                      <p className="mt-2 text-2xl font-bold text-white">Built for faster buying</p>
                    </div>
                    <div className="rounded-2xl bg-lime-500/15 p-3 text-lime-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-center gap-2 text-lime-300">
                        <Truck className="h-4 w-4" />
                        <span className="text-sm font-semibold">Fast delivery</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">Nationwide shipment for your essentials.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-center gap-2 text-lime-300">
                        <RotateCcw className="h-4 w-4" />
                        <span className="text-sm font-semibold">Easy returns</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">Simple returns if the product does not meet expectations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </MotionWrapper>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Trusted quality", description: "Every product is selected for durability and reliability.", icon: BadgeCheck },
              { title: "Quick support", description: "Need help choosing? We can guide you before checkout.", icon: Clock3 },
              { title: "Flexible buying", description: "Shop categories that fit your renovation, repair, or maintenance plans.", icon: Layers3 },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-100 text-lime-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {apiCategories.length > 0 && (
        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MotionWrapper>
              <SectionHeader
                badge="Shop by category"
                title="Browse by category"
                description="Choose the right product group for your project and shop faster."
              />
            </MotionWrapper>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {apiCategories.map((cat, index) => {
                const Icon = getIcon("Package");
                return (
                  <Link key={`${cat.name}-${index}`} href={`/store/category/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    <Card className="group h-full cursor-pointer overflow-hidden border border-slate-200 p-6 transition-all hover:-translate-y-1 hover:border-lime-200 hover:shadow-lg">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-50 text-lime-600 transition group-hover:bg-lime-600 group-hover:text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-900">{cat.name}</h3>
                      <p className="mt-2 text-sm text-slate-500">{cat.total} products available</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-700">
                        Browse now <MoveRight className="h-4 w-4" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="catalog" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-600">Live catalog</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Featured products</h2>
              <p className="mt-2 text-sm text-slate-500">Fresh picks from the live shop API, ready to order.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
              <Search className="h-4 w-4 text-lime-600" />
              Search, browse, and buy with confidence
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product: ApiProduct) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="Popular picks"
              title="Best sellers"
              description="The most in-demand items from our current inventory."
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.map((product: ApiProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              badge="New arrivals"
              title="Freshly added"
              description="Recently updated products for new projects and upgrades."
            />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product: ApiProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-slate-900 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-400">Why shop with us</p>
              <h2 className="mt-3 text-3xl font-bold text-white">A smarter way to buy home project essentials</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">From tools to finishing materials, our store helps customers find dependable products with clear pricing and fast support.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Live availability", description: "Products are pulled directly from the store API." },
                { title: "Premium selection", description: "Curated categories for repairs, finishes, and maintenance." },
                { title: "Easy ordering", description: "Simple product cards designed for quick product discovery." },
                { title: "Customer-first support", description: "Helpful guidance before and after purchase." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50/70 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper>
            <SectionHeader
              badge="FAQs"
              title="Frequently asked questions"
              description="Everything you need to know before ordering from our online store."
            />
          </MotionWrapper>
          <div className="mx-auto mt-8 max-w-3xl">
            <Accordion className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-gray-200 bg-white px-6 data-[state=open]:border-lime-200 data-[state=open]:shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-gray-500 leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionWrapper>
            <div className="mx-auto max-w-2xl text-center">
              <Bell className="mx-auto mb-4 h-10 w-10 text-lime-400" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Stay updated with new arrivals</h2>
              <p className="mt-4 text-gray-400">Subscribe for stock updates, new products, and special offers.</p>
              <div className="mt-8">
                <NewsletterForm />
              </div>
            </div>
          </MotionWrapper>
        </div>
      </section>
    </>
  );
}

// Product Card sub-component
function ProductCard({ product }: { product: ApiProduct }) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link href={`/store/product/${product.id}`}>
      <Card className="group h-full overflow-hidden border border-slate-200 transition-all hover:-translate-y-1 hover:border-lime-200 hover:shadow-xl">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {product.imageUrl ? (
            <Image
              src={`${API_BASE_URL}${product.imageUrl}`}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-gray-300" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm hover:bg-lime-50" aria-label="Add to wishlist">
              <Heart className="h-4 w-4 text-gray-500" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm hover:bg-lime-50" aria-label="Quick view">
              <Eye className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {hasDiscount ? (
            <div className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%</div>
          ) : null}
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-600">{product.category}</p>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-lime-700">{product.title}</h3>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-700">4.8</span>
            <span>• In stock</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900">Rs {product.price}</span>
            {hasDiscount ? <span className="text-sm text-slate-400 line-through">Rs {product.originalPrice}</span> : null}
          </div>

          <div className="mt-5 flex gap-2">
            <Button size="sm" className="flex-1 bg-lime-500 text-xs font-semibold text-white hover:bg-lime-600">
              Add to cart
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

import ProductDetailLoader from "@/components/store/ProductDetailLoader";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailLoader productId={id} />;
}

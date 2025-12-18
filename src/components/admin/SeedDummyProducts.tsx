import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { dummyProducts } from "@/data/dummyProducts";
import { toast } from "sonner";
import { Database, Loader2 } from "lucide-react";

export function SeedDummyProducts() {
  const [loading, setLoading] = useState(false);
  const { addProduct, products } = useProducts();

  const handleSeed = async () => {
    if (products.length > 0) {
      const confirm = window.confirm(
        `You already have ${products.length} products. Do you still want to add ${dummyProducts.length} dummy products?`
      );
      if (!confirm) return;
    }

    setLoading(true);
    try {
      let added = 0;
      for (const product of dummyProducts) {
        await addProduct(product);
        added++;
        toast.success(`Added: ${product.title}`);
      }
      toast.success(`Successfully added ${added} dummy products!`);
    } catch (error) {
      console.error("Error seeding products:", error);
      toast.error("Failed to seed some products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSeed} 
      disabled={loading}
      variant="outline"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {loading ? "Adding Products..." : "Add Dummy Products"}
    </Button>
  );
}

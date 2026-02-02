import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { dummyProducts } from "@/data/dummyProducts";
import { toast } from "sonner";
import { Database, Loader2, Trash2 } from "lucide-react";

export function SeedDummyProducts() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { addProduct, products, clearAllProducts } = useProducts();

  const handleClear = async () => {
    if (products.length === 0) {
      toast.info("No products to clear");
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to delete all ${products.length} products? This cannot be undone.`
    );
    if (!confirm) return;

    setClearing(true);
    try {
      const count = await clearAllProducts();
      toast.success(`Cleared ${count} products from Firestore`);
    } catch (error) {
      console.error("Error clearing products:", error);
      toast.error("Failed to clear products");
    } finally {
      setClearing(false);
    }
  };

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
    <div className="flex gap-2">
      <Button 
        onClick={handleClear} 
        disabled={clearing || loading}
        variant="destructive"
        className="gap-2"
      >
        {clearing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {clearing ? "Clearing..." : "Clear All"}
      </Button>
      <Button 
        onClick={handleSeed} 
        disabled={loading || clearing}
        variant="outline"
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        {loading ? "Adding..." : "Add Dummy"}
      </Button>
    </div>
  );
}

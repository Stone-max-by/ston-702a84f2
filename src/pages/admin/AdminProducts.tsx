import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { Product, ProductType, productTypeLabels, productTypeIcons, formatFileSize } from "@/types/product";
import { ProductForm } from "@/components/admin/ProductForm";
import { SeedDummyProducts } from "@/components/admin/SeedDummyProducts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminProducts() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
    setDeleteId(null);
  };

  const handleFormSubmit = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Product updated successfully");
      } else {
        await addProduct(data);
        toast.success("Product added successfully");
      }
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      await updateProduct(product.id, { visible: !product.visible });
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  const productCounts = {
    all: products.length,
    game: products.filter(p => p.type === "game").length,
    code: products.filter(p => p.type === "code").length,
    pixellab_plp: products.filter(p => p.type === "pixellab_plp").length,
    capcut_template: products.filter(p => p.type === "capcut_template").length,
    font: products.filter(p => p.type === "font").length,
    preset: products.filter(p => p.type === "preset").length,
    other: products.filter(p => p.type === "other").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} total products (Firebase)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <SeedDummyProducts />
          <Button onClick={handleAdd} className="gap-2 flex-1 sm:flex-none">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Type Stats */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(productTypeLabels) as ProductType[]).map((type) => (
          <Badge
            key={type}
            variant={typeFilter === type ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
          >
            {productTypeIcons[type]} {productTypeLabels[type]} ({productCounts[type]})
          </Badge>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10 bg-card border-white/10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProductType | "all")}>
          <SelectTrigger className="w-full sm:w-48 bg-card border-white/10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(productTypeLabels) as ProductType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {productTypeIcons[type]} {productTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-white/5 overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Size</TableHead>
              <TableHead className="text-muted-foreground">Version</TableHead>
              <TableHead className="text-muted-foreground">Downloads</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id} className="border-white/5">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={product.thumbnail || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400"}
                      alt={product.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category} • {product.tags?.slice(0, 2).join(", ")}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {productTypeIcons[product.type]} {productTypeLabels[product.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.sizeFormatted}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  v{product.version}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.downloads?.toLocaleString() || 0}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      product.visible
                        ? "bg-success/20 text-success"
                        : "bg-white/10 text-muted-foreground"
                    }`}>
                      {product.visible ? "Visible" : "Hidden"}
                    </span>
                    {product.featured && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
                        Featured
                      </span>
                    )}
                    {product.trending && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-warning/20 text-warning">
                        Trending
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVisibility(product)}
                      className="h-8 w-8"
                    >
                      {product.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(product.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No products found. Add your first product!
        </div>
      )}

      {/* Form Dialog */}
      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingProduct || undefined}
        mode={editingProduct ? "edit" : "add"}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Eye, Loader2, FolderOpen, Database, Coins, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ApiEndpoint, ApiCategory } from "@/types/api";
import { ApiEndpointModal } from "@/components/api/ApiEndpointModal";
import { ApiEndpointForm } from "@/components/api/ApiEndpointForm";
import { ApiCategoryForm } from "@/components/api/ApiCategoryForm";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAdminApiEndpoints, useAdminApiCategories } from "@/hooks/useAdminData";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { apiProviders } from "@/data/mockApis";

const methodColors: Record<string, string> = {
  GET: "bg-success/20 text-success",
  POST: "bg-primary/20 text-primary",
  PUT: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
};

export default function AdminApiEndpoints() {
  const { endpoints, loading: endpointsLoading, addEndpoint, updateEndpoint, deleteEndpoint } = useAdminApiEndpoints();
  const { categories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory } = useAdminApiCategories();
  const { settings } = useAdminSettings();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ApiEndpoint | null>(null);
  const [editingCategory, setEditingCategory] = useState<ApiCategory | null>(null);
  const [viewEndpoint, setViewEndpoint] = useState<ApiEndpoint | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [seedingData, setSeedingData] = useState(false);

  const loading = endpointsLoading || categoriesLoading;

  const filteredEndpoints = endpoints.filter((e) => {
    const matchesSearch = 
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.path.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || e.categoryId === categoryFilter || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (endpoint: ApiEndpoint) => {
    if (endpoint.categoryId) {
      const cat = categories.find(c => c.id === endpoint.categoryId);
      return cat?.name || endpoint.category || "—";
    }
    return endpoint.category || "—";
  };

  const handleAddEndpoint = () => {
    setEditingEndpoint(null);
    setFormOpen(true);
  };

  const handleEditEndpoint = (endpoint: ApiEndpoint) => {
    setEditingEndpoint(endpoint);
    setFormOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: ApiCategory) => {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleDeleteEndpoint = async (id: string) => {
    setActionLoading(true);
    try {
      await deleteEndpoint(id);
      toast.success("API endpoint deleted successfully");
    } catch (error) {
      toast.error("Failed to delete endpoint");
    } finally {
      setActionLoading(false);
      setDeleteId(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setActionLoading(true);
    try {
      await deleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setActionLoading(false);
      setDeleteCategoryId(null);
    }
  };

  const handleEndpointFormSubmit = async (data: Omit<ApiEndpoint, "id">) => {
    setActionLoading(true);
    try {
      if (editingEndpoint) {
        await updateEndpoint(editingEndpoint.id, data);
        toast.success("API endpoint updated successfully");
      } else {
        await addEndpoint(data);
        toast.success("API endpoint added successfully");
      }
      setFormOpen(false);
    } catch (error: any) {
      console.error("Save endpoint error:", error);
      const errorMessage = error?.message || error?.code || "Failed to save endpoint";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategoryFormSubmit = async (data: Omit<ApiCategory, "id">) => {
    setActionLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success("Category updated successfully");
      } else {
        await addCategory(data);
        toast.success("Category added successfully");
      }
      setCategoryFormOpen(false);
    } catch (error: any) {
      console.error("Save category error:", error);
      const errorMessage = error?.message || error?.code || "Failed to save category";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedCategories = async () => {
    setSeedingData(true);
    try {
      for (const provider of apiProviders) {
        await addCategory({
          name: provider.name,
          description: provider.description,
          baseUrl: provider.baseUrl,
          icon: provider.icon,
          color: provider.color,
          isActive: true,
        });
      }
      toast.success(`${apiProviders.length} categories added`);
    } catch (error) {
      toast.error("Failed to seed categories");
    } finally {
      setSeedingData(false);
    }
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
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">API Management</h1>
        <p className="text-sm text-muted-foreground">{categories.length} categories, {endpoints.length} endpoints</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="bg-card border border-white/10">
          <TabsTrigger value="categories" className="gap-2">
            <Layers className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="endpoints" className="gap-2">
            <Database className="w-4 h-4" />
            Endpoints
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            {categories.length === 0 && (
              <Button onClick={handleSeedCategories} variant="outline" className="gap-2 mr-2" disabled={seedingData}>
                {seedingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Seed Demo Categories
              </Button>
            )}
            <Button onClick={handleAddCategory} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <div className="bg-card rounded-xl p-8 border border-white/5 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No categories found</p>
              <Button onClick={handleAddCategory} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First Category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`bg-gradient-to-br ${category.color} rounded-xl p-4 border border-white/10 ${category.isActive === false ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteCategoryId(category.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs font-mono text-muted-foreground truncate">{category.baseUrl}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {endpoints.filter(e => e.categoryId === category.id).length} endpoints
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search endpoints..."
                className="pl-10 bg-card border-white/10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-card border-white/10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddEndpoint} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Endpoint
            </Button>
          </div>

          {filteredEndpoints.length === 0 ? (
            <div className="bg-card rounded-xl p-8 border border-white/5 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No endpoints found</p>
              <Button onClick={handleAddEndpoint} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First Endpoint
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-white/5 overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground w-[80px]">Status</TableHead>
                    <TableHead className="text-muted-foreground">Method</TableHead>
                    <TableHead className="text-muted-foreground">Endpoint</TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Credits</TableHead>
                    <TableHead className="text-muted-foreground hidden lg:table-cell">Rate Limit</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEndpoints.map((endpoint) => (
                    <TableRow key={endpoint.id} className={`border-white/5 ${endpoint.isActive === false ? 'opacity-50' : ''}`}>
                      <TableCell>
                        <div className={`w-2 h-2 rounded-full ${endpoint.isActive !== false ? 'bg-success' : 'bg-muted-foreground'}`} />
                      </TableCell>
                      <TableCell>
                        <Badge className={`${methodColors[endpoint.method]} border-0 font-mono`}>
                          {endpoint.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm text-foreground">{endpoint.path}</p>
                          <p className="text-xs text-muted-foreground">{endpoint.title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(endpoint)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-primary">
                          <Coins className="w-3 h-3" />
                          <span className="text-sm">{endpoint.creditsCost || 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                        {endpoint.rateLimit}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewEndpoint(endpoint)}
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEndpoint(endpoint)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(endpoint.id)}
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
          )}
        </TabsContent>
      </Tabs>

      {/* View Modal */}
      <ApiEndpointModal
        endpoint={viewEndpoint}
        baseUrl={categories.find(c => c.id === viewEndpoint?.categoryId)?.baseUrl || settings.apiBaseUrl || "https://api.example.com/v1"}
        open={!!viewEndpoint}
        onClose={() => setViewEndpoint(null)}
      />

      {/* Endpoint Form Modal */}
      <ApiEndpointForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleEndpointFormSubmit}
        initialData={editingEndpoint || undefined}
        mode={editingEndpoint ? "edit" : "add"}
        categories={categories}
      />

      {/* Category Form Modal */}
      <ApiCategoryForm
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSubmit={handleCategoryFormSubmit}
        initialData={editingCategory || undefined}
        mode={editingCategory ? "edit" : "add"}
      />

      {/* Delete Endpoint Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API endpoint? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10" disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteEndpoint(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Endpoints in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10" disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategoryId && handleDeleteCategory(deleteCategoryId)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

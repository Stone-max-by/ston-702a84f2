import { useState } from "react";
import { Tags, Plus, Pencil, Trash2, Loader2, Bot, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCategories, Category } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";

interface CategoryFormData {
  name: string;
  icon: string;
  order: number;
  isActive: boolean;
}

const emptyForm: CategoryFormData = {
  name: "",
  icon: "📁",
  order: 0,
  isActive: true,
};

export default function AdminCategories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [activeTab, setActiveTab] = useState<"bot" | "product">("bot");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const botCategories = categories.filter(c => c.type === "bot");
  const productCategories = categories.filter(c => c.type === "product");
  const currentCategories = activeTab === "bot" ? botCategories : productCategories;

  const handleAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: currentCategories.length });
    setDialogOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, order: cat.order, isActive: cat.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Category name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        toast({ title: "Success", description: "Category updated" });
      } else {
        await addCategory({ ...form, type: activeTab });
        toast({ title: "Success", description: "Category added" });
      }
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      toast({ title: "Success", description: "Category deleted" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tags className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground">{categories.length} total categories</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "bot" | "product")}>
        <TabsList className="w-full">
          <TabsTrigger value="bot" className="flex-1 gap-2">
            <Bot className="w-4 h-4" />
            Bot ({botCategories.length})
          </TabsTrigger>
          <TabsTrigger value="product" className="flex-1 gap-2">
            <Package className="w-4 h-4" />
            Product ({productCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bot" className="mt-4">
          <CategoryList
            categories={botCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggleActive}
          />
        </TabsContent>
        <TabsContent value="product" className="mt-4">
          <CategoryList
            categories={productCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggleActive}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Automation, Game, Utility"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="🤖"
                />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? "Update" : "Add Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryList({
  categories,
  onEdit,
  onDelete,
  onToggle,
}: {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggle: (cat: Category) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Tags className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No categories yet</p>
        <p className="text-xs text-muted-foreground/70">Add your first category</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="glass-card p-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">{cat.icon}</span>
            <div className="min-w-0">
              <p className="font-medium text-sm">{cat.name}</p>
              <p className="text-[10px] text-muted-foreground">Order: {cat.order}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant={cat.isActive ? "default" : "secondary"}
              className="text-[10px] cursor-pointer"
              onClick={() => onToggle(cat)}
            >
              {cat.isActive ? "Active" : "Off"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cat)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(cat)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

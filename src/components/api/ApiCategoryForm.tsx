import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ApiCategory } from "@/types/api";

interface ApiCategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (category: Omit<ApiCategory, "id">) => void;
  initialData?: ApiCategory;
  mode: "add" | "edit";
}

const defaultIcons = ["🔌", "🖼️", "⬇️", "💬", "🎮", "📦", "🔐", "📊", "🛒", "📱"];
const defaultColors = [
  "from-purple-500/20 to-pink-500/20",
  "from-blue-500/20 to-cyan-500/20",
  "from-green-500/20 to-emerald-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-yellow-500/20 to-amber-500/20",
  "from-indigo-500/20 to-violet-500/20",
];

export function ApiCategoryForm({ open, onClose, onSubmit, initialData, mode }: ApiCategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [baseUrl, setBaseUrl] = useState(initialData?.baseUrl || "https://api.example.com/v1");
  const [icon, setIcon] = useState(initialData?.icon || "🔌");
  const [color, setColor] = useState(initialData?.color || defaultColors[0]);
  const [isActive, setIsActive] = useState(initialData?.isActive !== false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setDescription(initialData?.description || "");
      setBaseUrl(initialData?.baseUrl || "https://api.example.com/v1");
      setIcon(initialData?.icon || "🔌");
      setColor(initialData?.color || defaultColors[0]);
      setIsActive(initialData?.isActive !== false);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      baseUrl,
      icon,
      color,
      isActive,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === "add" ? "Add New Category" : "Edit Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Image API"
              className="bg-background border-white/10"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Generate, edit, and transform images using AI"
              className="bg-background border-white/10 min-h-[60px]"
              required
            />
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="bg-background border-white/10 font-mono text-sm"
              required
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {defaultIcons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    icon === ic 
                      ? "bg-primary/20 ring-2 ring-primary" 
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c} transition-all ${
                    color === c 
                      ? "ring-2 ring-primary" 
                      : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {mode === "add" ? "Add Category" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

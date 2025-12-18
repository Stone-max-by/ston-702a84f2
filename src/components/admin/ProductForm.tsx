import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Product,
  ProductType,
  ProductFile,
  productTypeLabels,
  defaultCategories,
  formatFileSize,
  generateSlug,
} from "@/types/product";
import { ImageUpload, MultiImageUpload } from "./ImageUpload";
import { TelegramFileIdButton } from "./TelegramFileIdButton";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => void;
  initialData?: Partial<Product>;
  mode: "add" | "edit";
}

const defaultProduct: Partial<Product> = {
  title: "",
  slug: "",
  description: "",
  shortDescription: "",
  type: "game",
  category: "",
  subcategory: "",
  tags: [],
  thumbnail: "",
  screenshots: [],
  files: [],
  filesCount: 0,
  totalSizeBytes: 0,
  sizeFormatted: "0 B",
  telegramFileIds: [],
  version: "1.0",
  changelog: "",
  uploadDate: new Date().toISOString().split("T")[0],
  updateDate: "",
  releaseYear: new Date().getFullYear(),
  priceUSD: 0,
  originalPrice: 0,
  isFree: true,
  unlockByAds: false,
  adCreditsRequired: 0,
  coinPrice: 0,
  downloads: 0,
  views: 0,
  likes: 0,
  uploader: "admin",
  uploaderId: "",
  source: "",
  credits: "",
  platform: [],
  language: ["English"],
  featured: false,
  trending: false,
  visible: true,
  isNew: true,
  metaTitle: "",
  metaDescription: "",
};

const platformOptions = ["windows", "mac", "linux", "android", "ios", "web"];
const languageOptions = ["English", "Hindi", "Spanish", "French", "German", "Russian", "Chinese", "Japanese", "Korean", "Arabic"];

export function ProductForm({ open, onClose, onSubmit, initialData, mode }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>(initialData || defaultProduct);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (open) {
      setFormData(initialData || defaultProduct);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalSize = formData.files?.reduce((acc, f) => acc + f.sizeBytes, 0) || 0;
    
    onSubmit({
      ...formData,
      slug: formData.slug || generateSlug(formData.title || ""),
      totalSizeBytes: totalSize,
      sizeFormatted: formatFileSize(totalSize),
      filesCount: formData.files?.length || 0,
      telegramFileIds: formData.files?.map(f => f.telegramFileId) || [],
      isFree: (formData.priceUSD || 0) === 0,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const updateField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setFormData({ ...formData, [key]: value });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateField("tags", [...(formData.tags || []), tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateField("tags", formData.tags?.filter((t) => t !== tag) || []);
  };

  const handleTelegramFileId = (fileId: string, fileName?: string, fileSize?: number) => {
    const file: ProductFile = {
      id: Date.now().toString(),
      name: fileName || `file_${Date.now()}`,
      telegramFileId: fileId,
      sizeBytes: fileSize || 0,
    };
    updateField("files", [...(formData.files || []), file]);
  };

  const removeFile = (id: string) => {
    updateField("files", formData.files?.filter((f) => f.id !== id) || []);
  };

  const toggleArrayItem = (key: "platform" | "language", item: string) => {
    const arr = formData[key] || [];
    if (arr.includes(item)) {
      updateField(key, arr.filter((i) => i !== item));
    } else {
      updateField(key, [...arr, item]);
    }
  };

  const currentCategories = defaultCategories[formData.type as ProductType] || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="meta">Meta</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* Product Type */}
              <div className="space-y-2">
                <Label>Product Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => updateField("type", v as ProductType)}
                >
                  <SelectTrigger className="bg-background border-white/10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(productTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      updateField("title", e.target.value);
                      if (!initialData?.slug) {
                        updateField("slug", generateSlug(e.target.value));
                      }
                    }}
                    placeholder="Product title"
                    className="bg-background border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="product-slug"
                    className="bg-background border-white/10"
                  />
                </div>
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => updateField("category", v)}
                  >
                    <SelectTrigger className="bg-background border-white/10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => updateField("subcategory", e.target.value)}
                    placeholder="Optional subcategory"
                    className="bg-background border-white/10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Full description"
                  className="bg-background border-white/10 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  placeholder="One-line description"
                  className="bg-background border-white/10"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag"
                    className="bg-background border-white/10"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="secondary" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary/20 rounded-full text-xs text-primary flex items-center gap-1"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail with Firebase Upload */}
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <ImageUpload
                  value={formData.thumbnail}
                  onChange={(url) => updateField("thumbnail", url)}
                  folder="products/thumbnails"
                  label="Upload Thumbnail"
                />
              </div>

              {/* Screenshots with Firebase Upload */}
              <div className="space-y-2">
                <Label>Screenshots</Label>
                <MultiImageUpload
                  values={formData.screenshots || []}
                  onChange={(urls) => updateField("screenshots", urls)}
                  folder="products/screenshots"
                  maxImages={10}
                />
              </div>

              {/* Version & Dates */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => updateField("version", e.target.value)}
                    placeholder="1.0.0"
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uploadDate">Upload Date</Label>
                  <Input
                    id="uploadDate"
                    type="date"
                    value={formData.uploadDate}
                    onChange={(e) => updateField("uploadDate", e.target.value)}
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="releaseYear">Release Year</Label>
                  <Input
                    id="releaseYear"
                    type="number"
                    value={formData.releaseYear}
                    onChange={(e) => updateField("releaseYear", parseInt(e.target.value) || new Date().getFullYear())}
                    className="bg-background border-white/10"
                  />
                </div>
              </div>

              {/* Platform & Language */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleArrayItem("platform", p)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        formData.platform?.includes(p)
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-white/10 text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleArrayItem("language", l)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        formData.language?.includes(l)
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-white/10 text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-4">
              {/* Telegram Bot File ID Button */}
              <div className="p-4 bg-background rounded-lg border border-white/10 space-y-3">
                <Label className="text-sm font-medium">Add File via Telegram Bot</Label>
                <p className="text-xs text-muted-foreground">
                  Click the button below to get file ID from Telegram bot
                </p>
                <TelegramFileIdButton
                  onFileIdReceived={handleTelegramFileId}
                  botUsername="YourBotUsername"
                />
              </div>

              {/* Files List */}
              {formData.files && formData.files.length > 0 && (
                <div className="space-y-2">
                  <Label>Files ({formData.files.length})</Label>
                  <div className="space-y-2">
                    {formData.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-background rounded-lg border border-white/10"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {file.telegramFileId.substring(0, 30)}... • {formatFileSize(file.sizeBytes)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total: {formatFileSize(formData.files.reduce((acc, f) => acc + f.sizeBytes, 0))}
                  </p>
                </div>
              )}

              {/* Source & Credits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source || ""}
                    onChange={(e) => updateField("source", e.target.value)}
                    placeholder="Original source URL"
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uploader">Uploader</Label>
                  <Input
                    id="uploader"
                    value={formData.uploader}
                    onChange={(e) => updateField("uploader", e.target.value)}
                    placeholder="Uploader name"
                    className="bg-background border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Textarea
                  id="credits"
                  value={formData.credits || ""}
                  onChange={(e) => updateField("credits", e.target.value)}
                  placeholder="Credit information"
                  className="bg-background border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changelog">Changelog</Label>
                <Textarea
                  id="changelog"
                  value={formData.changelog || ""}
                  onChange={(e) => updateField("changelog", e.target.value)}
                  placeholder="Version changelog"
                  className="bg-background border-white/10"
                />
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="priceUSD">Price (USD)</Label>
                  <Input
                    id="priceUSD"
                    type="number"
                    step="0.01"
                    value={formData.priceUSD || ""}
                    onChange={(e) => updateField("priceUSD", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice || ""}
                    onChange={(e) => updateField("originalPrice", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-background border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coinPrice">Coin Price</Label>
                <Input
                  id="coinPrice"
                  type="number"
                  value={formData.coinPrice || ""}
                  onChange={(e) => updateField("coinPrice", parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="bg-background border-white/10"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-white/10">
                <div>
                  <Label>Unlock by Watching Ads</Label>
                  <p className="text-xs text-muted-foreground">Allow users to unlock this by watching ads</p>
                </div>
                <Switch
                  checked={formData.unlockByAds}
                  onCheckedChange={(v) => updateField("unlockByAds", v)}
                />
              </div>

              {formData.unlockByAds && (
                <div className="space-y-2">
                  <Label htmlFor="adCreditsRequired">Ad Credits Required</Label>
                  <Input
                    id="adCreditsRequired"
                    type="number"
                    value={formData.adCreditsRequired || ""}
                    onChange={(e) => updateField("adCreditsRequired", parseInt(e.target.value) || 0)}
                    placeholder="5"
                    className="bg-background border-white/10"
                  />
                </div>
              )}
            </TabsContent>

            {/* Meta Tab */}
            <TabsContent value="meta" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle || ""}
                  onChange={(e) => updateField("metaTitle", e.target.value)}
                  placeholder="SEO title"
                  className="bg-background border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={(e) => updateField("metaDescription", e.target.value)}
                  placeholder="SEO description"
                  className="bg-background border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-white/10">
                  <Label>Featured</Label>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(v) => updateField("featured", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-white/10">
                  <Label>Trending</Label>
                  <Switch
                    checked={formData.trending}
                    onCheckedChange={(v) => updateField("trending", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-white/10">
                  <Label>Visible</Label>
                  <Switch
                    checked={formData.visible}
                    onCheckedChange={(v) => updateField("visible", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-white/10">
                  <Label>Mark as New</Label>
                  <Switch
                    checked={formData.isNew}
                    onCheckedChange={(v) => updateField("isNew", v)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="downloads">Downloads</Label>
                  <Input
                    id="downloads"
                    type="number"
                    value={formData.downloads || ""}
                    onChange={(e) => updateField("downloads", parseInt(e.target.value) || 0)}
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="views">Views</Label>
                  <Input
                    id="views"
                    type="number"
                    value={formData.views || ""}
                    onChange={(e) => updateField("views", parseInt(e.target.value) || 0)}
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="likes">Likes</Label>
                  <Input
                    id="likes"
                    type="number"
                    value={formData.likes || ""}
                    onChange={(e) => updateField("likes", parseInt(e.target.value) || 0)}
                    className="bg-background border-white/10"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Add Product" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

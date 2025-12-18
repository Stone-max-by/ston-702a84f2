import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { ApiEndpoint, ApiCategory } from "@/types/api";

interface ApiEndpointFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (endpoint: Omit<ApiEndpoint, "id">) => void;
  initialData?: ApiEndpoint;
  mode: "add" | "edit";
  categories?: ApiCategory[];
}

interface ParamForm {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export function ApiEndpointForm({ open, onClose, onSubmit, initialData, mode, categories = [] }: ApiEndpointFormProps) {
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(initialData?.method || "GET");
  const [path, setPath] = useState(initialData?.path || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [requiresAuth, setRequiresAuth] = useState(initialData?.requiresAuth || false);
  const [rateLimit, setRateLimit] = useState(initialData?.rateLimit || "100 req/min");
  const [responseExample, setResponseExample] = useState(initialData?.responseExample || '{\n  "success": true,\n  "data": {}\n}');
  const [params, setParams] = useState<ParamForm[]>(initialData?.params || []);
  const [creditsCost, setCreditsCost] = useState(initialData?.creditsCost || 1);
  const [isActive, setIsActive] = useState(initialData?.isActive !== false);

  useEffect(() => {
    if (open) {
      setMethod(initialData?.method || "GET");
      setPath(initialData?.path || "");
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setCategoryId(initialData?.categoryId || "");
      setRequiresAuth(initialData?.requiresAuth || false);
      setRateLimit(initialData?.rateLimit || "100 req/min");
      setResponseExample(initialData?.responseExample || '{\n  "success": true,\n  "data": {}\n}');
      setParams(initialData?.params || []);
      setCreditsCost(initialData?.creditsCost || 1);
      setIsActive(initialData?.isActive !== false);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCategory = categories.find(c => c.id === categoryId);
    onSubmit({
      method,
      path,
      title,
      description,
      categoryId: categoryId || undefined,
      category: selectedCategory?.name || undefined,
      requiresAuth,
      rateLimit,
      responseExample,
      params: params.length > 0 ? params : undefined,
      creditsCost,
      isActive,
    });
    onClose();
  };

  const addParam = () => {
    setParams([...params, { name: "", type: "string", required: false, description: "" }]);
  };

  const updateParam = (index: number, field: keyof ParamForm, value: string | boolean) => {
    const updated = [...params];
    updated[index] = { ...updated[index], [field]: value };
    setParams(updated);
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === "add" ? "Add New API Endpoint" : "Edit API Endpoint"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Method & Path */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger className="bg-background border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label>Path</Label>
              <Input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/products/:id"
                className="bg-background border-white/10 font-mono"
                required
              />
            </div>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Get Product Details"
                className="bg-background border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-background border-white/10">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {categories.length === 0 ? (
                    <SelectItem value="" disabled>No categories available</SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Retrieve detailed information about a specific product."
              className="bg-background border-white/10 min-h-[60px]"
              required
            />
          </div>

          {/* Auth & Rate Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <Label>Requires Authentication</Label>
              <Switch checked={requiresAuth} onCheckedChange={setRequiresAuth} />
            </div>
            <div className="space-y-2">
              <Label>Rate Limit</Label>
              <Input
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                placeholder="100 req/min"
                className="bg-background border-white/10"
              />
            </div>
          </div>

          {/* Credits Cost & Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Credits Cost (per request)</Label>
              <Input
                type="number"
                min={1}
                value={creditsCost}
                onChange={(e) => setCreditsCost(Number(e.target.value))}
                placeholder="1"
                className="bg-background border-white/10"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Parameters</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addParam} className="gap-1 h-8">
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </div>
            
            {params.length > 0 && (
              <div className="space-y-2">
                {params.map((param, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-white/5 rounded-lg items-end">
                    <div className="col-span-12 sm:col-span-3 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={param.name}
                        onChange={(e) => updateParam(index, "name", e.target.value)}
                        placeholder="id"
                        className="bg-background border-white/10 h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={param.type} onValueChange={(v) => updateParam(index, "type", v)}>
                        <SelectTrigger className="bg-background border-white/10 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="string">string</SelectItem>
                          <SelectItem value="number">number</SelectItem>
                          <SelectItem value="boolean">boolean</SelectItem>
                          <SelectItem value="object">object</SelectItem>
                          <SelectItem value="array">array</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4 sm:col-span-2 flex items-center gap-2 pt-5">
                      <Switch
                        checked={param.required}
                        onCheckedChange={(v) => updateParam(index, "required", v)}
                      />
                      <span className="text-xs text-muted-foreground">Req</span>
                    </div>
                    <div className="col-span-10 sm:col-span-4 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={param.description}
                        onChange={(e) => updateParam(index, "description", e.target.value)}
                        placeholder="Product ID"
                        className="bg-background border-white/10 h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParam(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response Example */}
          <div className="space-y-2">
            <Label>Response Example (JSON)</Label>
            <Textarea
              value={responseExample}
              onChange={(e) => setResponseExample(e.target.value)}
              placeholder='{"success": true, "data": {}}'
              className="bg-background border-white/10 min-h-[120px] font-mono text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {mode === "add" ? "Add Endpoint" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

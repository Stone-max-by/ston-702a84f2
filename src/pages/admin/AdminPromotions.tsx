import { useState } from "react";
import { 
  Megaphone, 
  Plus, 
  Image, 
  Link, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Send,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePromotions, CreatePromotionData } from "@/hooks/usePromotions";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function AdminPromotions() {
  const { promotions, activePromotions, loading, createPromotion, deletePromotion, togglePromotion } = usePromotions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreatePromotionData>({
    title: '',
    message: '',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Title and message are required");
      return;
    }

    setCreating(true);
    const success = await createPromotion(formData);
    setCreating(false);

    if (success) {
      toast.success("Promotion created!");
      setDialogOpen(false);
      setFormData({ title: '', message: '', imageUrl: '', linkUrl: '', linkText: '' });
    } else {
      toast.error("Failed to create promotion");
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deletePromotion(id);
    if (success) {
      toast.success("Promotion deleted");
    } else {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await togglePromotion(id, !isActive);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Promotions</h1>
            <p className="text-xs text-muted-foreground">Push notifications to users</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                Create Promotion
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Title *</Label>
                <Input
                  placeholder="e.g. Special Offer!"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Message *</Label>
                <Textarea
                  placeholder="Enter your promotional message..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Image className="w-3 h-3" /> Image URL (optional)
                </Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
                {formData.imageUrl && (
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg border"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Link className="w-3 h-3" /> Link URL
                  </Label>
                  <Input
                    placeholder="https://..."
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Button Text</Label>
                  <Input
                    placeholder="e.g. Learn More"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {creating ? 'Creating...' : 'Create & Send'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <AdminStatCard
          title="Total"
          value={promotions.length}
          icon={Megaphone}
          color="primary"
        />
        <AdminStatCard
          title="Active"
          value={activePromotions.length}
          icon={Eye}
          color="success"
        />
      </div>

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No promotions yet</p>
          <p className="text-xs text-muted-foreground/70">Create one to notify all users</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => (
            <div 
              key={promo.id}
              className="p-3 bg-card rounded-xl border border-border/50"
            >
              <div className="flex items-start gap-3">
                {promo.imageUrl && (
                  <img 
                    src={promo.imageUrl} 
                    alt="" 
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{promo.title}</p>
                    {promo.isActive ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/20 text-success">Active</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{promo.message}</p>
                  {promo.linkUrl && (
                    <a 
                      href={promo.linkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-1"
                    >
                      <Link className="w-3 h-3" />
                      {promo.linkText || promo.linkUrl}
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(promo.createdAt, { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggle(promo.id, promo.isActive)}
                  >
                    {promo.isActive ? (
                      <ToggleRight className="w-4 h-4 text-success" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this promotion.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(promo.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Bot, Plus, Pencil, Trash2, Loader2, Search, ExternalLink } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TelegramBot } from "@/types/bot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const categories = ["Automation", "Utility", "Entertainment", "Finance", "Social"];

interface BotFormData {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  features: string;
  webhookUrl: string;
  isActive: boolean;
}

const emptyFormData: BotFormData = {
  name: "",
  shortDescription: "",
  description: "",
  price: 0,
  originalPrice: 0,
  image: "",
  category: "Utility",
  features: "",
  webhookUrl: "",
  isActive: true,
};

export default function AdminBots() {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null);
  const [formData, setFormData] = useState<BotFormData>(emptyFormData);
  const { toast } = useToast();

  const fetchBots = async () => {
    try {
      const botsRef = collection(db, 'telegram_bots');
      const q = query(botsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const botsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as TelegramBot[];
      
      setBots(botsData);
    } catch (err) {
      console.error('Error fetching bots:', err);
      toast({
        title: "Error",
        description: "Failed to load bots",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleEdit = (bot: TelegramBot) => {
    setEditingBot(bot);
    setFormData({
      name: bot.name,
      shortDescription: bot.shortDescription,
      description: bot.description,
      price: bot.price,
      originalPrice: bot.originalPrice || 0,
      image: bot.image,
      category: bot.category,
      features: bot.features.join(", "),
      webhookUrl: bot.webhookUrl || "",
      isActive: bot.isActive,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBot(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Name and price are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const botData = {
        name: formData.name,
        shortDescription: formData.shortDescription,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        image: formData.image,
        category: formData.category,
        features: formData.features.split(",").map(f => f.trim()).filter(Boolean),
        webhookUrl: formData.webhookUrl,
        isActive: formData.isActive,
        rating: editingBot?.rating || 4.5,
        totalSales: editingBot?.totalSales || 0,
      };

      if (editingBot) {
        await updateDoc(doc(db, 'telegram_bots', editingBot.id), botData);
        toast({ title: "Success", description: "Bot updated successfully" });
      } else {
        await addDoc(collection(db, 'telegram_bots'), {
          ...botData,
          createdAt: serverTimestamp()
        });
        toast({ title: "Success", description: "Bot added successfully" });
      }

      setDialogOpen(false);
      fetchBots();
    } catch (err) {
      console.error('Error saving bot:', err);
      toast({
        title: "Error",
        description: "Failed to save bot",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bot: TelegramBot) => {
    if (!confirm(`Delete "${bot.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'telegram_bots', bot.id));
      toast({ title: "Success", description: "Bot deleted successfully" });
      fetchBots();
    } catch (err) {
      console.error('Error deleting bot:', err);
      toast({
        title: "Error",
        description: "Failed to delete bot",
        variant: "destructive"
      });
    }
  };

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bot Management</h1>
            <p className="text-sm text-muted-foreground">{bots.length} bots total</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBot ? "Edit Bot" : "Add New Bot"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bot name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief description for cards"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed bot description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="299"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Original Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    placeholder="499 (for discount display)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Features (comma separated)</Label>
                <Input
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Feature 1, Feature 2, Feature 3"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook URL (for auto-delivery)</Label>
                <Input
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://your-webhook.com/deliver"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Active (visible in marketplace)</Label>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingBot ? "Update Bot" : "Add Bot"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search bots..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredBots.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No bots found</p>
          <p className="text-sm text-muted-foreground/70">Add your first bot to get started</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bot</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBots.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={bot.image}
                        alt={bot.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{bot.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {bot.shortDescription}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{bot.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">₹{bot.price}</span>
                      {bot.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through ml-1">
                          ₹{bot.originalPrice}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{bot.totalSales}</TableCell>
                  <TableCell>
                    <Badge variant={bot.isActive ? "default" : "secondary"}>
                      {bot.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(bot)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(bot)}
                        className="text-destructive hover:text-destructive"
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
    </div>
  );
}

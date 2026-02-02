import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Loader2, Check, AlertCircle, Bot } from "lucide-react";
import { toast } from "sonner";
import { useTempUploads, TempUpload } from "@/hooks/useTempUploads";
import { ProductFile } from "@/types/product";

interface TelegramFetchButtonProps {
  onDataFetched: (data: {
    title?: string;
    file?: ProductFile;
    thumbnailFileId?: string;
  }) => void;
}

export function TelegramFetchButton({ onDataFetched }: TelegramFetchButtonProps) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<TempUpload | null>(null);
  const { fetchBySessionId, markAsUsed } = useTempUploads();

  const handleFetch = async () => {
    if (!sessionId.trim()) {
      toast.error("Please enter a Session ID");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchBySessionId(sessionId.trim());
      
      if (!data) {
        toast.error("Session ID not found");
        setFetchedData(null);
        return;
      }

      if (data.status === "used") {
        toast.error("This session has already been used");
        setFetchedData(null);
        return;
      }

      if (data.status === "pending") {
        toast.error("No file uploaded yet. Upload a file via Telegram first.");
        setFetchedData(null);
        return;
      }

      setFetchedData(data);
      toast.success("Data fetched successfully!");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!fetchedData) return;

    // Prepare file data
    const file: ProductFile | undefined = fetchedData.fileId ? {
      id: Date.now().toString(),
      name: fetchedData.fileName || "file",
      telegramFileId: fetchedData.fileId,
      sizeBytes: fetchedData.fileSize || 0,
      mimeType: fetchedData.mimeType,
    } : undefined;

    // Call the callback with fetched data
    onDataFetched({
      title: fetchedData.title,
      file,
      thumbnailFileId: fetchedData.thumbnailFileId,
    });

    // Mark as used
    try {
      await markAsUsed(fetchedData.id);
    } catch (error) {
      console.error("Error marking as used:", error);
    }

    toast.success("Data applied to form!");
    setOpen(false);
    setSessionId("");
    setFetchedData(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <>
      <Button
        type="button"
        variant="default"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Fetch from Telegram
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Fetch from Telegram
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the Session ID from the Telegram bot to auto-fill product data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Session ID Input */}
            <div className="space-y-2">
              <Label>Session ID</Label>
              <div className="flex gap-2">
                <Input
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  className="bg-background border-white/10 font-mono uppercase"
                  maxLength={6}
                />
                <Button
                  type="button"
                  onClick={handleFetch}
                  disabled={loading || !sessionId.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
            </div>

            {/* Fetched Data Preview */}
            {fetchedData && (
              <div className="p-4 bg-background rounded-lg border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <Check className="w-4 h-4" />
                  Data Found!
                </div>
                
                <div className="space-y-2 text-sm">
                  {fetchedData.title && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium">{fetchedData.title}</span>
                    </div>
                  )}
                  
                  {fetchedData.fileName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File:</span>
                      <span className="font-medium truncate max-w-[200px]">{fetchedData.fileName}</span>
                    </div>
                  )}
                  
                  {fetchedData.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">{formatFileSize(fetchedData.fileSize)}</span>
                    </div>
                  )}
                  
                  {fetchedData.mimeType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{fetchedData.mimeType}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thumbnail:</span>
                    <span className="font-medium">
                      {fetchedData.thumbnailFileId ? "✅ Yes" : "❌ No"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded by:</span>
                    <span className="font-medium">
                      @{fetchedData.telegramUsername || fetchedData.telegramUserId}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!fetchedData && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-1">How to get Session ID:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open Telegram bot and send /upload</li>
                  <li>Send your product file</li>
                  <li>Send thumbnail (or /skip)</li>
                  <li>Copy the Session ID shown</li>
                </ol>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => {
                setOpen(false);
                setFetchedData(null);
                setSessionId("");
              }}>
                Cancel
              </Button>
              {fetchedData && (
                <Button type="button" onClick={handleApply}>
                  Apply to Form
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

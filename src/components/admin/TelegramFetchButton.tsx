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
import { Download, Loader2, Check, AlertCircle, Bot, RefreshCw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTempUploads, TempUpload } from "@/hooks/useTempUploads";
import { ProductFile } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface TelegramFetchButtonProps {
  onDataFetched: (data: {
    title?: string;
    file?: ProductFile;
    thumbnailFileId?: string;
    thumbnailUrl?: string;
    telegramUsername?: string;
  }) => void;
}

export function TelegramFetchButton({ onDataFetched }: TelegramFetchButtonProps) {
  const [open, setOpen] = useState(false);
  const [fileUniqueId, setFileUniqueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [fetchedData, setFetchedData] = useState<TempUpload | null>(null);
  const { fetchByFileUniqueId, incrementUsageCount, updateThumbnailUrl } = useTempUploads();

  const handleFetch = async () => {
    if (!fileUniqueId.trim()) {
      toast.error("Please enter a File ID");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchByFileUniqueId(fileUniqueId.trim());
      
      if (!data) {
        toast.error("File ID not found. Upload a file via Telegram first.");
        setFetchedData(null);
        return;
      }

      if (data.status === "pending") {
        toast.error("File upload not complete. Send the file to Telegram bot first.");
        setFetchedData(null);
        return;
      }

      setFetchedData(data);
      toast.success("File data found!");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadThumbnail = async () => {
    if (!fetchedData?.thumbnailFileId) {
      toast.error("No thumbnail to upload");
      return;
    }

    // If already uploaded, skip
    if (fetchedData.thumbnailUrl) {
      toast.info("Thumbnail already uploaded to ImageKit");
      return;
    }

    setUploadingThumbnail(true);
    try {
      const { data: imagekitData, error: imagekitError } = await supabase.functions.invoke('upload-to-imagekit', {
        body: {
          telegramFileId: fetchedData.thumbnailFileId,
          fileName: `thumb_${fetchedData.fileUniqueId}_${Date.now()}.jpg`,
        },
      });

      if (imagekitError) {
        console.error("ImageKit upload error:", imagekitError);
        toast.error("Failed to upload thumbnail to ImageKit");
        return;
      }

      if (imagekitData?.url) {
        // Save the URL to Firestore
        await updateThumbnailUrl(fetchedData.id, imagekitData.url);
        
        // Update local state
        setFetchedData(prev => prev ? { ...prev, thumbnailUrl: imagekitData.url } : null);
        
        toast.success(`Thumbnail uploaded! Saved ${imagekitData.optimization?.savedPercent || 0}%`);
      }
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleApply = async () => {
    if (!fetchedData) return;

    // Prepare file data
    const file: ProductFile | undefined = fetchedData.fileId ? {
      id: fetchedData.fileUniqueId,
      name: fetchedData.fileName || "file",
      telegramFileId: fetchedData.fileId,
      sizeBytes: fetchedData.fileSize || 0,
      mimeType: fetchedData.mimeType,
    } : undefined;

    // Get thumbnail URL (either already uploaded or needs upload)
    let thumbnailUrl = fetchedData.thumbnailUrl;
    
    // If no URL but has thumbnail, upload it first
    if (!thumbnailUrl && fetchedData.thumbnailFileId) {
      setUploadingThumbnail(true);
      try {
        const { data: imagekitData } = await supabase.functions.invoke('upload-to-imagekit', {
          body: {
            telegramFileId: fetchedData.thumbnailFileId,
            fileName: `thumb_${fetchedData.fileUniqueId}_${Date.now()}.jpg`,
          },
        });
        
        if (imagekitData?.url) {
          thumbnailUrl = imagekitData.url;
          await updateThumbnailUrl(fetchedData.id, thumbnailUrl);
        }
      } catch (error) {
        console.error("Error uploading thumbnail:", error);
      } finally {
        setUploadingThumbnail(false);
      }
    }

    // Call the callback with fetched data
    onDataFetched({
      title: fetchedData.title,
      file,
      thumbnailFileId: fetchedData.thumbnailFileId,
      thumbnailUrl,
      telegramUsername: fetchedData.telegramUsername || String(fetchedData.telegramUserId),
    });

    // Increment usage count (but don't block)
    incrementUsageCount(fetchedData.id).catch(console.error);

    toast.success("Data applied to form!");
    setOpen(false);
    setFileUniqueId("");
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
              Enter the File ID from Telegram bot to auto-fill product data. Same file can be used multiple times.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File ID Input */}
            <div className="space-y-2">
              <Label>File Unique ID</Label>
              <div className="flex gap-2">
                <Input
                  value={fileUniqueId}
                  onChange={(e) => setFileUniqueId(e.target.value)}
                  placeholder="e.g., AgADJh4AAosDCFQ"
                  className="bg-background border-white/10 font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleFetch}
                  disabled={loading || !fileUniqueId.trim()}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-500">
                    <Check className="w-4 h-4" />
                    File Found!
                  </div>
                  {fetchedData.usageCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Used {fetchedData.usageCount}x
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  {fetchedData.title && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium truncate max-w-[200px]">{fetchedData.title}</span>
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
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Thumbnail:</span>
                    <div className="flex items-center gap-2">
                      {fetchedData.thumbnailUrl ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={fetchedData.thumbnailUrl} 
                            alt="Thumbnail" 
                            className="w-8 h-8 object-cover rounded"
                          />
                          <span className="text-green-500 text-xs">✅ Uploaded</span>
                        </div>
                      ) : fetchedData.thumbnailFileId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleUploadThumbnail}
                          disabled={uploadingThumbnail}
                          className="h-7 text-xs"
                        >
                          {uploadingThumbnail ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <ImageIcon className="w-3 h-3 mr-1" />
                          )}
                          Upload to ImageKit
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">❌ None</span>
                      )}
                    </div>
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
                <p className="font-medium mb-1">How to get File ID:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Send your product file to Telegram bot</li>
                  <li>Send thumbnail image (optional)</li>
                  <li>Copy the <code className="bg-background px-1 rounded">File ID</code> shown</li>
                  <li>Paste here - reuse anytime!</li>
                </ol>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => {
                setOpen(false);
                setFetchedData(null);
                setFileUniqueId("");
              }}>
                Cancel
              </Button>
              {fetchedData && (
                <Button 
                  type="button" 
                  onClick={handleApply}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Apply to Form"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

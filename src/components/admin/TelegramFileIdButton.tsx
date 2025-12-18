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
import { Bot, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface TelegramFileIdButtonProps {
  onFileIdReceived: (fileId: string, fileName?: string, fileSize?: number) => void;
  botUsername?: string;
}

export function TelegramFileIdButton({ 
  onFileIdReceived, 
  botUsername = "YourBotUsername" 
}: TelegramFileIdButtonProps) {
  const [open, setOpen] = useState(false);
  const [fileId, setFileId] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Command to send to bot
  const botCommand = "/getfileid";

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(botCommand);
    setCopied(true);
    toast.success("Command copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (fileId.trim()) {
      onFileIdReceived(fileId.trim(), fileName.trim() || undefined, fileSize || undefined);
      setOpen(false);
      setFileId("");
      setFileName("");
      setFileSize(0);
      toast.success("File ID added!");
    }
  };

  const openTelegramBot = () => {
    window.open(`https://t.me/${botUsername}`, "_blank");
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Bot className="w-4 h-4" />
        Get File ID from Bot
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Get Telegram File ID
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload your file to the Telegram bot and paste the file ID here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Open Bot */}
            <div className="p-3 bg-background rounded-lg border border-white/10">
              <p className="text-sm font-medium mb-2">Step 1: Open Bot</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openTelegramBot}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open @{botUsername}
              </Button>
            </div>

            {/* Step 2: Send Command */}
            <div className="p-3 bg-background rounded-lg border border-white/10">
              <p className="text-sm font-medium mb-2">Step 2: Send this command</p>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                  {botCommand}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyCommand}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Step 3: Upload File */}
            <div className="p-3 bg-background rounded-lg border border-white/10">
              <p className="text-sm font-medium mb-2">Step 3: Upload your file to the bot</p>
              <p className="text-xs text-muted-foreground">
                The bot will reply with the file ID. Copy and paste it below.
              </p>
            </div>

            {/* Step 4: Enter File ID */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>File ID *</Label>
                <Input
                  value={fileId}
                  onChange={(e) => setFileId(e.target.value)}
                  placeholder="Paste file ID here"
                  className="bg-background border-white/10 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>File Name</Label>
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="game.zip"
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size (bytes)</Label>
                  <Input
                    type="number"
                    value={fileSize || ""}
                    onChange={(e) => setFileSize(parseInt(e.target.value) || 0)}
                    placeholder="1073741824"
                    className="bg-background border-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!fileId.trim()}>
                Add File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

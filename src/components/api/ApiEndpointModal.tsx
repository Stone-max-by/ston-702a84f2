import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check, Zap, Key, Coins, Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { ApiEndpoint } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface ApiEndpointModalProps {
  endpoint: ApiEndpoint | null;
  baseUrl: string;
  open: boolean;
  onClose: () => void;
}

const methodColors: Record<string, string> = {
  GET: "bg-success/20 text-success",
  POST: "bg-primary/20 text-primary",
  PUT: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
};

export function ApiEndpointModal({ endpoint, baseUrl, open, onClose }: ApiEndpointModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState(false);
  const { user } = useAuth();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowApiKey(false);
      setApiKey(null);
      setShowKeyValue(false);
    }
  }, [open]);

  if (!endpoint) return null;

  const fullUrl = `${baseUrl}${endpoint.path}`;
  const creditsCost = endpoint.creditsCost || 1;

  const curlExample = `curl -X ${endpoint.method} "${fullUrl}"${
    endpoint.requiresAuth ? ' \\\n  -H "Authorization: Bearer YOUR_API_KEY"' : ""
  }`;

  const jsExample = `const response = await fetch("${fullUrl}", {
  method: "${endpoint.method}",${
    endpoint.requiresAuth
      ? `\n  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }`
      : ""
  }
});

const data = await response.json();
console.log(data);`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGetApiKey = async () => {
    if (!user) {
      toast.error("Please login first to get your API key");
      return;
    }

    setLoadingKey(true);
    try {
      // Fetch user's API key from Firestore
      const apiKeysRef = collection(db, "apiKeys");
      const q = query(
        apiKeysRef, 
        where("userId", "==", user.id),
        where("isActive", "==", true),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("No API key found. Please create one in your profile.");
        setApiKey(null);
      } else {
        const keyData = snapshot.docs[0].data();
        setApiKey(keyData.apiKey || keyData.key || `${keyData.keyPrefix}...`);
        setShowApiKey(true);
      }
    } catch (error) {
      console.error("Error fetching API key:", error);
      toast.error("Failed to fetch API key");
    } finally {
      setLoadingKey(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + "•".repeat(Math.min(key.length - 8, 20));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-card border-white/10 h-[85vh] rounded-t-2xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-white/5">
            <SheetTitle className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-foreground">
                <Badge className={`${methodColors[endpoint.method]} border-0 font-mono text-[10px]`}>
                  {endpoint.method}
                </Badge>
                <span className="text-sm font-semibold truncate">{endpoint.title}</span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{fullUrl}</p>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Description */}
            <p className="text-xs text-muted-foreground">{endpoint.description}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md">
                <span className="text-[10px] text-muted-foreground">Auth:</span>
                <span className={`text-[10px] font-medium ${endpoint.requiresAuth ? "text-warning" : "text-success"}`}>
                  {endpoint.requiresAuth ? "Required" : "Public"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md">
                <Zap className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-foreground">{endpoint.rateLimit}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md">
                <Coins className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-medium">{creditsCost} credit/req</span>
              </div>
            </div>

            {/* Get API Key Section */}
            {endpoint.requiresAuth && (
              <div className="bg-background rounded-lg p-3 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">Your API Key</span>
                  </div>
                  {!showApiKey ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGetApiKey}
                      disabled={loadingKey}
                      className="h-7 text-[10px] px-2"
                    >
                      {loadingKey ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Key className="w-3 h-3 mr-1" />
                      )}
                      Get API Key
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowKeyValue(!showKeyValue)}
                        className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {showKeyValue ? (
                          <EyeOff className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (apiKey) {
                            copyToClipboard(apiKey, "apikey");
                            toast.success("API Key copied!");
                          }
                        }}
                        className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {copied === "apikey" ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {showApiKey && apiKey && (
                  <div className="bg-card rounded px-2 py-1.5 border border-white/5">
                    <code className="text-[10px] font-mono text-foreground break-all">
                      {showKeyValue ? apiKey : maskApiKey(apiKey)}
                    </code>
                  </div>
                )}
                {showApiKey && !apiKey && (
                  <p className="text-[10px] text-muted-foreground">
                    No active API key found. Create one in your profile.
                  </p>
                )}
              </div>
            )}

            {/* Parameters */}
            {endpoint.params && endpoint.params.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Parameters</h4>
                <div className="space-y-2">
                  {endpoint.params.map((param) => (
                    <div key={param.name} className="bg-background rounded-lg p-2.5 border border-white/5">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="text-xs font-mono text-primary">{param.name}</code>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{param.type}</Badge>
                        {param.required && (
                          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-warning/20 text-warning border-0">Required</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{param.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Examples */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Code Examples</h4>
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="bg-white/5 border border-white/5 w-full h-8">
                  <TabsTrigger value="curl" className="data-[state=active]:bg-white/10 flex-1 text-xs">cURL</TabsTrigger>
                  <TabsTrigger value="js" className="data-[state=active]:bg-white/10 flex-1 text-xs">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl" className="mt-2">
                  <div className="relative">
                    <pre className="bg-background rounded-lg p-3 text-[10px] font-mono text-foreground overflow-x-auto border border-white/5">
                      {curlExample}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(curlExample, "curl")}
                      className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {copied === "curl" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </TabsContent>
                <TabsContent value="js" className="mt-2">
                  <div className="relative">
                    <pre className="bg-background rounded-lg p-3 text-[10px] font-mono text-foreground overflow-x-auto border border-white/5">
                      {jsExample}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(jsExample, "js")}
                      className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {copied === "js" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Response Example */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Response Example</h4>
              <div className="relative">
                <pre className="bg-background rounded-lg p-3 text-[10px] font-mono text-foreground overflow-x-auto border border-white/5 max-h-32">
                  {endpoint.responseExample}
                </pre>
                <button
                  onClick={() => copyToClipboard(endpoint.responseExample, "response")}
                  className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {copied === "response" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

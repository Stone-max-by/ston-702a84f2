import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Zap, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { ApiEndpoint } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const { user } = useAuth();

  // Fetch user's API key and settings when modal opens
  useEffect(() => {
    if (!open) {
      setUserApiKey(null);
      return;
    }

    const fetchData = async () => {
      // Fetch auto-fill setting
      try {
        const settingsRef = doc(db, "config", "settings");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const settings = settingsSnap.data();
          setAutoFillEnabled(settings.autoFillApiKey !== false);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }

      // Fetch user's API key from users collection in Firestore
      if (user?.telegramId) {
        try {
          const userRef = doc(db, "users", String(user.telegramId));
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.apiKey?.isActive && userData.apiKey?.key) {
              setUserApiKey(userData.apiKey.key);
            }
          }
        } catch (error) {
          console.error("Error fetching API key:", error);
        }
      }
    };

    fetchData();
  }, [open, user]);

  if (!endpoint) return null;

  const fullUrl = `${baseUrl}${endpoint.path}`;
  const creditsCost = endpoint.creditsCost || 1;

  // Use actual API key if available and auto-fill is enabled
  const displayApiKey = (autoFillEnabled && userApiKey) ? userApiKey : "YOUR_API_KEY";

  const curlExample = `curl -X ${endpoint.method} "${fullUrl}"${
    endpoint.requiresAuth ? ` \\\n  -H "Authorization: Bearer ${displayApiKey}"` : ""
  }`;

  const jsExample = `const response = await fetch("${fullUrl}", {
  method: "${endpoint.method}",${
    endpoint.requiresAuth
      ? `\n  headers: {
    "Authorization": "Bearer ${displayApiKey}"
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

            {/* API Key Status - small indicator */}
            {endpoint.requiresAuth && autoFillEnabled && (
              <div className="flex items-center gap-2">
                {userApiKey ? (
                  <span className="text-[10px] text-success flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Your API key is auto-filled in examples
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Login to auto-fill your API key
                  </span>
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

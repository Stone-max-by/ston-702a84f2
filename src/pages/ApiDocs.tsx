import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ApiEndpointModal } from "@/components/api/ApiEndpointModal";
import { ApiPricingModal } from "@/components/api/ApiPricingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, ArrowLeft, Globe, CreditCard, Zap, Activity, Clock, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestoreApis } from "@/hooks/useFirestoreApis";
import { ApiEndpoint, ApiProvider } from "@/types/api";
import { useUserApiCredits } from "@/contexts/UserApiCreditsContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const methodColors: Record<string, string> = {
  GET: "bg-success/20 text-success",
  POST: "bg-primary/20 text-primary",
  PUT: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

export default function ApiDocs() {
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { remainingRequests } = useUserApiCredits();
  const { requireAuth } = useRequireAuth();
  const { providers: apiProviders, loading } = useFirestoreApis();

  const totalApis = apiProviders.length;
  const totalEndpoints = apiProviders.reduce((sum, p) => sum + p.totalEndpoints, 0);
  const totalRequests = apiProviders.reduce((sum, p) => sum + p.totalRequests, 0);
  const avgSuccessRate = apiProviders.length > 0 
    ? apiProviders.reduce((sum, p) => sum + p.successRate, 0) / apiProviders.length 
    : 0;

  const filteredProviders = apiProviders.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEndpoints = selectedProvider?.endpoints.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.path.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleBuyPlans = () => {
    if (!requireAuth('buy API plans')) return;
    setShowPricingModal(true);
  };

  return (
    <AppLayout title={selectedProvider ? selectedProvider.name : "API Marketplace"}>
      <div className="space-y-4 pb-6">
        {/* Back Button when viewing provider */}
        {selectedProvider && (
          <button
            onClick={() => {
              setSelectedProvider(null);
              setSearch("");
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to APIs
          </button>
        )}

        {/* Stats Banner */}
        {!selectedProvider && (
          <div className="space-y-3">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total APIs</span>
                </div>
                <p className="text-xl font-bold text-foreground">{totalApis}</p>
                <p className="text-[10px] text-muted-foreground">{totalEndpoints} endpoints</p>
              </div>

              <div className="bg-card rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Requests</span>
                </div>
                <p className="text-xl font-bold text-foreground">{formatNumber(totalRequests)}</p>
                <p className="text-[10px] text-muted-foreground">API calls served</p>
              </div>

              <div className="bg-card rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-warning/20 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-warning" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Success Rate</span>
                </div>
                <p className="text-xl font-bold text-foreground">{avgSuccessRate.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground">Avg. uptime</p>
              </div>

              <div className="bg-card rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Your Requests</span>
                </div>
                <p className="text-xl font-bold text-foreground">{remainingRequests}</p>
                <p className="text-[10px] text-muted-foreground">Remaining</p>
              </div>
            </div>

            {/* Buy Plans Button */}
            <Button
              onClick={handleBuyPlans}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-11"
            >
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">Buy API Plans</span>
            </Button>
          </div>
        )}

        {/* Provider Info Banner with Stats */}
        {selectedProvider && (
          <div className={`bg-gradient-to-r ${selectedProvider.color} rounded-xl p-4 border border-white/10`}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{selectedProvider.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground">{selectedProvider.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedProvider.description}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <code className="text-[10px] font-mono text-primary truncate">{selectedProvider.baseUrl}</code>
                </div>
              </div>
            </div>
            
            {/* Provider Stats */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-xs font-bold text-foreground">{formatNumber(selectedProvider.totalRequests)}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">Requests</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle className="w-3 h-3 text-warning" />
                  <span className="text-xs font-bold text-foreground">{selectedProvider.successRate}%</span>
                </div>
                <p className="text-[9px] text-muted-foreground">Success</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-bold text-foreground">{selectedProvider.avgResponseTime}ms</span>
                </div>
                <p className="text-[9px] text-muted-foreground">Avg. Time</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={selectedProvider ? "Search endpoints..." : "Search APIs..."}
            className="pl-10 bg-card border-white/10"
          />
        </div>

        {/* Provider List */}
        {!selectedProvider && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No APIs found</p>
              </div>
            ) : (
              filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider);
                    setSearch("");
                  }}
                  className="w-full bg-card rounded-xl border border-white/5 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-2xl`}>
                      {provider.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{provider.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">{provider.totalEndpoints} endpoints</span>
                        <span className="text-[10px] text-success flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {provider.successRate}%
                        </span>
                        <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {provider.avgResponseTime}ms
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Endpoints List */}
        {selectedProvider && (
          <div className="space-y-2">
            {filteredEndpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                onClick={() => setSelectedEndpoint(endpoint)}
                className="w-full bg-card rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <Badge className={`${methodColors[endpoint.method]} border-0 font-mono text-[10px] shrink-0 mt-0.5`}>
                    {endpoint.method}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{endpoint.title}</p>
                    <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{endpoint.path}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}

            {filteredEndpoints.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No endpoints found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ApiEndpointModal
        endpoint={selectedEndpoint}
        baseUrl={selectedProvider?.baseUrl || ""}
        open={!!selectedEndpoint}
        onClose={() => setSelectedEndpoint(null)}
      />

      <ApiPricingModal
        open={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        providerName={selectedProvider?.name}
      />
    </AppLayout>
  );
}

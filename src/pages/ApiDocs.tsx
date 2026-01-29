import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ApiEndpointModal } from "@/components/api/ApiEndpointModal";
import { ApiPricingModal } from "@/components/api/ApiPricingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, ChevronRight, ArrowLeft, Globe, CreditCard, Zap, Clock, Loader2, AlertCircle, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestoreApis } from "@/hooks/useFirestoreApis";
import { ApiEndpoint, ApiProvider } from "@/types/api";
import { useUserData } from "@/hooks/useUserData";
import { usePurchases } from "@/hooks/usePurchases";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays, isPast } from "date-fns";

const methodColors: Record<string, string> = {
  GET: "bg-success/20 text-success",
  POST: "bg-primary/20 text-primary",
  PUT: "bg-warning/20 text-warning",
  DELETE: "bg-destructive/20 text-destructive",
};

export default function ApiDocs() {
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { apiCredits, activePlan } = useUserData();
  const { requireAuth } = useRequireAuth();
  const { user } = useAuth();
  const { providers: apiProviders, loading } = useFirestoreApis();
  const { activePurchases, remainingRequests, totalRequests, usedRequests } = usePurchases();

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

  // Get active purchase from purchases collection (primary source)
  const latestActivePurchase = activePurchases.length > 0 
    ? activePurchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0]
    : null;

  // Plan calculations - prioritize purchases collection data
  const hasPlan = !!latestActivePurchase || !!activePlan;
  const purchaseExpiryDate = latestActivePurchase?.expiryDate || activePlan?.expiryDate;
  const isExpired = purchaseExpiryDate ? isPast(new Date(purchaseExpiryDate)) : false;
  const daysRemaining = purchaseExpiryDate ? differenceInDays(new Date(purchaseExpiryDate), new Date()) : 0;
  
  // Use purchase data for credits display
  const displayTotalCredits = latestActivePurchase?.totalRequests || activePlan?.totalCredits || 0;
  const displayUsedCredits = latestActivePurchase?.usedRequests || 0;
  const displayRemainingCredits = latestActivePurchase 
    ? latestActivePurchase.totalRequests - latestActivePurchase.usedRequests 
    : apiCredits;
  const usagePercent = displayTotalCredits > 0 
    ? Math.round((displayRemainingCredits / displayTotalCredits) * 100) 
    : 0;
  
  // Plan name from purchase or activePlan
  const planName = activePlan?.planName || (latestActivePurchase ? `API Plan` : null);
  const purchaseDate = activePlan?.purchaseDate || latestActivePurchase?.purchaseDate;

  return (
    <AppLayout title={selectedProvider ? selectedProvider.name : "API"}>
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

        {/* My Plan Card - Only show on main page */}
        {!selectedProvider && user && (
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20">
            {hasPlan && !isExpired ? (
              <>
                {/* Active Plan Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{planName || "API Plan"}</h3>
                      {purchaseDate && (
                        <p className="text-[10px] text-muted-foreground">
                          Purchased {format(new Date(purchaseDate), "dd MMM yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                    daysRemaining <= 3 
                      ? 'bg-destructive/20 text-destructive' 
                      : daysRemaining <= 7 
                        ? 'bg-warning/20 text-warning'
                        : 'bg-success/20 text-success'
                  }`}>
                    {daysRemaining} days left
                  </div>
                </div>

                {/* Credits Usage */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API Requests</span>
                    <span className="font-bold text-foreground">
                      {displayRemainingCredits} <span className="text-muted-foreground font-normal">/ {displayTotalCredits}</span>
                    </span>
                  </div>
                  <Progress value={usagePercent} className="h-2" />
                  <p className="text-[10px] text-muted-foreground text-right">{usagePercent}% remaining</p>
                </div>

                {/* Expiry Info */}
                {purchaseExpiryDate && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Expires</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      {format(new Date(purchaseExpiryDate), "dd MMM yyyy")}
                    </span>
                  </div>
                )}

                {/* Upgrade Button */}
                <Button
                  onClick={handleBuyPlans}
                  variant="outline"
                  className="w-full mt-3 h-10"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </>
            ) : (
              <>
                {/* No Plan / Expired State */}
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    {isExpired ? (
                      <AlertCircle className="w-7 h-7 text-destructive" />
                    ) : (
                      <CreditCard className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {isExpired ? "Plan Expired" : "No Active Plan"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isExpired 
                      ? "Your plan has expired. Renew to continue using API."
                      : "Get started with an API plan to access endpoints"}
                  </p>
                  
                  {/* Show remaining credits if any */}
                  {displayRemainingCredits > 0 && (
                    <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                      <Zap className="w-4 h-4 text-warning" />
                      <span className="text-sm text-foreground font-medium">{displayRemainingCredits} requests remaining</span>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleBuyPlans}
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/80"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isExpired ? "Renew Plan" : "Buy API Plan"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Not Logged In State */}
        {!selectedProvider && !user && (
          <div className="bg-card rounded-xl p-6 border border-border/50 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Login to view your API plan</p>
          </div>
        )}

        {/* Provider Info Banner */}
        {selectedProvider && (
          <div className={`bg-gradient-to-r ${selectedProvider.color} rounded-xl p-4 border border-white/10`}>
            <div className="flex items-start gap-3">
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
          <div className="space-y-2">
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
                  className="w-full bg-card rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-xl`}>
                      {provider.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{provider.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{provider.totalEndpoints}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
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
                className="w-full bg-card rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <Badge className={`${methodColors[endpoint.method]} border-0 font-mono text-[10px] shrink-0 mt-0.5`}>
                    {endpoint.method}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{endpoint.title}</p>
                    <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{endpoint.path}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
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

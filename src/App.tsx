import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserApiCreditsProvider } from "./contexts/UserApiCreditsContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Coins from "./pages/Coins";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";
import ApiDocs from "./pages/ApiDocs";
import Deposit from "./pages/Deposit";
import Transactions from "./pages/Transactions";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import BotMarketplace from "./pages/BotMarketplace";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBots from "./pages/admin/AdminBots";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApiEndpoints from "./pages/admin/AdminApiEndpoints";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminApiKeys from "./pages/admin/AdminApiKeys";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UserApiCreditsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/bots" element={<BotMarketplace />} />
              <Route path="/coins" element={<Coins />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/auth" element={<Auth />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
              <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
              <Route path="/admin/bots" element={<AdminLayout><AdminBots /></AdminLayout>} />
              <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
              <Route path="/admin/api" element={<AdminLayout><AdminApiEndpoints /></AdminLayout>} />
              <Route path="/admin/api-keys" element={<AdminLayout><AdminApiKeys /></AdminLayout>} />
              <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserApiCreditsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

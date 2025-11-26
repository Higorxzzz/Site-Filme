import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Favorites from "./pages/Favorites";
import MovieDetails from "./pages/MovieDetails";
import SeriesDetails from "./pages/SeriesDetails";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import VipPlan from "./pages/VipPlan";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AffiliateWithdraw from "./pages/AffiliateWithdraw";

const queryClient = new QueryClient();

const AppRoutes = () => {
  // Hook global para capturar ref em QUALQUER página
  useAffiliateTracking();

  return (
    <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<Series />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/series/:id" element={<SeriesDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/vip" element={<VipPlan />} />
          <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
          <Route path="/affiliate/withdraw" element={<AffiliateWithdraw />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Finance from "./pages/Finance";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Profile from "./pages/Profile";
import Materiais from "./pages/Materiais";
import RegisteredSuppliers from "./pages/RegisteredSuppliers";
import Registration from "./pages/Registration";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/obras" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
            <Route path="/materiais" element={<ProtectedRoute><Materiais /></ProtectedRoute>} />
            <Route path="/madeireiras" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/cadastro" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><RegisteredSuppliers /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

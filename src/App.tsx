import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom"; // Changed to HashRouter
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Scenarios from "./pages/Scenarios.tsx";
import Communication from "./pages/Communication.tsx";
import SkillProgress from "./pages/SkillProgress.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner /> 
      <HashRouter> {/* Changed to HashRouter */}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/progress" element={<SkillProgress />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

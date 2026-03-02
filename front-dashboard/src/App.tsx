import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/ChatPanel";
import Index from "./pages/Index";
import CameraDetail from "./pages/CameraDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Global chat toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setChatOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full border border-border bg-card shadow-lg hover:bg-secondary"
      >
        <MessageCircle className="h-5 w-5 text-primary" />
      </Button>

      {children}

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/camera/:id" element={<CameraDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

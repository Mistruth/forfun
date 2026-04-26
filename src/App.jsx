import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import templateStore from './lib/templateStore';

const queryClient = new QueryClient();

const App = () => {
  React.useEffect(() => {
    templateStore.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <HashRouter>
          <Routes>
            {navItems.map(({ to, page }) => (
              <Route key={to} path={to} element={page} />
            ))}
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

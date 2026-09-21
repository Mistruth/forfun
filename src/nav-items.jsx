import { HomeIcon } from "lucide-react";
import Index from "./pages/Index.jsx";
import DesignDemo from "./pages/DesignDemo.jsx";
import AIStyleDemo from "./pages/AIStyleDemo.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Design Demo",
    to: "/demo",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <DesignDemo />,
  },
  {
    title: "AI Style Demo",
    to: "/ai-demo",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <AIStyleDemo />,
  },
];

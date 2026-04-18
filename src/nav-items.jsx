import { HomeIcon, SmartphoneIcon } from "lucide-react";
import Index from "./pages/Index.jsx";
import MobileEditor from "./pages/MobileEditor.jsx";

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
    title: "移动端编辑器",
    to: "/mobile",
    icon: <SmartphoneIcon className="h-4 w-4" />,
    page: <MobileEditor />,
  },
];

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { LunchTableSidebar } from "@/components/layout/LunchTableSidebar";
import { Navbar, SidebarProvider } from "@/components/layout/Navbar";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { Toaster } from "@/components/ui/toaster";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const location = useLocation();

  return (
    <AuthGuard>
      <SidebarProvider>
        <NotificationToast />
        <div className="flex min-h-screen bg-background scanner-noise">
          {/* Desktop Sidebar */}
          <LunchTableSidebar className="hidden md:flex shrink-0 z-30" />

          <div className="relative flex min-h-screen flex-1 flex-col transition-[width] duration-300 ease-in-out">
            <AnnouncementBanner />
            <Navbar />
            <main className="flex-1 overflow-x-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </AuthGuard>
  );
}

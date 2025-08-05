import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function SiteHeader() {
  const isMobile = useIsMobile();
  return isMobile ? <SidebarTrigger /> : null;
}

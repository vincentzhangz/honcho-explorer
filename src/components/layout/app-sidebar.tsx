import {
  BoxesIcon,
  MessageSquareIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router";

import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useHoncho } from "@/context/honcho-context";
import { resolveBaseUrl } from "@/lib/settings";

const navItems = [
  { to: "/workspaces", label: "Workspaces", icon: BoxesIcon },
  { to: "/peers", label: "Peers", icon: UsersIcon },
  { to: "/sessions", label: "Sessions", icon: MessageSquareIcon },
  { to: "/search", label: "Search", icon: SearchIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const { settings } = useHoncho();
  const baseUrl = resolveBaseUrl(settings);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
            aria-hidden
          >
            H
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold tracking-tight">
              Honcho Explorer
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {settings.workspaceId || "No workspace"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={
                      location.pathname === item.to ||
                      location.pathname.startsWith(`${item.to}/`)
                    }
                    tooltip={item.label}
                    render={<NavLink to={item.to} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavLink
          to="/settings"
          title={`Connection settings · ${baseUrl}`}
          className="flex flex-col gap-1 rounded-md border bg-sidebar-accent/40 px-2 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1"
        >
          <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:hidden">
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {settings.mode === "cloud" ? "Cloud" : "Self-hosted"}
            </Badge>
          </div>
          <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {baseUrl.replace(/^https?:\/\//, "")}
          </span>
          <SettingsIcon
            className="hidden size-4 text-muted-foreground group-data-[collapsible=icon]:block"
            aria-hidden
          />
          <span className="sr-only">Connection settings</span>
        </NavLink>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

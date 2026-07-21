import { useEffect, useState } from "react";

import { ConnectionForm } from "@/components/connection/connection-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHoncho } from "@/context/honcho-context";
import { cn } from "@/lib/utils";

export function ConnectionScreen() {
  const { settings } = useHoncho();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("honcho-connection-intro");
    if (seen) {
      setVisible(true);
      return;
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    sessionStorage.setItem("honcho-connection-intro", "1");
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-6 transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out)]",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.02_250),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.95_0.015_220),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.22_0.03_250),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.2_0.025_220),_transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 grid w-full max-w-4xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-12">
        <div className="hidden flex-col gap-4 lg:flex">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            H
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Honcho Explorer
          </h1>
          <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
            Browse workspaces, peers, sessions, and memory on Honcho Cloud or
            your self-hosted instance.
          </p>
        </div>

        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle className="lg:sr-only">Honcho Explorer</CardTitle>
            <CardDescription>
              Connect to an instance, then choose a workspace to explore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionForm
              initial={settings}
              instanceSubmitLabel="Connect"
              workspaceSubmitLabel="Open explorer"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConnectionForm } from "@/components/connection/connection-form";
import { PageHeader } from "@/components/page-states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHoncho } from "@/context/honcho-context";
import { resolveBaseUrl } from "@/lib/settings";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function SettingsPage() {
  const { settings, disconnect } = useHoncho();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage connection, appearance, and how preferences are stored on this machine."
      />

      <Alert>
        <AlertTitle>Stored locally</AlertTitle>
        <AlertDescription>
          Connection settings are saved on this machine via the Tauri store (app
          data directory). They are not uploaded anywhere.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose light, dark, or match your system preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="inline-flex rounded-lg border p-0.5">
            <legend className="sr-only">Theme</legend>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const selected = mounted && theme === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-pressed={selected}
                  className={cn(
                    "gap-1.5",
                    selected && "bg-muted text-foreground",
                  )}
                  onClick={() => setTheme(option.value)}
                >
                  <Icon data-icon="inline-start" />
                  {option.label}
                </Button>
              );
            })}
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current connection</CardTitle>
          <CardDescription>
            {resolveBaseUrl(settings)} · workspace{" "}
            <span className="font-mono">{settings.workspaceId || "-"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            onClick={async () => {
              await disconnect();
              toast.success("Disconnected");
            }}
          >
            Disconnect
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update connection</CardTitle>
          <CardDescription>
            Reconnect to an instance, then choose a workspace from the live
            list. To switch workspaces on the same instance, use the Workspaces
            page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectionForm
            initial={settings}
            instanceSubmitLabel="Connect"
            workspaceSubmitLabel="Save & use workspace"
          />
        </CardContent>
      </Card>
    </div>
  );
}

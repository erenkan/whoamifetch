"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const subscribeNever = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The server does not know the theme: false while rendering on the server and hydrating, true after.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const dark = resolvedTheme !== "light";
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Toggle theme" onClick={() => setTheme(dark ? "light" : "dark")}>
      {mounted ? (dark ? <Moon /> : <Sun />) : <span className="size-4" aria-hidden="true" />}
    </Button>
  );
}

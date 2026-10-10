"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_ROWS } from "@/lib/pipeline/svg";

/**
 * Editor shell. Three panes: source (GitHub login or local photo), card editor (identity,
 * rows, looks), live preview (<img src="blob:..."> so it renders exactly like GitHub does).
 * The pipeline itself is not wired yet; see docs/superpowers/specs/.
 */
export default function Home() {
  const [login, setLogin] = useState("");
  const [userHost, setUserHost] = useState("you@github");
  const [command, setCommand] = useState("whoami");
  const rows = DEFAULT_ROWS;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">whoamifetch</h1>
        <p className="text-sm text-muted-foreground">
          A retro terminal card for your GitHub profile README. Everything runs in your browser;
          your photo never leaves this device.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="github">
                <TabsList className="w-full">
                  <TabsTrigger value="github" className="flex-1">GitHub avatar</TabsTrigger>
                  <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
                  <TabsTrigger value="none" className="flex-1">No photo</TabsTrigger>
                </TabsList>
                <TabsContent value="github" className="flex flex-col gap-3 pt-3">
                  <Label htmlFor="login">GitHub username</Label>
                  <div className="flex gap-2">
                    <Input id="login" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="octocat" />
                    <Button type="button" disabled={!login}>Fetch</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses your public avatar and profile fields; nothing is stored.
                  </p>
                </TabsContent>
                <TabsContent value="upload" className="flex flex-col gap-3 pt-3">
                  <Input type="file" accept="image/*" />
                  <p className="text-xs text-muted-foreground">
                    Processed on a canvas in this tab. The page cannot send it anywhere (CSP).
                  </p>
                </TabsContent>
                <TabsContent value="none" className="pt-3 text-sm text-muted-foreground">
                  The left column shows your initials in big ASCII letters instead of a portrait.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Label htmlFor="userhost">user@host</Label>
              <Input id="userhost" value={userHost} onChange={(e) => setUserHost(e.target.value)} />
              <Label htmlFor="command">Command</Label>
              <Input id="command" value={command} onChange={(e) => setCommand(e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rows</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {rows.map((r) => (
                <div key={r.key} className="grid grid-cols-[96px_1fr] gap-2">
                  <Input defaultValue={r.key} aria-label="key" />
                  <Input defaultValue={r.value} aria-label="value" />
                </div>
              ))}
              <Button type="button" variant="outline" className="mt-2">Add row</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-[480px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled>Copy README snippet</Button>
              <Button type="button" disabled>Download SVG</Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center rounded-md bg-[#0d1117] p-4 text-sm text-neutral-400">
            {userHost}:~$ {command}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

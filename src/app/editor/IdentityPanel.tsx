"use client";
import type { Dispatch } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Action, EditorState } from "./state";

export function IdentityPanel({ state, dispatch }: { state: EditorState; dispatch: Dispatch<Action> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Label htmlFor="userhost">user@host</Label>
        <Input id="userhost" value={state.card.userHost} onChange={(e) => dispatch({ type: "CARD", patch: { userHost: e.target.value } })} />
        <Label htmlFor="command">Command</Label>
        <Input id="command" value={state.card.command} onChange={(e) => dispatch({ type: "CARD", patch: { command: e.target.value } })} />
      </CardContent>
    </Card>
  );
}

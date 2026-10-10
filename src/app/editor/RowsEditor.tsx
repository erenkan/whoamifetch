"use client";
import type { Dispatch } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MAX_ROWS, type Action, type EditorState } from "./state";

export function RowsEditor({ state, dispatch }: { state: EditorState; dispatch: Dispatch<Action> }) {
  const rows = state.card.rows;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rows</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.map((r, i) => (
          // Rows have no stable id; the index is the identity the reducer uses too.
          <div key={i} className="grid grid-cols-[88px_1fr_auto_auto_auto] items-center gap-1">
            <Input value={r.key} aria-label={`Row ${i + 1} key`} onChange={(e) => dispatch({ type: "ROW_SET", index: i, row: { ...r, key: e.target.value } })} />
            <Input value={r.value} aria-label={`Row ${i + 1} value`} onChange={(e) => dispatch({ type: "ROW_SET", index: i, row: { ...r, value: e.target.value } })} />
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move row ${i + 1} up`} disabled={i === 0} onClick={() => dispatch({ type: "ROW_MOVE", from: i, to: i - 1 })}><ArrowUp /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move row ${i + 1} down`} disabled={i === rows.length - 1} onClick={() => dispatch({ type: "ROW_MOVE", from: i, to: i + 1 })}><ArrowDown /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove row ${i + 1}`} onClick={() => dispatch({ type: "ROW_REMOVE", index: i })}><X /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" className="mt-2" disabled={rows.length >= MAX_ROWS} onClick={() => dispatch({ type: "ROW_ADD" })}>
          Add row{rows.length >= MAX_ROWS ? ` (max ${MAX_ROWS})` : ""}
        </Button>
      </CardContent>
    </Card>
  );
}

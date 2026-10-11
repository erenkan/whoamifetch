"use client";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { useId, type Dispatch } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { InfoRow } from "@/lib/pipeline/types";
import { MAX_ROWS, type Action, type EditorState } from "./state";

function SortableRow({ id, index, row, dispatch }: { id: string; index: number; row: InfoRow; dispatch: Dispatch<Action> }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const set = (patch: Partial<InfoRow>) => dispatch({ type: "ROW_SET", index, row: { ...row, ...patch } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-1.5", isDragging && "relative z-10 opacity-60")}>
      <button
        type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
        className="inline-flex w-3.5 flex-none cursor-grab touch-none justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        aria-label={`Reorder row ${index + 1}`}
      >
        <GripVertical className="size-3.5" aria-hidden="true" />
      </button>
      <Input className="h-[34px] w-[100px] flex-none font-mono text-[13px]" placeholder="Key" aria-label={`Row ${index + 1} key`} value={row.key} onChange={(e) => set({ key: e.target.value })} />
      <Input className="h-[34px] text-[13px]" placeholder="Value" aria-label={`Row ${index + 1} value`} value={row.value} onChange={(e) => set({ value: e.target.value })} />
      <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={`Remove row ${index + 1}`} onClick={() => dispatch({ type: "ROW_REMOVE", index })}><X /></Button>
    </div>
  );
}

/** Identity tab: the prompt (user@host and command) and the info rows, reordered by drag or keyboard. */
export function IdentityTab({ state, dispatch }: { state: EditorState; dispatch: Dispatch<Action> }) {
  const { rows, userHost, command } = state.card, ids = state.rowIds;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dndId = useId();                                    // a stable id keeps the server and client markup equal
  const full = rows.length >= MAX_ROWS;
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="userhost">user@host</Label>
          <Input id="userhost" className="font-mono" value={userHost} onChange={(e) => dispatch({ type: "CARD", patch: { userHost: e.target.value } })} spellCheck={false} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="command">Command</Label>
          <Input id="command" className="font-mono" value={command} onChange={(e) => dispatch({ type: "CARD", patch: { command: e.target.value } })} spellCheck={false} />
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground">
        Printed as <span className="font-mono">{userHost}:~$ {command}</span> on the first line and again as the closing prompt.
      </p>

      <Separator />
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Rows</Label>
            <Badge variant="secondary" className="font-mono">{rows.length}</Badge>
          </div>
          <Button type="button" variant="ghost" size="sm" disabled={full} title={`Up to ${MAX_ROWS} rows`} onClick={() => dispatch({ type: "ROW_ADD" })}>
            <Plus aria-hidden="true" /> Add row
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <DndContext
            id={dndId} sensors={sensors} collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;
              dispatch({ type: "ROW_MOVE", from: ids.indexOf(String(active.id)), to: ids.indexOf(String(over.id)) });
            }}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {rows.map((r, i) => <SortableRow key={ids[i]} id={ids[i]} index={i} row={r} dispatch={dispatch} />)}
            </SortableContext>
          </DndContext>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Drag the handle to reorder, or focus it and use Space and the arrow keys. Keys pad to the longest key, like neofetch; values print in the phosphor color.
        </p>
      </div>
    </>
  );
}

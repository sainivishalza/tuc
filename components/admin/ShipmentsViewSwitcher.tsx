"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { ReactNode } from "react";

export default function ShipmentsViewSwitcher({ board, list }: { board: ReactNode; list: ReactNode }) {
  const [view, setView] = useState<"board" | "list">("board");

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setView("board")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            view === "board" ? "bg-brand-900 text-white" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <LayoutGrid size={13} />
          Board
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            view === "list" ? "bg-brand-900 text-white" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <List size={13} />
          List
        </button>
      </div>
      {view === "board" ? board : list}
    </div>
  );
}

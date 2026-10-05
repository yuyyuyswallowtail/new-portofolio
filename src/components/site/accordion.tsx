"use client";

import { Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  id: string;
  title: string;
  count?: number;
  content: ReactNode;
};

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `accordion-panel-${item.id.replace(/\W+/g, "-")}`;
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 py-6 text-left"
            >
              <span className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold tracking-tight md:text-5xl">
                  {item.title}
                </span>
                {item.count !== undefined && (
                  <span className="font-data text-xs text-ink-muted">
                    {item.count}
                  </span>
                )}
              </span>
              <Plus
                size={28}
                className={cn(
                  "shrink-0 transition-transform duration-300",
                  isOpen && "rotate-45",
                )}
              />
            </button>
            <div
              id={panelId}
              inert={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows] duration-300",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-7">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

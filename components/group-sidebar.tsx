"use client";

import { useTranslations } from "next-intl";

interface GroupSidebarProps {
  groups: Array<{ group: string; count: number }>;
  collapsedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
}

export function GroupSidebar({
  groups,
  collapsedGroups,
  onToggleGroup
}: GroupSidebarProps) {
  const t = useTranslations("table");

  if (groups.length === 0) {
    return null;
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3 text-sm font-semibold text-foreground">
        {t("groups")} ({groups.length})
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2.5">
        {groups.map(({ group, count }) => {
          const isCollapsed = collapsedGroups.has(group);
          return (
            <button
              key={group}
              type="button"
              onClick={() => onToggleGroup(group)}
              className="mb-1.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-muted/70"
            >
              <span className="truncate font-medium">{group}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {count} {isCollapsed ? "+" : "-"}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

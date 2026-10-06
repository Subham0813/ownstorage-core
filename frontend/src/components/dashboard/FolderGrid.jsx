import { memo } from "react";
import { FolderCard } from "./FolderCard";
import { FileListCard } from "./FileListCard";
import { ListHeader } from "./ListHeader";

export const FolderGrid = memo(function FolderGrid({
  items,
  // selectedIds,  // Shelved: uncomment when bulk operations are built
  // onSelect,     // Shelved: uncomment when bulk operations are built
  onOpen,
  onShowDetails,
  onContextMenu,
  onAction,
  accent,
  viewMode = "grid",
  renderBadge,
  metaText,
  timeText,
  sortBy,
  sortOrder,
  onSortChange,
}) {
  if (viewMode === "list") {
    return (
      <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800/70 overflow-hidden">
        <ListHeader sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
        <div className="space-y-0">
          {items.map((item) => (
            <FileListCard
              key={item.id}
              item={item}
              // isSelected={selectedIds.has(item.id)}  // Shelved
              // onSelect={onSelect}                     // Shelved
              onOpen={onOpen}
              onShowDetails={onShowDetails}
              onContextMenu={onContextMenu}
              onAction={onAction}
              badge={renderBadge?.(item)}
              metaText={metaText?.(item)}
              timeText={timeText?.(item)}
              accent={accent}
              pending={item._pending}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5 sm:gap-4">
      {items.map((item) => (
        <FolderCard
          key={item.id}
          item={item}
          // isSelected={selectedIds.has(item.id)}  // Shelved
          // onSelect={onSelect}                     // Shelved
          onOpen={onOpen}
          onShowDetails={onShowDetails}
          onContextMenu={onContextMenu}
          badge={renderBadge?.(item)}
          metaText={metaText?.(item)}
          timeText={timeText?.(item)}
          accent={accent}
          pending={item._pending}
        />
      ))}
    </div>
  );
});

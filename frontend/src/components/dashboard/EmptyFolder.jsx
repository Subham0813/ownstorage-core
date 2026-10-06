import { Icon } from "../ui/Icon";
import { Btn } from "../ui/UI";

export function EmptyFolder({ onUpload, onNewFolder }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4 animate-in fade-in duration-300">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5 shadow-xs">
        <Icon
          name="folderFill"
          size={40}
          className="text-amber-500/80 dark:text-amber-400/80 drop-shadow-xs"
        />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-zinc-100 mb-1">
        This folder is empty
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-sm">
        Drag and drop files here or use the buttons below to add content.
      </p>
      <div className="flex items-center gap-3">
        <Btn variant="primary" size="sm" onClick={onUpload}>
          <Icon name="upload" size={20} />
          Upload Files
        </Btn>
        <Btn variant="ghost" size="sm" onClick={onNewFolder}>
          <Icon name="folderPlus" size={20} />
          New Folder
        </Btn>
      </div>
    </div>
  );
}

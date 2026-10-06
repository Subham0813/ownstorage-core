import { NewFolderDialog } from "../../components/modals/NewFolderDialog";
import { RenameDialog } from "../../components/modals/RenameDialog";
import { MoveModal } from "../../components/modals/MoveModal";
import { ShareModal } from "../../components/modals/ShareModal";
import FAB from "../../components/ui/FAB";

/**
 * Shared block of modals + FAB used by both the empty-state and the main
 * AllFiles render.
 */
export function AllFilesModals({
  newFolderModal,
  parentName,
  onCloseNewFolder,
  onCreateFolder,
  renameModal,
  onCloseRename,
  onRename,
  moveModal,
  onCloseMove,
  onMove,
  onCopy,
  rootDirId,
  shareModal,
  onCloseShare,
  onChanged,
  fab,
  fileInputRef,
  folderInputRef,
  onFileSelect,
  onFolderSelect,
}) {
  return (
    <>
      <NewFolderDialog
        isOpen={newFolderModal}
        parentName={parentName}
        onClose={onCloseNewFolder}
        onCreate={onCreateFolder}
      />
      <RenameDialog
        isOpen={renameModal.isOpen}
        item={renameModal.item}
        onClose={onCloseRename}
        onRename={onRename}
      />
      <MoveModal
        isOpen={moveModal.isOpen}
        item={moveModal.item}
        items={moveModal.items}
        mode={moveModal.mode}
        onClose={onCloseMove}
        onMove={onMove}
        onCopy={onCopy}
        rootDirId={rootDirId}
      />
      <ShareModal
        isOpen={shareModal.isOpen}
        item={shareModal.item}
        onClose={onCloseShare}
        onChanged={onChanged}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onFileSelect}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onFolderSelect}
        webkitdirectory="true"
        directory="true"
      />

      {fab && (
        <FAB
          onUpload={fab.onUpload}
          onUploadFolder={fab.onUploadFolder}
          onNewFolder={fab.onNewFolder}
          onGDriveImport={fab.onGDriveImport}
          detailsPanelOpen={fab.detailsPanelOpen}
        />
      )}
    </>
  );
}

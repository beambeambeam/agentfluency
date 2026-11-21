import {
  Delete02Icon,
  File01Icon,
  FileAddIcon,
  Folder01Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { AssessmentConfig } from "./config";

type WorkspaceFile = AssessmentConfig["files"][number];

const fileLimit = 18;
const textLimit = 12_000;
const fileId = () => crypto.getRandomValues(new Uint32Array(4)).join("-");

export const WorkspaceFiles = ({
  files,
  onChange,
  uploading,
  onUploadingChange,
}: {
  files: WorkspaceFile[];
  onChange: (update: (files: WorkspaceFile[]) => WorkspaceFile[]) => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
}) => {
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const pathInput = useRef<HTMLInputElement>(null);
  const focusPath = useRef(false);
  const selected = files.find((file) => file.id === selectedId) ?? files[0];
  const openId = selected?.id;
  const canAdd = !uploading && files.length < fileLimit;

  useEffect(() => {
    if (openId && focusPath.current) {
      focusPath.current = false;
      pathInput.current?.focus();
      pathInput.current?.select();
    }
  }, [openId]);

  const createFile = () => {
    const file = { id: fileId(), path: "", content: "" };
    onChange((current) => [...current, file]);
    setMessage("");
    focusPath.current = true;
    setSelectedId(file.id);
  };

  const uploadFiles = async (input: HTMLInputElement) => {
    const uploads = [...(input.files ?? [])];
    input.value = "";
    if (!uploads.length) {
      return;
    }
    if (files.length + uploads.length > fileLimit) {
      setMessage(`Add up to ${fileLimit} files. Remove a file to make room.`);
      return;
    }
    const oversized = uploads.find((file) => file.size > textLimit);
    if (oversized) {
      setMessage(`${oversized.name} exceeds the 12 KB text file limit.`);
      return;
    }

    onUploadingChange(true);
    setMessage("Reading files…");
    try {
      const imported = await Promise.all(
        uploads.map(async (file) => {
          const path = file.webkitRelativePath || file.name;
          const content = new TextDecoder("utf-8", { fatal: true }).decode(
            await file.arrayBuffer()
          );
          if (content.includes("\u0000")) {
            throw new Error("Binary file");
          }
          return { id: fileId(), path, content };
        })
      );
      onChange((current) => [...current, ...imported]);
      setSelectedId(imported[0]?.id);
      setMessage(
        imported.length === 1
          ? `Uploaded ${imported[0]?.path}.`
          : `Uploaded ${imported.length} files.`
      );
    } catch {
      setMessage("Could not read the upload. Choose UTF-8 text files.");
    }
    onUploadingChange(false);
  };

  const editFile = (
    changes: Partial<Pick<WorkspaceFile, "path" | "content">>
  ) =>
    onChange((current) =>
      current.map((file) =>
        file.id === openId ? { ...file, ...changes } : file
      )
    );

  return (
    <section
      className="bg-card min-w-0 space-y-4 rounded-xl border p-5"
      aria-labelledby="files-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="files-title" className="font-semibold">
          Provided files
        </h2>
        <span className="text-muted-foreground text-xs">
          {files.length} of {fileLimit} files
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={!canAdd} onClick={createFile}>
          <HugeiconsIcon icon={FileAddIcon} aria-hidden="true" /> Add file
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canAdd}
          onClick={() => fileInput.current?.click()}
        >
          <HugeiconsIcon icon={Upload04Icon} aria-hidden="true" /> Upload files
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canAdd}
          onClick={() => folderInput.current?.click()}
        >
          <HugeiconsIcon icon={Folder01Icon} aria-hidden="true" /> Upload folder
        </Button>
        <input
          ref={fileInput}
          type="file"
          hidden
          multiple
          onChange={(event) => uploadFiles(event.currentTarget)}
        />
        <input
          ref={(input) => {
            folderInput.current = input;
            input?.setAttribute("webkitdirectory", "");
          }}
          type="file"
          hidden
          multiple
          onChange={(event) => uploadFiles(event.currentTarget)}
        />
      </div>
      <output className="text-muted-foreground block text-sm">
        {message ||
          (canAdd
            ? "Upload UTF-8 text files up to 12 KB, or write a file here."
            : "Remove a file to make room for another.")}
      </output>
      {selected && (
        <div className="border-border grid min-w-0 overflow-hidden rounded-lg border xl:grid-cols-[minmax(9rem,1fr)_minmax(0,2fr)]">
          <ul
            aria-label="Workspace files"
            className="bg-muted/30 max-h-52 min-w-0 space-y-0.5 overflow-auto border-b p-2 xl:max-h-96 xl:border-r xl:border-b-0"
          >
            {files.map((file) => (
              <li key={file.id}>
                <Button
                  type="button"
                  size="sm"
                  variant={file.id === openId ? "secondary" : "ghost"}
                  aria-pressed={file.id === openId}
                  className="w-full justify-start"
                  title={file.path}
                  onClick={() => setSelectedId(file.id)}
                >
                  <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                  <span className="truncate font-mono text-xs">
                    {file.path || "Untitled file"}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="bg-background min-w-0 space-y-3 p-4">
            <label className="block space-y-1 text-sm">
              <span>File path</span>
              <Input
                ref={pathInput}
                value={selected.path}
                maxLength={160}
                placeholder="folder/example.txt"
                onChange={(event) => editFile({ path: event.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Contents</span>
              <Textarea
                className="font-mono"
                rows={8}
                maxLength={textLimit}
                value={selected.content}
                onChange={(event) => editFile({ content: event.target.value })}
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange((current) =>
                  current.filter((file) => file.id !== openId)
                );
                setMessage("");
              }}
            >
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" /> Remove
              file
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

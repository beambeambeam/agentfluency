import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Csv01Icon,
  Css3Icon,
  File01Icon,
  Folder01Icon,
  FolderOpenIcon,
  JavaScriptIcon,
  Note01Icon,
  Settings02Icon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

import type { AssessmentConfig } from "./config";

export type WorkspaceFile = AssessmentConfig["files"][number];

interface Folder {
  folders: Map<string, Folder>;
  files: WorkspaceFile[];
}

const createFolder = (): Folder => ({ folders: new Map(), files: [] });

export const fileName = (file: WorkspaceFile) =>
  file.path.slice(file.path.lastIndexOf("/") + 1);

const fileKinds = {
  css: { icon: Css3Icon, tone: "style", label: "CSS", syntax: "css" },
  csv: { icon: Csv01Icon, tone: "data", label: "CSV", syntax: "csv" },
  env: {
    icon: Settings02Icon,
    tone: "settings",
    label: "Environment",
    syntax: "env",
  },
  js: {
    icon: JavaScriptIcon,
    tone: "source",
    label: "JavaScript",
    syntax: "javascript",
  },
  jsx: {
    icon: JavaScriptIcon,
    tone: "source",
    label: "JSX",
    syntax: "javascript",
  },
  md: {
    icon: Note01Icon,
    tone: "document",
    label: "Markdown",
    syntax: "markdown",
  },
  json: { icon: SourceCodeIcon, tone: "source", label: "JSON", syntax: "json" },
  ts: {
    icon: SourceCodeIcon,
    tone: "document",
    label: "TypeScript",
    syntax: "javascript",
  },
  tsx: {
    icon: SourceCodeIcon,
    tone: "document",
    label: "TSX",
    syntax: "javascript",
  },
  txt: {
    icon: File01Icon,
    tone: "plain",
    label: "Plain text",
    syntax: "plain",
  },
} as const;

export const getFileKind = (file: WorkspaceFile) => {
  const extension = fileName(file).split(".").at(-1)?.toLowerCase();
  if (extension && Object.hasOwn(fileKinds, extension)) {
    return fileKinds[extension as keyof typeof fileKinds];
  }
  return fileKinds.txt;
};

export const FileIcon = ({ file }: { file: WorkspaceFile }) => {
  const kind = getFileKind(file);
  return (
    <HugeiconsIcon
      icon={kind.icon}
      size={15}
      className="wb-file-icon"
      data-tone={kind.tone}
      aria-hidden="true"
    />
  );
};

const organizeFiles = (files: WorkspaceFile[]) => {
  const root = createFolder();
  for (const file of files) {
    let current = root;
    for (const name of file.path.split("/").slice(0, -1)) {
      const folder = current.folders.get(name) ?? createFolder();
      current.folders.set(name, folder);
      current = folder;
    }
    current.files.push(file);
  }
  return root;
};

interface TreeProps {
  folder: Folder;
  path: string;
  activePath?: string;
  openFile: (file: WorkspaceFile) => void;
}

const FileTree = ({ folder, path, activePath, openFile }: TreeProps) => (
  <ul className="wb-tree">
    {[...folder.folders].map(([name, child]) => {
      const childPath = `${path}${name}/`;
      return (
        <li key={childPath}>
          <details className="wb-folder" open>
            <summary className="wb-tree-row">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={13}
                className="wb-folder-closed"
                aria-hidden="true"
              />
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={13}
                className="wb-folder-open"
                aria-hidden="true"
              />
              <HugeiconsIcon
                icon={Folder01Icon}
                size={16}
                className="wb-folder-icon wb-folder-closed"
                aria-hidden="true"
              />
              <HugeiconsIcon
                icon={FolderOpenIcon}
                size={16}
                className="wb-folder-icon wb-folder-open"
                aria-hidden="true"
              />
              <span>{name}</span>
            </summary>
            <FileTree
              folder={child}
              path={childPath}
              activePath={activePath}
              openFile={openFile}
            />
          </details>
        </li>
      );
    })}
    {folder.files.map((file) => (
      <li key={file.path}>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="wb-tree-row wb-tree-file"
          aria-pressed={file.path === activePath}
          onClick={() => openFile(file)}
          title={file.path}
        >
          <FileIcon file={file} />
          <span>{fileName(file)}</span>
        </Button>
      </li>
    ))}
  </ul>
);

export const FileExplorer = ({
  files,
  projectName,
  activePath,
  openFile,
}: {
  files: WorkspaceFile[];
  projectName: string;
  activePath?: string;
  openFile: (file: WorkspaceFile) => void;
}) => (
  <details open className="wb-explorer-root">
    <summary className="wb-tree-row wb-root-row">
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={13}
        className="wb-folder-closed"
        aria-hidden="true"
      />
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={13}
        className="wb-folder-open"
        aria-hidden="true"
      />
      <span>{projectName}</span>
    </summary>
    {files.length ? (
      <FileTree
        folder={organizeFiles(files)}
        path=""
        activePath={activePath}
        openFile={openFile}
      />
    ) : (
      <p className="wb-empty-files">No provided files</p>
    )}
  </details>
);

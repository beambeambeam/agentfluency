import { fileName, getFileKind } from "./file-explorer";
import type { WorkspaceFile } from "./file-explorer";

const patterns = {
  css: /(?<comment>\/\*[\s\S]*?\*\/)|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<number>#[\da-fA-F]{3,8}\b|-?\d+(?:\.\d+)?(?:%|[a-z]+)?)|(?<keyword>@[\w-]+)|(?<property>--[\w-]+|[a-z-]+(?=\s*:))|(?<punctuation>[{}:;,])/gu,
  csv: /(?<string>"(?:[^"]|"")*")|(?<number>(?<=^|,)[+-]?\d+(?:\.\d+)?(?=,|$))|(?<punctuation>,)/gmu,
  env: /(?<comment>^[ \t]*#[^\r\n]*)|(?<property>^[ \t]*[A-Z_][\w]*(?=\s*=))|(?<string>"[^"\r\n]*"|'[^'\r\n]*')|(?<punctuation>=)/gimu,
  javascript:
    /(?<comment>\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)|(?<string>"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|`(?:\\[\s\S]|[^`\\])*`)|(?<keyword>\b(?:as|async|await|break|case|catch|class|const|continue|default|else|export|extends|finally|for|from|function|if|import|interface|let|new|of|return|satisfies|switch|throw|try|type|var|while|yield)\b)|(?<literal>\b(?:true|false|null|undefined)\b)|(?<number>\b(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b)|(?<property>\b[$\w]+(?=\s*\())|(?<punctuation>[{}()[\],;])/gu,
  json: /(?<property>"(?:\\.|[^"\\])*"(?=\s*:))|(?<string>"(?:\\.|[^"\\])*")|(?<literal>\b(?:true|false|null)\b)|(?<number>-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(?<punctuation>[{}[\]:,])/gu,
  markdown:
    /(?<heading>^[ \t]{0,3}#{1,6}[ \t]+[^\r\n]*)|(?<string>`[^`\r\n]+`)|(?<property>\[[^\]\r\n]+\]\([^)\r\n]+\))|(?<keyword>\*\*[^*\r\n]+\*\*|__[^_\r\n]+__)|(?<punctuation>^[ \t]*(?:[-+*]|\d+\.)[ \t]+|^[ \t]*>[ \t]?)/gmu,
  plain: null,
} as const;

export type FileSyntax = keyof typeof patterns;

interface SourceToken {
  text: string;
  start: number;
  tone?: string;
}

interface SourceLine {
  number: number;
  tokens: SourceToken[];
}

const splitSource = (source: string, syntax: FileSyntax) => {
  const lines: SourceLine[] = [{ number: 1, tokens: [] }];
  const add = (text: string, offset: number, tone?: string) => {
    const pieces = text.split("\n");
    let start = offset;
    for (const [index, piece] of pieces.entries()) {
      if (index > 0) {
        lines.push({ number: lines.length + 1, tokens: [] });
      }
      const line = lines.at(-1);
      if (line && piece) {
        line.tokens.push({
          start,
          text: piece,
          tone: syntax === "csv" && line.number === 1 ? "heading" : tone,
        });
      }
      start += piece.length + 1;
    }
  };
  const pattern = patterns[syntax];
  let offset = 0;
  if (pattern) {
    for (const match of source.matchAll(pattern)) {
      const [text] = match;
      add(source.slice(offset, match.index), offset);
      const tone = Object.entries(match.groups ?? {}).find(
        ([, value]) => value !== undefined
      )?.[0];
      add(text, match.index, tone);
      offset = match.index + text.length;
    }
  }
  add(source.slice(offset), offset);
  return lines;
};

export const SourcePreview = ({ file }: { file: WorkspaceFile }) => {
  const lines = splitSource(
    file.content.replaceAll("\r\n", "\n"),
    getFileKind(file).syntax
  );
  return (
    <div className="wb-source" aria-label={`${fileName(file)} contents`}>
      {lines.map(({ tokens, number }) => (
        <div className="wb-source-line" key={number}>
          <span className="wb-line-number" aria-hidden="true">
            {number}
          </span>
          <code>
            {tokens.length === 0
              ? " "
              : tokens.map(({ start, text, tone }) => (
                  <span key={start} data-syntax={tone}>
                    {text}
                  </span>
                ))}
          </code>
        </div>
      ))}
    </div>
  );
};

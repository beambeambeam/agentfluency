import {
  ArrowDown01Icon,
  ChatGptIcon,
  ClaudeIcon,
  Cursor01Icon,
  GoogleGeminiIcon,
  GrokIcon,
  LockKeyIcon,
  TerminalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  harnesses,
  harnessSchema,
  models,
  modelSchema,
  openAiModelSchema,
} from "./config";
import type { Harness, Model } from "./config";

const harnessIcons = {
  workspace: TerminalIcon,
  guided: ClaudeIcon,
  chat: Cursor01Icon,
  grok: GrokIcon,
  gemini: GoogleGeminiIcon,
};

const modelIcons = {
  "claude-sonnet-5": ClaudeIcon,
  "grok-4.7": GrokIcon,
  "composer-2.5": Cursor01Icon,
  "gemini-3.5-flash": GoogleGeminiIcon,
};

interface PickerProps<Value extends string> {
  value: Value;
  onChange: (value: Value) => void;
  locked?: boolean;
  compact?: boolean;
}

interface Choice {
  id: string;
  label: string;
  icon: typeof ChatGptIcon;
  note?: string;
}

const harnessChoices: Choice[] = harnessSchema.options.map((id) => ({
  id,
  label: harnesses[id],
  icon: harnessIcons[id],
}));

const modelChoices: Choice[] = modelSchema.options.map((id) => ({
  id,
  label: models[id],
  icon: Object.hasOwn(modelIcons, id)
    ? modelIcons[id as keyof typeof modelIcons]
    : ChatGptIcon,
  note: openAiModelSchema.safeParse(id).success ? undefined : "Demo",
}));

const AssistantPicker = ({
  choices,
  label,
  value,
  onChange,
  compact,
  locked,
}: PickerProps<string> & { choices: Choice[]; label: string }) => {
  const selected = choices.find((choice) => choice.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label}: ${selected?.label ?? ""}`}
        disabled={locked}
        title={locked ? `${label} locked by interviewer` : undefined}
        render={
          <Button
            variant={compact ? "ghost" : "outline"}
            size={compact ? "xs" : "default"}
            className={compact ? "wb-picker" : "w-full justify-between"}
          />
        }
      >
        <HugeiconsIcon
          icon={selected?.icon ?? ChatGptIcon}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-left">
          {selected?.label}
        </span>
        <HugeiconsIcon
          icon={locked ? LockKeyIcon : ArrowDown01Icon}
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={compact ? "top" : "bottom"}
        className="min-w-52"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            {choices.map((choice) => (
              <DropdownMenuRadioItem key={choice.id} value={choice.id}>
                <HugeiconsIcon icon={choice.icon} aria-hidden="true" />
                <span>{choice.label}</span>
                {choice.note && (
                  <span className="text-muted-foreground ml-auto text-[10px]">
                    {choice.note}
                  </span>
                )}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const HarnessPicker = ({
  onChange,
  ...props
}: Omit<PickerProps<Harness>, "onChange"> & {
  onChange?: (value: Harness) => void;
}) => (
  <AssistantPicker
    {...props}
    label="Harness preset"
    choices={harnessChoices}
    onChange={(id) => onChange?.(harnessSchema.parse(id))}
  />
);

export const ModelPicker = ({
  onChange,
  supportedModels,
  ...props
}: PickerProps<Model> & { supportedModels?: readonly Model[] }) => (
  <AssistantPicker
    {...props}
    label="Model"
    choices={
      supportedModels
        ? modelChoices.filter(({ id }) =>
            supportedModels.some((model) => model === id)
          )
        : modelChoices
    }
    onChange={(id) => onChange(modelSchema.parse(id))}
  />
);

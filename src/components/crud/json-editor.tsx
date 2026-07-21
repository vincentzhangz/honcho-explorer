import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type JsonEditorProps = {
  label: string;
  description?: string;
  value: unknown;
  onSave: (parsed: Record<string, unknown> | unknown) => Promise<void> | void;
  objectOnly?: boolean;
  saveLabel?: string;
};

export function JsonEditor({
  label,
  description,
  value,
  onSave,
  objectOnly = true,
  saveLabel = "Save",
}: JsonEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(value ?? (objectOnly ? {} : value), null, 2));
    setError(null);
  }, [value, objectOnly]);

  async function handleSave() {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON.");
      return;
    }

    if (
      objectOnly &&
      (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    ) {
      setError("Value must be a JSON object.");
      return;
    }

    setPending(true);
    try {
      await onSave(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel>{label}</FieldLabel>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={10}
          className="font-mono text-xs"
          aria-invalid={Boolean(error) || undefined}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </Field>
      <Button
        type="button"
        size="sm"
        className="w-fit"
        disabled={pending}
        onClick={() => void handleSave()}
      >
        {pending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : null}
        {saveLabel}
      </Button>
    </div>
  );
}

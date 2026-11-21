import { Task01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { evaluationPercent, ratingLabels, rubric } from "./evaluation";
import type { Evaluation, Ratings } from "./evaluation";
import { displayTime } from "./session-overview";
import { saveSessionEvaluation } from "./sessions";

export const SessionEvaluation = ({
  sessionId,
  initialEvaluation,
}: {
  sessionId: string;
  initialEvaluation: Evaluation | null;
}) => {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState(initialEvaluation);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const score = evaluation ? evaluationPercent(evaluation.ratings) : null;

  const save = async (form: HTMLFormElement) => {
    const values = new FormData(form);
    const ratings = Object.fromEntries(
      rubric.map(({ id }) => [id, Number(values.get(id))])
    ) as Ratings;
    setSaving(true);
    setError("");
    try {
      setEvaluation(
        await saveSessionEvaluation({
          data: { id: sessionId, ratings, notes: String(values.get("notes")) },
        })
      );
      setEditing(false);
      await router.invalidate();
    } catch {
      setError("Could not save the rubric. Try again.");
    }
    setSaving(false);
  };

  return (
    <section
      aria-labelledby="evaluation-heading"
      className="bg-card space-y-4 rounded-xl border p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="evaluation-heading"
            className="flex items-center gap-2 font-semibold"
          >
            <HugeiconsIcon icon={Task01Icon} size={18} aria-hidden="true" />
            AI fluency score
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {evaluation
              ? `Scored by interviewer · ${displayTime(evaluation.updatedAt)}`
              : "Awaiting interviewer scoring. Use the submission and recorded evidence to rate the four criteria."}
          </p>
        </div>
        {!editing && (
          <Button
            type="button"
            size="sm"
            variant={evaluation ? "outline" : "default"}
            onClick={() => setEditing(true)}
          >
            {evaluation ? "Edit rubric" : "Score interview"}
          </Button>
        )}
      </div>

      {evaluation && score !== null && !editing && (
        <>
          <div className="grid items-center gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <div className="bg-muted grid min-h-28 content-center rounded-xl p-4">
              <p className="text-4xl font-semibold tabular-nums">{score}%</p>
              <p className="text-muted-foreground text-sm">
                Overall rubric score
              </p>
            </div>
            <ul
              aria-label="Rubric score breakdown"
              className="grid gap-3 sm:grid-cols-2"
            >
              {rubric.map(({ id, title }) => {
                const value = evaluation.ratings[id];
                return (
                  <li key={id} className="min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>{title}</span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {value}/4
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="bg-muted h-2 overflow-hidden rounded-full"
                    >
                      <div
                        className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
                        style={{ width: `${value * 25}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {evaluation.notes && (
            <div className="border-t pt-3 text-sm">
              <h3 className="font-medium">Reviewer notes</h3>
              <p className="text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                {evaluation.notes}
              </p>
            </div>
          )}
        </>
      )}
      {editing && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!saving) {
              void save(event.currentTarget);
            }
          }}
        >
          <p className="text-muted-foreground text-sm">
            Rate each criterion from 0 to 4. The four ratings contribute
            equally.
          </p>
          <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Evaluation criteria</legend>
            {rubric.map(({ id, title, description }) => (
              <div
                className="bg-background grid gap-2 rounded-lg border p-3"
                key={id}
              >
                <label htmlFor={`rubric-${id}`} className="text-sm font-medium">
                  {title}
                </label>
                <p
                  id={`criterion-${id}`}
                  className="text-muted-foreground text-sm"
                >
                  {description}
                </p>
                <select
                  id={`rubric-${id}`}
                  name={id}
                  aria-describedby={`criterion-${id}`}
                  defaultValue={evaluation?.ratings[id] ?? ""}
                  required
                  className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
                >
                  <option value="" disabled>
                    Choose a rating
                  </option>
                  {ratingLabels.map((label, value) => (
                    <option key={label} value={value}>
                      {value} · {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </fieldset>
          <label className="block space-y-1 text-sm font-medium">
            <span>
              Reviewer notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </span>
            <Textarea
              name="notes"
              maxLength={2000}
              rows={3}
              disabled={saving}
              defaultValue={evaluation?.notes}
            />
          </label>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save rubric"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setError("");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};

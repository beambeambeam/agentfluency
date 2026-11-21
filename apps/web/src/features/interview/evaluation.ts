import { z } from "zod";

const rating = z.number().int().min(0).max(4);
export const ratingsSchema = z.object({
  direction: rating,
  verification: rating,
  iteration: rating,
  deliverable: rating,
});

export const evaluationInputSchema = z.object({
  ratings: ratingsSchema,
  notes: z.string().trim().max(2000),
});
export const evaluationSchema = evaluationInputSchema.extend({
  updatedAt: z.iso.datetime(),
});

export type Ratings = z.infer<typeof ratingsSchema>;
export type Evaluation = z.infer<typeof evaluationSchema>;

export const rubric = [
  {
    id: "direction",
    title: "AI direction",
    description:
      "Gave the assistant a clear goal, useful context, and constraints.",
  },
  {
    id: "verification",
    title: "Verification",
    description:
      "Checked AI claims against source evidence or independent tests.",
  },
  {
    id: "iteration",
    title: "Iteration and judgment",
    description:
      "Refined the approach and corrected or rejected weak AI output.",
  },
  {
    id: "deliverable",
    title: "Final deliverable",
    description:
      "Delivered an accurate, actionable outcome grounded in evidence.",
  },
] as const satisfies readonly {
  id: keyof Ratings;
  title: string;
  description: string;
}[];

export const ratingLabels = [
  "No evidence",
  "Emerging",
  "Developing",
  "Proficient",
  "Strong",
];

export const evaluationPercent = (ratings: Ratings) =>
  Math.round(
    (rubric.reduce((sum, criterion) => sum + ratings[criterion.id], 0) /
      (4 * rubric.length)) *
      100
  );

import { desc, eq } from "drizzle-orm";

import type { Database } from "./index";
import { assessment, assessmentSubmission } from "./schema/assessment";
import { user } from "./schema/auth";

const demoAssessmentId = "revenue-review";

export const readDemoAssessment = async (db: Database) => {
  const [record] = await db
    .select({ config: assessment.config })
    .from(assessment)
    .where(eq(assessment.id, demoAssessmentId));
  return record?.config;
};

export const writeDemoAssessment = async (db: Database, config: unknown) => {
  await db
    .insert(assessment)
    .values({ id: demoAssessmentId, config })
    .onConflictDoUpdate({ target: assessment.id, set: { config } });
};

export const readDemoSubmission = async (db: Database, candidateId: string) => {
  const [submission] = await db
    .select()
    .from(assessmentSubmission)
    .where(eq(assessmentSubmission.candidateId, candidateId));
  return submission;
};

export const listDemoSubmissions = (db: Database) =>
  db
    .select({
      candidateId: assessmentSubmission.candidateId,
      candidateName: user.name,
      response: assessmentSubmission.response,
      submittedAt: assessmentSubmission.submittedAt,
    })
    .from(assessmentSubmission)
    .innerJoin(user, eq(user.id, assessmentSubmission.candidateId))
    .orderBy(desc(assessmentSubmission.submittedAt))
    .limit(20);

export const saveDemoSubmission = async (
  db: Database,
  candidateId: string,
  response: string
) => {
  await db
    .insert(assessmentSubmission)
    .values({ candidateId, response })
    .onConflictDoUpdate({
      target: assessmentSubmission.candidateId,
      set: { response, submittedAt: new Date() },
    });
};

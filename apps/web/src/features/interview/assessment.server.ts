import { readDemoAssessment } from "@agentfluency/db/demo-assessment";

import { createServices } from "@/services";

import { assessmentSchema } from "./config";
import { demoAssessment } from "./demo-config";

export const loadAssessment = async () => {
  const { db } = createServices();
  const record = await readDemoAssessment(db);
  return record ? assessmentSchema.parse(record) : demoAssessment;
};

import type { AssessmentConfig } from "./config";

export const demoAssessment: AssessmentConfig = {
  title: "Explain the revenue decline",
  workspace: "Revenue review",
  brief:
    "You are a business analyst preparing an update for the commercial team. Use the supplied sales data and the AI assistant to explain what changed between April and May. Verify the assistant's claims against the source and cite the numbers in your recommendation.",
  harness: "workspace",
  model: "gpt-6.1-sol",
  allowHarnessSelection: true,
  allowModelSelection: false,
  sandbox: "scratchpad",
  allowFileAttachments: true,
  steps: [
    {
      id: "inspect",
      title: "Read the brief",
      instructions:
        "Open the decision memo and sales summary. Identify the metrics you need to compare.",
    },
    {
      id: "verify",
      title: "Use AI and verify",
      instructions:
        "Ask the assistant for an explanation. Check its hypothesis against sales.csv and record any correction.",
    },
    {
      id: "submit",
      title: "Submit your recommendation",
      instructions:
        "Explain the primary driver with numbers and recommend one follow-up analysis.",
    },
  ],
  files: [
    {
      id: "memo",
      path: "brief/decision-memo.md",
      content:
        "# Monthly commercial review\n\nThe VP wants a short explanation of the revenue decline from April to May. Start with the sales summary, check the underlying rows, and distinguish what the data shows from hypotheses that need follow-up.\n",
    },
    {
      id: "sales",
      path: "data/sales.csv",
      content:
        "month,channel,orders,revenue_usd\nApril,Marketplace,600,66000\nApril,Direct,400,34000\nMay,Marketplace,600,54000\nMay,Direct,400,26000\n",
    },
    {
      id: "metrics",
      path: "data/metric-definitions.md",
      content:
        "# Metric definitions\n\n- Order volume: total number of orders.\n- Average order value: revenue divided by orders.\n- Compare aggregate revenue and order volume before looking at individual channels.\n",
    },
  ],
};

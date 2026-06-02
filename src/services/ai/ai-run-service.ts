import type { AgentType, AiRunStatus, Prisma } from "@prisma/client";

type AiRunDb = {
  aiRun: {
    create(args: Prisma.AiRunCreateArgs): Promise<{ id: string }>;
    update(args: Prisma.AiRunUpdateArgs): Promise<unknown>;
  };
};

export async function createAiRun({
  db,
  userId,
  agentType,
  model,
  inputSummary
}: {
  db: AiRunDb;
  userId: string;
  agentType: AgentType;
  model: string;
  inputSummary: string;
}) {
  return db.aiRun.create({
    data: {
      userId,
      agentType,
      model,
      inputSummary,
      status: "RUNNING"
    }
  });
}

export async function finishAiRun({
  db,
  id,
  status,
  outputSummary,
  errorMessage,
  latencyMs
}: {
  db: AiRunDb;
  id: string;
  status: AiRunStatus;
  outputSummary?: string;
  errorMessage?: string;
  latencyMs: number;
}) {
  return db.aiRun.update({
    where: { id },
    data: {
      status,
      outputSummary,
      errorMessage: errorMessage ?? null,
      latencyMs
    }
  });
}

import type { AiModelSetting, Prisma } from "@prisma/client";

import {
  defaultReviewModel,
  isReviewModelValue,
  type ReviewModelValue
} from "@/domain/models";

const defaultSettingsId = "default";

type ModelSettingsEnv = Record<string, string | undefined>;

type ReadModelSettingsDb = {
  aiModelSetting: {
    findUnique(args: Prisma.AiModelSettingFindUniqueArgs): Promise<AiModelSetting | null>;
  };
};

type ModelSettingsDb = ReadModelSettingsDb & {
  aiModelSetting: ReadModelSettingsDb["aiModelSetting"] & {
    upsert(args: Prisma.AiModelSettingUpsertArgs): Promise<AiModelSetting | unknown>;
  };
};

export type EffectiveModelSettings = {
  baseUrl: string;
  apiKey: string;
  defaultModel: ReviewModelValue;
};

export type PublicModelSettings = {
  baseUrl: string;
  defaultModel: ReviewModelValue;
  hasApiKey: boolean;
  maskedApiKey: string | null;
};

export async function getEffectiveModelSettings(
  db: ReadModelSettingsDb,
  env: ModelSettingsEnv = process.env
): Promise<EffectiveModelSettings | null> {
  const savedSettings = await db.aiModelSetting.findUnique({
    where: { id: defaultSettingsId }
  });
  const baseUrl =
    nonEmpty(savedSettings?.baseUrl) ?? nonEmpty(env.MODEL_API_BASE_URL) ?? "";
  const apiKey = nonEmpty(savedSettings?.apiKey) ?? nonEmpty(env.MODEL_API_KEY) ?? "";
  const defaultModel = normalizeReviewModel(savedSettings?.defaultModel);

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    defaultModel
  };
}

export async function getPublicModelSettings({
  db,
  env = process.env
}: {
  db: ReadModelSettingsDb;
  env?: ModelSettingsEnv;
}): Promise<PublicModelSettings> {
  const settings = await getEffectiveModelSettings(db, env);

  return {
    baseUrl: settings?.baseUrl ?? nonEmpty(env.MODEL_API_BASE_URL) ?? "",
    defaultModel: settings?.defaultModel ?? defaultReviewModel,
    hasApiKey: Boolean(settings?.apiKey ?? nonEmpty(env.MODEL_API_KEY)),
    maskedApiKey: maskApiKey(settings?.apiKey ?? nonEmpty(env.MODEL_API_KEY) ?? null)
  };
}

export async function saveModelSettings(
  db: ModelSettingsDb,
  input: {
    baseUrl: string;
    apiKey: string;
    defaultModel: string;
  }
) {
  const current = await db.aiModelSetting.findUnique({
    where: { id: defaultSettingsId }
  });
  const nextApiKey = nonEmpty(input.apiKey) ?? current?.apiKey ?? "";
  const data = {
    id: defaultSettingsId,
    baseUrl: normalizeBaseUrl(input.baseUrl),
    apiKey: nextApiKey,
    defaultModel: normalizeReviewModel(input.defaultModel)
  };

  if (!data.baseUrl) {
    throw new Error("Base URL is required");
  }

  if (!data.apiKey) {
    throw new Error("API key is required");
  }

  return db.aiModelSetting.upsert({
    where: { id: defaultSettingsId },
    create: data,
    update: {
      baseUrl: data.baseUrl,
      apiKey: data.apiKey,
      defaultModel: data.defaultModel
    }
  });
}

export function maskApiKey(apiKey: string | null): string | null {
  if (!apiKey) {
    return null;
  }

  if (apiKey.length < 12) {
    return "已设置";
  }

  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export function normalizeReviewModel(value: string | undefined | null): ReviewModelValue {
  return value && isReviewModelValue(value) ? value : defaultReviewModel;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/g, "");
}

function nonEmpty(value: string | undefined | null): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

export type ModelRuntimeConfig = {
  endpoint?: string;
  baseUrl?: string;
  apiKey: string;
  model: string;
};

type ModelEnv = Record<string, string | undefined>;

export function resolveModelConfig(
  env: ModelEnv,
  options: { modelNameKey?: string } = {}
): ModelRuntimeConfig | null {
  const endpoint = nonEmpty(env.MODEL_API_ENDPOINT);
  const baseUrl = nonEmpty(env.MODEL_API_BASE_URL);
  const apiKey = nonEmpty(env.MODEL_API_KEY);
  const model = nonEmpty(env[options.modelNameKey ?? "MODEL_NAME"]) ?? nonEmpty(env.MODEL_NAME);

  if ((!endpoint && !baseUrl) || !apiKey || !model) {
    return null;
  }

  return {
    endpoint,
    baseUrl,
    apiKey,
    model
  };
}

export function describeMissingModelConfig(env: ModelEnv, modelNameKey = "MODEL_NAME") {
  const missing: string[] = [];

  if (!nonEmpty(env.MODEL_API_ENDPOINT) && !nonEmpty(env.MODEL_API_BASE_URL)) {
    missing.push("MODEL_API_BASE_URL or MODEL_API_ENDPOINT");
  }

  if (!nonEmpty(env.MODEL_API_KEY)) {
    missing.push("MODEL_API_KEY");
  }

  if (!nonEmpty(env[modelNameKey]) && !nonEmpty(env.MODEL_NAME)) {
    missing.push(modelNameKey === "MODEL_NAME" ? "MODEL_NAME" : `${modelNameKey} or MODEL_NAME`);
  }

  return missing.join(", ");
}

function nonEmpty(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

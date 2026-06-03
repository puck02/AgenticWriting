import { describeMissingModelConfig, resolveModelConfig } from "@/services/ai/model-config";
import { FetchModelProvider } from "@/services/review/model-provider";
import { MockOcrAdapter, type OcrAdapter, VisionOcrAdapter } from "@/services/ocr/ocr-service";

type OcrEnv = Record<string, string | undefined>;

export function createOcrAdapterFromEnv(env: OcrEnv = process.env): OcrAdapter {
  if (env.OCR_MODE === "mock" || (env.NODE_ENV === "test" && !hasModelConfig(env))) {
    return new MockOcrAdapter();
  }

  const config = resolveModelConfig(env, { modelNameKey: "OCR_MODEL_NAME" });

  if (!config) {
    throw new Error(
      `Real OCR requires ${describeMissingModelConfig(env, "OCR_MODEL_NAME")}`
    );
  }

  return new VisionOcrAdapter({
    provider: new FetchModelProvider(config)
  });
}

function hasModelConfig(env: OcrEnv): boolean {
  return resolveModelConfig(env, { modelNameKey: "OCR_MODEL_NAME" }) !== null;
}

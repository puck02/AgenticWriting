"use client";

import { useState, type FormEvent } from "react";

import { IslandButton, IslandCard, IslandSelect } from "@/components/IslandUi";
import { reviewModels, type ReviewModelValue } from "@/domain/models";
import type { PublicModelSettings } from "@/services/ai/model-settings-service";

export function ModelSettingsPanel({
  initialSettings
}: {
  initialSettings: PublicModelSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [baseUrl, setBaseUrl] = useState(initialSettings.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState<ReviewModelValue>(
    initialSettings.defaultModel
  );
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/model-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, defaultModel })
      });
      const data = (await response.json().catch(() => ({}))) as {
        settings?: PublicModelSettings;
        error?: string;
      };

      if (!response.ok || !data.settings) {
        throw new Error(data.error ?? "模型设置保存失败。");
      }

      setSettings(data.settings);
      setBaseUrl(data.settings.baseUrl);
      setDefaultModel(data.settings.defaultModel);
      setApiKey("");
      setMessage("模型设置已保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "模型设置保存失败。");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <IslandCard className="space-y-4 p-4 sm:p-5">
        <div>
          <h2 className="text-lg font-black text-[#3f3426]">模型连接</h2>
          <p className="mt-1 text-sm leading-6 text-[#725d42]">
            保存后所有批改和引导请求会使用这里的 OpenAI-compatible 地址。
          </p>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-[#725d42]">
            Base URL
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              className="auth-input"
              placeholder="https://provider.example/v1"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#725d42]">
            API Key
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="auth-input"
              type="password"
              placeholder={settings.hasApiKey ? "留空则沿用当前密钥" : "请输入 API Key"}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[#725d42]">
            默认模型
            <IslandSelect
              value={defaultModel}
              onChange={(event) =>
                setDefaultModel(event.target.value as ReviewModelValue)
              }
            >
              {reviewModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </IslandSelect>
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t-2 border-[#725d42]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-[#725d42]">
            当前密钥：{settings.maskedApiKey ?? "未设置"}
          </p>
          <IslandButton
            type="submit"
            variant="primary"
            loading={isPending}
            loadingLabel="保存中..."
          >
            保存模型设置
          </IslandButton>
        </div>

        {message ? (
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-bold text-[#725d42]"
          >
            {message}
          </p>
        ) : null}
      </IslandCard>
    </form>
  );
}

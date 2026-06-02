export type ModelProvider = {
  completeJson(prompt: string): Promise<string>;
};

export class FetchModelProvider implements ModelProvider {
  constructor({
    endpoint,
    baseUrl,
    apiKey,
    model
  }: {
    endpoint?: string;
    baseUrl?: string;
    apiKey: string;
    model: string;
  }) {
    this.endpoint = endpoint ?? `${trimTrailingSlash(baseUrl ?? "")}/chat/completions`;
    this.apiKey = apiKey;
    this.model = model;
  }

  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly model: string;

  async completeJson(prompt: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error("Model provider request failed");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Model provider returned empty content");
    }

    return content;
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/g, "");
}

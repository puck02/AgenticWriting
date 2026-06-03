export type ModelProvider = {
  completeJson(prompt: string): Promise<string>;
  completeVisionText(input: VisionTextInput): Promise<string>;
};

export type VisionTextInput = {
  prompt: string;
  file: File;
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
    return this.completeChat({
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" }
    });
  }

  async completeVisionText({ prompt, file }: VisionTextInput): Promise<string> {
    return this.completeChat({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: await fileToDataUrl(file)
              }
            }
          ]
        }
      ]
    });
  }

  private async completeChat({
    messages,
    responseFormat
  }: {
    messages: ChatMessage[];
    responseFormat?: { type: "json_object" };
  }): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        ...(responseFormat ? { response_format: responseFormat } : {})
      })
    });

    if (!response.ok) {
      throw new Error(
        `Model provider request failed with status ${response.status}: ${await readResponseSummary(response)}`
      );
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

type ChatMessage = {
  role: "user";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/g, "");
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");

  return `data:${file.type};base64,${bytes}`;
}

async function readResponseSummary(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");

  return body.slice(0, 500) || "empty response body";
}

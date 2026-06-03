# Agentic Writing Coach

AI 辅助考研英语写作教练 MVP。

## 本地运行

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

## AI 模式

默认产品路径会在模型环境变量齐全时调用真实 OpenAI-compatible Chat Completions；测试环境仍使用 deterministic/mock adapter，避免单元测试依赖外部网络。

如需启用 OpenAI-compatible 第三方中转站，在 `.env.local` 中配置：

```env
MODEL_API_BASE_URL="https://your-provider.example/v1"
MODEL_API_KEY="your-api-key"
MODEL_NAME="your-model-name"
```

也可以直接使用完整 chat completions endpoint：

```env
MODEL_API_ENDPOINT="https://your-provider.example/v1/chat/completions"
```

`MODEL_API_ENDPOINT` 优先级高于 `MODEL_API_BASE_URL`。OCR 通过同一个 OpenAI-compatible endpoint 调用视觉模型；如果批改模型不支持图片，额外配置：

```env
OCR_MODEL_NAME="your-vision-model-name"
```

只有显式设置 `REVIEWER_MODE="deterministic"` 或 `OCR_MODE="mock"` 时，才会进入本地演示模式。

## 验证

```bash
npm test
npm run lint
npm run build
```

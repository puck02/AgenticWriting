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

默认使用 deterministic reviewer，便于本地开发和测试，不会调用外部模型。

如需启用 OpenAI-compatible 第三方中转站，在 `.env.local` 中配置：

```env
REVIEWER_MODE="production"
MODEL_API_BASE_URL="https://your-provider.example/v1"
MODEL_API_KEY="your-api-key"
MODEL_NAME="your-model-name"
```

也可以直接使用完整 chat completions endpoint：

```env
MODEL_API_ENDPOINT="https://your-provider.example/v1/chat/completions"
```

`MODEL_API_ENDPOINT` 优先级高于 `MODEL_API_BASE_URL`。图片识别当前使用 mock OCR adapter，上传图片后会生成可编辑识别草稿；后续可替换为真实 OCR 或多模态模型适配器。

## 验证

```bash
npm test
npm run lint
npm run build
```

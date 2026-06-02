# Agentic Writing Coach Production Upgrade Design

## Goal

Upgrade the current MVP from a deterministic demo into a production-grade AI writing coach for考研英语写作.

The upgrade must add real model calls, image-based input, OCR-assisted drafting, agentic review orchestration, and explainable long-term memory. The product should keep the current core loop: review an essay, let the user accept or reject sentence suggestions, update the user's writing profile, and reuse that profile in later reviews.

## Product Scope

This upgrade focuses on individual learners. It does not add teacher workspaces, course management, class analytics, payments, or social features.

The production loop is:

1. User creates a new review.
2. User enters or uploads the essay prompt.
3. User enters or uploads the essay body.
4. OCR converts uploaded images into editable text drafts.
5. User reviews and edits the recognized prompt/body.
6. User submits confirmed text for review.
7. AI agents retrieve relevant memory, review the essay, validate the output, and save structured results.
8. User accepts or rejects sentence suggestions.
9. Feedback updates writing preferences, error patterns, memory events, and the expression library.
10. Future reviews use the updated profile to produce more personalized suggestions.

## User Experience

### Prompt Input

The prompt area supports both text entry and image upload.

Accepted image use cases:

- Exam prompt photos
- Chart screenshots
- Picture-writing prompts
- Application-letter requirements

After upload, the page shows an OCR state: uploading, recognizing, ready, or failed. When recognition succeeds, the recognized text is inserted into the prompt textarea. The user can edit it before review.

### Essay Body Input

The body area supports text entry and image upload.

After upload, OCR output is normalized into an editable draft:

- Remove obvious duplicate blank lines.
- Preserve paragraph breaks when confidence is high.
- Normalize whitespace around English words and punctuation.
- Keep user wording unchanged where possible.
- Avoid automatic rewriting before review.

The user must confirm the recognized text by submitting the final textarea content. Images are input aids, not authoritative essay records.

### Review Result

The result page keeps the current structure: score, summary, priority, error patterns, and sentence suggestions.

Production review adds clearer agentic explanations:

- Which memories influenced the review.
- Which suggestions match the user's accepted preferences.
- Which suggestions avoid previously rejected styles.
- Why each suggestion is suitable for考研写作.

### Memory Transparency

The profile page should eventually show not only current preference counts but also why a memory exists. Each memory item should be traceable to feedback or review events.

Users must be able to delete profile and expression items. Deleted items must not be injected into later review context.

## Agentic Architecture

The system should use a controlled agent pipeline, not free-form multi-agent autonomy. Each agent has one responsibility, structured inputs, structured outputs, and validation.

### Input Agent

Responsibilities:

- Accept image uploads for prompt/body.
- Call OCR or a multimodal model.
- Normalize recognized text into editable drafts.
- Preserve source metadata and OCR confidence where available.

Output:

- `promptDraft`
- `contentDraft`
- raw OCR text
- normalized text
- status and error details

### Memory Retrieval Agent

Responsibilities:

- Load active writing preferences, error patterns, expression assets, and memory events.
- Rank memory by user, essay type, topic, expression intent, recency, and evidence count.
- Build a compact memory context for the review model.

Output:

- selected preferences
- selected error patterns
- selected expressions
- explanation of why each item was selected

### Review Agent

Responsibilities:

- Review the confirmed essay text as a考研英语 writing coach.
- Produce structured JSON matching the existing review schema, with any production extensions.
- Use memory context to personalize suggestions without overfitting.

Output:

- overall score
- category scores
- summary
- priority
- error patterns
- sentence suggestions
- per-suggestion memory explanation

### Suggestion Personalization Agent

Responsibilities:

- Check whether each suggestion fits the user's profile.
- Reduce suggestions that match repeatedly rejected patterns.
- Keep suggestions suitable for exam writing and user skill level.

This can initially be a prompt section inside the Review Agent. It should become a separate service only if tests show review prompts are too hard to control.

### Quality Guard

Responsibilities:

- Validate model output against schema.
- Reject empty suggestions, changed meaning, malformed JSON, impossible scores, or unsupported labels.
- Trigger one repair attempt for invalid model output.
- Return a controlled failure if repair fails.

### Memory Update Agent

Responsibilities:

- Convert review results and user feedback into durable memory events.
- Update aggregate writing preferences and error patterns.
- Add accepted expressions to the expression library.
- Restore soft-deleted preferences when new feedback supports the same label.

This agent should be deterministic rule-based at first. LLM-based memory summarization can be added later after the event log exists.

## Data Model Additions

### UploadAsset

Stores uploaded prompt/body images and OCR state.

Fields:

- `id`
- `userId`
- `purpose`: prompt or content
- `fileName`
- `mimeType`
- `sizeBytes`
- `storageKey`
- `ocrStatus`
- `rawText`
- `normalizedText`
- `errorMessage`
- `createdAt`

### AiRun

Stores each model/agent run for observability.

Fields:

- `id`
- `userId`
- `agentType`
- `model`
- `status`
- `inputSummary`
- `outputSummary`
- `errorMessage`
- `latencyMs`
- `createdAt`

No API keys, raw secrets, or sensitive headers may be stored.

### MemoryEvent

Stores explainable memory changes.

Fields:

- `id`
- `userId`
- `eventType`
- `essayId`
- `suggestionId`
- `essayType`
- `label`
- `payload`
- `createdAt`

Examples:

- accepted suggestion
- rejected suggestion
- error pattern observed
- expression added
- memory deleted
- memory restored

### Review Versioning

The current essay review can remain embedded in `Essay` for now. A future `ReviewVersion` table should be added when the product supports retry history, multiple model versions, or before/after comparisons.

## Model Integration

The current `DeterministicReviewer` remains for tests and local fallback. Production adds a model-backed reviewer implementing the same `LlmReviewer` interface.

The production reviewer must:

- Accept `ReviewRequest`.
- Build a prompt from essay type, prompt, content, and selected memory.
- Call the configured model provider.
- Parse structured output.
- Validate with Zod.
- Attempt one repair if validation fails.
- Return `ReviewResult`.

Environment variables should configure provider, model, and API key. The application must fail clearly when production model mode is enabled without required configuration.

## OCR Integration

OCR should be behind an adapter interface.

Initial adapter options:

- Mock OCR adapter for development and tests.
- Production OCR adapter using a multimodal model or OCR service.

The UI must not depend on the provider. It calls an app API route, receives normalized text, and lets the user edit it.

## API Additions

### Upload OCR Route

`POST /api/uploads/ocr`

Input:

- multipart file
- purpose: prompt or content

Output:

- upload id
- OCR status
- raw text
- normalized text

### Review Route Changes

`POST /api/essays` remains text-based:

- `essayType`
- `prompt`
- `content`

Optional future fields:

- `promptUploadId`
- `contentUploadId`

The route should not accept image files directly.

## Reliability

### Upload Limits

The product must reject unsupported files before OCR:

- Only image MIME types.
- Size limit enforced server-side.
- Clear error for unsupported files.

### Model Failures

If review fails:

- Do not create a completed essay review.
- Return a clear error.
- Store an `AiRun` failure record.
- Allow the user to retry without retyping input.

If OCR fails:

- Keep the existing textarea content.
- Show an error.
- Allow retry or manual entry.

### Schema Validation

All LLM review output must pass `reviewResultSchema`. Production extensions must be added to the schema before they are used by the UI.

## Testing Strategy

Tests must cover:

- OCR text normalization.
- Upload validation.
- OCR route success and failure behavior.
- Production reviewer adapter success path with mocked provider.
- Invalid model output repair attempt.
- Invalid model output failure after repair.
- Memory retrieval ranking.
- Feedback creates memory events and updates aggregate memory.
- Deleted memories are excluded from review context.
- Prompt/body image OCR fills editable text before submission.
- Essay submission still sends confirmed text only.

## Rollout Plan

Build this upgrade in product slices:

1. OCR-ready input workflow with mock OCR.
2. Real OCR adapter.
3. Production reviewer adapter.
4. AI run logging and quality guard.
5. Memory events and retrieval upgrade.
6. Agentic personalization improvements.
7. Production hardening and documentation.

Each slice must be independently testable and committable.

## Non-Goals

This production upgrade does not include:

- Teacher dashboards
- Class management
- Payments
- Full course planning
- Mobile app packaging
- Vector database as a required dependency
- Fully autonomous agents that can mutate user data without deterministic validation

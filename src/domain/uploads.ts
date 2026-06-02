import { z } from "zod";

export const uploadPurposes = ["PROMPT", "CONTENT"] as const;
export const uploadPurposeSchema = z.enum(uploadPurposes);

export type UploadPurposeValue = (typeof uploadPurposes)[number];

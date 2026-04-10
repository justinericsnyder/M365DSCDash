import yaml from "js-yaml";
import { z } from "zod";

// DSC Configuration Document schema based on DSC v3 spec
const ResourceInstanceSchema = z.object({
  name: z.string(),
  type: z.string(),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  dependsOn: z.array(z.string()).optional(),
});

const ParameterSchema = z.object({
  type: z.enum(["string", "int", "bool", "array", "object"]),
  defaultValue: z.unknown().optional(),
  allowedValues: z.array(z.unknown()).optional(),
  description: z.string().optional(),
});

const DSCDocumentSchema = z.object({
  $schema: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  parameters: z.record(z.string(), ParameterSchema).optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  resources: z.array(ResourceInstanceSchema).min(1),
});

export type DSCDocument = z.infer<typeof DSCDocumentSchema>;
export type DSCResourceInstance = z.infer<typeof ResourceInstanceSchema>;

export function parseDSCDocument(input: string): {
  success: boolean;
  data?: DSCDocument;
  error?: string;
} {
  try {
    // Try YAML first, then JSON
    let parsed: unknown;
    try {
      parsed = yaml.load(input);
    } catch {
      parsed = JSON.parse(input);
    }

    const result = DSCDocumentSchema.safeParse(parsed);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => i.message).join(", "),
      };
    }

    return { success: true, data: result.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to parse document",
    };
  }
}

export function extractResourceTypes(doc: DSCDocument): string[] {
  return [...new Set(doc.resources.map((r) => r.type))];
}

export function getResourceOwner(type: string): string {
  return type.split("/")[0] || "Unknown";
}

export function getResourceName(type: string): string {
  return type.split("/").pop() || type;
}

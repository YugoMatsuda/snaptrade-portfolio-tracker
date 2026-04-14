import {
  type ConditionalSchemaConverter,
  type JSONSchema,
  OpenAPIGenerator,
} from "@orpc/openapi";
import { stringify as toYaml } from "npm:yaml@latest";
import { z } from "zod";
import { router } from "../router.ts";

type SchemaObject = Record<string, unknown>;

// Zod v4's z.toJSONSchema() outputs in JSON Schema Draft 2020-12 format,
// which adds "$schema": "https://json-schema.org/draft/2020-12/schema" at the root.
// This field is invalid as an OpenAPI 3.1 schema and causes swift-openapi-generator
// to ignore the entire schema, so it must be stripped.
function stripZodMeta({ $schema: _, ...rest }: SchemaObject): SchemaObject {
  return rest;
}

// Zod v4's z.toJSONSchema() outputs nullable fields as:
//   anyOf: [{ type: "string" }, { type: "null" }]
// which conforms to the JSON Schema standard.
//
// However, as of April 2026, swift-openapi-generator does not support this pattern
// and throws "The anyOf structure did not decode into any child schema".
// Related issues:
//   https://github.com/apple/swift-openapi-generator/issues/82
//   https://github.com/apple/swift-openapi-generator/issues/286
//   https://github.com/apple/swift-openapi-generator/issues/534
//
// As a workaround, convert to the type array notation officially supported by OpenAPI 3.1:
//   type: ["string", "null"]
// This conversion is a known official workaround for swift-openapi-generator.
// This function can be removed once swift-openapi-generator supports anyOf nullable.
function normalizeNullable(schema: SchemaObject): SchemaObject {
  if (Array.isArray(schema.anyOf)) {
    const anyOf = schema.anyOf as SchemaObject[];
    const nullIndex = anyOf.findIndex((s) => s.type === "null");
    if (nullIndex !== -1 && anyOf.length === 2) {
      const nonNull = anyOf[nullIndex === 0 ? 1 : 0];
      const normalized = normalizeNullable(nonNull);
      const existingType = normalized.type;
      return {
        ...normalized,
        type: Array.isArray(existingType)
          ? [...existingType, "null"]
          : [existingType, "null"],
      };
    }
  }
  // Recursively process properties
  if (schema.properties && typeof schema.properties === "object") {
    const props = schema.properties as Record<string, SchemaObject>;
    return {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(props).map(([k, v]) => [k, normalizeNullable(v)]),
      ),
    };
  }
  // Recursively process items
  if (schema.items && typeof schema.items === "object") {
    return { ...schema, items: normalizeNullable(schema.items as SchemaObject) };
  }
  return schema;
}

const zodConverter: ConditionalSchemaConverter = {
  condition: (schema) => schema instanceof z.ZodType,
  convert: (schema) => {
    const raw = z.toJSONSchema(schema as z.ZodType) as SchemaObject;
    const jsonSchema = normalizeNullable(stripZodMeta(raw)) as unknown as JSONSchema;
    const required = !(schema as z.ZodType)._zod.traits.has("ZodOptional");
    return [required, jsonSchema];
  },
};

const generator = new OpenAPIGenerator({
  schemaConverters: [zodConverter],
});

const spec = await generator.generate(router, {
  info: {
    title: "SnapTrade Portfolio API",
    version: "0.1.0",
  },
  servers: [{ url: "http://localhost:8000/api" }],
});

// contract/openapi.json (single source of truth)
const jsonPath = new URL("../../contract/openapi.json", import.meta.url);
await Deno.writeTextFile(jsonPath, JSON.stringify(spec, null, 2));
console.log("Generated: contract/openapi.json");

// ios/.../openapi.yaml (auto-generated artifact)
const yamlPath = new URL(
  "../../ios/SnaptradePortfolioTracker/SnaptradePortfolioTracker/Resources/openapi.yaml",
  import.meta.url,
);
await Deno.writeTextFile(yamlPath, toYaml(spec));
console.log("Generated: ios/.../openapi.yaml");

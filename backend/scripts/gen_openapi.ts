import {
  type ConditionalSchemaConverter,
  type JSONSchema,
  OpenAPIGenerator,
} from "@orpc/openapi";
import { stringify as toYaml } from "npm:yaml@latest";
import { z } from "zod";
import { router } from "../router.ts";

type SchemaObject = Record<string, unknown>;

// Zod v4のz.toJSONSchema()はJSON Schema Draft 2020-12形式で出力するため、
// ルートに "$schema": "https://json-schema.org/draft/2020-12/schema" が付与される。
// このフィールドはOpenAPI 3.1スキーマとして不正であり、
// swift-openapi-generatorがスキーマ全体を無視する原因になるため除去する。
function stripZodMeta({ $schema: _, ...rest }: SchemaObject): SchemaObject {
  return rest;
}

// Zod v4のz.toJSONSchema()はnullableフィールドを
//   anyOf: [{ type: "string" }, { type: "null" }]
// という形式で出力する（JSON Schema標準に準拠）。
//
// しかしswift-openapi-generatorはこのパターンを2026年4月時点でサポートしておらず、
// "The anyOf structure did not decode into any child schema" というエラーになる。
// 関連Issue:
//   https://github.com/apple/swift-openapi-generator/issues/82
//   https://github.com/apple/swift-openapi-generator/issues/286
//   https://github.com/apple/swift-openapi-generator/issues/534
//
// 対策として、OpenAPI 3.1が正式サポートする type配列記法
//   type: ["string", "null"]
// に変換する。この変換はswift-openapi-generatorの公式workaroundとして認知されている。
// swift-openapi-generatorが anyOf nullable をサポートした際はこの関数を削除できる。
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
  // properties を再帰的に処理
  if (schema.properties && typeof schema.properties === "object") {
    const props = schema.properties as Record<string, SchemaObject>;
    return {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(props).map(([k, v]) => [k, normalizeNullable(v)]),
      ),
    };
  }
  // items を再帰的に処理
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

// contract/openapi.json（シングルソース）
const jsonPath = new URL("../../contract/openapi.json", import.meta.url);
await Deno.writeTextFile(jsonPath, JSON.stringify(spec, null, 2));
console.log("Generated: contract/openapi.json");

// ios/.../openapi.yaml（自動生成物）
const yamlPath = new URL(
  "../../ios/SnaptradePortfolioTracker/SnaptradePortfolioTracker/Resources/openapi.yaml",
  import.meta.url,
);
await Deno.writeTextFile(yamlPath, toYaml(spec));
console.log("Generated: ios/.../openapi.yaml");

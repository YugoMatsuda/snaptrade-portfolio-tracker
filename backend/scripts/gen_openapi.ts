import {
  type ConditionalSchemaConverter,
  type JSONSchema,
  OpenAPIGenerator,
} from "@orpc/openapi";
import { stringify as toYaml } from "npm:yaml@latest";
import { z } from "zod";
import { router } from "../router.ts";

const zodConverter: ConditionalSchemaConverter = {
  condition: (schema) => schema instanceof z.ZodType,
  convert: (schema) => {
    const jsonSchema = z.toJSONSchema(schema as z.ZodType) as unknown as JSONSchema;
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
  servers: [{ url: "http://localhost:8000/rpc" }],
});

// contract/openapi.json（シングルソース）
const jsonPath = new URL("../../contract/openapi.json", import.meta.url);
await Deno.writeTextFile(jsonPath, JSON.stringify(spec, null, 2));
console.log("Generated: contract/openapi.json");

// ios/.../openapi.yaml（自動生成物）
const yamlPath = new URL(
  "../../ios/SnaptradePortfolioTracker/SnaptradePortfolioTracker/openapi.yaml",
  import.meta.url,
);
await Deno.writeTextFile(yamlPath, toYaml(spec));
console.log("Generated: ios/.../openapi.yaml");

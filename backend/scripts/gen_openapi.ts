import {
  type ConditionalSchemaConverter,
  type JSONSchema,
  OpenAPIGenerator,
} from "@orpc/openapi";
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

const outputPath = new URL("../../contract/openapi.json", import.meta.url);
await Deno.writeTextFile(outputPath, JSON.stringify(spec, null, 2));

console.log("openapi.json generated at contract/openapi.json");

import type { ZodSchema } from "zod";
export interface QueryDefinition<T> {
	schema: ZodSchema<T>;
}

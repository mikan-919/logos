export const componentTypes = [
  {
    key: "tagmemo.memo",
    ownerApp: "tagmemo",
    schema: {
      type: "object",
      properties: { body: { type: "string" } },
      required: ["body"],
      additionalProperties: false,
    },
  },
  {
    key: "tagmemo.tag",
    ownerApp: "tagmemo",
    schema: { type: "object", additionalProperties: false },
  },
  {
    key: "tagmemo.tags",
    ownerApp: "tagmemo",
    schema: {
      type: "object",
      properties: { entities: { type: "array", items: { type: "string", format: "uuid" } } },
      required: ["entities"],
      additionalProperties: false,
    },
  },
  {
    key: "tagmemo.tag-states",
    ownerApp: "tagmemo",
    schema: {
      type: "object",
      properties: {
        entities: { type: "array", items: { type: "string", format: "uuid" } },
        states: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              state: { type: "string", enum: ["off", "auto", "on"] },
              score: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["id", "state", "score"],
            additionalProperties: false,
          },
        },
      },
      required: ["entities", "states"],
      additionalProperties: false,
    },
  },
];

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
    key: "tagmemo.tag-scores",
    ownerApp: "tagmemo",
    schema: {
      type: "object",
      properties: {
        entities: { type: "array", items: { type: "string", format: "uuid" } },
        scores: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              score: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["id", "score"],
            additionalProperties: false,
          },
        },
      },
      required: ["entities", "scores"],
      additionalProperties: false,
    },
  },
  {
    key: "tagmemo.inference",
    ownerApp: "tagmemo",
    schema: {
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
      additionalProperties: false,
    },
  },
];

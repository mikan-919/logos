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
];

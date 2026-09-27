export const componentTypes = [
  {
    key: "logos.name",
    ownerApp: "logos",
    schema: {
      type: "object",
      properties: { value: { type: "string", minLength: 1 } },
      required: ["value"],
      additionalProperties: false,
    },
  },
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

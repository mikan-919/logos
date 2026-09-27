export const nameType = {
  key: "logos.name",
  ownerApp: "logos",
  schema: {
    type: "object",
    properties: { value: { type: "string", minLength: 1 } },
    required: ["value"],
    additionalProperties: false,
  },
};

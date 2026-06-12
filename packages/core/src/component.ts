type Component<T extends string, SCHEMA> = {
	type: T;
	data: SCHEMA;

	origin: "logos" | string;

	authority: "external" | "internal";
};

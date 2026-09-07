export class WorkspaceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceValidationError";
  }
}

export class RevisionConflictError extends Error {
  constructor(
    readonly entityId: string,
    readonly expectedRevision: number,
    readonly actualRevision: number,
  ) {
    super(
      `Entity ${entityId} has revision ${actualRevision}; expected ${expectedRevision}`,
    );
    this.name = "RevisionConflictError";
  }
}

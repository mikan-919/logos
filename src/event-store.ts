import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { SemanticEvent } from "./types";

export class EventStore {
  readonly path: string;

  private constructor(path: string) {
    this.path = path;
  }

  static async open(workspace: string): Promise<EventStore> {
    const path = join(workspace, ".logos", "events.jsonl");
    await mkdir(dirname(path), { recursive: true });
    return new EventStore(path);
  }

  async readAll(): Promise<SemanticEvent[]> {
    let contents: string;
    try {
      contents = await readFile(this.path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }

    return contents
      .split("\n")
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line) as SemanticEvent;
        } catch (error) {
          throw new Error(`Invalid semantic event at line ${index + 1}`, { cause: error });
        }
      });
  }

  async append(event: SemanticEvent): Promise<void> {
    await appendFile(this.path, `${JSON.stringify(event)}\n`, "utf8");
  }
}

export type Name = {
  title: string;
  description?: string;
};

export type Task = {
  status: "todo" | "in-progress" | "done";
};

export type Schedule = {
  date: string; // YYYY-MM-DD
};

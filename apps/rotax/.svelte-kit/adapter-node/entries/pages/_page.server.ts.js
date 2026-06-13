import { a as api } from "../../chunks/api.js";
const load = async () => {
  const res = await api.api.rotax.tasks.$get();
  const tasks = await res.json();
  return { tasks };
};
export {
  load
};

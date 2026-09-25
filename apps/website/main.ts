import { Hono } from "hono";
import { irisoutRouter } from "irisout/hono";
const app = new Hono();

app.route("/", irisoutRouter("./src"));

export { app };

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { parseTrustProxy } from "./config/index";
import routes from "./routes/index";
import { errorHandler, notFoundHandler } from "./middlewares";

const app = express();

app.set("trust proxy", parseTrustProxy(process.env.TRUST_PROXY));
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };

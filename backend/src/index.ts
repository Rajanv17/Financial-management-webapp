import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDatabase, parseTrustProxy } from "./config/index";
import routes from "./routes/index";
import cookieParser from "cookie-parser";
import { errorHandler, notFoundHandler } from "./middlewares";

const app = express();
const PORT = process.env.PORT;

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

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database connection failed !!! ", err);
  });

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

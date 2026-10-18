import "dotenv/config";
import { app } from "./app";
import { connectDatabase } from "./config/index";

const PORT = process.env.PORT;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database connection failed !!! ", err);
  });

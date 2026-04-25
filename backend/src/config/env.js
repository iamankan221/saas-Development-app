import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  database: {
    url: process.env.DATABASE_URL,
  },
};

if (!config.database.url) {
  throw new Error("DATABASE_URL environment variable is not set");
}

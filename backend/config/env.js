const isProduction = process.env.NODE_ENV === "production";

const requireEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const validateJwtSecret = () => {
  const jwtSecret = requireEnv("JWT_SECRET");

  return jwtSecret;
};

const parseCorsOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "";
  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.includes("*")) {
    return "*";
  }

  if (origins.length > 0) {
    return origins;
  }

  return "*";
};

export const loadEnvConfig = () => {
  requireEnv("MONGODB_URI");
  validateJwtSecret();

  return {
    isProduction,
    corsOrigins: parseCorsOrigins(),
    port: Number(process.env.PORT || 8000),
    host: process.env.HOST || "0.0.0.0",
    adminSeedEnabled: process.env.ADMIN_SEED_ENABLED === "true",
  };
};

export const getAdminSeedConfig = () => {
  if (process.env.ADMIN_SEED_ENABLED !== "true") {
    return null;
  }

  return {
    name: requireEnv("ADMIN_NAME"),
    email: requireEnv("ADMIN_EMAIL").toLowerCase(),
    password: requireEnv("ADMIN_PASSWORD"),
  };
};

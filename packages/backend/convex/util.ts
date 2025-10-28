/**
 * Throws an error if the environment variable is not set.
 */
export const requireEnv = (name: string) => {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing environment variable \`${name}\``);
  }
  return value;
};
/**
 * Gets the environment from the CONVEX_ENV environment variable.
 */
export const getEnvironment = () => {
  return process.env.CONVEX_ENV || "development";
};
/**
 * Checks if the environment is development.
 */
export const isDevelopment = () => getEnvironment() === "development";

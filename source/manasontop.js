const Client = require("./Structures/Rihantmkc");
const { WebhookClient } = require("discord.js");

const log = (level, message) => {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

const errorWebhook = new WebhookClient({
  url:
    process.env.ERROR_WEBHOOK_URL ||
    "https://discord.com/api/webhooks/1273194517394227255/uGgVK02tBr--YJwPb5XpkjlTvicMemoIl8o5ruN-gRdjos-2S5GlwMd0pKkT9r-LLg73",
});
const client = new Client();
const metrics = {
  warnings: 0,
  errors: 0,
  guilds: 0,
  users: 0,
  channels: 0,
};
const handleError = (type, error) => {
  log("error", `${type}: ${error.message}`);
  metrics.errors++;
  errorWebhook
    .send(`${type}: ${error.message}`)
    .catch((e) =>
      log("error", `Failed to send error to webhook: ${e.message}`)
    );
};
process.on("warning", (warning) => {
  log("warn", `Warning: ${warning.name} - ${warning.message}`);
  metrics.warnings++;
});

process.on("unhandledRejection", (reason, promise) => {
  handleError(`Fullfilled Promise Rejection: ${reason.message}`, reason);
});

process.on("uncaughtException", (error) => {
  handleError("Uncaught Exception", error);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});
const shutdown = () => {
  log("info", "Received shutdown signal. Cleaning up raws and exiting");
  client.destroy();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
client.on("ready", () => {
  log("info", `Bot is ready! Logged in as ${client.user.tag}`);
  updateMetrics();
});

client.on("error", (error, id) => {
  handleError(`Type ${id} Error\n ${error.message}`, error);
  if (id) {
    log("error", `Error occurred in cluster ${id}`);
  }
});
const clusterEval = async (fn) => {
  const results = await client.cluster.broadcastEval(fn);
  return results.reduce((prev, val) => prev + val, 0);
};
const updateMetrics = async () => {
  metrics.guilds = await Promise.all([clusterEval((c) => c.guilds.cache.size)]);
  metrics.users = await Promise.all([clusterEval((c) => c.users.cache.size)]);
};

setInterval(updateMetrics, 60000);
client.AvonBuild();
const isProduction = process.env.MODE === "production";
if (!isProduction) {
  log("info", "Running in development mode");
}
module.exports = { client };

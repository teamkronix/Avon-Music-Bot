const { ActivityType, EmbedBuilder, WebhookClient } = require("discord.js");
const os = require("os");
const userSchema = require("../../Models/User");
class BotManager {
  constructor(client) {
    this.client = client;
    this.statusInterval = 15000;
    this.metricsInterval = 600000;
    this.intervals = new Set();
    this.currentStatus = 0;
    this.isInitialized = false;
  }
  async initialize() {
    try {
      if (this.isInitialized) return;
      this.isInitialized = true;
      await this.updateStatus();
      await this.met();
      await this.lis();
      console.log(
        `[Avon Music] Initialized successfully on cluster ${this.client.cluster.id}`
      );
    } catch (error) {
      console.error("[Avon Music] Initialization error:", error);
      setTimeout(() => this.initialize(), 5000);
    }
  }
  async updateStatus() {
    try {
      const statusConfigs = [
        {
          name: "Tunes in {serverCount} servers",
          type: ActivityType.Playing,
        },
        {
          name: "{userCount} users jamming",
          type: ActivityType.Watching,
        },
        {
          name: "+help | {songCount} songs played",
          type: ActivityType.Listening,
        },
        {
          name: "Music with {activeVoice} sessions",
          type: ActivityType.Competing,
        },
      ];
      const interval = setInterval(async () => {
        try {
          const metrics = await this.tezz();
          const status = statusConfigs[this.currentStatus];
          const formattedName = status.name
            .replace("{serverCount}", metrics.totalServers.toLocaleString())
            .replace("{userCount}", metrics.totalUsers.toLocaleString())
            .replace("{songCount}", metrics.totalSongs.toLocaleString())
            .replace("{activeVoice}", metrics.activeVoice.toLocaleString());
          await this.client.user.setActivity(formattedName, {
            type: status.type,
          });
          this.currentStatus = (this.currentStatus + 1) % statusConfigs.length;
        } catch (error) {
          console.error("[Avon Music] Status update error:", error);
        }
      }, this.statusInterval);
      this.intervals.add(interval);
    } catch (error) {
      console.error("[Avon Music] Status initialization error:", error);
    }
  }
  async met() {
    try {
      const interval = setInterval(async () => {
        const metrics = await this.tezz();
        await this.logMetrics(metrics);
      }, this.metricsInterval);
      this.intervals.add(interval);
    } catch (error) {
      console.error("[Avon Music] Metrics collection error:", error);
    }
  }
  async tezz() {
    try {
      const [totalServers, totalChannels, totalUsers] = await Promise.all([
        this.clusterEval((c) => c.guilds.cache.size),
        this.clusterEval((c) => c.channels.cache.size),
        this.clusterEval((c) => c.users.cache.size),
      ]);
      const activeVoice = await this.clusterEval(
        (c) => c.kazagumo?.players?.size || 0
      );
      let userDB = await userSchema.find();
      let totalSongs = 0;
      for (const user of userDB) {
        totalSongs += user.songsPlayed;
      }
      // const totalSongs = await this.clusterEval((c) =>
      //   [...(c.kazagumo?.players?.values() || [])].reduce(
      //     (acc, player) => acc + (player.queue?.size || 0),
      //     0
      //   )
      // );

      const systemMetrics = {
        cpuUsage: os.loadavg()[0],
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: process.uptime(),
        ping: this.client.ws.ping,
      };
      return {
        clusterInfo: {
          id: this.client.cluster.id,
          count: this.client.cluster.count,
          localServerCount: this.client.guilds.cache.size,
        },
        totalServers,
        totalChannels,
        totalUsers,
        activeVoice,
        totalSongs,
        system: systemMetrics,
      };
    } catch (error) {
      console.error("[Avon Music] Metrics collection error:", error);
      return null;
    }
  }
  async logMetrics(metrics) {
    if (!metrics) return;
    const embed = new EmbedBuilder()
      .setTitle(`Avon Stats - Cluster ${metrics.clusterInfo.id}`)
      .setColor(this.client.config.color)
      .setDescription(
        `**Cluster Info**\n- ID: ${metrics.clusterInfo.id}\n- Total Clusters: ${
          metrics.clusterInfo.count
        }\n- Servers: ${
          metrics.clusterInfo.localServerCount
        }\n\n**Global Stats**\n- Servers: ${
          metrics.totalServers
        }\n- Channels: ${metrics.totalChannels}\n- Users: ${
          metrics.totalUsers
        }\n\n**Music Stats**\n- Active Sessions: ${
          metrics.activeVoice
        }\n- Songs in Queue: ${
          metrics.totalSongs
        }\n\n**System Metrics**\n- CPU Load: ${metrics.system.cpuUsage.toFixed(
          2
        )}%\n- Memory: ${this.formatBytes(
          metrics.system.totalMemory - metrics.system.freeMemory
        )} / ${this.formatBytes(
          metrics.system.totalMemory
        )}\n- Uptime: ${this.formatUptime(metrics.system.uptime)}\n- Ping: ${
          metrics.system.ping
        }ms`
      )
      // .addFields([
      //   {
      //     name: "Cluster Info",
      //     value: `ID: ${metrics.clusterInfo.id}\nTotal Clusters: ${metrics.clusterInfo.count}\nLocal Servers: ${metrics.clusterInfo.localServerCount}`,
      //     inline: true,
      //   },
      //   {
      //     name: "Global Stats",
      //     value: `Servers: ${metrics.totalServers}\nChannels: ${metrics.totalChannels}\nUsers: ${metrics.totalUsers}`,
      //     inline: true,
      //   },
      //   {
      //     name: "Music Stats",
      //     value: `Active Sessions: ${metrics.activeVoice}\nSongs in Queue: ${metrics.totalSongs}`,
      //     inline: true,
      //   },
      //   {
      //     name: "System Metrics",
      //     value: `CPU Load: ${metrics.system.cpuUsage.toFixed(
      //       2
      //     )}%\nMemory: ${this.formatBytes(
      //       metrics.system.totalMemory - metrics.system.freeMemory
      //     )} / ${this.formatBytes(
      //       metrics.system.totalMemory
      //     )}\nUptime: ${this.formatUptime(metrics.system.uptime)}\nPing: ${
      //       metrics.system.ping
      //     }ms`,
      //     inline: false,
      //   },
      // ])
      .setThumbnail(this.client.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    console.log(
      `[Stats] Cluster ${metrics.clusterInfo.id} | ${new Date().toISOString()}`
    );
    console.table({
      Servers: metrics.totalServers,
      Channels: metrics.totalChannels,
      Users: metrics.totalUsers,
      "Active Players": metrics.activeVoice,
      "Total Songs": metrics.totalSongs,
    });
    try {
      const web = `https://canary.discord.com/api/webhooks/1298644336732278855/bcMKMoeJPbnfBgJ7-GVX01YaOki80HRTe8sRVAjKIU3KWGGIbGLCNTWzmIGS7iCclLPZ`;
      const webhook = new WebhookClient({ url: web });
      webhook.send({ embeds: [embed] });
    } catch (error) {
      console.error(
        "[Avon Music] Error sending metrics to log channel:",
        error
      );
    }
  }
  async clusterEval(fn) {
    try {
      const results = await this.client.cluster.broadcastEval(fn);
      return results.reduce((sum, value) => sum + value, 0);
    } catch (error) {
      console.error("[Avon Music] Cluster evaluation error:", error);
      return 0;
    }
  }
  async lis() {
    this.client.on("guildCreate", () => this.handleGuildUpdate());
    this.client.on("guildDelete", () => this.handleGuildUpdate());
    this.client.on("error", this.handleError.bind(this));
    this.client.on("disconnect", this.handleDisconnect.bind(this));
  }
  async handleGuildUpdate() {
    try {
      await this.updateStatus();
    } catch (error) {
      console.error("[Avon Music] Guild update handler error:", error);
    }
  }
  async handleError(error) {
    console.error("[Avon Music] Client error:", error);
    try {
      const logChannel = await this.getLogChannel();
      if (logChannel) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("Avon Music Error")
          .setColor("Red")
          .setDescription(`\`\`\`${error.stack || error.message}\`\`\``)
          .setTimestamp();
        await logChannel.send({ embeds: [errorEmbed] });
      }
    } catch (logError) {
      console.error("[Avon Music] Error logging error:", logError);
    }
  }
  async handleDisconnect(event) {
    console.log(
      "[Avon Music] Disconnected from Discord. Attempting to reconnect."
    );
    try {
      this.intervals.forEach((interval) => clearInterval(interval));
      this.intervals.clear();
      setTimeout(() => this.initialize(), 5000);
    } catch (error) {
      console.error("[Avon Music] Disconnect handler error:", error);
    }
  }
  formatBytes(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
  }
  formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }
  destroy() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.isInitialized = false;
  }
}

module.exports = async (client) => {
  const botManager = new BotManager(client);
  await botManager.initialize();
};

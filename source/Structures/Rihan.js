const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  ButtonStyle,
} = require("discord.js");
const { ClusterClient, getInfo } = require("discord-hybrid-sharding");
const config = require("../Config");
const AntiRatelimit = require("../Handlers/AntiRatelimit");
const mongoose = require("mongoose");
const Loader = require("../Handlers/Loader");
const Music = require("../Handlers/Playback");
const SpotiPro = require("spoti-pro");
const axios = require("axios");
const { Connectors } = require("shoukaku");
const { Kazagumo, Plugins } = require("kazagumo");
const Spotify = require("kazagumo-spotify");
const BotUtils = require("./Utils");
const GuildSchema = require("../Models/Guild");
const Topgg = require("@top-gg/sdk");

const Intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildWebhooks,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
];
const message = new AntiRatelimit({
  globalDelay: 2000,
  userCooldown: 7000,
  maxQueueSize: 200,
  maxUserQueueSize: 6,
  banLimit: 5,
  banDuration: 10 * 60 * 1000,
});

module.exports = class AvonClient extends Client {
  constructor() {
    let shardingOptions = {};
    try {
      const shardInfo = getInfo();
      shardingOptions = {
        shards: shardInfo.SHARD_LIST,
        shardCount: shardInfo.TOTAL_SHARDS,
      };
    } catch (error) {
      console.warn("Running in non-sharded mode");
    }
    super({
      ...shardingOptions,
      allowedMentions: {
        parse: ["roles", "users", "everyone"],
        repliedUser: false,
      },
      intents: Intents,
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
        Partials.Reaction,
      ],
      ws: {
        large_threshold: 50,
        version: 10,
      },
      rest: {
        retries: 5,
        authPrefix: "Bot",
        api: "https://discord.com/api",
        cdn: "https://cdn.discordapp.com/",
        version: "10",
        rejectOnRateLimit: null,
      },
    });
    if (shardingOptions.shardCount) {
      this.cluster = new ClusterClient(this);
    }
    this.spotify = new SpotiPro(
      "83c98500a89a4a5eae6fa819643644b8",
      "b2627d1bf6c846d98e102fe58e656892",
      { cacheEnabled: true }
    );
    this.topgg = new Topgg.Api(config.tokenTopgg);
    this.config = config;
    this.utils = new BotUtils(this);
    this.commands = new Collection();
    this.message = message;
    this.shardInfo = shardingOptions;
    this.Nodes = config.nodes;
    this.rest = new REST({ version: "10" }).setToken(this.config.token.Primary);
    this.btn = {
      green: ButtonStyle.Success,
      red: ButtonStyle.Danger,
      grey: ButtonStyle.Secondary,
      blue: ButtonStyle.Primary,
      link: ButtonStyle.Link,
    };
    this.kazagumo = new Kazagumo(
      {
        plugins: [
          new Plugins.PlayerMoved(this),
          new Spotify({
            clientId: "83c98500a89a4a5eae6fa819643644b8",
            clientSecret: "b2627d1bf6c846d98e102fe58e656892",
            playlistPageLimit: 1,
            albumPageLimit: 1,
            searchLimit: 10,
            searchMarket: "IN",
          }),
        ],
        defaultSearchEngine: "youtube_music",
        defaultSource: "ytmsearch:",
        defaultYoutubeThumbnail: "hq720",
        send: (guildId, payload) => {
          const guild = this.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
      },
      new Connectors.DiscordJS(this),
      this.Nodes,
      {
        resume: true,
        resumeTimeout: 60,
        resumeByLibrary: true,
        reconnectTries: 10,
        reconnectInterval: 10,
        restTimeout: 60,
        moveOnDisconnect: true,
        voiceConnectionTimeout: 90,
      }
    );
    this.kazagumo.shoukaku.on("ready", (name) => {
      console.log(`Lavalink ${name}: Ready!`);
      this.reconnectNodes(name);
    });
    this.kazagumo.shoukaku.on("error", (name, error) =>
      console.error(`Lavalink ${name}: Error:`, error)
    );
    this.kazagumo.shoukaku.on("close", (name, code, reason) =>
      console.warn(`Lavalink ${name}: Closed: ${code} ${reason}`)
    );

    this.music = new Music(this);
  }
  async  setupDiscordSdk() {
    await this.discordSdk.ready();
  }
  async AvonBuild() {
    try {
      new Loader(this);
      // await this.setupDiscordSdk().then(() => {
      //   console.log("Discord SDK Ready");
      // }).catch((error) => {
      //   console.error("Error setting up Discord SDK:", error);
      // });
      await this.connectToDatabase();
      await this.login(this.config.token.Primary).catch(async (error) => {
        console.error(
          "Error logging in to Primary Bot, Trying Secondary:",
          error
        );
        await this.login(this.config.token.Secondary).catch((error) => {
          console.error("Error logging in to Secondary:", error);
        });
      });
    } catch (error) {
      console.error("Error during AvonBuild:", error);
    }
  }
  async reconnectNodes(nodeName) {
    try {
      console.log(
        `Attempting to reconnect players and 24/7 VCs for node: ${nodeName}`
      );
      const guilds = this.guilds.cache.map((guild) => guild.id);
      for (const [guildId, player] of this.kazagumo.players) {
        if (
          guilds.includes(guildId) &&
          player.shoukaku.node.name === nodeName
        ) {
          try {
            player.connect();
            console.log(
              `Successfully reconnected player for guild: ${guildId}`
            );
          } catch (error) {
            console.error(
              `Failed to reconnect player for guild: ${guildId}`,
              error
            );
          }
        }
      }
      const twentyFourSevenGuilds = await GuildSchema.find({
        "twentyFourSeven.enabled": true,
        id: { $in: guilds },
      }).lean();
      console.log(
        `Found ${twentyFourSevenGuilds.length} guilds with 24/7 mode enabled`
      );
      for (const guild of twentyFourSevenGuilds) {
        try {
          const guildObj = this.guilds.cache.get(guild.id);
          if (!guildObj) {
            console.log(`Guild ${guild.id} not found in cache, skipping`);
            continue;
          }
          const existingPlayer = this.kazagumo.players.get(guild.id);
          if (
            existingPlayer &&
            existingPlayer.shoukaku.node.name !== nodeName
          ) {
            console.log(
              `Skipping guild ${guild.id} as it's connected to a different node`
            );
            continue;
          }
          const voiceChannel = guildObj.channels.cache.get(
            guild.twentyFourSeven.voiceChannel
          );
          const textChannel = guildObj.channels.cache.get(
            guild.twentyFourSeven.textChannel
          );
          if (!voiceChannel || !textChannel) {
            console.log(
              `Invalid voice or text channel for guild ${guild.id}, skipping`
            );
            continue;
          }
          const player = await this.kazagumo.createPlayer({
            guildId: guild.id,
            textId: textChannel.id,
            voiceId: voiceChannel.id,
            deaf: true,
            shardId: guildObj.shardId,
          });
          console.log(
            `Successfully connected to 24/7 VC for guild: ${guild.id}`
          );
        } catch (error) {
          console.error(
            `Failed to connect to 24/7 VC for guild: ${guild.id}`,
            error
          );
        }
      }
      console.log(`Reconnection process completed for node: ${nodeName}`);
    } catch (error) {
      console.error(`Error in reconnectNodes for ${nodeName}:`, error);
    }
  }
  async connectToDatabase() {
    mongoose.set("strictQuery", true);
    const Options = {
      autoIndex: false,
      connectTimeoutMS: 10000,
      family: 4,
    };
    await mongoose
      .connect(this.config.mongoURL.Primary, Options)
      .then(() => {
        console.log("Connected to Main MongoDB");
      })
      .catch(async (error) => {
        console.error("Error connecting to MongoDB:", error);
        await mongoose
          .connect(this.config.mongoURL.Secondary, Options)
          .then(() => {
            console.log("Connected to Secondary MongoDB");
          })
          .catch((error) => {
            console.error("Error connecting to Secondary MongoDB:", error);
          });
      });
  }
};

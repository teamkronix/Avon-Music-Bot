const { Connectors } = require("shoukaku");
const { Kazagumo, Plugins } = require("kazagumo");
const SiaQueue = require("./kazagumoQueue");
const AvonServer  = require("./AvonServer");

module.exports = class SiaKaju extends Kazagumo {
  constructor(client, nodes) {
    super(
      {
        plugins: [
          //   new Spotify({
          //     clientId: client.settings.SPOTIFY_ID,
          //     clientSecret: client.settings.SPOTIFY_SECRET,
          //     playlistPageLimit: 5,
          //     searchLimit: 15,
          //     albumPageLimit: 5,
          //     searchMarket: "IN",
          //   }),
          //   new KazagumoFilter(),
          //   new Deezer(),
          //   new Apple({
          //     countryCode: "in",
          //     imageWidth: 1200,
          //     imageHeight: 1800,
          //   }),
          new Plugins.PlayerMoved(client),
        ],
        defaultSearchEngine: "youtube",
        defaultYoutubeThumbnail: "hq720",
        send: (guildId, payload) => {
          const guild = client.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
      },
      new Connectors.DiscordJS(client),
      nodes,
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
    this.queue = new SiaQueue(this);
    this.avonServer = new fastify();
    this.shoukaku.on("ready", (name) =>
      console.info(`Lavalink ${name}: Ready From SiaKaju`)
    );
    this.shoukaku.on("disconnect", (name, count) => {
      const players = [...this.shoukaku.players.values()].filter(
        (p) => p.node.name === name
      );
      players.map((player) => {
        this.destroyPlayer(player.guildId);
        player.destroy();
      });
      console.warn(`Lavalink ${name}: Disconnected`);
    });
    this.shoukaku.on("close", (name, code, reason) =>
      this.console.warn(`Lavalink ${name}: Closed - ${code} - ${reason}`)
    );
  }
};

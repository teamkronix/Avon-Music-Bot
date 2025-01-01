/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const os = require("os");
const process = require("process");
const formatters = {
  convertTime: (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
    return parts.join(' ') || '0s';
  },
  formatBytes: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${Math.round(bytes / Math.pow(1024, i), 2)} ${sizes[i]}`;
  },
  formatNumber: (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  getCPUUsage: async () => {
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    const totalUsage = (endUsage.user + endUsage.system) / 1000000;
    return Math.round(totalUsage * 100) / 100;
  }
};
module.exports = {
  name: "stats",
  aliases: ["statistics", "info", "botinfo","bi"],
  category: "Misc",
  permission: "",
  desc: "Get detailed bot statistics and system information",
  dev: false,
  options: {
    owner: false,
    inVc: false,
    sameVc: false,
    player: {
      playing: false,
      active: false,
    },
    premium: false,
    vote: false,
  },

  run: async ({ client, message }) => {
    try {
      const createEmbed = (title, description, fields = []) => {
        const embed = new EmbedBuilder()
          .setColor(client.config.color)
          .setAuthor({ 
            name: title, 
            iconURL: message.guild.iconURL({ dynamic: true }) 
          })
          .setDescription(description)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ 
            text: `Requested by ${message.author.tag}`, 
            iconURL: message.author.displayAvatarURL({ dynamic: true }) 
          })
          .setTimestamp();

        if (fields.length) embed.addFields(fields);
        return embed;
      };
      const [totalGuilds, totalUsers, totalChannels] = await Promise.all([
        client.cluster.broadcastEval(c => c.guilds.cache.size)
          .then(res => res.reduce((a, b) => a + b, 0)),
        client.cluster.broadcastEval(c => c.guilds.cache.reduce((a, g) => a + g.memberCount, 0))
          .then(res => res.reduce((a, b) => a + b, 0)),
        client.cluster.broadcastEval(c => c.channels.cache.size)
          .then(res => res.reduce((a, b) => a + b, 0))
      ]);
      const memoryUsage = process.memoryUsage();
      const memoryStats = {
        rss: formatters.formatBytes(memoryUsage.rss),
        heapUsed: formatters.formatBytes(memoryUsage.heapUsed),
        heapTotal: formatters.formatBytes(memoryUsage.heapTotal),
        external: formatters.formatBytes(memoryUsage.external)
      };
      const embed1 = createEmbed(
        "Bot Statistics",
        "Detailed information about the bot's current status and performance.",
        [
          {
            name: "General Stats",
            value: `\`\`\`yaml
Servers    : ${formatters.formatNumber(totalGuilds)}
Users      : ${formatters.formatNumber(totalUsers)}
Channels   : ${formatters.formatNumber(totalChannels)}
Uptime     : ${formatters.convertTime(client.uptime)}
\`\`\``,
            inline: false
          },
          {
            name: "Memory Usage",
            value: `\`\`\`yaml
RSS        : ${memoryStats.rss}
Heap Used  : ${memoryStats.heapUsed}
Heap Total : ${memoryStats.heapTotal}
External   : ${memoryStats.external}
\`\`\``,
            inline: false
          }
        ]
      );
      const embed2 = createEmbed(
        "Shard Information",
        "Detailed information about the current shard and clustering.",
        [
          {
            name: "Shard Details",
            value: `\`\`\`yaml
Shard ID        : ${message.guild.shardId}
Total Shards    : ${client.cluster.info.TOTAL_SHARDS}
Cluster ID      : ${client.cluster.id}
Total Clusters  : ${client.cluster.count}
Guilds in Shard : ${client.guilds.cache.filter(g => g.shardId === message.guild.shardId).size}
\`\`\``,
            inline: false
          },
          {
            name: "Shard Performance",
            value: `\`\`\`yaml
Latency    : ${client.ws.ping}ms
Heap Used  : ${formatters.formatBytes(process.memoryUsage().heapUsed)}
CPU Usage  : ${await formatters.getCPUUsage()}%
\`\`\``,
            inline: false
          }
        ]
      );
      const cpuInfo = os.cpus()[0];
      const embed3 = createEmbed(
        "System Information",
        "Detailed information about the host system.",
        [
          {
            name: "System Details",
            value: `\`\`\`yaml
OS Type     : ${os.type()}
OS Platform : ${os.platform()}
OS Release  : ${os.release()}
OS Arch     : ${os.arch()}
\`\`\``,
            inline: false
          },
          {
            name: "Hardware Details",
            value: `\`\`\`yaml
CPU Model   : ${cpuInfo.model}
CPU Cores   : ${os.cpus().length}
CPU Speed   : ${cpuInfo.speed}MHz
Total RAM   : ${formatters.formatBytes(os.totalmem())}
Free RAM    : ${formatters.formatBytes(os.freemem())}
Load Avg    : ${os.loadavg().map(x => x.toFixed(2)).join(', ')}
\`\`\``,
            inline: false
          }
        ]
      );
    const embed4 = createEmbed(
        "Developers Information",
        `- <:co_owner:1287337208210001921> [**Tejas Shettigar (TEZZ 444)**](https://discord.com/users/900981299022536757)\n- <:co_owner:1287337208210001921> [**Punit**](https://discord.com/users/765841266181144596)\n- <:co_owner:1287337208210001921> [**Rihan (!! BOT !!)**](https://discord.com/users/785708354445508649)\n- <:co_owner:1287337208210001921> [**Mafia**](https://discord.com/users/1220040643766915112)`
      );
      const createButton = (id, label, emoji, disabled = false) =>
        new ButtonBuilder()
          .setCustomId(id)
          .setLabel(label)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled);
      const buttons = [
        createButton("bot_stats", "Bot Stats", true),
        createButton("shard_info", "Shard Info"),
        createButton("system_stats", "System Info"),
        createButton("devs_info","Developers Info")
      ];
      const row = new ActionRowBuilder().addComponents(buttons);
      const msg = await message.channel.send({
        embeds: [embed1],
        components: [row]
      });
      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 180000,
      });
      collector.on("collect", async (interaction) => {
        if(interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "You are not allowed to interact with this button.",
            ephemeral: true
          });
        }
        await interaction.deferUpdate();
        buttons.forEach(button => button.setDisabled(false));
        switch (interaction.customId) {
          case "bot_stats":
            buttons[0].setDisabled(true);
            await interaction.editReply({
              embeds: [embed1],
              components: [new ActionRowBuilder().addComponents(buttons)]
            });
            break;
          case "shard_info":
            buttons[1].setDisabled(true);
            await interaction.editReply({
              embeds: [embed2],
              components: [new ActionRowBuilder().addComponents(buttons)]
            });
            break;
          case "system_stats":
            buttons[2].setDisabled(true);
            await interaction.editReply({
              embeds: [embed3],
              components: [new ActionRowBuilder().addComponents(buttons)]
            });
            break;
          case "devs_info":
            buttons[3].setDisabled(true);
            await interaction.editReply({
              embeds: [embed4],
              components: [new ActionRowBuilder().addComponents(buttons)]
            });
            break;
        }
      });
      collector.on("end", async () => {
        buttons.forEach(button => button.setDisabled(true));
        await msg.edit({
          components: [new ActionRowBuilder().addComponents(buttons)]
        }).catch(() => {});
      });
    } catch (error) {
      console.error("Stats Command Error:", error);
      return message.channel.send({
        content: "An error occurred while fetching the statistics.",
        ephemeral: true
      });
    }
  },
};
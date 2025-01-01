const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const guildSchema = require("../Models/Guild");
module.exports = class BotUtils {
  constructor(client) {
    this.client = client;
  }
  async getPrefix(guildId) {
    let prefix = this.client.config.prefix;
    if (!guildId) return prefix;
    const guild = await guildSchema.findOne({ id: guildId });
    if (guild) prefix = guild.prefix;
    return prefix;
  }

  async setVCStatus(channel, status) {
    let channel1 = this.client.channels.cache.get(channel);
    if (!channel1) return;
    const perms = channel1.permissionsFor(this.client.user);
    if (!perms.has("ManageChannels")) return;
    const pay = { status: status };
    await this.client.rest.put(`/channels/${channel}/voice-status`, {
      body: pay,
    }).catch((e) => {
      console.error(e);
    });
  }
  async removeVCStatus(channel) {
    let channel1 = this.client.channels.cache.get(channel);
    if (!channel1) return;
    const perms = channel1.permissionsFor(this.client.user);
    if (!perms.has("ManageChannels")) return;
    await this.client.rest.put(`/channels/${channel}/voice-status`, {
      body: { status: "" },
    }).catch((e) => {
      console.error(e);
    });
  }
  async massDM(client) {
    try {
      const channel = client.channels.cache.get("1229366361826918405");
      if (!channel) throw new Error("Channel not found");

      const confirmMsg = await channel.send({
        content:
          "⚠️ Are you sure you want to send this announcement to all users? Type 'yes' to confirm.",
      });
      const filter = (m) => m.content.toLowerCase() === "yes";
      const collected = await channel
        .awaitMessages({
          filter,
          max: 1,
          time: 30000,
          errors: ["time"],
        })
        .catch(() => null);

      if (!collected) {
        return channel.send("Mass DM cancelled - timed out.");
      }

      await channel.send("✅ Starting mass DM process...");

      const totalMembers = await client.cluster
        .broadcastEval(async (c) => {
          let total = 0;
          for (const guild of c.guilds.cache.values()) {
            try {
              await guild.members.fetch();
              total += guild.members.cache.filter((m) => !m.user.bot).size;
            } catch {
              continue;
            }
          }
          return total;
        })
        .then((results) => results.reduce((acc, val) => acc + val, 0));

      const embedData = {
        author: {
          name: "Avon Music",
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        },
        title: "🎉 Avon has been Updated to V3!",
        description: `We're excited to announce that Avon has been updated to Version 3!\n\nThank you for being part of our journey!\nCurrently serving **${totalMembers.toLocaleString()}** users across all servers.`,
        fields: [
          {
            name: "🆕 What's New?",
            value:
              "• Enhanced Performance\n• Improved Stability\n• Better Audio Quality\n• New Features & Commands\n• Bug Fixes",
          },
          {
            name: "🔗 Quick Links",
            value:
              "• [Click Here To Know More](https://discord.gg/S5zmG2RtJ3)\n• [Vote for Avon](https://top.gg/bot/904317141866647592/vote)\n• [Invite Avon](https://discord.com/oauth2/authorize?client_id=904317141866647592&permissions=8&scope=bot%20applications.commands)",
          },
        ],
        color: 0x2f3136,
        timestamp: new Date(),
        footer: {
          text: `You received this message because you\'re Avon Music's fav user`,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        },
      };

      const rowData = {
        type: 1,
        components: [
          {
            type: 2,
            label: "Vote Me",
            style: 5,
            emoji: { id: "1286959566323449896" },
            url: client.config.vote,
          },
          {
            type: 2,
            label: "Freemium",
            style: 5,
            emoji: { id: "1287336628066586665" },
            url: client.config.vote,
          },
        ],
      };

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;
      let progressMessage = await channel.send("Initializing mass DM...");
      let isRunning = true;
      const updateProgress = async () => {
        if (!isRunning) return;
        try {
          await progressMessage.edit({
            content:
              `Progress Update (${new Date().toLocaleTimeString()}):` +
              `\n✅ Success: ${successCount}` +
              `\n❌ Failed: ${failCount}` +
              `\n⏭️ Skipped: ${skippedCount}` +
              `\n📊 Total Processed: ${
                successCount + failCount + skippedCount
              }`,
          });
        } catch (err) {
          console.error("Error updating progress:", err);
        }
      };
      const progressInterval = setInterval(updateProgress, 4000);
      try {
        const results = await client.cluster.broadcastEval(
          async (c, { embedData, rowData }) => {
            const { EmbedBuilder, ActionRowBuilder } = require("discord.js");
            const success = [];
            const failed = [];
            const skipped = [];
            const embed = new EmbedBuilder(embedData);
            const row = new ActionRowBuilder(rowData);

            for (const guild of c.guilds.cache.values()) {
              try {
                await guild.members.fetch();
                const members = guild.members.cache.filter((m) => !m.user.bot);

                for (const [_, member] of members) {
                  try {
                    const dmChannel = await member.createDM();
                    const messages = await dmChannel.messages.fetch({
                      limit: 5,
                    });

                    const alreadySent = messages.some(
                      (msg) =>
                        msg.author.id === c.user.id &&
                        msg.embeds.length > 0 &&
                        msg.embeds[0].title === embedData.title &&
                        Date.now() - msg.createdTimestamp < 24 * 60 * 60 * 1000
                    );
                    if (alreadySent) {
                      skipped.push(member.id);
                      continue;
                    }

                    await dmChannel.send({
                      embeds: [embed],
                      components: [row],
                    });
                    success.push(member.id);
                    await new Promise((resolve) => setTimeout(resolve, 100));
                  } catch {
                    failed.push(member.id);
                  }
                }
              } catch (err) {
                console.error(`Error processing guild ${guild.id}:`, err);
                continue;
              }
            }
            return {
              success: success.length,
              failed: failed.length,
              skipped: skipped.length,
            };
          },
          { context: { embedData, rowData } }
        );
        results.forEach((result) => {
          if (result) {
            successCount += result.success;
            failCount += result.failed;
            skippedCount += result.skipped;
          }
        });
      } finally {
        isRunning = false;
        clearInterval(progressInterval);
      }
      await updateProgress();
      return channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Mass DM Completed")
            .setDescription(
              `✅ Successfully sent: ${successCount}\n` +
                `❌ Failed: ${failCount}\n` +
                `⏭️ Skipped (already sent): ${skippedCount}\n\n` +
                `📊 Total attempted: ${
                  successCount + failCount + skippedCount
                }\n` +
                `⏱️ Completed at: ${new Date().toLocaleTimeString()}`
            )
            .setColor(successCount > failCount ? "Green" : "Red")
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error("Error in mass DM:", error);
      return channel.send(`❌ Error: ${error.message}`);
    }
  }

  async getGuildTextChannel(message, args) {
    let channel;
    if (message.mentions.channels.first()) {
      channel = message.mentions.channels.first();
    } else if (args && args.length !== undefined) {
      let arg = args
        .map((x) => {
          if (!isNaN(x)) return x;
        })
        .filter((x) => {
          if (x !== undefined || x !== null) return x;
        });
      if (!arg.length || !arg[0]) return undefined;
      arg = arg[0];
      channel = message.guild.channels.cache.get(arg);

      if (!channel) {
        channel = await message.guild.channels.fetch(arg).catch((e) => {
          return undefined;
        });
      }
    } else channel = undefined;
    if (channel !== undefined && channel.type === 0) channel = channel;
    return channel;
  }
  async getGuildMember(message, args) {
    let member;

    if (message.type === 19) {
      let members = message.mentions.members
        .filter((x) => x !== message.guild.members.me)
        .map((x) => x);
      if (members.length !== 0) {
        if (members.length === 1) member = members[0];
        else member = members[1];
      } else {
        if (args.length) {
          let arg = args
            .map((x) => {
              if (!isNaN(x)) return x;
            })
            .filter((x) => {
              if (x !== undefined || x !== null) return x;
            });
          if (!arg.length || !arg[0]) return undefined;
          arg = arg[0];
          member = message.guild.members.cache.get(arg);
          if (!member) {
            member = await message.guild.members.fetch(arg).catch((e) => {
              return undefined;
            });
          }
        }
      }
    } else {
      if (
        message.mentions.members
          .filter((x) => x !== message.guild.members.me)
          .first()
      ) {
        member = message.mentions.members
          .filter((x) => x !== message.guild.members.me)
          .first();
      } else {
        let arg = args
          .map((x) => {
            if (!isNaN(x)) return x;
          })
          .filter((x) => {
            if (x !== undefined || x !== null) return x;
          });
        if (!arg.length || !arg[0]) return undefined;
        arg = arg[0];
        member = message.guild.members.cache.get(arg);
        if (!member) {
          member = await message.guild.members.fetch(arg).catch(() => {
            return undefined;
          });
        }
      }
    }

    return member;
  }
  async getGuildRole(message, args) {
    let role;
    if (message.type === 19) {
      let roles = message.mentions.roles.map((x) => x);
      if (roles.length !== 0) {
        if (roles.length === 1) role = roles[0];
        else role = roles[1];
      } else {
        if (args.length) {
          let arg = args
            .map((x) => {
              if (!isNaN(x)) return x;
            })
            .filter((x) => {
              if (x !== undefined || x !== null) return x;
            });
          if (!arg.length || !arg[0]) return undefined;
          arg = arg[0];
          role = message.guild.roles.cache.get(arg);
          if (!role) {
            role = await message.guild.roles.fetch(arg).catch((e) => {
              return undefined;
            });
          }
        }
      }
    } else {
      if (message.mentions.roles.first()) {
        role = message.mentions.roles.first();
      } else {
        let arg = args
          .map((x) => {
            if (!isNaN(x)) return x;
          })
          .filter((x) => {
            if (x !== undefined || x !== null) return x;
          });
        if (!arg.length || !arg[0]) return undefined;
        arg = arg[0];
        role = message.guild.roles.cache.get(arg);
        if (!role) {
          role = await message.guild.roles.fetch(arg).catch((e) => {
            return undefined;
          });
        }
      }
    }
    return role;
  }
  async getUser(message, args) {
    let user;
    if (message.type === 19) {
      let users = message.mentions.users.map((x) => x);
      if (users.length !== 0) {
        if (users.length === 1) user = users[0];
        else user = users[1];
      } else {
        if (args.length) {
          if (isNaN(args[0]) && args.length === 1) {
            user = message.author;
          } else {
            let arg = args
              .map((x) => {
                if (!isNaN(x)) return x;
              })
              .filter((x) => {
                if (x !== undefined || x !== null) return x;
              });
            if (!arg.length || !arg[0]) return undefined;
            arg = arg[0];
            user = this.client.users.cache.get(arg);
            if (!user) {
              user = await this.client.users.fetch(arg).catch((e) => {
                return undefined;
              });
            }
          }
        } else user = message.author;
      }
    } else {
      if (
        message.mentions.users.filter((x) => x !== this.client.user).first()
      ) {
        user = message.mentions.users
          .filter((x) => x !== this.client.user)
          .first();
      } else {
        if (args.length) {
          if (args.length === 1 && isNaN(args[0])) {
            user = message.author;
          } else {
            let arg = args
              .map((x) => {
                if (!isNaN(x)) return x;
              })
              .filter((x) => {
                if (x !== undefined || x !== null) return x;
              });
            if (!arg.length || !arg[0]) return undefined;
            arg = arg[0];
            user = this.client.users.cache.get(arg);
            if (!user) {
              user = await this.client.users.fetch(arg).catch((e) => {
                return undefined;
              });
            }
          }
        } else {
          user = message.author;
        }
      }
    }

    return user;
  }
  async rec(trackUrl) {
    const track = await this.client.spotipro.getRecommendations(trackUrl);
    return track;
  }
  async AvonAutoplay(player, url) {
    try {
      const track = player.data.get("autoplayTrack");
      if (!track) player.data.set("autoplayTrack", null);
      const yt = `https://www.youtube.com/watch?v=${track.identifier}&list=RD${track.identifier}`;
      if (track.uri.includes("open.spotify.com")) {
        const tezz = await this.client.spotify.getRecommendations(url);
        const res = await this.client.kazagumo.search(tezz, {
          requester: this.client.user,
        });
        const result = res.tracks[0];
        if (result) {
          await player.queue.add(result);
          if (!player.playing) player.play();
          player.data.set("autoplayTrack", result);
        }
      } else if (
        track.uri.includes("youtube.com") ||
        track.uri.includes("youtu.be")
      ) {
        const res = await this.client.kazagumo.search(yt, {
          requester: this.client.user,
        });
        if (res) {
          await player.queue.add(
            res.tracks[
              Math.floor(Math.random() * Math.floor(res.tracks.length))
            ]
          );
          if (!player.playing) player.play();
          player.data.set("autoplayTrack", res);
        }
      } else {
        const res = await this.client.kazagumo.search(track.author, {
          requester: this.client.user,
        });
        if (res) {
          await player.queue.add(
            res.tracks[
              Math.floor(Math.random() * Math.floor(res.tracks.length))
            ]
          );
          if (!player.playing) player.play();
          player.data.set("autoplayTrack", res);
        }
      }
    } catch (e) {
      this.console.error(e);
    }
  }
  async convertTime(duration) {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    if (hours <= 0) {
      return `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
    }
    if (hours > 0) {
      return `${hours}hr ${minutes < 10 ? "0" : ""}${minutes}m ${
        seconds < 10 ? "0" : ""
      }${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
    }
    return `${hours}hr ${minutes < 10 ? "0" : ""}${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
  }
  hasHigherRoles(member1, member2) {
    if (member1?.roles?.highest?.position > member2?.roles?.highest?.position) {
      return true;
    } else return false;
  }
  async handleAction({ message, member, action, args }) {
    if (!["ban", "kick", "mute", "unmute", "unban"].includes(action)) {
      throw new Error("Action Undefined or Unknown.");
    }

    let msg = await message.channel.send({
      content: `Are you Sure You want to Perfom this Action ?`,
      components: [
        new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setLabel("Yes")
            .setCustomId("confirm")
            .setStyle(3),
          new ButtonBuilder().setStyle(4).setLabel("No").setCustomId("decline"),
        ]),
      ],
    });

    let collector = msg.createMessageComponentCollector({
      filter: (b) => {
        if (b.user.id === message.author.id) return true;
        else {
          return b.reply({
            content: `Only ${message.author} can Perform this Action`,
            ephemeral: true,
          });
        }
      },
      time: 1000000 * 7,
      idle: (1000000 * 7) / 2,
    });
    if (message.author.id == this.client.id) {
      message.author.globalName = message.author.username;
    }

    collector.on("collect", async (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId === "confirm") {
          let reason;
          switch (action) {
            case "ban":
              reason = args[1] ? args.slice(1).join(" ") : "No Reason Provided";
              await member
                .ban({
                  reason: `${
                    message.author.globalName
                      ? message.author.globalName
                      : message.author.username
                  } | ${reason}`,
                })
                .then(async (user) => {
                  await user
                    .send({
                      content: `${this.client.emoji.moderation} You have ben **Banned** From: ${message.guild.name}\n${this.client.emoji.reason} Reason: ${reason}`,
                    })
                    .then(() => {
                      return interaction.update({
                        content: ``,
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${this.client.emoji.moderation} Member Banned: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.tick} Successful DMs`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        components: [],
                      });
                    })
                    .catch((err) => {
                      return interaction.update({
                        content: ``,
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${this.client.emoji.moderation} Member Banned: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.cross} Unsuccessful DMs`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        components: [],
                      });
                    });
                })
                .catch((e) => {
                  return interaction.update({
                    content: ``,
                    embeds: [
                      new EmbedBuilder()
                        .setColor(this.client.config.color)
                        .setTitle(`Action Cancelled 🚫`)
                        .setDescription(
                          `${this.client.emoji.warn} Couldn't Ban That Member Kindly Check my Role Poistion and Permissions.`
                        ),
                    ],
                    components: [],
                  });
                });
              break;
            case "kick":
              reason = args[1] ? args.slice(1).join(" ") : "No Reason Provided";
              await member
                .kick(
                  `${
                    message.author.globalName
                      ? message.author.globalName
                      : message.author.username
                  } | ${reason}`
                )
                .then(async (user) => {
                  await user
                    .send({
                      content: `${this.client.emoji.moderation} You have been **Kicked** From: ${message.guild.name}/n${this.client.emoji.reason} Reason: ${reason}`,
                    })
                    .then(() => {
                      return interaction.update({
                        content: ``,
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${this.client.emoji.moderation} Member Kicked: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.tick} Successful DMs`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        components: [],
                      });
                    })
                    .catch((err) => {
                      return interaction.update({
                        content: ``,
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${this.client.emoji.moderation} Member Kicked: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.cross} Unsuccessful DMs`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        components: [],
                      });
                    });
                })
                .catch((er) => {
                  return interaction.update({
                    content: ``,
                    components: [],
                    embeds: [
                      new EmbedBuilder()
                        .setColor(this.client.config.color)
                        .setTitle(`Action Cancelled 🚫`)
                        .setDescription(
                          `${this.client.emoji.warn} Couldn't Kick That Member Kindly Check my Role Poistion and Permissions.`
                        ),
                    ],
                  });
                });
              break;
            case "mute":
              let dur = args[1];
              let time = dur ? ms(dur) : ms("1 month");

              reason = dur
                ? args[2]
                  ? args.slice(2).join(" ")
                  : "No Reason Provided"
                : args[1]
                ? args.slice(1).join(" ")
                : "No Reason Provided";
              await member
                .timeout(
                  time,
                  `${
                    message.author.globalName
                      ? message.author.globalName
                      : message.author.username
                  } | ${reason}`
                )
                .then(async (member) => {
                  await member
                    .send({
                      content: `${this.client.emoji.moderation} You have been **Muted** in: ${message.guild.name}\n${this.client.emoji.reason} Reason: ${reason}`,
                    })
                    .then(() => {
                      return interaction.update({
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${this.client.emoji.moderation} Member Muted: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.tick} Successful DMs.`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        content: ``,
                        components: [],
                      });
                    })
                    .catch((err) => {
                      return interaction.update({
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${this.client.emoji.moderation} Member Muted: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.cross} Unsuccessful DMs`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        content: ``,
                        components: [],
                      });
                    });
                })
                .catch((err) => {
                  return interaction.update({
                    content: ``,
                    components: [],
                    embeds: [
                      new EmbedBuilder()
                        .setColor(this.client.config.color)
                        .setTitle(`Action Cancelled 🚫`)
                        .setDescription(
                          `${this.client.emoji.warn} Couldn't Mute That Member Kindly Check my Role Poistion and Permissions.`
                        ),
                    ],
                  });
                });
              break;
            case "unmute":
              reason = args[1] ? args.slice(1).join(" ") : "No Reason Provided";
              await member
                .timeout(
                  null,
                  `${
                    message.author.globalName
                      ? message.author.globalName
                      : message.author.username
                  } | ${reason}`
                )
                .then(async (user) => {
                  await user
                    .send({
                      content: `${this.client.emoji.moderation} You have been **Unmuted** in: ${message.guild.name}\n${this.client.emoji.reason} Reason: ${reason}`,
                    })
                    .then(() => {
                      return interaction.update({
                        content: ``,
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${
                                this.client.emoji.moderation
                              } Member Unmuted: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.tick} Successful DMs`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        components: [],
                      });
                    })
                    .catch((err) => {
                      return interaction.update({
                        embeds: [
                          new EmbedBuilder()
                            .setColor(this.client.config.color)
                            .setDescription(
                              `${
                                this.client.emoji.moderation
                              } Member Unmuted: ${
                                member.user.globalName
                                  ? member.user.globalName
                                  : member.user.username
                              }\n${this.client.emoji.warn} Action By: ${
                                message.author.globalName
                                  ? message.author.globalName
                                  : message.author.username
                              }\n${this.client.emoji.reason} Reason: ${
                                reason.length > 200
                                  ? reason.slice(0, 201) + "..."
                                  : reason
                              }\n${this.client.emoji.cross} Unsuccessful DMs`
                            )
                            .setTitle(`Action Taken 🔨`),
                        ],
                        content: ``,
                        components: [],
                      });
                    });
                })
                .catch((err) => {
                  return interaction.update({
                    content: ``,
                    components: [],
                    embeds: [
                      new EmbedBuilder()
                        .setColor(this.client.config.color)
                        .setTitle(`Action Cancelled 🚫`)
                        .setDescription(
                          `${this.client.emoji.warn} Couldn't Unmute That Member Kindly Check my Role Poistion and Permissions.`
                        ),
                    ],
                  });
                });
              break;
            case "unban":
              reason = args[1] ? args.slice(1).join(" ") : "No Reason Provided";

              await message.guild.bans
                .fetch(member)
                .then(async (ban) => {
                  if (ban) {
                    await message.guild.bans
                      .remove(
                        ban.user,
                        `${
                          message.author.globalName
                            ? message.author.globalName
                            : message.author.usename
                        } | ${reason}`
                      )
                      .then(async (user) => {
                        await user
                          .send({
                            content: `${this.client.emoji.moderation} You have been **Unbanned** from: ${message.guild.name}\n${this.client.emoji.reason} Reason: ${reason}`,
                          })
                          .then(() => {
                            return interaction.update({
                              content: ``,
                              embeds: [
                                new EmbedBuilder()
                                  .setColor(this.client.config.color)
                                  .setDescription(
                                    `${
                                      this.client.emoji.moderation
                                    } User Unbanned: ${
                                      member.globalName
                                        ? member.globalName
                                        : member.username
                                    }\n${this.client.emoji.warn} Action By: ${
                                      message.author.globalName
                                        ? message.author.globalName
                                        : message.author.username
                                    }\n${this.client.emoji.reason} Reason: ${
                                      reason.length > 200
                                        ? reason.slice(0, 201) + "..."
                                        : reason
                                    }\n${this.client.emoji.tick} Successful DMs`
                                  )
                                  .setTitle(`Action Taken 🔨`),
                              ],
                              components: [],
                            });
                          })
                          .catch((err) => {
                            return interaction.update({
                              content: ``,
                              embeds: [
                                new EmbedBuilder()
                                  .setColor(this.client.config.color)
                                  .setDescription(
                                    `${
                                      this.client.emoji.moderation
                                    } User Unbanned: ${
                                      member.globalName
                                        ? member.globalName
                                        : member.username
                                    }\n${this.client.emoji.warn} Action By: ${
                                      message.author.globalName
                                        ? message.author.globalName
                                        : message.author.username
                                    }\n${this.client.emoji.reason} Reason: ${
                                      reason.length > 200
                                        ? reason.slice(0, 201) + "..."
                                        : reason
                                    }\n${
                                      this.client.emoji.cross
                                    } Unsuccessful DMs`
                                  )
                                  .setTitle(`Action Taken 🔨`),
                              ],
                              components: [],
                            });
                          });
                      })
                      .catch((err) => {
                        return interaction.update({
                          embeds: [
                            new EmbedBuilder()
                              .setColor(this.client.config.color)
                              .setDescription(
                                `${this.client.emoji.cross} Couldn't Perform this Action. Please check my Permissions.`
                              )
                              .setTitle(`Action Unsuccessful 🚫`),
                          ],
                          content: ``,
                          components: [],
                        });
                      });
                  } else {
                    return interaction.update({
                      embeds: [
                        new EmbedBuilder()
                          .setColor(this.client.config.color)
                          .setDescription(
                            `${this.client.emoji.moderation} User not Found in the Ban List.`
                          )
                          .setTitle(`Action Denied 🚫`),
                      ],
                      content: ``,
                      components: [],
                    });
                  }
                })
                .catch((err) => {
                  return interaction.update({
                    embeds: [
                      new EmbedBuilder()
                        .setColor(this.client.config.color)
                        .setDescription(
                          `${this.client.emoji.moderation} User not Found in the Ban List.`
                        )
                        .setTitle(`Action Denied 🚫`),
                    ],
                    content: ``,
                    components: [],
                  });
                });
          }
        } else if (interaction.customId === "decline") {
          return interaction.update({
            content: ``,
            embeds: [
              new EmbedBuilder()
                .setColor(this.client.config.color)
                .setTitle(`Action Cancelled 🚫: User Cancellation`),
            ],
            components: [],
          });
        }
      }
    });
    collector.on("end", async () => {
      if (collector.collected) return;
      else {
        return await msg
          .edit({
            embeds: [
              new EmbedBuilder()
                .setColor(this.client.config.color)
                .setTitle(`Action Cancelled: Interaction Timed Out`),
            ],
            components: [],
          })
          .catch(() => {});
      }
    });
  }
};

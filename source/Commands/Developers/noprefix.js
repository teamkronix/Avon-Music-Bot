const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const userSchema = require("../../Models/User");
module.exports = {
  name: "noPrefix",
  aliases: ["nop"],
  category: "",
  description: "Add, remove, or list noPrefix users",
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
  run: async ({ client, message, args }) => {
    const tezz = [
      "900981299022536757",
      "765841266181144596",
      "785708354445508649",
      "902363493242650635",
      "1130902310302797827",
      "1112906652568539166",
      "658246604364578817"
    ];
    if (!tezz.includes(message.author.id)) {
      return message.channel
        .send({ content: "You are not authorized to use this command." })
        .then((m) => setTimeout(() => m.delete(), 5000));
    }

    const sub = args[0]?.toLowerCase();
    if (!sub || !["add", "remove", "list", "view", "show"].includes(sub)) {
      return message.channel.send({
        content: "Usage: noPrefix <add|remove|list> [@user|userId]",
      });
    }

    const getUser = async () => {
      const ok =
        message.mentions.users.first() ||
        client.users.cache.get(args[1]) ||
        (await client.users.fetch(args[1]).catch(() => null));
      if (!ok) {
        return client.cluster
          .broadcastEval(`this.users.cache.get('${args[1]}')`)
          .then((res) => res.find(Boolean));
      }
      return ok;
    };

    if (["add", "remove"].includes(sub)) {
      const user = await getUser();
      if (!user) {
        return message.channel.send({
          content: "Please mention a valid user or provide a valid user ID.",
        });
      }
      let userData = await userSchema.findOne({ id: user.id });
      if (!userData) {
        userData = new userSchema({ id: user.id, noPrefix: false });
      }

      if (sub === "add") {
        if (userData.noPrefix) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: `No Prefix`,
              iconURL: user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
              `**${
                user.globalName ? user.globalName : user.username
              }** is already in the Global No Prefix List`
            )
            .setColor("Red")
            .setFooter({
              text: `Actioned by ${
                message.author.globalName || message.author.username
              }`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();
          return message.channel.send({ embeds: [embed] });
        }
        userData.noPrefix = true;
        await userData.save();
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `No Prefix`,
            iconURL: user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `**${
              user.globalName ? user.globalName : user.username
            }** has been added to the Global No Prefix List`
          )
          .setColor(client.config.color)
          .setFooter({
            text: `Actioned by ${
              message.author.globalName || message.author.username
            }`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();
        return message.channel.send({ embeds: [embed] });
      } else if (sub === "remove") {
        if (!userData.noPrefix) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: `No Prefix`,
              iconURL: user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
              `**${
                user.globalName ? user.globalName : user.username
              }** is not in the Global No Prefix List`
            )
            .setColor("Red")
            .setFooter({
              text: `Actioned by ${
                message.author.globalName || message.author.username
              }`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();
          return message.channel.send({ embeds: [embed] });
        }
        userData.noPrefix = false;
        await userData.save();
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `No Prefix`,
            iconURL: user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `**${
              user.globalName ? user.globalName : user.username
            }** has been removed from the Global No Prefix List`
          )
          .setColor("Red")
          .setFooter({
            text: `Actioned by ${
              message.author.globalName || message.author.username
            }`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();
        return message.channel.send({ embeds: [embed] });
      }
    }
    if (sub === "list" || sub === "view" || sub === "show") {
      const noPrefixUsers = await userSchema.find({ noPrefix: true });
      if (!noPrefixUsers.length) {
        return message.reply({
          content: "No users currently have No Prefix privileges.",
          ephemeral: true,
        });
      }
      const pageSize = 10;
      const totalPages = Math.ceil(noPrefixUsers.length / pageSize);
      const hmm = async (page) => {
        const start = (page - 1) * pageSize;
        const end = page * pageSize;
        const usersInDb = noPrefixUsers.slice(start, end);
        const users = await Promise.all(
          usersInDb.map(async (userData) => {
            const user = await client.users.fetch(userData.id).catch(() => null);
            if (!user) return `Unknown User (${userData.id})`;
            return `**${user.globalName || user.username}** (${user.id})`;
          })
        );

        return new EmbedBuilder()
          .setAuthor({
            name: "No Prefix Users",
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            users.map((u, i) => `**${start + i + 1}.** ${u}`).join("\n")
          )
          .setColor(client.config.color)
          .setFooter({
            text: `Page ${page}/${totalPages} • Total Users: ${noPrefixUsers.length}`,
          })
          .setTimestamp();
      };

      const omk = async (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("no_previous")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
          new ButtonBuilder()
            .setCustomId("no_next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages)
        );
      };

      let currentPage = 1;
      const em = await hmm(currentPage);
      const bu = await omk(currentPage);
      const reply = await message.reply({ embeds: [em], components: [bu] });
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: (i) => i.user.id === message.author.id,
      });
      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id)
          return interaction.reply({
            content: "You are not allowed to interact with this button.",
            ephemeral: true,
          });

        if (interaction.customId === "no_previous") {
          currentPage = Math.max(1, currentPage - 1);
        } else if (interaction.customId === "no_next") {
          currentPage = Math.min(totalPages, currentPage + 1);
        }
        const newEmbed = await hmm(currentPage);
        const newButtons = await omk(currentPage);
        await interaction.update({
          embeds: [newEmbed],
          components: [newButtons],
        });
      });
      collector.on("end", () => {
        reply.edit({ components: [] });
      });
    }
  },/** 

@code Fucked by manas 
@for support join https://discord.gg/coderz
@this code is licensed give credits to me before using
@enjoy the skidded and chatgpt. Dumped bit code

**/
};
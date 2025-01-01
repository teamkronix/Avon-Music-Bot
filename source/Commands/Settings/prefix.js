const guildSchema = require("../../Models/Guild");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "prefix",
  aliases: ["setprefix"],
  category: "Settings",
  permission: "ManageGuild",
  dev: false,
  desc: "Change the Prefix of the Bot in the Server",
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
    try {
      let guildData = await guildSchema.findOne({ id: message.guild.id });
      if (!guildData) {
        guildData = await guildSchema.findOneAndUpdate(
          { id: message.guild.id },
          { $setOnInsert: { id: message.guild.id, prefix: "+" } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      guildData = await guildSchema.findOne({ id: message.guild.id });
      let oldPrefix = guildData.prefix;
      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setAuthor({
            name: `${message.guild.name} Prefix Settings`,
            iconURL: message.guild.iconURL(),
          })
          .setDescription(`- **Server Prefix**: \`${guildData.prefix}\``);

        return await client.message.send(message, { embeds: [embed] });
      }
      await guildSchema.findOneAndUpdate(
        { id: message.guild.id },
        { $set: { prefix: args[0] } },
        { new: true }
      );
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setAuthor({
          name: `${message.guild.name} Prefix Settings`,
          iconURL: message.guild.iconURL(),
        })
        .setDescription(
          `- **Prefix Changed** from \`${oldPrefix}\` to \`${args[0]}\``
        )
        .setFooter({
          text: `Updated by ${message.author.username}`,
          iconURL: message.author.avatarURL(),
        })
        .setTimestamp();

      return await client.message.send(message, { embeds: [embed] });
    } catch (error) {
      console.error("Error updating prefix: ", error);
      return await client.message.send(message, {
        content: "An error occurred while executing this command",
      });
    }
  },
};

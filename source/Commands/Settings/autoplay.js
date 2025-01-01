const guildSchema = require("../../Models/Guild");
const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "autoplay",
  aliases: ["auto-play","ap"],
  category: "Settings",
  permission: "ManageGuild",
  desc: "Toggle the Autoplay Feature",
  dev: false,
  options: {
    owner: false,
    inVc: true,
    sameVc: true,
    player: {
      playing: false,
      active: false,
    },
    premium: false,
    vote: true,
  },

  run: async ({ client, message, args }) => {
    try {
      let guildData = await guildSchema.findOne({ id: message.guild.id });
      if (!guildData) {
        await guildSchema.findOneAndUpdate(
          { id: message.guild.id },
          { $setOnInsert: { id: message.guild.id, prefix: "+" } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      guildData = await guildSchema.findOne({ id: message.guild.id });
      let old = guildData.settings.autoplay;
      await guildSchema.findOneAndUpdate(
        { id: message.guild.id },
        { $set: { "settings.autoplay": !old } },
        { new: true }
      );
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setAuthor({
          name: `${message.guild.name} Autoplay Settings`,
          iconURL: message.guild.iconURL(),
        })
        .setDescription(`- **Autoplay** \`${old ? "Disabled" : "Enabled"}\``);
      const payload = {
        embeds: [embed],
      };
      return await client.message.send(message, payload);
    } catch (e) {
      console.log(e);
    }
  },
};

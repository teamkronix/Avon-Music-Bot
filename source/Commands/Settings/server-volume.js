const guildSchema = require("../../Models/Guild");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "server-volume",
  aliases: ["volume", "svolume"],
  category: "Settings",
  permission: "",
  desc: "Change the Volume of the Bot in the Server",
  dev: false,
  options: {
    owner: false,
    inVc: true,
    sameVc: true,
    player: {
      playing: false,
      active: true,
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
          { $setOnInsert: { id: message.guild.id, prefix: "+", "settings.volume": 100 } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      guildData = await guildSchema.findOne({ id: message.guild.id });
      let oldVolume = guildData.settings.volume;
      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setAuthor({
            name: `${message.guild.name} Volume Settings`,
            iconURL: message.guild.iconURL(),
          })
          .setDescription(`- **Server Volume**: \`${guildData.settings.volume}\``);
        
        return await message.channel.send({ embeds: [embed] });
      }
      if (isNaN(args[0])) {
        return await message.channel.send({
          content: "Please provide a valid number for the volume.",
        });
      }
      const volume = parseInt(args[0]);
      if (volume > 200 || volume < 20) {
        return await message.channel.send({
          content: "Volume should be between **20** and **200**.",
        });
      }
      await guildSchema.findOneAndUpdate(
        { id: message.guild.id },
        { $set: { "settings.volume": volume } },
        { new: true }
      );
      let player = client.kazagumo.players.get(message.guild.id);
      if (player) {
        player.setVolume(volume);
      }
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setAuthor({
          name: `${message.guild.name} Volume Settings`,
          iconURL: message.guild.iconURL(),
        })
        .setDescription(`- **Volume Changed** from \`${oldVolume}\` to \`${volume}\``)
        .setFooter({
          text: `Updated by ${message.author.username}`,
          iconURL: message.author.avatarURL(),
        });
      return await message.channel.send({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      return message.channel.send({
        content: "An error occurred while updating the volume.",
      });
    }
  },
};

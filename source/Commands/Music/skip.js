const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "skip",
  aliases: ["s", "next"],
  category: "Music",
  desc: "Skips the Music!",
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
    vote: false,
  },

  run: async ({ client, message, args }) => {
    try {
      if (!message.member.voice.channel) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `You need to be in a voice channel to use this command`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(client.config.color);
        return message.channel
          .send({
            embeds: [embed],
          })
          .then((x) => {
            setTimeout(() => x.delete(), 5000);
          });
      }
      client.music.Skip(message);
    } catch (e) {
      console.log(e);
    }
  },
};

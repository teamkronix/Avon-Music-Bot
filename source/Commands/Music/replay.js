const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "replay",
  aliases: ["wapis"],
  category: "Music",
  desc: "Replay the Music!",dev: false,
  options: {
    owner: false,
    inVc: true,
    sameVc: true,
    player: {
      playing: true,
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
      let player = client.kazagumo.players.get(message.guild.id);
      if (!player) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `I'm not connected to any voice channel`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(client.config.color);
        return message.channel
          .send({ embeds: [embed] })
          .then((x) => setTimeout(() => x.delete(), 5000));
      }
      if (!player.queue.current) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `There is no song playing`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(client.config.color);
        return message.channel
          .send({ embeds: [embed] })
          .then((x) => setTimeout(() => x.delete(), 5000));
      }
      player.seek(0);
    } catch (e) {
      console.log(e);
    }
  },
};

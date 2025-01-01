/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "clear",
  aliases: ["clearqueue", "cq"],
  category: "Music",
  desc: "Clear the Queue!",dev: false,
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
      let player = await client.kazagumo.players.get(message.guild.id);
      player.queue.clear();
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `Queue Cleared by ${message.author.globalName}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(client.config.color);
      return message.channel.send({
        embeds: [embed],
      });
    } catch (e) {
      console.log(e);
    }
  },
};

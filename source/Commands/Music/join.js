/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "join",
  aliases: ["j", "connect"],
  category: "Music",
  desc: "Avon joins the voice channel",dev: false,
  options: {
    owner: false,
    inVc: true,
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
      const voiceChannel = message.member.voice.channel;
      let player = await client.kazagumo.players.get(message.guild.id) || await client.music.CreateAvonPlayer(message);
      if (!player) {
        player = client.music.CreateAvonPlayer(message);
      } else {
        await message.guild.members.me.voice.setChannel(voiceChannel.id);
        await player.setVoiceChannel(voiceChannel.id);
      }
      return await message.channel.send(
        `**I have Joined <#${voiceChannel.id}>**`
      );
    } catch (e) {
      console.log(e);
    }
  },
};

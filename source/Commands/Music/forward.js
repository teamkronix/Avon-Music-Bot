/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
module.exports = {
  name: "forward",
  aliases: ["fwd"],
  category: "Music",
  desc: "Forward the song by a custom time or +10 seconds by default",dev: false,
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
            name: `You need to be in a voice channel to use this command.`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(client.config.color);
        return message.channel
          .send({ embeds: [embed] })
          .then((x) => setTimeout(() => x.delete(), 5000));
      }
      let player = client.kazagumo.players.get(message.guild.id);
      if (!player || !player.queue.current) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription("There is no song currently playing.")
              .setColor("Red"),
          ],
        });
      }
      let currentPosition = player.position;
      let songDuration = player.queue.current.length;
      let forwardTime = args[0] ? parseTime(args[0]) : 10000;
      if (isNaN(forwardTime)) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                "Please provide a valid time in seconds or `mm:ss` format."
              )
              .setColor("Red"),
          ],
        });
      }
      let newPosition = currentPosition + forwardTime;
      if (newPosition >= songDuration) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription("You can't forward beyond the song's duration.")
              .setColor("Red"),
          ],
        });
      }
      player.seek(newPosition);
      const formattedPosition = formatTime(newPosition);
      const embed = new EmbedBuilder()
        .setDescription(`Forwarded to **${formattedPosition}**`)
        .setColor(client.config.color);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("fwd_10s").setLabel("+10s").setStyle(2),
        new ButtonBuilder().setCustomId("fwd_30s").setLabel("+30s").setStyle(1),
        new ButtonBuilder().setCustomId("fwd_1m").setLabel("+1min").setStyle(1)
      );
      const msg = await message.channel.send({
        embeds: [embed],
        components: [row],
      });
      const collector = msg.createMessageComponentCollector({ time: 15000 });
      collector.on("collect", async (i) => {
        if (i.user.id !== message.author.id) {
          return i.reply({
            content: "This is not your command!",
            ephemeral: true,
          });
        }
        let increment = 0;
        if (i.customId === "fwd_10s") increment = 10000;
        if (i.customId === "fwd_30s") increment = 30000;
        if (i.customId === "fwd_1m") increment = 60000;
        const newFwdPosition = player.position + increment;
        if (newFwdPosition >= songDuration) {
          return i.update({
            content: "You can't forward beyond the song's duration.",
            components: [],
          });
        }
        player.seek(newFwdPosition);
        await i.update({
          content: `Forwarded +${increment / 1000} seconds to **${formatTime(
            newFwdPosition
          )}**`,
          components: [],
        });
      });
      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          msg.edit({ content: "Forward interaction closed.", components: [] });
        }
      });
    } catch (e) {
      console.error(e);
      return message.channel.send({
        content: "An error occurred while executing this command.",
      });
    }
  },
};
function parseTime(input) {
  if (!isNaN(input)) {
    return parseInt(input) * 1000;
  }
  const timePattern = /^(\d+):(\d+)$/;
  const match = input.match(timePattern);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    return (minutes * 60 + seconds) * 1000;
  }
  return NaN;
}
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

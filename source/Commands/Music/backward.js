/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
module.exports = {
  name: "backward",
  aliases: ["rewind", "bw"],
  category: "Music",
  desc: "Rewind the song by a custom time or -10 seconds by default",dev: false,
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
      let backwardTime = args[0] ? parseTime(args[0]) : 10000;
      if (isNaN(backwardTime)) {
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
      let newPosition = currentPosition - backwardTime;
      if (newPosition < 0) {
        newPosition = 0;
      }
      player.seek(newPosition);
      const formattedPosition = formatTime(newPosition);
      const embed = new EmbedBuilder()
        .setDescription(`Rewinded to **${formattedPosition}**`)
        .setColor(client.config.color);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("bw_10s").setLabel("-10s").setStyle(1),
        new ButtonBuilder().setCustomId("bw_30s").setLabel("-30s").setStyle(1),
        new ButtonBuilder().setCustomId("bw_1m").setLabel("-1min").setStyle(1)
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
        let decrement = 0;
        if (i.customId === "bw_10s") decrement = 10000;
        if (i.customId === "bw_30s") decrement = 30000;
        if (i.customId === "bw_1m") decrement = 60000;
        const newBwPosition = player.position - decrement;
        if (newBwPosition < 0) {
          player.seek(0);
          return i.update({
            content: "Rewinded to the start of the song (0:00).",
            components: [],
          });
        }
        player.seek(newBwPosition);
        await i.update({
          content: `Rewinded -${decrement / 1000} seconds to **${formatTime(
            newBwPosition
          )}**`,
          components: [],
        });
      });
      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          msg.edit({ content: "Rewind interaction closed.", components: [] });
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

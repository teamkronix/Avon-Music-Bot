const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
module.exports = {
  name: "loop",
  aliases: ["repeat"],
  category: "Music",
  desc: "Loop the Queue, track or off!",dev: false,
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
      const { member, guild, author, channel } = message;
      if (!member.voice.channel) {
        return sendEmbed(channel, `You need to be in a voice channel to use this command`, client.config.color);
      }
      const player = client.kazagumo.players.get(guild.id);
      if (!player || !player.queue.current) {
        return sendEmbed(channel, `There is no song playing right now`, client.config.color);
      }
      const userChoice = args[0] ? args[0].toLowerCase() : null;
      if (["song", "track"].includes(userChoice)) {
        player.setLoop("track");
        return sendEmbed(channel, `Looping the current **song**`, client.config.color);
      }
      if (userChoice === "queue") {
        player.setLoop("queue");
        return sendEmbed(channel, `Looping the **queue**`, client.config.color);
      }
      if (["off", "disable"].includes(userChoice)) {
        player.setLoop("none");
        return sendEmbed(channel, `Looping **disabled**`, client.config.color);
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("loop_song")
          .setLabel("Song")
          .setStyle(player.loop === "track" ? "Primary" : "Secondary")
          .setDisabled(player.loop === "track"),
        new ButtonBuilder()
          .setCustomId("loop_queue")
          .setLabel("Queue")
          .setStyle(player.loop === "queue" ? "Primary" : "Secondary")
          .setDisabled(player.loop === "queue"),
        new ButtonBuilder()
          .setCustomId("loop_off")
          .setLabel("Disable")
          .setStyle(player.loop === "none" ? "Danger" : "Secondary")
          .setDisabled(player.loop === "none")
      );
      const loopMessage = await channel.send({
        content: "Please select the loop mode:",
        components: [row],
      });
      const collector = loopMessage.createMessageComponentCollector({
        time: 15000,
        filter: (interaction) => interaction.user.id === author.id,
      });
      collector.on("collect", async (interaction) => {
        if (interaction.customId === "loop_song") {
          player.setLoop("track");
          await interaction.update({ content: "Looping the **current song**", components: [] });
        } else if (interaction.customId === "loop_queue") {
          player.setLoop("queue");
          await interaction.update({ content: "Looping the **queue**", components: [] });
        } else if (interaction.customId === "loop_off") {
          player.setLoop("none");
          await interaction.update({ content: "**Looping disabled**", components: [] });
        }
      });
      collector.on("end", (_, reason) => {
        if (reason === "time") {
          loopMessage.edit({ content: "Loop selection **timed out**", components: [] });
        }
      });
    } catch (error) {
      console.error(error);
      return sendEmbed(message.channel, "An error occurred while processing the command.", "Red");
    }
  },
};
async function sendEmbed(channel, content, color) {
  const embed = new EmbedBuilder().setDescription(content).setColor(color);
  return await channel.send({ embeds: [embed] }).then((msg) => setTimeout(() => msg.delete(), 5000));
}

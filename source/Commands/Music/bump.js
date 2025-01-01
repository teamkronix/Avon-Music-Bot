/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "bump",
  aliases: ["move", "bumptrack"],
  category: "Music",
  desc: "Bump a specific song from the queue to the front",dev: false,
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
      const player = client.kazagumo.players.get(message.guild.id);
      const queue = player.queue;
      const current = queue.current;
      if (!current) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription("There is no song currently playing.")
              .setColor("Red"),
          ],
        });
      }
      if (queue.length < 2) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription("There is only one song in the queue.")
              .setColor("Red"),
          ],
        });
      }
      const index = parseInt(args[0]);
      if (isNaN(index) || index < 1 || index > queue.length) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription("Invalid track number. Please provide a valid number from the queue.")
              .setColor("Red"),
          ],
        });
      }
      const track = queue[index - 1];
      queue.splice(index - 1, 1);
      queue.unshift(track); 
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(`Bumped **${track.title.substring(0, 50)}** to the top of the queue.`)
            .setColor(client.config.color),
        ],
      });
    } catch (e) {
      console.error(e);
      await message.channel.send({
        content: "An error occurred while processing the bump command.",
        ephemeral: true,
      });
    }
  },
};

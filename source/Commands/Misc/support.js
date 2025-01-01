/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
  name: "support",
  aliases: ["sup"],
  category: "Misc",
  permission: "",
  desc: "Get the Support Server Link of the Bot",dev: false,
  options: {
    owner: false,
    inVc: false,
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
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(5)
          .setURL(client.config.support),
        new ButtonBuilder()
          .setLabel("Invite Me")
          .setStyle(5)
          .setURL(client.config.invite)
      );
      const embed = new EmbedBuilder()
        .setColor(client.config.color)
        .setAuthor({
          name: `${client.user.username} Support Links`,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `> - Awesome! You want to join the support server. Click the button below to join the support server.`
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: `Requested by ${message.author.globalName || message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();
      const payload = {
        embeds: [embed],
        components: [row],
      };
      return await client.message.send(message, payload);
    } catch (err) {
      console.error(err);
      await client.message.send(message, {
        content: "An error occurred while executing this command",
      });
    }
  },
};

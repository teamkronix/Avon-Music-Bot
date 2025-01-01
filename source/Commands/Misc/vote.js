/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
  name: "vote",
  aliases: ["votelink"],
  category: "Misc",
  permission: "",
  desc: "Get the Invite Link of the Bot",
  dev: false,
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
            .setLabel("Vote Me")
            .setStyle(5)
            .setEmoji('1286959566323449896')
            .setURL(client.config.vote)
        );
        const embed = new EmbedBuilder()
            .setColor(client.config.color)
            .setAuthor({
            name: `${client.user.username} Vote Links`,
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
            `> - Awesome! You want to vote me. Click the button below to vote me.`
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({
            text: `Requested by ${
                message.author.globalName || message.author.tag
            }`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();
        const payload = {
            embeds: [embed],
            components: [row],
        };
        return await client.message.send(message, payload);
        }
        catch (err) {
        console.error(err);
        await client.message.send(message, {
            content: "An error occurred while executing this command",
        });
    }
    }
};
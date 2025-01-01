/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  name: "vanity-info",
  aliases: ["vanity", "vanityinfo", "vi"],
  category: "Misc",
  permission: "ManageGuild",
  desc: "Get the Information of a Vanity URL Server",dev: false,
  options: {
    owner: false,
    inVc: false,
    sameVc: false,
    player: {
      playing: false,
      active: false,
    },
    premium: false,
    vote: true,
  },
  run: async ({ client, message, args }) => {
    try {
      async function fetchVanityInfo(vanity) {
        try {
          const response = await axios.get(
            `https://discord.com/api/v10/invites/${vanity}?with_counts=true&with_expiration=true`,
            {
              headers: {
                Authorization: `Bot ${client.config.token.Primary}`,
              },
            }
          );
          return response.data;
        } catch (error) {
          console.error("Error fetching vanity info:", error);
          return null;
        }
      }
      function createEmbed(data, ctx) {
        const embed = new EmbedBuilder()
          .setTitle(data.guild.name)
          .setURL(`https://discord.gg/${data.code}`)
          .setColor(client.config.color)
          .setThumbnail(
            `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=4096`
          )
          .setFooter({
            text: `Requested By ${
              ctx.author?.globalName ?? ctx.user.globalName
            }`,
            iconURL:
              ctx.author?.displayAvatarURL() ?? ctx.user.displayAvatarURL(),
          });

        if (data.guild.description) {
          embed.setDescription(data.guild.description);
        }
        const fields = [
          {
            name: "Vanity URL",
            value: `discord.gg/${data.code}`,
            inline: true,
          },
          { name: "Guild ID", value: data.guild.id, inline: true },
          {
            name: "Member Count",
            value: data.approximate_member_count.toString(),
            inline: true,
          },
          {
            name: "Online Members",
            value: data.approximate_presence_count.toString(),
            inline: true,
          },
          {
            name: "Boosts",
            value: data.guild.premium_subscription_count.toString(),
            inline: true,
          },
        ];
        if (data.channel) {
          fields.push({
            name: "Invite Channel",
            value: data.channel.name,
            inline: true,
          });
        }
        embed.addFields(fields);
        if (data.guild.banner) {
          embed.setImage(
            `https://cdn.discordapp.com/banners/${data.guild.id}/${data.guild.banner}.png?size=4096`
          );
        }
        if (data.expires_at) {
          embed.addFields({
            name: "Expires At",
            value: new Date(data.expires_at).toUTCString(),
            inline: false,
          });
        }
        return embed;
      }
      let vanity = args[0];
      if (!vanity) {
        if (message.guild.vanityURLCode) {
          vanity = message.guild.vanityURLCode;
        } else {
          return await client.message.send(message, {
            content: "Please provide a vanity URL.",
          });
        }
      }
      const data = await fetchVanityInfo(vanity);
      if (!data) {
        return await client.message.send(message, {
          content: "Unable to fetch vanity info.",
        });
      }
      const embed = createEmbed(data, message);
      return await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in vanity-info command:", error);
      return await client.message.send(message, {
        content: "An error occurred while executing this command.",
      });
    }
  },
};

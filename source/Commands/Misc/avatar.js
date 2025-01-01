/** 

@code Fucked by manas 
@for support join https://discord.gg/coderz
@this code is licensed give credits to me before using
@enjoy the skidded and chatgpt. Dumped bit code

**/
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");
const cooldowns = new Map();
async function getUser(client, userId) {
  let user = await client.cluster.broadcastEval(
    async (c, ctx) => {
      return await c.users.fetch(ctx.userId).catch(() => null);
    },
    { context: { userId } }
  );
  return user.find((u) => u !== null);
}
async function getPfpFromAxios(userId, client) {
  try {
    const response = await axios.get(
      `https://discord.com/api/users/${userId}`,
      {
        headers: {
          Authorization: `Bot ${client.config.token.Primary}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}
function handleCooldown(userId) {
  const now = Date.now();
  const cooldownTime = 5000;
  for (const [id, timestamp] of cooldowns) {
    if (now - timestamp > cooldownTime) {
      cooldowns.delete(id);
    }
  }
  if (cooldowns.has(userId)) {
    const expirationTime = cooldowns.get(userId) + cooldownTime;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return Math.round(timeLeft);
    }
  }
  cooldowns.set(userId, now);
  return 0;
}
module.exports = {
  name: "avatar",
  aliases: ["av", "pfp", "dp"],
  category: "Misc",
  permission: "",
  desc: "Get the Avatar of a User",dev: false,
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
      let user =
        message.mentions.users.first() ||
        (await getUser(client, args[0])) ||
        message.author;
      let userPfp = await getPfpFromAxios(user.id, client);
      if (!userPfp) {
        const errorEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setAuthor({
            name: "Unable to fetch user",
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setDescription("User not found")
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          });
        return await message.reply({ embeds: [errorEmbed] });
      }
      const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${
        userPfp.avatar
      }.${userPfp.avatar.startsWith("a_") ? "gif" : "png"}?size=1024`;
      const embed = new EmbedBuilder()
        .setColor(client.config.color)
        .setAuthor({
          name: `${user.username}'s Avatar`,
          iconURL: avatarUrl,
        })
        .setImage(avatarUrl)
        .setFooter({
          text: `Requested by ${message.author.globalName}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("View Original")
          .setStyle(ButtonStyle.Link)
          .setURL(avatarUrl),
        new ButtonBuilder()
          .setCustomId("download")
          .setLabel("Download")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("random")
          .setLabel("Random Avatar")
          .setStyle(ButtonStyle.Secondary)
      );
      const response = await message.reply({
        embeds: [embed],
        components: [row],
      });
      const collector = response.createMessageComponentCollector({
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          await interaction.reply({
            content: "You are not allowed to interact with this button.",
            ephemeral: true,
          });
          return;
        }
        if (interaction.customId === "download") {
          await interaction.reply({
            content: `Here's the download link for ${user.username}'s avatar: ${avatarUrl}`,
            ephemeral: true,
          });
        } else if (interaction.customId === "random") {
          const cooldownTime = handleCooldown(interaction.user.id);
          if (cooldownTime > 0) {
            await interaction.reply({
              content: `Please wait ${cooldownTime} seconds before using the Random Avatar button again.`,
              ephemeral: true,
            });
            return;
          }
          const randomUser = await client.users.fetch(
            client.users.cache.randomKey()
          );
          const randomUserPfp = await getPfpFromAxios(randomUser.id, client);
          if (randomUserPfp) {
            const randomAvatarUrl = `https://cdn.discordapp.com/avatars/${
              randomUser.id
            }/${randomUserPfp.avatar}.${
              randomUserPfp.avatar.startsWith("a_") ? "gif" : "png"
            }?size=1024`;
            const newEmbed = new EmbedBuilder()
              .setColor(client.config.color)
              .setAuthor({
                name: `${randomUser.username}'s Avatar`,
                iconURL: randomAvatarUrl,
              })
              .setImage(randomAvatarUrl)
              .setFooter({
                text: `Requested by ${message.author.globalName}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
              })
              .setTimestamp();
            const newRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("View Original")
                .setStyle(ButtonStyle.Link)
                .setURL(randomAvatarUrl),
              new ButtonBuilder()
                .setCustomId("download")
                .setLabel("Download")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("random")
                .setLabel("Random Avatar")
                .setStyle(ButtonStyle.Secondary)
            );
            await interaction.update({
              embeds: [newEmbed],
              components: [newRow],
            });
          } else {
            await interaction.reply({
              content: "Failed to fetch a random avatar. Please try again.",
              ephemeral: true,
            });
          }
        }
      });
      collector.on("end", () => {
        response.edit({ components: [] });
      });
    } catch (error) {
      console.error("Error in avatar command:", error);
      await message.reply(
        "An error occurred while processing your request. Please try again later."
      );
    }
  },
};

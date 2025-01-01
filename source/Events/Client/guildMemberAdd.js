const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
  } = require("discord.js");
  
  module.exports = async (client, member) => {
    try {
      if (member.user.bot) return;
      const accountCreationDate = member.user.createdAt;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      if (accountCreationDate > oneMonthAgo) {
        console.log(`Account ${member.user.tag} is less than one month old. Skipping welcome message.`);
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(client.config.color || "#5865F2")
        .setAuthor({
          name: `Welcome ${member.user.globalName || member.user.username}`,
          iconURL: member.guild.iconURL({ dynamic: true }) || null,
          url: client.config.support,
        })
        .setDescription(
          `- Thanks for joining **${member.guild.name}**! I'm **${client.user.username}**, the best music bot here. You can Add me to your server [click here](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands).`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
        .setFooter({
          text: `You are the ${member.guild.memberCount}th member in this server!`,
          iconURL: member.guild.iconURL({ dynamic: true }) || null,
        });
  
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setEmoji("1104994194856103966")
          .setURL(client.config.support),
        new ButtonBuilder()
          .setLabel("Invite")
          .setStyle(ButtonStyle.Link)
          .setEmoji("1167860474147250267")
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
          )
      );
      await member
        .send({ embeds: [embed], components: [row], content : `[Avon Music](${client.config.support})` })
        .then(() => console.log(`Sent welcome message to ${member.user.tag}.`))
        .catch(() => {
          console.log(
            `Failed to send welcome message to ${member.user.tag}; they may have DMs disabled.`
          );
        });
    } catch (error) {
      console.error(
        `Error in guildMemberAdd for user ${member.user.tag}:`,
        error
      );
    }
  };
  

// const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
// const Denque = require("denque");
// const memberQueue = new Denque();
// const RATE_LIMIT_INTERVAL = 2000;
// module.exports = async (client) => {
//   setInterval(async () => {
//     if (memberQueue.isEmpty()) return;
//     const member = memberQueue.shift();
//     await sendWelcomeMessage(client, member);
//   }, RATE_LIMIT_INTERVAL);
//   client.on("guildMemberAdd", (member) => {
//     if (!member.user.bot) {
//       memberQueue.push(member);
//     }
//   });
// };
// async function sendWelcomeMessage(client, member) {
//   try {
//     const embed = new EmbedBuilder()
//       .setColor(client.config.color || "#5865F2")
//       .setAuthor({
//         name: `Welcome ${member.user.globalName || member.user.username}`,
//         iconURL: member.guild.iconURL({ dynamic: true }) || null,
//         url: client.config.support,
//       })
//       .setDescription(
//         `- Thanks for joining **${member.guild.name}**! I'm **${client.user.username}**, the best music bot here. Add me to your server by [clicking here](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands).`
//       )
//       .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
//       .setFooter({
//         text: `You are the ${member.guild.memberCount}th member in this server!`,
//         iconURL: member.guild.iconURL({ dynamic: true }) || null,
//       });

//     const row = new ActionRowBuilder().addComponents(
//       new ButtonBuilder()
//         .setLabel("Support")
//         .setStyle(ButtonStyle.Link)
//         .setEmoji("1104994194856103966")
//         .setURL(client.config.support),
//       new ButtonBuilder()
//         .setLabel("Invite")
//         .setStyle(ButtonStyle.Link)
//         .setEmoji("1167860474147250267")
//         .setURL(
//           `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
//         )
//     );

//     await member.send({ embeds: [embed], components: [row] })
//       .then(() => console.log(`Sent welcome message to ${member.user.tag}.`))
//       .catch(() => {
//         console.log(
//           `Failed to send welcome message to ${member.user.tag}; they may have DMs disabled.`
//         );
//       });

//   } catch (error) {
//     console.error(
//       `Error sending welcome message to ${member.user.tag}:`,
//       error
//     );
//   }
// }


// // const {
// //   EmbedBuilder,
// //   ButtonBuilder,
// //   ActionRowBuilder,
// //   ButtonStyle,
// // } = require("discord.js");

// // module.exports = async (client, member) => {
// //   try {
// //     if (member.user.bot) return;
// //     const embed = new EmbedBuilder()
// //       .setColor(client.config.color || "#5865F2")
// //       .setAuthor({
// //         name: `Welcome ${member.user.globalName || member.user.username}`,
// //         iconURL: member.guild.iconURL({ dynamic: true }) || null,
// //         url: client.config.support,
// //       })
// //       .setDescription(
// //         `- Thanks for joining **${member.guild.name}**! I'm **${client.user.username}**, the best music bot here. You can Add me to your server [click here](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands).`
// //       )
// //       .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
// //       .setFooter({
// //         text: `You are the ${member.guild.memberCount}th member in this server!`,
// //         iconURL: member.guild.iconURL({ dynamic: true }) || null,
// //       });
// //     const row = new ActionRowBuilder().addComponents(
// //       new ButtonBuilder()
// //         .setLabel("Support")
// //         .setStyle(ButtonStyle.Link)
// //         .setEmoji("1104994194856103966")
// //         .setURL(client.config.support),
// //       new ButtonBuilder()
// //         .setLabel("Invite")
// //         .setStyle(ButtonStyle.Link)
// //         .setEmoji("1167860474147250267")
// //         .setURL(
// //           `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
// //         )
// //     );
// //     await member
// //       .send({ embeds: [embed], components: [row] })
// //       .then(() => console.log(`Sent welcome message to ${member.user.tag}.`))
// //       .catch(() => {
// //         console.log(
// //           `Failed to send welcome message to ${member.user.tag}; they may have DMs disabled.`
// //         );
// //       });
// //   } catch (error) {
// //     console.error(
// //       `Error in guildMemberAdd for user ${member.user.tag}:`,
// //       error
// //     );
// //   }
// // };

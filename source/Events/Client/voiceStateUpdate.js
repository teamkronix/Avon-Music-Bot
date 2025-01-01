const { EmbedBuilder } = require("discord.js");
const VoiceStateHandler = require("../../Handlers/Voice");
module.exports = async (client, oldState, newState) => {
  try {
    const voiceStateHandler = new VoiceStateHandler(client);
    await voiceStateHandler.handle(oldState, newState);
  }
  catch (error) {
    console.error("Error in voice state update handler:", error);
  }
};



//     const player = client.kazagumo.players.get(voiceChannel.guild.id);
//     const members = voiceChannel.members;
//     const otherMembers = members.filter((member) => !member.user.bot);
//     const otherBots = members.filter(
//       (member) => member.user.bot && member.id !== client.user.id
//     );
//     if (otherMembers.size === 0 && otherBots.size === 0) {
//       const timerId = setTimeout(async () => {
//         await destroyPlayer(voiceChannel.guild.id, guildData, client);
//       }, 10 * 60 * 1000);
//       AvonTimer.set(voiceChannel.guild.id, timerId);
//     } else {
//       const existingTimer = AvonTimer.get(voiceChannel.guild.id);
//       if (existingTimer) {
//         clearTimeout(existingTimer);
//         AvonTimer.delete(voiceChannel.guild.id);
//       }
//     }
//   } catch (e) {
//     console.error("Error in voice state update handler:", e);
//   }
// };
// async function destroyPlayer(guildId, guildData, client) {
//   const player = client.kazagumo.players.get(guildId);
//   if (player) {
//     player.destroy();
//   }
//   const d = guildData.twentyFourSeven.textChannel;
//   const textChannel = d ? client.channels.cache.get(textChannelId) : null;
//   if (textChannel) {
//     const embed = new EmbedBuilder()
//       .setColor(client.config.color)
//       .setAuthor({
//         name: "Avon Music Player",
//         iconURL: client.user.displayAvatarURL(),
//       })
//       .setDescription(
//         `I have left the voice channel as there were no members in the voice channel for 10 minutes.`
//       );

//     textChannel.send({ embeds: [embed] }).catch(() => {});
//   }
//   AvonTimer.delete(guildId);
// }

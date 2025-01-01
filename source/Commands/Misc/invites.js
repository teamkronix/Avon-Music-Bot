/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder } = require("discord.js");

async function fetchInvites(guild, userId = null) {
  try {
    const invites = await guild.invites.fetch();
    const invUsers = new Map();
    for (const invite of invites.values()) {
      const inviterId = invite.inviterId;
      if (!inviterId) continue; 
      let inviter;
      try {
        inviter = await guild.members.fetch(inviterId);
      } catch (error) {
        continue; 
      }
      if (!invUsers.has(inviter.user.id)) {
        invUsers.set(inviter.user.id, {
          inviter,
          invites: [],
        });
      }
      invUsers.get(inviter.user.id).invites.push(invite);
    }
    if (userId) {
      const userInvites = invUsers.get(userId);
      if (userInvites) {
        return userInvites;
      } else {
        return { inviter: null, invites: [] };
      }
    }
    return invUsers;
  } catch (error) {
    console.error("Error fetching invites:", error);
    return null;
  }
}
module.exports = {
  name: "invites",
  aliases: ["server-invites", "user-invites"],
  category: "Misc",
  permission: "",
  desc: "Get the invites of the server or a user invites",dev: false,
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
      let user;
      if (!args[0] && !message.mentions.users.first()) {
        user = message.author;
      } else if (args[0]?.toLowerCase() === "all") {
        const guild = message.guild;
        const invs = await fetchInvites(guild);
        if (!invs)
          return await client.message.send(message, {
            content: "Unable to fetch invites",
          });
        const embed = new EmbedBuilder()
          .setColor(client.config.color)
          .setAuthor({
            name: `Server All Invites`,
            iconURL: guild.iconURL(),
          });
        if (invs.size) {
          const invitesField = Array.from(invs.values())
            .map(
              (invUser) =>
                `**${
                  invUser.inviter.user.globalName ??
                  invUser.inviter.user.username
                }** - ${invUser.invites.length.toString()} Invites ( Users Joined : ${invUser.invites.reduce(
                  (acc, invite) => acc + invite.uses,
                  0
                )} )`
            )
            .join("\n");
          embed.setDescription(
            invitesField.length > 4096
              ? `${invitesField.slice(0, 4093)}...`
              : invitesField
          );
        }
        return await client.message.send(message, { embeds: [embed] });
      } else if (args[0]?.match(/<@!?(\d{17,19})>/)) {
        let filterID = args[0].replace(/<@!?(\d{17,19})>/, "$1");
        user = await client.users.fetch(filterID);
      } else if (args[0]?.match(/\d{17,19}/)) {
        user = await client.users.fetch(args[0]);
      } else {
        user = message.author;
      }
      const guild = message.guild;
      const invs = await fetchInvites(guild, user.id);
      if (!invs)
        return await client.message.send(message, {
          content: "Unable to fetch invites",
        });
      const embed = new EmbedBuilder().setColor(client.config.color).setAuthor({
        name: `${
          user.globalName ?? user.username
        }'s Has ${invs.invites.length.toString()} Invites`,
        iconURL: user.displayAvatarURL(),
      });

      if (invs.invites.length) {
        const invitesField = invs.invites
          .map((invite) => `**.gg/${invite.code}** - ${invite.uses} uses`)
          .join("\n");
        embed.addFields({ name: "Invites", value: invitesField });
      } else {
        embed.setDescription(`This user has no invites.`);
      }
      return await client.message.send(message, { embeds: [embed] });
    } catch (err) {
      console.error(err);
      await client.message.send(message, {
        content: "An error occurred while executing this command",
      });
    }
  },
};
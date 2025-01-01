const {
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  WebhookClient,
  EmbedBuilder,
} = require("discord.js");
const guildSchema = require("../../Models/Guild");
const userSchema = require("../../Models/User");

module.exports = async (client, message) => {
  try {
    if (message.author.bot || message.channel.type === 1) return;
    const guildData = await guildSchema.findOneAndUpdate(
      { id: message.guild.id },
      { $setOnInsert: { id: message.guild.id, prefix: "+" } },
      { upsert: true, new: true, setDefaultsOnInsert: true, lean: true }
    );
    let prefix = guildData.prefix ?? `+`;
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>$`);
    if (message.content.match(mentionRegex)) {
      const msg =
        Math.random() > 0.5
          ? `> <:aHumanity_Friends:1248852525285900320> Greetings <@!${message.author.id}>! I am ${client.user.username}, a user-friendly bot with unique features.\n- Join [Support Server](https://discord.gg/S5zmG2RtJ3)\n- Invite Me [${client.user.username}](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)\n- My Prefix is \`${prefix}\``
          : `> <:aHumanity_Friends:1248852525285900320> Hola **${message.author.globalName}**! This is ${client.user.username}, a legendary music bot.\n- Join [Support Server](https://discord.gg/S5zmG2RtJ3)\n- Invite Me [${client.user.username}](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)\n- My Prefix is \`${prefix}\``;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `Avon Music For You`,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        })
        .setColor(client.config.color)
        .setDescription(`${msg}\n-# Special Thanks To All Supporters ❤`)
        .setImage(
          "https://cdn.discordapp.com/attachments/971701889223782400/1286758037817921607/Sia_Canary.gif?ex=66ef124f&is=66edc0cf&hm=de9ae78dba8c727822c825ee40709d0550c995679c09e665e37fbaf116336140&"
        );

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/S5zmG2RtJ3"),
        new ButtonBuilder()
          .setLabel("Invite Me")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
          )
      );
      return message.channel
        .send({ embeds: [embed], components: [actionRow] })
        .catch(() => {
          message.author
            .send({
              content: `I cannot send messages in ${message.channel.name}. Please ensure I have permissions to send messages in that channel.`,
            })
            .catch(() => {});
        });
    }
    let dev = client.config.developers;
    let noprefixUsers = [];
    let userData = await userSchema.find({ noPrefix: true });
    userData.forEach((user) => {
      noprefixUsers.push(user.id);
    });

    if (
      (dev.includes(message.author.id) ||
        noprefixUsers.includes(message.author.id)) &&
      !message.content.startsWith(prefix)
    ) {
      prefix = "";
    }
    const reg = (newprefix) => {
      return newprefix.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
    };
    const mentionprefix = new RegExp(
      `^(<@!?${client.user.id}>|${reg(prefix)})`
    );
    if (!mentionprefix.test(message.content)) return;
    const [, content] = message.content.match(mentionprefix);
    const args = message.content.slice(content.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const cmd =
      client.commands.get(commandName) ||
      client.commands.find((c) => c.aliases && c.aliases.includes(commandName));
    if (!cmd) return;
    const checkBotPermissions = async (message, client) => {
      const rPermissions = [
        "SendMessages",
        "ViewChannel",
        "EmbedLinks",
        "UseExternalEmojis",
        "Connect",
        "Speak",
      ];
      try {
        const botMember = await message.guild.members.fetch(client.user.id);
        const mPermissions = rPermissions.filter(
          (perm) => !botMember.permissions.has(perm)
        );
        if (mPermissions.length > 0) {
          const permissionList = mPermissions.join(", ");
          const inviteLink = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
          const content = `- I need these many permissions ${permissionList}. Consider Reporting To Developer [Tejas Shettigar (TEZZ 444)](<https://discord.com/users/900981299022536757>)`;
          try {
            await message.channel.send({ content });
            return;
          } catch (error) {
            if (error) {
              try {
                await message.author.send({
                  content: `I cannot send messages in **${message.channel.name}**. Please ensure I have permissions to send messages in that channel! [Re Invite Me](${inviteLink})`,
                });
              } catch (dmError) {
                console.error("Failed to send DM:", dmError);
              }
            } else {
              console.error("Error sending message:", error);
            }
          }
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error checking bot permissions:", error);
        return false;
      }
    };
    if (cmd && !checkBotPermissions(message, client)) {
      return;
    }
    if (cmd.permission && !message.member.permissions.has(cmd.permission) && !dev.includes(message.author.id)) {
      return message.channel
        .send({ content: `You lack the ${cmd.permission} permission.` })
        .catch(() => {
          message.author
            .send({
              content: `- <:Supporterss:1248199396491923486> I cannot send messages in ${message.channel.name}. Please ensure I have permissions to send messages in that channel! [Re Invite Me](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`,
            })
            .catch(() => {});
        });
      
    }
    if (cmd.dev && !client.config.developers.includes(message.author.id)) {
      return message.channel.send({
        content: `- This command is restricted to Tejas Shettigar (TEZZ 444)`,
      });
    }
    if (
      cmd.options.owner &&
      !client.config.developers.includes(message.author.id)
    ) {
      return message.channel.send({
        content: `- This command is restricted to Rihan, Mafia, Punit, TEZZ 444`,
      });
    }
    if (cmd.options.inVc && !message.member.voice.channel) {
      return message.channel.send({
        content: `- You must be in a voice channel to use this command.`,
      });
    }
    const player = client.kazagumo.players.get(message.guild.id) || null;
    if (cmd.options.player.active && !player) {
      return message.channel.send({
        content: `- I cannot Find the **Player** in this server, Try ${prefix}dc to disconnect the session.`,
      });
    }
    if (cmd.options.sameVc && !player) {
      return message.channel.send({
        content: `- I cannot Find the **Player** in this server, Try ${prefix}dc to disconnect the session.`,
      });
    }
    if (cmd.options.player.playing && (!player || !player.queue.current)) {
      return message.channel.send({
        content: `- There is no song currently playing.`,
      });
    }
    if (cmd.options.premium && !guildData.premium && !dev.includes(message.author.id)) {
      return message.channel.send({
        content: `- This command is for premium servers only.`,
      });
    }
    if (cmd.options.vote){
      let voted = await client.topgg.hasVoted(message.author.id);
      if (!voted && !dev.includes(message.author.id)) {
        return await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.color)
              .setAuthor({
                name: `Vote Required`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `<:GZ_Announce_Side_Cyan:1287335673610637312> <@!${message.author.id}> You need to vote Avon In Top.gg to use this command. [Vote Here](${client.config.vote})`
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Vote")
                .setStyle(5)
                .setEmoji("1012977248250376222")
                .setURL(client.config.vote)
            ),
          ],
        });
      }
    }
    await cmd
      .run({ client, message, args, prefix, guildData, player })
      .catch((error) => {
        console.error("Error executing command:", error);
        message.channel
          .send({
            content: `I encountered an error while executing the command. Please Report To Developer [Tejas Shettigar (TEZZ 444)](<https://discord.com/users/900981299022536757>)`,
          })
          .catch(() => {
            message.author
              .send({
                content: `I cannot send messages in ${message.channel.name}. Please ensure I have permissions to send messages in that channel.`,
              })
              .catch(() => {});
          });
      });
    await logCommandExecution(client, message, cmd, args, cmd);
    await updateUserData(message.author.id, commandName);
  } catch (error) {
    console.error("Error in message event:", error);
  }
};

async function logCommandExecution(client, message, cmd, args, cmd) {
  try {
    if (client.config.LOGGINGS.commandRun) {
      let commandWeb = new WebhookClient({
        url: client.config.LOGGINGS.commandRun,
      });
      commandWeb.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setDescription(
              `- **Command Author:** [${
                    message.author.globalName
                      ? message.author.globalName
                      : message.author.username
                  }](https://discord.com/users/${message.author.id})\n- **Command Channel:** [${
                    message.channel.name
                  }](https://discord.com/channels/${message.guild.id}/${
                message.channel.id
              })\n- **Command Guild:** ${message.guild.name} (\`${
                message.guild.id
              }\`)\n- **Command Used at:** <t:${Math.round(
                    Date.now() / 1000
                  )}:R> [<t:${Math.round(Date.now() / 1000)}>]\n- **Command:** ${cmd.name}\n- **Command Arguments:** ${args.join(" ") || "No Arguments"}
              `
            )
            .setAuthor({
              name: `Command Run Logging`,
              iconURL: message.guild.icon
                ? message.guild.iconURL({ foceStatic: false })
                : message.author.displayAvatarURL({ forceStatic: false }),
            })
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true })),
        ],
      });
    } else {
      console.warn(
        "Command logging configuration is missing or incomplete. Skipping command logging."
      );
    }
  } catch (error) {
    console.error("Error occurred while logging command execution:", error);
  }
}
async function updateUserData(userId, commandName) {
  try {
    const updateData = {
      $inc: { commandsUsed: 1 },
    };
    if (commandName === "play") {
      updateData.$inc.songsPlayed = 1;
      updateData.$push = {
        "favTracks.songs": {
          $each: [],
        },
      };
    }
    await userSchema.findOneAndUpdate({ id: userId }, updateData, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  } catch (error) {
    console.error("Error updating user data:", error);
  }
}

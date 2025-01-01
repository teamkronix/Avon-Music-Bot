const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const GuildSchema = require("../Models/Guild");

module.exports = async function AvonDispatcher(client, kazagumo) {
  kazagumo.on("playerStart", async (player, track) => {
    if (track.length < 5000) {
      player.skip();
      let channel = client.channels.cache.get(player.textId);
      if (channel) {
        channel
          .send({
            content: `- Track is less than **5 seconds.** Skipping the track.`,
          })
          .then((msg) => setTimeout(() => msg.delete(), 5000));
      }
      return;
    }
    let guildData = await GuildSchema.findOne({ id: player.guildId });
    const channel = client.channels?.cache.get(player.textId);
    let data = await client.spotify.searchTrack(track.title);
    let title, author, thumbnail, url, artistLink;
    let tezz = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (tezz.test(track.uri)) {
      title = data.title
        ? data.title.replace(/[^a-zA-Z0-9 ]/g, "")
        : track.title.replace(/[^a-zA-Z0-9 ]/g, "");
      author = data.artist ? data.artist : client.user.username;
      thumbnail = data.thumbnail ? data.thumbnail : track.thumbnail;
      url = data.link ? data.link : track.uri;
      artistLink = data.artistLink ? data.artistLink : track.uri;
    } else {
      title = track.title;
      author = track.author;
      thumbnail = track.thumbnail;
      url = track.uri;
      artistLink = data.artistLink ? data.artistLink : track.uri;
    }
    player.queue.current.title = title;
    player.data.set("url", url);
    player.data.set("autoplayTrack", track);
    // let ops = track.requester.globalName ?? track.requester.username;
    let ops = `[**${
      track.requester.globalName
        ? track.requester.globalName
        : track.requester.username
    }**](https://discord.com/users/${track.requester.id})`;

    client.utils.setVCStatus(
      player.voiceId,
      `<a:tezz444:1301577123131031624> ${title} by ${author}`
    );
    const nowPlaying = new EmbedBuilder()
      .setAuthor({
        name: `Now Playing`,
        iconURL:
          "https://cdn.discordapp.com/emojis/1301577123131031624.gif?size=128&quality=lossless" ??
          track.requester.displayAvatarURL({ dynamic: true }),
        url: track.uri,
      })
      .setColor(client.config.color)
      .setThumbnail(thumbnail)
      .addFields(
        {
          name: "<a:tezzRequester:1301587466117189676> Chosen by",
          value: ops,
          inline: true,
        },
        {
          name: "<a:Duration:1039591831937232917> Duration",
          value: track.isStream
            ? "Live"
            : await client.utils.convertTime(track.length),
          inline: true,
        }
      )
      .setFooter({
        text: `Autoplay - ${
          guildData.settings.autoplay ? "Enabled" : "Disabled"
        } ⁠・ Volume - ${player.volume}% ⁠・ Queue - ${player.queue.length}`,
        iconURL: track.requester.displayAvatarURL({ dynamic: true }),
      });
    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("previous")
        .setStyle(client.btn.grey)
        .setEmoji("1131847086053269575"),
      new ButtonBuilder()
        .setCustomId("PauseAndResume")
        .setEmoji("1131847861299068948")
        .setStyle(client.btn.grey),
      new ButtonBuilder()
        .setCustomId("stop")
        .setEmoji("1301593382057152542")
        .setStyle(client.btn.red),
      new ButtonBuilder()
        .setEmoji("1131847099361792082")
        .setCustomId("settings")
        .setStyle(client.btn.grey),
      new ButtonBuilder()
        .setEmoji("1131847093925969990")
        .setCustomId("skip")
        .setStyle(client.btn.grey)
    );
    const buttonsRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("like")
        .setEmoji("1301594300639084635")
        .setLabel("Like Track")
        .setStyle(client.btn.green),
      new ButtonBuilder()
        .setCustomId("music_invite")
        .setEmoji("1301356058769621042")
        .setLabel("Invite Friend")
        .setStyle(client.btn.blue),
      new ButtonBuilder()
        .setCustomId("lyrics")
        .setEmoji("1205176894665003008")
        .setLabel("Lyrics")
        .setStyle(client.btn.blue)
    );

    if (player.volume > 100) {
      nowPlaying.setDescription(
        `**[${
          title.length > 30 ? `${title.slice(0, 30)}...` : title
        }](${url})** by [**${author}**](${artistLink})\n-# **Note:** *Volume is slightly higher then usual, may cause distortion*`
      );
      //   \n- **Duration** \`(${
      //     track.isStream ? "Live" : await client.utils.convertTime(track.length)
      //   })\`\n-# Note: Volume is slightly higher then usual, may cause distortion`
      // );
    } else {
      nowPlaying.setDescription(
        `**[${
          title.length > 30 ? `${title.slice(0, 30)}...` : title
        }](${url})** by [**${author}**](${artistLink})`
      );
      // <:sia_DotBlue:1068413440672149545> **Duration** \`(${track.isStream ? "Live" : await client.utils.convertTime(
      //   track.length
      // )})\``
    }
    if (channel) {
      await channel
        ?.send({ embeds: [nowPlaying], components: [buttonsRow, buttonsRow2] })
        .then((msg) => player.data.set("message", msg));
    } else {
      player.destroy();
      let channelGuild = client.guilds.cache.get(player.guildId);
      let channels = channelGuild.channels.cache.filter(
        (c) => c.type === ChannelType.GuildText
      );
      await client.channels.cache
        .get(channels.first().id)
        .send({
          content: `I can't find the text channel to send the message. So Destroying the player.`,
        })
        .then((msg) => setTimeout(() => msg.delete(), 8000))
        .catch((err) => console.error(err));
    }
  });
  kazagumo.on("playerEnd", async (player) => {
    const msg = player.data.get("message").id;
    const channel = client.channels.cache.get(player.textId);
    if (channel) {
      if (channel.messages.cache.get(msg)) {
        channel.messages.cache.get(msg).delete();
      }
    }
  });
  kazagumo.on("playerClosed", async (player, track) => {
    const channel = client.channels?.cache.get(player.textId);
    if (channel) {
      channel.messages.fetch(player.data.get("message")).then((msg) => {
        msg.delete();
      });
    }
  });
  kazagumo.on("playerEmpty", async (player) => {
    let prefix = await client.utils.getPrefix(player.guildId);
    client.utils.setVCStatus(
      player.voiceId,
      `${prefix ?? "+"}play <song name> And Enjoy!`
    );
    player.data.get("message")?.delete();
    let data = await GuildSchema.findOne({ id: player.guildId });
    if (data && data?.settings.autoplay) {
      client.utils.AvonAutoplay(player, player.data?.get("url"));
    } else {
      const embed = new EmbedBuilder().setColor(client.config.color).setAuthor({
        name: `No more tracks in the queue. Leaving the voice channel.`,
        iconURL: client.user.avatarURL(),
      });
      const channel = client.channels.cache.get(player.textId);
      channel
        .send({ embeds: [embed] })
        .then((msg) => setTimeout(() => msg.delete(), 80000 * 10 * 2));
    }
  });
  kazagumo.on("playerDestroy", async (player) => {
    client.utils.removeVCStatus(player.voiceId);
    try {
      let data = await GuildSchema.findOne({ id: player.guildId });
      let shard = await client.guilds.cache.get(data.id).shardId;
      if (data.twentyFourSeven.enabled) {
        await client.kazagumo.createPlayer({
          guildId: data.id,
          textId: data.twentyFourSeven.textChannel,
          voiceId: data.twentyFourSeven.voiceChannel,
          shardId: shard,
          deaf: true,
        });
      }
      if (!player) return;
      if (!player && !player.playing) return;
      const msg = player.data.get("message")
        ? player.data.get("message").id
        : null;
      if (!msg) return;
      const channel = client.channels.cache.get(player.textId);
      if (channel) {
        if (channel.messages.cache.get(msg)) {
          channel.messages.cache.get(msg).delete();
        }
      }
    } catch (e) {
      const player = client.kazagumo.players.get(player.guildId);
      player.destroy();
    }
  });
  kazagumo.on("playerMoved", async (player, state, channels) => {
    client.utils.removeVCStatus(player.voiceId);
    try {
      const newChannel = client.channels.cache.get(channels.newChannelId);
      const oldChannel = client.channels.cache.get(channels.oldChannelId);
      let channel = client.channels.cache.get(player.textId);
      if (channels.newChannelId === channels.oldChannelId) return;
      if (!channel) return;
      if (state === "UNKNOWN") {
        player.destroy();
        return channel
          .send({
            content: `- Unable to move to the new channel. So Destroying the player.`,
          })
          .then((msg) => setTimeout(() => msg.delete(), 8000));
      }
      if (state === "MOVED") {
        // player.queue.clear();
        // player.skip();
        player.setVoiceChannel(channels.newChannelId);
        if (player.paused) player.pause(false);
        return channel
          .send({
            content: `- Someone moved me from **${oldChannel.name}** to **${newChannel.name}**`,
          })
          .then((msg) => setTimeout(() => msg.delete(), 8000));
      }
      if (state === "LEFT") {
        let data = await GuildSchema.findOne({ id: player.guildId });
        if (channels.newChannel) {
          player.setVoiceChannel(channels.newChannelId);
        } else {
          if (player) player.destroy();
          let shard = await client.guilds.cache.get(data.id).shardId;
          if (data.twentyFourSeven.enabled) {
            setTimeout(async () => {
              await client.kazagumo.createPlayer({
                guildId: data.id,
                textId: data.twentyFourSeven.textChannel,
                voiceId: data.twentyFourSeven.voiceChannel,
                shardId: shard,
                deaf: true,
              });
            }, 3000);
          } else {
            if (player) player.destroy();
            const oldChannel = client.channels.cache.get(channels.oldChannelId);
            return channel
              .send({
                content: ` - I have been left from **${oldChannel.name}**. Destroying the player.`,
              })
              .then((msg) => setTimeout(() => msg.delete(), 8000));
          }
        }
      }
    } catch (e) {
      const player = client.kazagumo.players.get(player.guildId);
      player.destroy();
    }
  });
  kazagumo.on("playerStuck", async (player, data) => {
    client.utils.removeVCStatus(player.voiceId);
    const channel = client.channels.cache.get(player.textId);
    let msg = player.data.get("message").id;
    if (channel) {
      if (channel.messages.cache.get(msg)) {
        channel.messages.cache.get(msg).delete();
      }
    }
    console.warn(
      `Track is stuck for more than ${data.threshold}ms. Skipping the track in ${player.guildId}`
    );
    if (channel) {
      channel
        .send({
          content: `- Track is stuck for more than ${data.threshold}ms. Skipping the track.`,
        })
        .then((msg) => setTimeout(() => msg.delete(), 5000));
      player.skip();
    }
  });
};

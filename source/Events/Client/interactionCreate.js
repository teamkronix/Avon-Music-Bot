const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
} = require("discord.js");
const guildSchema = require("../../Models/Guild");
const userSchema = require("../../Models/User");
const { getLyrics } = require("genius-lyrics-api");
const GENIUS_API_KEY =
  "XQBi-Wyb2XsdU0ajdnBnzhpQHK5G0lc9dbeTpc7Zql8v9zvYBCaFavT-66M42oZN";
const MUSIXMATCH_API_KEY = "771d5d35b79464903df01f5f7f7fdc19";

module.exports = async (client, interaction) => {
  try {
    if (interaction.isButton()) {
      switch (interaction.customId) {
        case "PauseAndResume":
          await PauseResume(interaction, client);
          break;
        case "skip":
          await Skip(interaction, client);
          break;
        case "stop":
          await Stop(interaction, client);
          break;
        case "settings":
          await Settings(interaction, client);
          break;
        case "previous":
          await Previous(interaction, client);
          break;
        case "like":
          await Like(interaction, client);
          break;
        case "music_invite":
          await MusicInvite(interaction, client);
          break;
        case "lyrics":
          await Lyrics(interaction, client);
        default:
          break;
      }
    }
  } catch (e) {
    console.error(e);
  }
};

async function PauseResume(interaction, client) {
  const player = client.kazagumo.players.get(interaction.guildId);
  if (!interaction.member.voice.channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In A **Voice Channel** To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (player && interaction.member.voice.channelId !== player.voiceId) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In <#${player.voiceId}> To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (!player) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `No Music Player Was Found In Server **${interaction.guild.name}**`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (
    player.queue.current.requester.id !== interaction.user.id &&
    player.queue.current.requester.id !== client.user.id
  ) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `Only ${player.queue.current.requester} Can Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  player.pause(player.paused ? false : true);
  const buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("previous")
      .setStyle(client.btn.grey)
      .setEmoji("1131847086053269575"),
    new ButtonBuilder()
      .setCustomId("PauseAndResume")
      .setEmoji(player.paused ? "1131847088884437063" : "1131847861299068948")
      .setStyle(player.paused ? client.btn.green : client.btn.grey),
    new ButtonBuilder()
      .setCustomId("stop")
      .setEmoji("1301593382057152542")
      .setStyle(client.btn.red),
    new ButtonBuilder()
      .setEmoji("1131847099361792082")
      .setCustomId("settings")
      .setStyle(player.paused ? client.btn.green : client.btn.grey),
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
  await interaction.update({ components: [buttonsRow, buttonsRow2] });
}

async function Skip(interaction, client) {
  const player = client.kazagumo.players.get(interaction.guildId);
  if (!interaction.member.voice.channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In A **Voice Channel** To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (player && interaction.member.voice.channelId !== player.voiceId) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In <#${player.voiceId}> To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (!player) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `No Music Player Was Found In Server **${interaction.guild.name}**`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (
    player.queue.current.requester.id !== interaction.user.id &&
    player.queue.current.requester.id !== client.user.id
  ) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `Only ${player.queue.current.requester} Can Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  player.skip();
  const embed = new EmbedBuilder()
    .setColor(client.config.color)
    .setAuthor({
      name: "Avon Music Controller",
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    })
    .setDescription(`**Skipped** The Current Track`);
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function Stop(interaction, client) {
  const player = client.kazagumo.players.get(interaction.guildId);
  if (!interaction.member.voice.channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In A **Voice Channel** To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (player && interaction.member.voice.channelId !== player.voiceId) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In <#${player.voiceId}> To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (!player) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `No Music Player Was Found In Server **${interaction.guild.name}**`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (
    player.queue.current.requester.id !== interaction.user.id &&
    player.queue.current.requester.id !== client.user.id
  ) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `Only ${player.queue.current.requester} Can Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  player.destroy();
  const embed = new EmbedBuilder()
    .setColor(client.config.color)
    .setAuthor({
      name: "Avon Music Controller",
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    })
    .setDescription(`**Stopped** The Music Player & Left The Voice Channel`);
  return interaction.reply({ embeds: [embed], ephemeral: true });
}
async function Settings(interaction, client) {
  await interaction.deferReply({ ephemeral: true });
  const player = await client.kazagumo.players.get(interaction.guildId);
  if (!interaction.member.voice.channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In A **Voice Channel** To Use This Button`
      );
    return interaction.editReply({ embeds: [embed], ephemeral: true });
  }
  if (player && interaction.member.voice.channelId !== player.voiceId) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In <#${player.voiceId}> To Use This Button`
      );
    return interaction.editReply({ embeds: [embed], ephemeral: true });
  }
  if (!player) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `No Music Player Was Found In Server **${interaction.guild.name}**`
      );
    return interaction.editReply({ embeds: [embed], ephemeral: true });
  }
  if (
    player.queue.current.requester.id !== interaction.user.id &&
    player.queue.current.requester.id !== client.user.id
  ) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `Only ${player.queue.current.requester} Can Use This Button`
      );
    return interaction.editReply({ embeds: [embed], ephemeral: true });
  }
  if (player && player.paused) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(`Settings Are **Disabled** When Music Is Paused`);
    return interaction.editReply({ embeds: [embed], ephemeral: true });
  }
  let bu1 = new ButtonBuilder()
    .setCustomId("volume-down")
    .setEmoji("1131847106269814816")
    .setStyle(client.btn.grey);
  let bu2 = new ButtonBuilder()
    .setCustomId("volume-up")
    .setEmoji("1131847110866771979")
    .setStyle(client.btn.grey);
  let bu3 = new ButtonBuilder()
    .setCustomId("loop")
    .setEmoji("1246340148283707433")
    .setStyle(client.btn.grey);
  let bu4 = new ButtonBuilder()
    .setCustomId("autoplay")
    .setEmoji("1217563635065552997")
    .setStyle(client.btn.grey);
  let bu5 = new ButtonBuilder()
    .setCustomId("shuffle")
    .setEmoji("1217562943554715649")
    .setStyle(client.btn.grey);
  let row = new ActionRowBuilder().addComponents(bu1, bu2, bu3, bu4, bu5);
  let send = await interaction.editReply({ components: [row] });
  let filter = (i) => i.user.id === interaction.user.id;
  let collector = send.createMessageComponentCollector({
    filter,
    time: 60000,
  });
  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        content: "This Button Is Not For You",
        ephemeral: true,
      });
    }

    if (i.customId === "volume-down") {
      if (player.volume === 0) {
        await i.update({
          content: "I Can't Go Lower Than 0",
          components: [row],
        });
      }
      if (player.volume < 10)
        return await i.reply({
          content: "Volume Is Already At **0%**",
          ephemeral: true,
        });
      if (player.volume > 0 && player.volume < 10) return player.setVolume(0);
      let current = player.volume - 10;
      player.setVolume(player.volume - 10);
      await i.reply({
        content: `Volume Has Been Set To **${current}%**`,
        ephemeral: true,
      });
    }
    if (i.customId === "volume-up") {
      if (player.volume === 200) {
        await i.update({
          content: "I Can't Go Higher Than 200",
          components: [row],
        });
      }
      if (player.volume > 190)
        return await i.reply({
          content: "Volume Is Already At **200%**",
          ephemeral: true,
        });
      if (player.volume > 190 && player.volume < 200)
        return player.setVolume(200);
      let current = player.volume + 10;
      player.setVolume(player.volume + 10);
      await i.reply({
        content: `Volume Has Been Set To **${current}%**`,
        ephemeral: true,
      });
    }
    if (i.customId === "loop") {
      switch (player.loop) {
        case "none":
          player.setLoop("queue");
          await i.reply({
            content: "I Will Now Loop The **Queue**",
            ephemeral: true,
          });
          break;
        case "queue":
          player.setLoop("track");
          await i.reply({
            content: "I Will Now Loop The **Current Track**",
            ephemeral: true,
          });
          break;
        case "track":
          player.setLoop("none");
          await i.reply({
            content: "I Will Not Loop Anything",
            ephemeral: true,
          });
          break;
        default:
          player.setLoop("none");
          await i.reply({
            content: "I Will Not Loop Anything",
            ephemeral: true,
          });
          break;
      }
    }
    if (i.customId === "autoplay") {
      let guildata = await guildSchema.findOne({ id: interaction.guildId });
      if (!guildata) {
        guildata = await guildSchema.findOneAndUpdate(
          { id: interaction.guildId },
          { id: interaction.guildId, "settings.autoplay": true },
          { upsert: true, new: true }
        );
      }
      if (guildata.settings.autoplay) {
        guildata.settings.autoplay = false;
        await guildata.save();
        await i.reply({
          content: `Autoplay Has Been **Disabled**`,
          ephemeral: true,
        });

        return;
      } else {
        guildata.settings.autoplay = true;
        await guildata.save();
        await i.reply({
          content: `Autoplay Has Been **Enabled**`,
          ephemeral: true,
        });
        return;
      }
    }
    if (i.customId === "shuffle") {
      if (player && player.queue.size < 2) {
        await i.reply({
          content: "I Need At Least 2 Tracks To Shuffle",
          ephemeral: true,
        });
      }
      player.queue.shuffle();
      await i.reply({
        content: "I Have Shuffled The Queue",
        ephemeral: true,
      });
    }
    collector.resetTimer();
  });
}
async function Previous(interaction, client) {
  const player = client.kazagumo.players.get(interaction.guildId);
  if (!interaction.member.voice.channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In A **Voice Channel** To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (player && interaction.member.voice.channelId !== player.voiceId) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In <#${player.voiceId}> To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (!player) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `No Music Player Was Found In Server **${interaction.guild.name}**`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (
    player.queue.current.requester.id !== interaction.user.id &&
    player.queue.current.requester.id !== client.user.id
  ) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `Only ${player.queue.current.requester} Can Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  const previous = player.getPrevious();
  if (!previous) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(`No Previous Track Was Found`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  await player.play(player.getPrevious(true));
  const embed = new EmbedBuilder()
    .setColor(client.config.color)
    .setAuthor({
      name: "Avon Music Controller",
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    })
    .setDescription(`I will Start Playing The **Previous** Track`);
  return interaction.reply({ embeds: [embed], ephemeral: true });
}
async function Like(interaction, client) {
  let user = await userSchema.findOne({ id: interaction.user.id });
  let favstracks = user.favTracks.songs;
  const player = client.kazagumo.players.get(interaction.guildId);
  if (!interaction.member.voice.channel) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In A **Voice Channel** To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (player && interaction.member.voice.channelId !== player.voiceId) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `You Need To Be In <#${player.voiceId}> To Use This Button`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (!player) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `No Music Player Was Found In Server **${interaction.guild.name}**`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (favstracks.includes(player.queue.current.uri)) {
    user.favTracks = favstracks.filter(
      (track) => track !== player.queue.current.uri
    );
    await user.save();
    const embed = new EmbedBuilder()
      .setColor(client.config.color)
      .setAuthor({
        name: "Avon Music Controller",
        iconURL: interaction.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `<:thumbs1down:1215368596692140073> You Have **Disliked** [**${player.queue.current.title}**](${player.queue.current.uri})`
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  user.favTracks.songs.push(player.queue.current.uri);
  await user.save();
  const embed = new EmbedBuilder()
    .setColor(client.config.color)
    .setAuthor({
      name: "Avon Music Controller",
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    })
    .setDescription(
      `<:heartt:1068244222060282026> You **Liked** [**${player.queue.current.title}**](${player.queue.current.uri})`
    );
  return interaction.reply({ embeds: [embed], ephemeral: true });
}
const cooldowns = new Map();
async function Cooldown(userId) {
  const now = Date.now();
  const cooldownTime = 15000;
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
async function Lyrics(interaction, client) {
  try {
    let time = await Cooldown(interaction.user.id);
    if (time > 0) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setAuthor({
              name: "Avon Music Controller",
              iconURL: interaction.guild.iconURL({ dynamic: true }),
            })
            .setDescription(
              `Too Fast! Please Wait **${time}** Seconds Before Using This Button Again`
            ),
        ],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Fetching Lyrics...",
        ephemeral: true,
      });
      const embed = emx(interaction, client);
      const validationError = await val(interaction, client);
      if (validationError) {
        return await interaction.editReply({
          embeds: [validationError],
          ephemeral: true,
          content: null,
        });
      }
      const player = client.kazagumo.players.get(interaction.guildId);
      const currentTrack = player.queue.current;
      let { song, artist } = await getSongDetails(currentTrack, client);
      await interaction.editReply({
        content: `- Searching lyrics for "${song}". It may take a few seconds`,
        embeds: [],
      });
      const lyrics = await fetchLyrics(song, artist);
      if (!lyrics) {
        embed
          .setDescription(
            `\`❌\` No lyrics found for **${song}** by **${artist}**`
          )
          .setFooter({ text: "Try with a different song. We Tried Our Best" });
        return await interaction.editReply({
          content: null,
          embeds: [embed],
          ephemeral: true,
        });
      }
      const lyricsEmbeds = lyr(
        song,
        artist,
        lyrics,
        client.config.color,
        interaction
      );
      await interaction.editReply({
        content: null,
        embeds: lyricsEmbeds,
        ephemeral: true,
      });
    }
  } catch (error) {
    await handleError(interaction, error);
  }
}
function emx(interaction, client) {
  return new EmbedBuilder().setColor(client.config.color).setAuthor({
    name: "Avon Music Controller",
    iconURL: interaction.guild.iconURL({ dynamic: true }),
  });
}
async function val(interaction, client) {
  const embed = emx(interaction, client);
  const player = client.kazagumo.players.get(interaction.guildId);
  if (!interaction.member.voice.channel) {
    embed.setDescription(
      `- You should be in a voice channel to use this button`
    );
    return embed;
  }
  if (!player || !player.queue.current) {
    embed.setDescription(`- There is no song playing`);
    return embed;
  }
  if (player && interaction.member.voice.channelId !== player.voiceId) {
    embed.setDescription(
      `- You need to be in <#${player.voiceId}> to use this button`
    );
    return embed;
  }
  return null;
}
async function getSongDetails(currentTrack, client) {
  let song = currentTrack.title;
  let artist = currentTrack.author;
  if (song.length > 50) {
    song = song.slice(0, 50);
  }
  try {
    const spotifyData = await client.spotify.searchTrack(song);
    if (spotifyData) {
      artist = spotifyData.artist || artist;
      song = spotifyData.title || song;
    }
  } catch (error) {
    console.warn("Failed to fetch Spotify metadata:", error.message);
  }
  return { song, artist };
}

async function fetchLyrics(song, artist) {
  try {
    const geniusOptions = {
      apiKey: GENIUS_API_KEY,
      title: song,
      artist: artist,
      optimizeQuery: true,
    };
    const geniusLyrics = await getLyrics(geniusOptions);
    if (geniusLyrics?.trim()) {
      return geniusLyrics;
    }
  } catch (error) {
    console.warn("Genius lyrics fetch failed:", error.message);
  }
  try {
    let url = `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?format=json&callback=callback&q_track=${song}&q_artist=${artist}&apikey=${MUSIXMATCH_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.message.body.lyrics) {
      return data.message.body.lyrics.lyrics_body;
    }
  } catch (error) {
    console.warn("Musixmatch lyrics fetch failed:", error.message);
  }
  return null;
}
function lyr(song, artist, lyrics, color, interaction) {
  const embeds = [];
  const chunks = splitLyrics(lyrics);
  chunks.forEach((chunk, index) => {
    const embed = new EmbedBuilder().setColor(color).setAuthor({
      name: "Avon Lyrics",
      iconURL: `https://cdn.discordapp.com/emojis/1205176894665003008.webp?size=128&quality=lossless`,
    });
    if (index === 0) {
      embed.setDescription(
        `- Lyrics for **${song}** by **${artist}**\n\n${chunk}`
      );
    } else {
      embed.setDescription(chunk);
    }
    if (index === chunks.length - 1) {
      embed.setFooter({
        text: `Powered by Genius & Musixmatch | Page ${index + 1}`,
      });
    }
    embeds.push(embed);
  });
  return embeds;
}
function splitLyrics(lyrics) {
  const chunks = [];
  const maxLength = 4096;
  while (lyrics.length > 0) {
    let chunk = lyrics.slice(0, maxLength);
    if (lyrics.length > maxLength) {
      const lastNewline = chunk.lastIndexOf("\n");
      if (lastNewline > 0) {
        chunk = chunk.slice(0, lastNewline);
      }
    }
    chunks.push(chunk);
    lyrics = lyrics.slice(chunk.length);
  }
  return chunks;
}
async function handleError(interaction, error) {
  console.error("Lyrics Command Error:", error);
  const errorEmbed = new EmbedBuilder()
    .setColor("#ff0000")
    .setAuthor({
      name: "Error While Fetching Lyrics",
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    })
    .setDescription(
      "An error occurred while fetching the lyrics. Please try again later."
    )
    .setFooter({
      text: "If this persists, please report this to the bot developers",
    });
  try {
    if (interaction.deferred) {
      await interaction.editReply({
        content: null,
        embeds: [errorEmbed],
        ephemeral: true,
      });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  } catch (replyError) {
    console.error("Error while sending error message:", replyError);
  }
}
async function MusicInvite(interaction, client) {
  // let voted = await client.topgg.hasVoted(interaction.user.id);
  // try {
  //   if (!voted && !client.config.vote_bypass.includes(interaction.user.id)) {
  //     return await interaction.reply({
  //       embeds: [
  //         new EmbedBuilder()
  //           .setColor(client.config.color)
  //           .setAuthor({
  //             name: "Vote For Avon",
  //             iconURL: interaction.guild.iconURL({ dynamic: true }),
  //           })
  //           .setDescription(
  //             `- <:GZ_Announce_Side_Cyan:1287335673610637312> This Feature Is Only Available To [**Voters**](${client.config.support}) Of Avon, You Can Buy Premium To Unlock This Feature`
  //           ),
  //       ],
  //       components: [
  //         new ActionRowBuilder().addComponents(
  //           new ButtonBuilder()
  //             .setURL(client.config.vote)
  //             .setLabel("Vote Me")
  //             .setEmoji("1012977248250376222")
  //             .setStyle(client.btn.green)
  //         ),
  //       ],
  //       ephemeral: true,
  //     });
  //   }
  // } catch (error) {
  //   return await interaction.reply({
  //     content: "An error occurred while checking your vote status",
  //     ephemeral: true,
  //   });
  // }
  try {
    const [guildData, userDb, player] = await Promise.all([
      guildSchema.findOne({ id: interaction.guildId }),
      userSchema.findOne({ id: interaction.user.id }),
      client.kazagumo.players.get(interaction.guildId),
    ]);
    if (!guildData?.musicInvitesEnabled) {
      return await ctx(
        interaction,
        "Music Invites are **disabled** in this server."
      );
    }
    const memberVC = interaction.member.voice.channel;
    if (!memberVC) {
      return await ctx(
        interaction,
        "You need to be in a **Voice Channel** to invite others."
      );
    }
    if (player && interaction.member.voice.channelId !== player.voiceId) {
      return await ctx(
        interaction,
        `You need to be in <#${player.voiceId}> to invite others.`
      );
    }
    if (
      guildData.inviteRoleId &&
      !interaction.member.roles.cache.has(guildData.inviteRoleId)
    ) {
      return await ctx(
        interaction,
        `You need the <@&${guildData.inviteRoleId}> role to invite others.`
      );
    }
    if (userDb?.invitesCooldown && Date.now() < userDb.invitesCooldown) {
      const remainingTime = Math.ceil(
        (userDb.invitesCooldown - Date.now()) / 1000
      );
      return await ctx(
        interaction,
        `You're on cooldown! Please wait **${remainingTime}** seconds before sending another invite.`
      );
    }
    const userSelectMenu = new UserSelectMenuBuilder()
      .setCustomId("music_invite_user_select")
      .setPlaceholder("Select a friend to invite")
      .setMinValues(1)
      .setMaxValues(1);
    const row = new ActionRowBuilder().addComponents(userSelectMenu);
    const response = await interaction.reply({
      content: "> Search Your Friends To Invite",
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });
    const collector = response.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      try {
        await i.deferUpdate();
        const tgr = i.values[0];
        const [targetUser, targetMember] = await Promise.all([
          client.users.fetch(tgr),
          interaction.guild.members.fetch(tgr),
        ]);
        if (targetUser.bot) {
          return await i.editReply({
            content: `Fk Bro, You Can't Invite Bots`,
            components: [],
          });
        }
        if (
          targetMember.voice &&
          targetMember.voice.channelId === memberVC.id
        ) {
          return await i.editReply({
            content: `**${targetUser.globalName}** is already in **${memberVC.name}**!`,
            components: [],
          });
        }
        try {
          let channellink = `https://discord.com/channels/${interaction.guildId}/${memberVC.id}`;
          const em = new EmbedBuilder()
            .setColor(client.config.color)
            .setTitle(`<a:Playing:1012978822137794631> Avon Music Invite`)
            .setURL(`https://discord.gg/m2cNczR6su`)
            .setThumbnail(player.queue.current.thumbnail)
            .setDescription(
              `<a:DYN_Walking:1068052283163680790> **${interaction.user.globalName}** has invited you to join **${memberVC.name}** Music Party in **${interaction.guild.name}**\n\nPlaying :  [${player.queue.current.title}](${channellink}) by ${player.queue.current.author}`
            )
            .addFields(
              { name: "Server", value: interaction.guild.name, inline: true },
              {
                name: "Invited By",
                value: `${interaction.user.globalName}(ID: ${interaction.user.id})`,
                inline: true,
              }
            );
          await targetUser
            .send({
              embeds: [em],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setLabel("Join Channel")
                    .setEmoji("1037753119863476284")
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                      `discord://-/channels/${interaction.guildId}/${memberVC.id}`
                    ),
                  new ButtonBuilder()
                    .setLabel("Report")
                    .setEmoji("1301812047671066684")
                    .setStyle(ButtonStyle.Link)
                    .setURL(client.config.support)
                ),
              ],
            })
            .catch((e) => {
              throw e;
            });
          if (userDb) {
            userDb.invitesCooldown = Date.now() + 30000;
            await userDb.save();
          }
          await i.editReply({
            content: `\`✅\` Successfully sent an invite to **${targetUser.globalName}**`,
            components: [],
          });
        } catch (dmError) {
          await i.editReply({
            content: `I couldn't send a DM to **${targetUser.globalName}**`,
            components: [],
          });
        }
      } catch (error) {
        await handleCollectorError(i, error);
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time" && response.editable) {
        await response.edit({
          content: "`⏳` The invite selection timed out.",
          components: [],
        });
      }
    });
  } catch (error) {
    console.error("Music Invite Error:", error);
    await err(interaction, error);
  }
}
async function ctx(interaction, description) {
  const embed = new EmbedBuilder()
    .setColor(interaction.client.config.color)
    .setAuthor({
      name: "Music Controller",
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    })
    .setDescription(description);
  return await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function handleCollectorError(interaction, error) {
  console.error("Collector Error:", error);
  await interaction.editReply({
    content: `\`❌\` An error occurred while processing your request.`,
    components: [],
  });
}

async function err(interaction, error) {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      content: `\`❌\` An error occurred while processing your request.`,
      components: [],
    });
  } else {
    await interaction.reply({
      content: `\`❌\` An error occurred while processing your request.`,
      ephemeral: true,
    });
  }
}

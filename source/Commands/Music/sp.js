const {
  ActionRowBuilder,
  ButtonBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { getLyrics } = require("genius-lyrics-api");
const api = "XQBi-Wyb2XsdU0ajdnBnzhpQHK5G0lc9dbeTpc7Zql8v9zvYBCaFavT-66M42oZN";
const SpotiPro = require("spoti-pro");
const spotify = new SpotiPro(
  "83c98500a89a4a5eae6fa819643644b8",
  "b2627d1bf6c846d98e102fe58e656892",
  { cacheEnabled: true }
);
const axios = require("axios");
const { avonRecommendations } = require("../../Handlers/AvonRec");

module.exports = {
  name: "play1",
  aliases: ["p1"],
  category: "Music",
  desc: "Play a song of your favorite choice",
  dev: false,
  options: {
    owner: false,
    inVc: true,
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
      if (!message.member.voice.channel) {
        const payload = {
          content: "You need to be in a **voice channel** to play music.",
        };
        return client.message.send(message, payload);
      }

      const query = args.join(" ");
      if (!query) {
        const payload = {
          content:
            "Please provide a song name or URL to play. Example: `play Faded`",
        };
        return await client.message.send(message, payload);
      }

      const urlRegex =
        /^((?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)+[\w]{2,63}(?:\/[\w-\./?%&=]*)?)$/i;
      if (!urlRegex.test(query)) {
        await message.channel.sendTyping();
        const songs = await searchSongs(client, query, 11, message);
        if (!songs.length) {
          const payload = {
            content: "No songs found for the given query.",
          };
          return client.message.send(message, payload);
        }
        const msg = await sendInitialMessage(message, songs, 0);
        const collector = await createCollector(msg, message.author.id);
        handleCollector(collector, msg, songs, message, client);
      } else {
        const track = await client.kazagumo.search(query, {
          requester: message.author,
        });
        if (!track) {
          const payload = {
            content: "No songs found for the given query.",
          };
          return client.message.send(message, payload);
        }

        const player =
          client.kazagumo.getPlayer(message.guild.id) ||
          (await client.kazagumo.createPlayer({
            guildId: message.guild.id,
            textId: message.channel.id,
            voiceId: message.member.voice.channel.id,
            shardId: message.guild.shardId,
            deaf: true,
          }));

        player.queue.add(track.tracks[0]);
        if (!player.playing && !player.paused) {
          try {
            await player.play();
          } catch (error) {
            console.error("Error playing track:", error);
            return client.message.send(message, {
              content:
                "An error occurred while trying to play the track. Please try again later.",
            });
          }
        }

        const embed = createAddedToQueueEmbed(track.tracks[0], message, client);
        return client.message.send(message, { embeds: [embed] });
      }
    } catch (error) {
      console.error("Error in play command:", error);
      return client.message.send(message, {
        content: "An unexpected error occurred. Please try again later.",
      });
    }
  },
};

async function searchSongs(client, query, limit, message) {
  try {
    const youtubeResults = await client.kazagumo.search(query, {
      source: "ytsearch:",
      requester: message.author,
    });
    if (!youtubeResults.tracks || youtubeResults.tracks.length === 0) return [];
    const firstSong = youtubeResults.tracks[0];
    const secondSong = youtubeResults.tracks[1];
    const seedTrack = {
      id: firstSong.identifier,
      name: firstSong.title,
      artist: firstSong.author,
    };
    const avonRex = await avonRecommendations(seedTrack, limit - 2);
    const allTracks = await Promise.all(
      avonRex.map(async (rec) => {
        const searchQuery = `${rec.name} ${rec.artist}`;
        const result = await client.kazagumo.search(searchQuery, {
          requester: message.author,
        });
        return result.tracks[0];
      })
    );
    const res = [firstSong, ...allTracks.filter(Boolean), secondSong].slice(
      0,
      limit
    );
    return res;
  } catch (error) {
    console.error("Error in searchSongs:", error);
    return [];
  }
}
// const spotifyUrl = await getSpotifyUrl(firstSong.title);
// if (!spotifyUrl) return youtubeResults.tracks.slice(0, 2);
//  // const recommendations = await getRecommendations(spotifyUrl);
//   if (!recommendations || recommendations.length === 0)
//     return youtubeResults.tracks.slice(0, 2);
//   const spotifyResults = await Promise.all(
//     recommendations.slice(0, 8).map(async (track) => {
//       const searchQuery = `${track.name} ${track.artists[0].name}`;
//       let random = [track.external_url, searchQuery];
//       let query = random[Math.floor(Math.random() * random.length)];
//       const result = await client.kazagumo.search(query, {
//         requester: message.author,
//       });
//       return result.tracks[0];
//     })
//   );
// return [firstSong, ...spotifyResults.filter(Boolean), secondSong].slice(
//   0,
//   limit
// );
//   } catch (error) {
//     console.error("Error in searchSongs:", error);
//     return [];
//   }
// }

async function sendInitialMessage(message, songs, selectedIndex) {
  const attachment = new AttachmentBuilder(
    await createSongListImage(songs, selectedIndex),
    { name: "tejas-songs.png" }
  );
  const selectMenu = await createStringSelectMenuHandlePlay(
    songs,
    selectedIndex,
    30
  );
  const components = [
    new ActionRowBuilder().addComponents(selectMenu),
    createButtonRow1(),
    createButtonRow2(),
  ];
  return message.channel.send({
    files: [attachment],
    components,
  });
}

function createCollector(msg, authorId) {
  const filter = (interaction) => interaction.user.id === authorId;
  return msg.createMessageComponentCollector({
    filter,
    time: 300000,
  });
}

function handleCollector(collector, msg, songs, message, client) {
  let selectedIndex = 0;
  let viewMode = "list";

  collector.on("collect", async (i) => {
    try {
      if (i.user.id !== message.author.id)
        return i.reply({
          content: "This is not your command Play Menu",
          ephemeral: true,
        });
      await i.deferUpdate();
      if (i.isStringSelectMenu()) {
        const selectedSong = songs.find((song) => song.uri === i.values[0]);
        if (selectedSong) {
          await handlePlay(client, message, selectedSong, msg);
          return;
        }
      }
      switch (i.customId) {
        case "up":
          if (selectedIndex === 0) return;
          if (selectedIndex > 0) selectedIndex--;
          break;
        case "down":
          if (selectedIndex === songs.length - 1) return;
          if (selectedIndex < songs.length - 1) selectedIndex++;
          break;
        case "view":
          viewMode = "details";
          break;
        case "back":
          viewMode = "list";
          break;
        case "play":
          await handlePlay(client, message, songs[selectedIndex], msg);
          return;
        case "lyrics":
          await handleLyrics(
            songs[selectedIndex],
            msg,
            message.author ? message.author : i.user
          );
          return;
        default:
          break;
      }
      await updateMessage(msg, songs, selectedIndex, viewMode, message.author);
    } catch (error) {
      console.error("Error in collector:", error);
      await msg.channel.send(
        "An error occurred while processing your request. Please try again."
      );
    }
  });

  collector.on("end", () => handleCollectorEnd(msg));
}

async function updateMessage(msg, songs, selectedIndex, viewMode, author) {
  try {
    const selectMenu = await createStringSelectMenuHandlePlay(
      songs,
      selectedIndex,
      30
    );
    if (viewMode === "list") {
      const attachment = new AttachmentBuilder(
        await createSongListImage(songs, selectedIndex),
        { name: "tejas_songs.png" }
      );
      await msg.edit({
        files: [attachment],
        embeds: [],
        components: [
          new ActionRowBuilder().addComponents(selectMenu),
          createButtonRow1(),
          createButtonRow2(),
        ],
      });
    } else {
      const embed = createSongDetailsEmbed(songs[selectedIndex], author);
      await msg.edit({
        embeds: [embed],
        files: [],
        components: [createDetailsButtonRow()],
      });
    }
  } catch (error) {
    console.error("Error updating message:", error);
    await msg.channel.send(
      "An error occurred while updating the message. Please try the command again."
    );
  }
}

async function handlePlay(client, message, song, msg) {
  await playSong(client, message, song);
  const addedToQueueEmbed = createAddedToQueueEmbed(song, message, client);
  await msg.edit({ embeds: [addedToQueueEmbed], components: [], files: [] });
}

async function handleLyrics(song, msg, user) {
  let lSng = await spotify.search({ query: song.title, type: "track" });
  let artist = lSng.artist ? lSng.artist : "Alan Walker";
  let realSong = lSng.title ? lSng.title : "Faded";
  let options = {
    apiKey: api,
    title: realSong,
    artist: artist,
    optimizeQuery: true,
  };
  getLyrics(options)
    .then((lyrics) => {
      if (!lyrics || lyrics.trim() === "") {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `No Lyrics Found For ${song.title} By ${artist}`,
            iconURL: user.displayAvatarURL(),
          })
          .setColor("Red");
        return msg.edit({ embeds: [embed], components: [createBackButton()] });
      }
      const lyricsEmbed = createLyricsEmbed(song, lyrics, user, artist);
      return msg.edit({
        embeds: [lyricsEmbed],
        components: [createBackButton()],
        files: [],
      });
    })
    .catch((err) => {
      console.error("Error fetching lyrics:", err);
      return msg.edit({
        content: "An error occurred while fetching lyrics.",
        embeds: [],
        files: [],
        components: [createBackButton()],
      });
    });
}

async function handleCollectorEnd(msg) {
  const disabledComponents = msg.components.map((row) =>
    ActionRowBuilder.from(row).setComponents(
      row.components.map((button) =>
        ButtonBuilder.from(button).setDisabled(true)
      )
    )
  );
  await msg.edit({ components: disabledComponents });
}

async function createSongListImage(songs, selectedIndex) {
  const canvas = createCanvas(500, 700);
  const ctx = canvas.getContext("2d");
  drawBackground(ctx, canvas);
  // drawDecorativeLines(ctx, canvas);
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.stroke();
  drawTitle(ctx, canvas);
  drawSongList(ctx, songs, selectedIndex, canvas);
  //await drawMusicalNotes(ctx, canvas);
  return canvas.toBuffer();
}

function drawBackground(ctx, canvas) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(1, "#16213e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// function drawDecorativeLines(ctx, canvas) {
//   ctx.beginPath();
//   for (let i = 0; i < 20; i++) {
//     ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
//     ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
//   }
//   ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
//   ctx.stroke();
// }

function drawTitle(ctx, canvas) {
  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("Avon Music System", canvas.width / 2, 50);
  ctx.font = "18px Arial";
  ctx.fillStyle = "#cccccc";
  ctx.fillText("Avon Music - The Perfect Music Partner", canvas.width / 2, 80);
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
}

function drawSongList(ctx, songs, selectedIndex, canvas) {
  songs.forEach((song, index) => {
    const y = 120 + index * 55;
    if (index === selectedIndex) {
      drawHighlightedSong(ctx, y, canvas);
    } else {
      drawNormalSong(ctx, y, canvas);
    }
    ctx.fillText(`${index + 1}. ${truncateString(song.title, 29)}`, 29, y + 29);
  });
}

function drawHighlightedSong(ctx, y, canvas) {
  const highlightGradient = ctx.createLinearGradient(
    20,
    y,
    canvas.width - 20,
    y + 45
  );
  highlightGradient.addColorStop(0, "#ff7eb3");
  highlightGradient.addColorStop(1, "#7eb3ff");
  ctx.fillStyle = highlightGradient;
  ctx.fillRect(20, y, canvas.width - 40, 45);
  ctx.fillStyle = "#000000";
}

function drawNormalSong(ctx, y, canvas) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(20, y, canvas.width - 40, 45);
  ctx.fillStyle = "#ffffff";
}

async function drawMusicalNotes(ctx, canvas) {
  try {
    //  const noteIcon = await loadImage("");
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
      ctx.drawImage(
        noteIcon,
        Math.random() * (canvas.width - 30),
        Math.random() * (canvas.height - 30),
        30,
        30
      );
    }
    ctx.globalAlpha = 1;
  } catch (err) {
    console.error("Error loading note icon:", err);
  }
}

function createAddedToQueueEmbed(song, message, client) {
  const user = message.author;
  const player = client.kazagumo.players.get(message.guildId);
  const embed = new EmbedBuilder()
    .setAuthor({
      name: player.playing ? "Added to Queue" : "Ready to Play",
      iconURL: user.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(
      `[${song.title ?? "Unknow Avon track"}](${
        song.uri ?? "https://www.google.com"
      }) ( <@${user.id}> )`
    )
    .setColor("#0099ff")
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: "Duration", value: formatDuration(song.length), inline: true },
      { name: "Artist", value: song.author, inline: true }
    );
  const tezz = player.queue.current.length - player.position;
  const sia = player.queue
    .slice(player.position + 1)
    .reduce((acc, song) => acc + song.length, 0);
  const timeRemaingForNextSong = tezz + sia;
  if (player.playing && player.queue.size > 0) {
    embed.addFields({
      name: "Position in Queue",
      value: `#${player.queue.size} Next Track in ${formatDuration(
        timeRemaingForNextSong
      )}`,
      inline: true,
    });
  }
  return embed;
}

function createButtonRow1() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("up").setLabel("⬆").setStyle(1),
    new ButtonBuilder()
      .setCustomId("play")
      .setEmoji("1131847088884437063")
      .setLabel("Play Track")
      .setStyle(3),
    new ButtonBuilder().setCustomId("view").setLabel("Details").setStyle(2),
    new ButtonBuilder().setCustomId("Lyrics").setLabel("Lyrics").setStyle(2)
  );
}

function createButtonRow2() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("down").setLabel("⬇").setStyle(1),
    new ButtonBuilder()
      .setURL("https://discord.gg/S5zmG2RtJ3")
      .setStyle(5)
      .setLabel("Freemium")
      .setEmoji("1009435997534175323"),
    new ButtonBuilder()
      .setURL(
        `https://discord.com/oauth2/authorize?client_id=904317141866647592&permissions=8&scope=bot%20applications.commands`
      )
      .setStyle(5)
      .setLabel("Invite Me")
      .setEmoji("1077942469108445297")
  );
}

function createDetailsButtonRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("back")
      .setLabel("Back to List")
      .setStyle(1),
    new ButtonBuilder()
      .setCustomId("lyrics")
      .setLabel("View Lyrics")
      .setStyle(2),
    new ButtonBuilder()
      .setCustomId("play")
      .setEmoji("1131847088884437063")
      .setLabel("Play Track")
      .setStyle(3)
  );
}

function createBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back").setLabel("Back to List").setStyle(1)
  );
}

async function playSong(client, message, song) {
  const player = await client.kazagumo.createPlayer({
    guildId: message.guild.id,
    textId: message.channel.id,
    voiceId: message.member.voice.channel.id,
    shardId: message.guild.shardId,
    deaf: true,
  });
  player.queue.add(song);
  if (!player.playing && !player.paused) {
    await player.play();
  }
}

function formatDuration(duration) {
  const hours = Math.floor(duration / 3600000);
  const minutes = Math.floor((duration % 3600000) / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function createSongDetailsEmbed(song, user) {
  return new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle(song.title)
    .setURL(song.uri)
    .setDescription(`- **Duration:** ${formatDuration(song.length)}`)
    .setAuthor({ name: `Artist - ${song.author}` })
    .setThumbnail(song.thumbnail)
    .setFooter({
      text: `Requested by ${user.username}`,
      iconURL: user.displayAvatarURL(),
    })
    .setTimestamp();
}

function createLyricsEmbed(song, lyrics, user, artist) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Lyrics For ${song.title} By ${artist}`,
      iconURL: user.displayAvatarURL(),
    })
    .setDescription(lyrics.slice(0, 4096))
    .setColor("#0099ff")
    .setFooter({
      text: `Requested by ${user.globalName}`,
      iconURL: user.displayAvatarURL(),
    });
  return embed;
}

function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
}
async function createStringSelectMenuHandlePlay(
  songs,
  selectedIndex,
  limitWords = 100
) {
  const options = songs.map((song, index) => {
    return {
      label:
        song.title.length > limitWords
          ? song.title.slice(0, 30) + "..."
          : song.title,
      value: song.uri.length > 100 ? song.uri.slice(0, 97) + "..." : song.uri,
      default: index === selectedIndex,
    };
  });
  return new StringSelectMenuBuilder()
    .setCustomId("select")
    .setPlaceholder("» Select a song to play")
    .addOptions(options);
}

async function getSpotifyUrl(trackName) {
  try {
    const accessToken = await getSpotifyToken();
    const response = await axios.get("https://api.spotify.com/v1/search", {
      params: {
        q: trackName,
        type: "track",
        limit: 1,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (
      !response.data ||
      !response.data.tracks ||
      !response.data.tracks.items ||
      response.data.tracks.items.length === 0
    ) {
      console.log("No tracks found for:", trackName);
      return null;
    }
    return response.data.tracks.items[0].external_urls.spotify;
  } catch (error) {
    console.error(
      "Error getting Spotify URL:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function getRecommendations(trackUrl) {
  try {
    const baseApiUrl = "https://api.spotify.com/v1/recommendations";
    const accessToken = await getSpotifyToken();
    const id = await urlFormat(trackUrl);

    if (!id) {
      throw new Error("Invalid track URL");
    }

    const response = await axios.get(baseApiUrl, {
      params: {
        seed_tracks: id,
        limit: 9,
        market: "IN",
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (
      !response.data ||
      !response.data.tracks ||
      response.data.tracks.length === 0
    ) {
      console.log("No recommendations found for:", trackUrl);
    }

    return response.data.tracks.map((track) => ({
      name: track.name,
      artists: track.artists.map((artist) => artist.name),
      uri: track.uri,
      external_url: track.external_urls.spotify,
    }));
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    if (error.response) {
      throw new Error(
        `Error | Getting Recommendations from Spotify: ${error.response.data.error.message}`
      );
    }
    throw new Error(
      `Error | Getting Recommendations from Spotify: ${error.message}`
    );
  }
}

async function getSpotifyToken() {
  const clientId = "83c98500a89a4a5eae6fa819643644b8";
  const clientSecret = "b2627d1bf6c846d98e102fe58e656892";
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
}
function urlFormat(url) {
  const urlParts = url.split("/");
  const idPart = urlParts[urlParts.length - 1];
  const id = idPart.split("?")[0];
  return id;
}

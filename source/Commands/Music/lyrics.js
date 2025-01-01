const axios = require('axios');
const { getLyrics } = require("genius-lyrics-api");
const api = "XQBi-Wyb2XsdU0ajdnBnzhpQHK5G0lc9dbeTpc7Zql8v9zvYBCaFavT-66M42oZN";
const musixmatchApi = "771d5d35b79464903df01f5f7f7fdc19";
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "lyrics",
  aliases: ["ly"],
  category: "Music",
  desc: "Get the Lyrics of the Current Playing Song",dev: false,
  options: {
    owner: false,
    inVc: true,
    sameVc: true,
    player: {
      playing: true,
      active: true,
    },
    premium: false,
    vote: true,
  },

  run: async ({ client, message, args }) => {
    try {
      let player = client.kazagumo.players.get(message.guild.id);

      if (!message.member.voice.channel) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `You need to be in a voice channel to use this command`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(client.config.color);
        return message.channel
          .send({ embeds: [embed] })
          .then((x) => setTimeout(() => x.delete(), 5000));
      }
      if (!player || !player.queue.current) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: "There is no song playing",
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor("Red");
        return message.channel
          .send({ embeds: [embed] })
          .then((x) => setTimeout(() => x.delete(), 5000));
        }
      await message.channel.sendTyping();
      let song = player.queue.current.title.length > 50
        ? player.queue.current.title.slice(0, 50)
        : player.queue.current.title;
      let artist = player.queue.current.author;
      let spotifySearchResult = await client.spotify.searchTrack(song);
      if (spotifySearchResult) {
        artist = spotifySearchResult.artist || artist;
        song = spotifySearchResult.title || song;
      }
      const options = {
        apiKey: api,
        title: song,
        artist: artist,
        optimizeQuery: true,
      };
      let lyrics = await getLyrics(options);
      if (!lyrics || lyrics.trim() === "") {
        lyrics = await mux(song, artist);
        if (!lyrics || lyrics.trim() === "") {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: `No Lyrics Found For ${song} By ${artist}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setColor("Red");
          return message.channel.send({ embeds: [embed] });
        }
      }
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `Lyrics - ${song} By ${artist}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(lyrics.slice(0, 4096))
        .setColor("DarkOrange");
      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `An error occurred while fetching the lyrics`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor("Red");
      return message.channel.send({ embeds: [embed] });
    }
  },
};
async function mux(song, artist) {
  try {
    const response = await axios.get(
      `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get`, {
        params: {
          q_track: song,
          q_artist: artist,
          apikey: musixmatchApi,
        },
      }
    );
    if (response.data && response.data.message.body.lyrics) {
      return response.data.message.body.lyrics.lyrics_body;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Musixmatch API error: ${error}`);
    return null;
  }
}

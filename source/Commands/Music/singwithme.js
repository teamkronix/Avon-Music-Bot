const axios = require("axios");
const { EmbedBuilder } = require("discord.js");

class LyricsSynchronizer {
  constructor(client, player) {
    this.client = client;
    this.player = player;
    this.lyrics = [];
    this.currentLineIndex = 0;
    this.syncInterval = null;
    this.lyricsEmbed = null;
    this.lyricsMessage = null;
    this.lastUpdateTime = 0;
    this.updateThreshold = 1000;
  }
  async fetchLyrics(track) {
    try {
      const response = await axios.get(
        `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get`,
        {
          params: {
            q_track: track.title,
            q_artist: track.author,
            apikey: "771d5d35b79464903df01f5f7f7fdc19",
          },
        }
      );

      if (response.data.message.header.status_code === 200) {
        const rawLyrics = response.data.message.body.lyrics.lyrics_body;
        this.lyrics = this.parseLyrics(rawLyrics, track.length);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      return false;
    }
  }

  parseLyrics(rawLyrics, trackDuration) {
    const lines = rawLyrics.split("\n").filter((line) => line.trim() !== "");
    const totalLines = lines.length;
    const timePerLine = trackDuration / totalLines;

    return lines.map((line, index) => ({
      text: line,
      startTime: index * timePerLine,
      endTime: (index + 1) * timePerLine,
    }));
  }

  onTrackEnd() {
    this.stop();
    this.lyricsEmbed.setDescription(
      "Sing With Me Session Has Ended! It was Awesome Experience"
    );
    this.lyricsMessage
      .edit({ embeds: [this.lyricsEmbed] })
      .catch(console.error);
  }

  start(trackLength) {
    this.stop();
    this.syncInterval = setInterval(() => this.syncLyrics(), 250);
    setTimeout(() => this.onTrackEnd(), trackLength);
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.currentLineIndex = 0;
  }

  syncLyrics() {
    const currentPosition = this.player.position;
    const newIndex = this.findCurrentLyricIndex(currentPosition);

    if (
      newIndex !== this.currentLineIndex &&
      Date.now() - this.lastUpdateTime > this.updateThreshold
    ) {
      this.currentLineIndex = newIndex;
      this.updateLyricsDisplay();
      this.lastUpdateTime = Date.now();
    }
  }

  findCurrentLyricIndex(currentPosition) {
    return this.lyrics.findIndex(
      (line) =>
        currentPosition >= line.startTime && currentPosition < line.endTime
    );
  }

  updateLyricsDisplay() {
    const visibleLines = 5;
    const startIndex = Math.max(
      0,
      this.currentLineIndex - Math.floor(visibleLines / 2)
    );
    const endIndex = Math.min(this.lyrics.length, startIndex + visibleLines);

    const lyricsText = this.lyrics
      .slice(startIndex, endIndex)
      .map((line, index) => {
        const relativeIndex = index + startIndex - this.currentLineIndex;
        if (relativeIndex === 0 || relativeIndex === 1) {
          return `**> ${line.text} <**`;
        }
        return line.text;
      })
      .join("\n");

    this.lyricsEmbed.setDescription(lyricsText);
    this.lyricsMessage
      .edit({ embeds: [this.lyricsEmbed] })
      .catch(console.error);
  }

  async initializeLyricsDisplay(channel) {
    this.lyricsEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Avon Lyrics")
      .setDescription("Loading lyrics...")
      .setFooter({ text: "Powered by Musixmatch x Avon" });

    this.lyricsMessage = await channel.send({ embeds: [this.lyricsEmbed] });
  }
}

module.exports = {
  name: "singwithme",
  aliases: ["swm"],
  category: "Music",
  permission: "",
  desc: "Sing With Lyrics",
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
    vote: true,
  },

  run: async ({ client, message, args }) => {
    try {
      let player = await client.kazagumo.players.get(message.guild.id);
      if (!player) {
        await client.music.CreateAvonPlayer(message);
        player = await client.kazagumo.players.get(message.guild.id);
      }
      if (player.playing || player.queue.size > 0) {
        await client.music.Stop(message);
        const payload = {
          content: "Please Disconnect Me if Any Music is Playing",
        };
        await client.message.send(message, payload);
      }
      await message.channel.sendTyping();
      const query = args.join(" ");
      if (!query) {
        return await client.message.send(
          message,
          "Please provide a song name to search for lyrics sing with me session"
        );
      }
      const lyricsClient = new LyricsSynchronizer(client, player);
      const searchResult = await player.search(query, {
        requester: message.author,
        source: "ytmsearch:",
      });

      if (!searchResult || searchResult.tracks.length === 0) {
        return await client.message.send(
          message,
          "No tracks found for your query"
        );
      }
      const track = searchResult.tracks[0];
      const lyricsFound = await lyricsClient.fetchLyrics(track);
      if (!lyricsFound) {
        return await client.message.send(
          message,
          "Lyrics not found for this track."
        );
      }
      await lyricsClient.initializeLyricsDisplay(message.channel);
      lyricsClient.start(track.length);
      player.queue.add(track);
      if (!player.playing) player.play();
      await client.kazagumo.on(
        "trackEnd",
        lyricsClient.onTrackEnd.bind(lyricsClient)
      );
      await client.kazagumo.on(
        "trackStuck",
        lyricsClient.onTrackEnd.bind(lyricsClient)
      );
      const interval = setInterval(() => {
        if (player.playing && player.queue.current === track) {
          return;
        }
        clearInterval(interval);
        lyricsClient.onTrackEnd();
      }, 1000);
    } catch (error) {
      console.error("Error in singwithme command:", error);
      await client.message.send(
        message,
        "An error occurred while processing your request."
      );
    }
  },
};
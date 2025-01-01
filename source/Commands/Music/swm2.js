const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

class LyricsSynchronizer {
  constructor(client, player) {
    this.client = client;
    this.player = player;
    this.lyrics = [];
    this.currentIndex = 0;
    this.lyricsEmbed = null;
    this.lyricsMessage = null;
    this.updateInterval = null;
  }

  async fetchLyrics(track) {
    try {
      const response = await axios.get('https://api.musixmatch.com/ws/1.1/matcher.lyrics.get', {
        params: {
          q_track: track.title,
          q_artist: track.author,
          apikey: '771d5d35b79464903df01f5f7f7fdc19'
        }
      });

      if (response.data.message.header.status_code === 200) {
        const rawLyrics = response.data.message.body.lyrics.lyrics_body;
        this.lyrics = this.parseLyrics(rawLyrics, track.length);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      return false;
    }
  }

  parseLyrics(rawLyrics, trackDuration) {
    const lines = rawLyrics.split('\n').filter(line => line.trim() !== '');
    const timePerLine = trackDuration / lines.length;
    return lines.map((line, index) => ({
      text: line,
      startTime: index * timePerLine,
      endTime: (index + 1) * timePerLine
    }));
  }

  start() {
    this.updateInterval = setInterval(() => this.updateLyrics(), 250);
  }

  stop() {
    clearInterval(this.updateInterval);
    this.currentIndex = 0;
  }

  updateLyrics() {
    const currentTime = this.player.position;
    const newIndex = this.lyrics.findIndex(line => currentTime >= line.startTime && currentTime < line.endTime);
    
    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const visibleLines = 10;
    const startIndex = Math.max(0, this.currentIndex - 4);
    const endIndex = Math.min(this.lyrics.length, startIndex + visibleLines);

    const lyricsText = this.lyrics.slice(startIndex, endIndex).map((line, index) => {
      const relativeIndex = index + startIndex - this.currentIndex;
      if (relativeIndex >= 0 && relativeIndex < 3) {
        return `**${line.text}**`;
      }
      return line.text;
    }).join('\n');

    this.lyricsEmbed.setDescription(lyricsText);
    this.lyricsMessage.edit({ embeds: [this.lyricsEmbed] }).catch(console.error);
  }

  async initializeDisplay(channel, track) {
    this.lyricsEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${track.title} - ${track.author}`)
      .setDescription('Loading lyrics...')
      .setFooter({ text: 'Powered by Musixmatch x Avon' });

    this.lyricsMessage = await channel.send({ embeds: [this.lyricsEmbed] });
  }
}

module.exports = {
    name: "singwithme2",
    aliases: ["swm2"],
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
      vote: false,
    },
  run: async ({ client, message, args }) => {
    try {
      const query = args.join(' ');
      if (!query) return client.message.send(message, 'Please provide a song name.');

      let player = client.kazagumo.players.get(message.guild.id);
      if (!player) {
        await client.music.CreateAvonPlayer(message);
        player = client.kazagumo.players.get(message.guild.id);
      }

      if (player.playing) await client.music.Stop(message);

      const searchResult = await player.search(query, { requester: message.author });
      if (!searchResult.tracks.length) return client.message.send(message, 'No tracks found.');

      const track = searchResult.tracks[0];
      const lyricsSync = new LyricsSynchronizer(client, player);
      
      const lyricsFound = await lyricsSync.fetchLyrics(track);
      if (!lyricsFound) return client.message.send(message, 'Lyrics not found for this track.');

      await lyricsSync.initializeDisplay(message.channel, track);
      lyricsSync.start();

      player.queue.add(track);
      if (!player.playing) player.play();

      const cleanup = () => {
        lyricsSync.stop();
        client.kazagumo.off('playerEnd', cleanup);
        client.kazagumo.off('playerEmpty', cleanup);
      };

      client.kazagumo.on('playerEnd', cleanup);
      client.kazagumo.on('playerEmpty', cleanup);

    } catch (error) {
      console.error('Error in singwithme command:', error);
      client.message.send(message, 'An error occurred while processing your request.');
    }
  },
};
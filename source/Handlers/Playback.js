const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionType,
  ComponentType,
} = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const Fuse = require("fuse.js");

module.exports = class Music {
  constructor(client) {
    this.client = client;
  }
  Name(ctx) {
    if (ctx.type === InteractionType.ApplicationCommand) {
      return ctx.user.username;
    } else {
      return ctx.author.globalName;
    }
  }
  async ctxSend(ctx, object) {
    if (ctx.type === InteractionType.ApplicationCommand) {
      return ctx.editReply(object);
    } else {
      return ctx.reply(object);
    }
  }
  async handleError(ctx, err) {
    if (ctx.type === InteractionType.ApplicationCommand) {
      await ctx.editReply({
        content:
          "- An error occurred while playing the song. Try Reporting it to the Developer [Team Avon](<https://discord.gg/S5zmG2RtJ3>)"
      });
      return this.console.error(err + " " + err.stack);
    } else {
      await ctx.reply({
        content:
          "- An error occurred while playing the song. Try Reporting it to the Developer [Team Avon](<https://discord.gg/S5zmG2RtJ3>)"
      });
      return this.console.error(err + " " + err.stack);
    }
  }

  async CreateAvonPlayer(ctx) {
    try {
      const { channel } = ctx.member.voice;
      const player = await this.client.kazagumo.createPlayer({
        guildId: ctx.guild.id,
        voiceId: channel.id,
        textId: ctx.channel.id,
        deaf: true,
        shardId: ctx.guild.shardId,
      });
      return player;
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async searchSong(query) {
    try {
      const kazagumoResults = await this.kazagumoSearch(query);
      const webResults = await this.webSearch(query);
      const combinedResults = this.combineAndRankResults(
        kazagumoResults,
        webResults,
        query
      );
      return combinedResults[0];
    } catch (error) {
      console.error("Error in searchSong:", error);
      throw error;
    }
  }
  async kazagumoSearch(query) {
    try {
      const result = await this.client.kazagumo.search(query, {
        requester: this.client.user,
      });
      return result.tracks.map((track) => ({
        title: track.title,
        artist: track.author,
        url: track.uri,
        duration: track.length,
        source: "kazagumo",
      }));
    } catch (error) {
      console.error("Error in kazagumoSearch:", error);
      return [];
    }
  }

  async webSearch(query) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}+song`;
      const response = await axios.get(searchUrl);
      const html = await response.data;
      const $ = cheerio.load(html);
      const results = [];
      $(".g").each((i, elem) => {
        const titleElem = $(elem).find("h3.r > a");
        const title = titleElem.text();
        const url = titleElem.attr("href");
        const snippet = $(elem).find(".s .st").text();
        if (title && url) {
          results.push({
            title: title,
            url: url,
            snippet: snippet,
            source: "web",
          });
        }
      });

      return results;
    } catch (error) {
      console.error("Error in webSearch:", error);
      return [];
    }
  }

  combineAndRankResults(kazagumoResults, webResults, originalQuery) {
    const allResults = [...kazagumoResults, ...webResults];
    const fuse = new Fuse(allResults, {
      keys: ["title", "artist", "snippet"],
      includeScore: true,
      threshold: 0.4,
    });
    const fuzzyResults = fuse.search(originalQuery);
    const rankedResults = fuzzyResults.map((result) => {
      const item = result.item;
      let score = result.score;
      if (item.source === "kazagumo") {
        score *= 0.9;
      }
      if (item.duration) {
        const durationScore = Math.abs(item.duration - 240000) / 120000;
        score += durationScore * 0.1;
      }
      if (
        item.title &&
        (item.title.toLowerCase().includes("playlist") ||
          item.title.toLowerCase().includes("album"))
      ) {
        score += 0.2;
      }
      return { ...item, score };
    });
    rankedResults.sort((a, b) => a.score - b.score);

    return rankedResults;
  }
  async Play(ctx, query, source) {
    try {
      if (ctx.type === InteractionType.ApplicationCommand) {
        await ctx.deferReply();
      }
      if (ctx.type !== InteractionType.ApplicationCommand) {
        await ctx.channel.sendTyping();
      }
      if (!ctx.member.voice.channel) {
        const msg = `You Need To Be In A Voice Channel To Play Music!`;
        return this.ctxSend(ctx, { content: msg });
      }
      const player = await this.CreateAvonPlayer(ctx);
      if (player && player.voiceId !== ctx.member.voice.channel.id) {
        const msg = `**${
          this.client.user.username
        }** Is Already Playing Music In **${
          ctx.guild.channels.cache.get(player.voiceId).name
        }**`;
        return this.ctxSend(ctx, { content: msg });
      }
      if (
        player &&
        !player.playing &&
        player.voiceId !== ctx.member.voice.channel.id
      ) {
        const newChannel = ctx.guild.channels.cache.get(
          ctx.member.voice.channel.id
        );
        player.disconnect();
        player.setVoiceChannel(newChannel.id);
      }
      const songQuery = query;
      let requester;
      if (ctx.type === InteractionType.ApplicationCommand) {
        requester = ctx.user;
      } else {
        requester = ctx.author;
      }
      const result = await this.client.kazagumo.search(songQuery, {
        requester: requester,
        source: source ? source : "ytsearch:",
        engine: "youtube",
      });
      if (!result.tracks.length) {
        const msg = `No Tracks Were Found For Query \`${songQuery}\``;
        return await this.ctxSend(ctx, { content: msg });
      }
      async function timeRem(player) {
        const timeRemaining = player.queue.reduce((acc, track) => {
          return acc + track.length;
        }, 0);
        return timeRemaining;
      }
      if (result.type === "PLAYLIST") {
        if (player.queue.size > 0) {
          for (let track of result.tracks) player.queue.add(track);
        } else {
          player.queue.add(result.tracks);
        }
        if (!player.playing && !player.paused) player.play();
        if (player.playing && player.paused) player.pause(false);
        const playlistMsg = `- Loaded Playlist **${result.playlistName}** ( \`${result.tracks.length}\` ) Tracks Added To queue!`;
        return await this.ctxSend(ctx, { content: playlistMsg });
      } else {
        const title =
          result.tracks[0]?.title?.replace(/[^a-zA-Z0-9 ]/g, "") || "Untitled";
        const trackMsg = `- Enqueued [${this.slice(title, 50)}](<${
          result.tracks[0]?.uri
        }>) \`(${this.convertTime(result.tracks[0]?.length) || "Live"})\``;
        if (player.queue.size == 0 && !player.playing) {
          player.queue.add(result.tracks[0]);
          if (!player.playing && !player.paused) player.play();
          if (player.playing && player.paused) player.pause(false);
          return await this.ctxSend(ctx, { content: trackMsg });
        }
        if (player.queue.size == 0 && player.playing) {
          player.queue.add(result.tracks[0]);
          if (!player.playing && !player.paused) player.play();
          if (player.playing && player.paused) player.pause(false);
          return await this.ctxSend(ctx, { content: trackMsg });
        }
        const actionRow = new ActionRowBuilder();
        const button = new ButtonBuilder()
          .setLabel("Play Next")
          .setStyle(this.client.btn.green)
          .setCustomId("playnext");
        actionRow.addComponents(button);
        const newMsg = `${trackMsg} Adding To Queue In <t:${
          Math.floor(Date.now() / 1000) + 7
        }:R>`;
        const slashMsg = `**Added To Queue At Position #${
          player.queue.size + 1
        }**\n${trackMsg} | ${timeRem(player)}`;
        if (ctx.type === InteractionType.ApplicationCommand) {
          player.queue.add(result.tracks[0]);
          if (!player.playing && !player.paused) player.play();
          if (player.playing && player.paused) player.pause(false);
          return this.ctxSend(ctx, { content: slashMsg });
        }
        let obj = { content: newMsg, components: [actionRow] };
        const send = await this.ctxSend(ctx, obj).catch((err) =>
          this.console.error(err)
        );
        const filter = (button) =>
          button.user.id === ctx.author.id ? ctx.author.id : ctx.user.id;
        const collector = send.createMessageComponentCollector({
          filter,
          time: 5000,
        });
        collector.on("collect", async (button) => {
          if (button.user.id !== ctx.author.id)
            return button.reply({
              content: `This Play Next Button is for **${this.Name(
                ctx
              )}** Only!`,
              ephemeral: true,
            });
          if (button.customId === "playnext") {
            player.queue.splice(0, 0, result.tracks[0]);
            if (!player.playing && !player.paused) player.play();
            if (player.playing && player.paused) player.pause(false);
            const playNextMsg = `**Playing Next!**\n${trackMsg}`;
            await button.update({ content: playNextMsg, components: [] });
          }
        });
        collector.on("end", async (collected) => {
          if (!collected.size) {
            player.queue.add(result.tracks[0]);
            if (!player.playing && !player.paused) player.play();
            if (player.playing && player.paused) player.pause(false);
            const queuedMsg = `**Added To Queue At Position #${player.queue.size}**\n${trackMsg}`;
            if (send.type === InteractionType.ApplicationCommand) {
              await send.editReply({ content: queuedMsg, components: [] });
            }
            await send.edit({ content: queuedMsg, components: [] });
          }
        });
      }
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Skip(ctx) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player && !player.playing) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      player.skip();
      const newMsg = `<:tick:1258353310717706281> **${this.Name(
        ctx
      )}** has **Skipped** the track!`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Pause(ctx) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player && !player.playing) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player && player.paused) {
        const msg = `**${this.client.user.username}** Is Already Paused!`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      player.pause(true);
      const newMsg = `<:tick:1258353310717706281> **${this.Name(
        ctx
      )}** has **Paused** the current track!`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Resume(ctx) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (!player.paused) {
        const msg = `**${this.client.user.username}** Is Not Paused!`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      player.pause(false);
      const newMsg = `<:tick:1258353310717706281> **${this.Name(
        ctx
      )}** has **Resumed** the current track!`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Stop(ctx) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player && !player.playing) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      player.queue.clear();
      player.skip();
      const newMsg = `<:tick:1258353310717706281> **${this.Name(
        ctx
      )}** has **Stopped** the player!`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Disconnect(ctx) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      await player.destroy();
      // if (player) {
      //   player.disconnect()?.catch((err) => this.console.error(err));
      // }
      const newMsg = `<:tick:1258353310717706281> **Disconnected** From Voice Channel!`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      this.console.error(err);
    }
  }
  async Queue(ctx, p) {
    try {
      let index = p ? (p - 1) * 10 : 0;
      let page = p || 1;
      if (!p || isNaN(p) || p < 1) {
        index = 0;
        page = 1;
      }
      let pageMsg = "";
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player && p > Math.ceil(player.queue.size / 10)) {
        p = Math.ceil(player.queue.size / 10);
        index = (p - 1) * 10;
        page = p;
      }
      if (!player.playing && player.queue.size == 0) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }else{
      if (player && player.queue.size == 0 && player.playing) {
        // const msg = `## <:author:1039587784727466024> Queue Of ${
        //   ctx.guild.name
        // }\n- Currently Playing **${this.slice(
        //   player.queue.current.title,
        //   50
        // )}** \`(${
        //   this.convertTime(player.queue.current.length)
        //     ? this.convertTime(player.queue.current.length)
        //     : "Live"
        // })\` \n\n**No More Tracks In Queue**`;
        //⬐ current track
        const msg = `\`\`\`md
      ⬐ current Song
  ${this.slice(player.queue.current.title, 50)} (${
          this.convertTime(player.queue.current.length)
            ? this.convertTime(player.queue.current.length)
            : "Live"
        })
      ⬑ current track
  
      No More Tracks In Queue
  \`\`\``;

        await this.ctxSend(ctx, { content: msg });
      }
      const queue = player.queue.map(
        (track, i) =>
          `- \`${++i}\` [${this.slice(track.title, 50)}](<${track.uri}>) \`(${
            this.convertTime(track.length)
              ? this.convertTime(track.length)
              : "Live"
          })\``
      );
      const queueLength = queue.length;
      const totalPages = Math.ceil(queueLength / 10);
      if (queueLength > 10) {
        pageMsg = queue.slice(index, index + 10).join("\n");
      } else {
        pageMsg = queue.join("\n");
      }
      const QueuePage = `## <:author:1039587784727466024> Queue Of ${
        ctx.guild.name
      }\n${
        pageMsg ? pageMsg : "No Tracks Were Enqued!"
      }\n\n**Page ${page}/${totalPages}**`;
      const components = new ActionRowBuilder();
      const button1 = new ButtonBuilder()
        .setLabel("Back")
        .setStyle(this.client.btn.blue)
        .setCustomId("previous_q");
      if (totalPages === 1) {
        button1.setDisabled(true);
      }
      const button2 = new ButtonBuilder()
        .setLabel("First")
        .setStyle(this.client.btn.grey)
        .setCustomId("first_q");
      if (totalPages === 1) {
        button2.setDisabled(true);
      }
      const button3 = new ButtonBuilder()
        .setLabel("Last")
        .setStyle(this.client.btn.grey)
        .setCustomId("last_q");
      if (totalPages === 1) {
        button3.setDisabled(true);
      }
      const button4 = new ButtonBuilder()
        .setLabel("Next")
        .setStyle(this.client.btn.blue)
        .setCustomId("next_q");
      if (totalPages === 1) {
        button4.setDisabled(true);
      }
      components.addComponents(button1, button2, button3, button4);
      const MSG = await this.ctxSend(ctx, {
        content: QueuePage,
        components: [components],
      }).catch((err) => this.console.error(err));
      const collector = await MSG.createMessageComponentCollector({
        time: 80000,
        ComponentType: ComponentType.Button,
      });
      collector.on("collect", async (i) => {
        let user;
        if (ctx.type === InteractionType.ApplicationCommand) {
          user = ctx.user;
        } else {
          user = ctx.author;
        }
        if (i.user.id !== user.id) {
          return i.reply({
            content: `This Button is for **${this.Name(ctx)}** Only!`,
            ephemeral: true,
          });
        }
        await i.deferUpdate();
        if (i.customId === "previous_q") {
          if (page === 1) {
            await i.reply({
              content: `You Are Already On The First Page!`,
              ephemeral: true,
            });
            components.components.map((x) => {
              if (x.customId === "previous_q" || x.customId === "first_q") {
                x.setDisabled(true);
              }
              return x;
            });
          }
          index -= 10;
          page--;
          if (index < 0) {
            index = 0;
            page = 1;
          }
          const currentPage = queue.slice(index, index + 10);
          pageMsg = currentPage.join("\n");
          const QueuePage = `## <:author:1039587784727466024> Queue Of ${ctx.guild.name}\n${pageMsg}\n\n**Page ${page}/${totalPages}**`;
          await i.editReply({ content: QueuePage, components: [components] });
        }
        if (i.customId === "next_q") {
          if (page === totalPages) {
            await i.reply({
              content: `You Are Already On The Last Page!`,
              ephemeral: true,
            });
            components.components.map((x) => {
              if (x.customId === "next_q" || x.customId === "last_q") {
                x.setDisabled(true);
              }
              return x;
            });
          }
          index += 10;
          page++;
          if (index >= queueLength) {
            index -= 10;
            page--;
          }
          const currentPage = queue.slice(index, index + 10);
          pageMsg = currentPage.join("\n");
          const QueuePage = `## <:author:1039587784727466024> Queue Of ${ctx.guild.name}\n${pageMsg}\n\n**Page ${page}/${totalPages}**`;
          await i.editReply({ content: QueuePage, components: [components] });
        }
        if (i.customId === "first_q") {
          if (page === 1) {
            await i.reply({
              content: `You Are Already On The First Page!`,
              ephemeral: true,
            });
            components.components.map((x) => {
              if (x.customId === "previous_q" || x.customId === "first_q") {
                x.setDisabled(true);
              }
              return x;
            });
          }
          index = 0;
          page = 1;
          const currentPage = queue.slice(index, index + 10);
          pageMsg = currentPage.join("\n");
          const QueuePage = `## <:author:1039587784727466024> Queue Of ${ctx.guild.name}\n${pageMsg}\n\n**Page ${page}/${totalPages}**`;
          await i.editReply({ content: QueuePage, components: [components] });
        }
        if (i.customId === "last_q") {
          if (page === totalPages) {
            await i.reply({
              content: `You Are Already On The Last Page!`,
              ephemeral: true,
            });
            components.components.map((x) => {
              if (x.customId === "next_q" || x.customId === "last_q") {
                x.setDisabled(true);
              }
              return x;
            });
          }
          index = queueLength - 10;
          page = totalPages;
          const currentPage = queue.slice(index, index + 10);
          pageMsg = currentPage.join("\n");
          const QueuePage = `## <:author:1039587784727466024> Queue Of ${ctx.guild.name}\n${pageMsg}\n\n**Page ${page}/${totalPages}**`;
          await i.editReply({ content: QueuePage, components: [components] });
        }
        collector.resetTimer();
      });
      collector.on("end", async () => {
        components.components.forEach((x) => {
          x.setDisabled(true);
        });
        await MSG.edit({ content: QueuePage, components: [components] });
      });
    }
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Volume(ctx, volume) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (isNaN(volume) || volume < 0 || volume > 200) {
        const msg = `Please Provide A Valid Volume Between **0 - 200**`;
        return await this.ctxSend(ctx, { content: msg });
      }
      let reg = /[-+*/]/g;
      volume = volume.replace(reg, "");
      player.setVolume(volume);
      let tezz;
      if (player.volume > volume) {
        tezz = "Decreased";
      } else {
        tezz = "Increased";
      }
      const newMsg = `${this.client.emoji.tick} **${this.Name(
        ctx
      )}** has **${tezz}** the volume to **${volume}%**`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Previous(ctx) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player && !player.playing) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      const previous = player.getPrevious();
      if (!previous) {
        const msg = `No Previous Tracks Found!`;
        await this.ctxSend(ctx, { content: msg });
      }
      await player.play(player.getPrevious(true));
      const newMsg = `<:tick:1258353310717706281> **${this.Name(
        ctx
      )}** has **Played** to the previous track!`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  async Shuffle(ctx) {
    try {
      let player = this.client.kazagumo.players.get(ctx.guild.id);
      if (!player) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player && !player.playing) {
        const msg = `**${this.client.user.username}** Is Not Playing Any Music`;
        await this.ctxSend(ctx, { content: msg }).then((x) => {
          setTimeout(() => x.delete(), 10000);
        });
      }
      if (player.queue.size <= 1) {
        const msg = `No Tracks To Shuffle!`;
        await this.ctxSend(ctx, { content: msg });
      }
      if (player.queue.size < 3) {
        const msg = `Queue Size Is Too Small To Shuffle!`;
        await this.ctxSend(ctx, { content: msg });
      }
      player.queue.shuffle();
      const newMsg = `<:tick:1258353310717706281> **${this.Name(
        ctx
      )}** **Shuffled Queue!**`;
      await this.ctxSend(ctx, { content: newMsg });
    } catch (err) {
      await this.handleError(ctx, err);
    }
  }
  slice(str, length) {
    if (str.length > length) {
      return str.slice(0, length) + "...";
    } else {
      return str;
    }
  }
  convertTime(duration) {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    if (hours <= 0) {
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds}`;
    }
    if (hours <= 0 && minutes <= 0) {
      return `00:${seconds < 10 ? "0" : ""}${seconds}`;
    }
    if (hours <= 0 && seconds <= 0) {
      return `${minutes}:00`;
    }
    if (minutes <= 0 && seconds <= 0) {
      return `00:00`;
    }
    return `${hours}:${minutes}:${seconds}`;
  }
};

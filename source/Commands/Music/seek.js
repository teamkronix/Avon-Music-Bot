const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "seek",
  aliases: [],
  category: "Music",
  desc: "Seek to a specific time in the currently playing song",
  dev: false,
  options: {
    owner: false,
    inVc: true,
    sameVc: true,
    player: {
      playing: true,
      active: true,
    },
    premium: false,
    vote: false,
  },
  run: async ({ client, message, args }) => {
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
    if (!player) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `I'm not connected to any voice channel`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(client.config.color);
      return message.channel
        .send({ embeds: [embed] })
        .then((x) => setTimeout(() => x.delete(), 5000));
    }
    if (!player.queue.current) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `There is no song playing`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(client.config.color);
      return message.channel
        .send({ embeds: [embed] })
        .then((x) => setTimeout(() => x.delete(), 5000));
    }
    if (!player.playing) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `The player is already paused`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(client.config.color);
      return message.channel
        .send({ embeds: [embed] })
        .then((x) => setTimeout(() => x.delete(), 5000));
    }
    if (!args[0]) {
      return message.reply({
        content: "Please provide a time to seek, Example `1m`, `1:30`, `90s`.",
      });
    }
    let seconds = 0;
    const timeArg = args[0].toLowerCase();
    if (timeArg.includes(":")) {
      const time = timeArg.split(":");
      const minutes = parseInt(time[0], 10);
      const secs = parseInt(time[1], 10);
      if (isNaN(minutes) || isNaN(secs)) {
        return message.reply({
          content: "Please provide a valid time in the format `mm:ss`.",
        });
      }
      seconds = minutes * 60 + secs;
    } else {
      const match = timeArg.match(/(\d+)([a-z]+)?/);
      if (!match) {
        return message.reply({
          content:
            "Please provide a valid time like `1m`, `2min`, `1s`, `90s`.",
        });
      }
      const value = parseInt(match[1], 10);
      const unit = match[2] || "s";
      switch (unit) {
        case "m":
        case "min":
        case "minutes":
          seconds = value * 60;
          break;
        case "s":
        case "sec":
        case "second":
        case "seconds":
          seconds = value;
          break;
        default:
          return message.reply({
            content:
              "Please provide a valid time unit like `m` for minutes or `s` for seconds.",
          });
      }
    }
    if (seconds > player.queue.current.length / 1000) {
      return message.reply({
        content: "The time you provided exceeds the duration of the song.",
      });
    }
    player.seek(seconds * 1000);
    return message.reply({ content: `Seeked to **${args[0]}**` });
  },
};

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  AttachmentBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
async function createQualityImage(currentQuality, theme = "neon") {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext("2d");
  const themes = {
    neon: {
      primary: "#ff00ff",
      secondary: "#00ffff",
      accent: "#ffff00",
      text: "#ffffff",
    },
    monochrome: {
      primary: "#ffffff",
      secondary: "#cccccc",
      accent: "#888888",
      text: "#ffffff",
    },
    pastel: {
      primary: "#ffb3ba",
      secondary: "#bae1ff",
      accent: "#baffc9",
      text: "#ffffff",
    },
    cyberpunk: {
      primary: "#f3e600",
      secondary: "#00fff9",
      accent: "#ff00a0",
      text: "#ffffff",
    },
  };

  const colors = themes[theme] || themes.neon;
  ctx.clearRect(0, 0, 1200, 630);
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 10; j++) {
      ctx.beginPath();
      ctx.arc(i * 60, j * 60, 20, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? colors.primary : colors.secondary;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.font = "bold 60px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = colors.text;
  ctx.fillText("AVON x DOLBY", 600, 100);
  ctx.font = "300 30px 'Arial', sans-serif";
  ctx.fillStyle = colors.accent;
  ctx.fillText("EXPERIENCE", 600, 140);
  const qualities = ["Low", "Medium", "High"];
  const y = 350;
  qualities.forEach((quality, index) => {
    const x = 300 + index * 300;
    const radius = 100;
    const time = Date.now() * 0.001 + index;
    const hue = (time * 50) % 360;
    const dynamicColor = `hsl(${hue}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = dynamicColor;
    ctx.lineWidth = 10;
    ctx.stroke();
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius - 10);
    gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.1)`);
    gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.3)`);
    ctx.beginPath();
    ctx.arc(x, y, radius - 10, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    const pulseSize = Math.sin(time * 5) * 5;
    ctx.beginPath();
    ctx.arc(x, y, radius - 20 + pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
    ctx.fill();
    ctx.font = "bold 30px 'Arial', sans-serif";
    ctx.fillStyle = colors.text;
    ctx.fillText(quality, x, y + 10);
    if (quality.toLowerCase() === currentQuality.toLowerCase()) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 15, 0, Math.PI * 2);
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.font = "bold 24px 'Arial', sans-serif";
      ctx.fillStyle = colors.accent;
      ctx.fillText("ACTIVE", x, y + radius + 40);
    }
  });
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    for (let x = 0; x < 1200; x += 5) {
      const time = Date.now() * 0.001;
      const y = 550 + Math.sin((x + time * 200) * 0.02 + i) * 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.font = "300 20px 'Arial', sans-serif";
  ctx.fillStyle = colors.text;
  ctx.fillText("IMMERSE YOURSELF IN CRYSTAL-CLEAR SOUND WITH AVON", 600, 600);

  const buffer = canvas.toBuffer("image/png");
  return new AttachmentBuilder(buffer, {
    name: "avon_tejas_quality_settings.png",
  });
}
function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
module.exports = {
  name: "quality",
  aliases: ["setquality", "audioquality"],
  category: "Settings",
  permission: "",
  desc: "Change the quality of the music",
  dev: false,
  options: {
    owner: false,
    inVc: true,
    sameVc: true,
    player: {
      playing: false,
      active: true,
    },
    premium: false,
    vote: true,
  },

  run: async ({ client, message, args }) => {
    try {
      const a = client.kazagumo.players.get(message.guild.id);
      if (!a)
        return client.message.send(message, {
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(
                "I'm not connected to a voice channel in this server."
              )
              .setColor("#FF0000"),
          ],
        });
      let player = a.shoukaku;
      if (!player) {
        await client.message.send(message, {
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(
                "I'm not connected to a voice channel in this server."
              )
              .setColor("#FF0000"),
          ],
        });
        return;
      }
      let currentTheme = "default";
      const getCurrentQuality = () => {
        const volume = player.volume;
        const bitrate = message.member.voice.channel.bitrate;
        if (volume <= 80 && bitrate <= 64000) return "low";
        if (volume >= 110 && bitrate >= 96000) return "high";
        if (volume >= 100 && bitrate >= 80000) return "medium";
        if (volume >= 90 && bitrate >= 72000) return "medium";
        if (volume >= 90 && bitrate >= 64000) return "low";
        if (volume >= 110 && bitrate >= 96000) return "Ultra";
        return "medium";
      };
      const qualityDescriptions = {
        low: "Optimized for slower connections. Reduced bandwidth usage while maintaining clarity.",
        medium:
          "Perfectly balanced quality and performance. Crystal-clear audio for most listeners.",
        high: "Ultra HD studio-quality audio. Experience every nuance with unparalleled fidelity.",
      };
      const applyQualitySettings = async (quality) => {
        const higBitRate = await message.guild.channels.cache
          .filter(
            (channel) => channel.type === "GuildVoice" && channel.bitrate > 0
          )
          .reduce((highest, channel) => {
            return channel.bitrate > highest ? channel.bitrate : highest;
          }, 0);

        const voiceChannel = message.member.voice.channel;
        switch (quality) {
          case "low":
            await player.setFilters({
              equalizer: [
                { band: 0, gain: 0 },
                { band: 1, gain: 0.05 },
                { band: 2, gain: 0.01 },
                { band: 3, gain: -0.05 },
                { band: 4, gain: -0.05 },
                { band: 5, gain: -0.05 },
                { band: 6, gain: -0.05 },
                { band: 7, gain: -0.05 },
                { band: 8, gain: -0.05 },
                { band: 9, gain: -0.05 },
                { band: 10, gain: -0.05 },
                { band: 11, gain: -0.05 },
                { band: 12, gain: -0.05 },
                { band: 13, gain: -0.05 },
                { band: 14, gain: -0.05 },
              ],
              timescale: { speed: 1.0, pitch: 1.0, rate: 1.0 },
              volume: 0.8,
            });
            a.setVolume(80);
            await voiceChannel.setBitrate(64000);
            break;
          case "medium":
            await player.setFilters({
              equalizer: [
                { band: 0, gain: 0 },
                { band: 1, gain: 0 },
                { band: 2, gain: 0 },
                { band: 3, gain: 0 },
                { band: 4, gain: 0 },
                { band: 5, gain: 0 },
                { band: 6, gain: 0 },
                { band: 7, gain: 0 },
                { band: 8, gain: 0 },
                { band: 9, gain: 0 },
                { band: 10, gain: 0 },
                { band: 11, gain: 0 },
                { band: 12, gain: 0 },
                { band: 13, gain: 0 },
                { band: 14, gain: 0 },
              ],
              timescale: { speed: 1.0, pitch: 1.0, rate: 1.0 },
              volume: 1.0,
            });
            a.setVolume(100);
            await voiceChannel.setBitrate(80000);
            break;
          case "high":
            await player.setFilters({
              equalizer: [
                { band: 0, gain: 0.1 },
                { band: 1, gain: 0.1 },
                { band: 2, gain: 0.05 },
                { band: 3, gain: 0 },
                { band: 4, gain: -0.03 },
                { band: 5, gain: -0.05 },
                { band: 6, gain: 0 },
                { band: 7, gain: 0.05 },
                { band: 8, gain: 0.1 },
                { band: 9, gain: 0.08 },
                { band: 10, gain: 0.06 },
                { band: 11, gain: 0.07 },
                { band: 12, gain: 0.05 },
                { band: 13, gain: 0.02 },
                { band: 14, gain: 0 },
              ],

              // equalizer: [
              //   { band: 0, gain: 0.16 },
              //   { band: 1, gain: 0.14 },
              //   { band: 2, gain: 0.12 },
              //   { band: 3, gain: 0.1 },
              //   { band: 4, gain: 0.05 },
              //   { band: 5, gain: 0.03 },
              //   { band: 6, gain: 0.02 },
              //   { band: 7, gain: 0.01 },
              //   { band: 8, gain: 0.0 },
              // ],
              timescale: {
                speed: 1.0,
                pitch: 1.0,
                rate: 1.0,
              },
              volume: 1.05,
              bassboost: 1.2,
              lowpass: { smoothing: 10.0 },
              compressor: {
                threshold: -10.0,
                knee: 1.0,
                ratio: 4.0,
                attack: 0.05,
                release: 0.1,
              },
              treble: {
                frequency: 14000,
                depth: 1.0,
              },
            });

            a.setVolume(105);
            await voiceChannel.setBitrate(96000);
            break;
          case "Ultra":
            await player.setFilters({
              equalizer: [
                { band: 0, gain: 0.1 },
                { band: 1, gain: 0.1 },
                { band: 2, gain: 0.1 },
              ],
              timescale: { speed: 1.0, pitch: 1.0, rate: 1.0 },
              volume: 1.1,
            });
            a.setVolume(110);
            await voiceChannel.setBitrate(higBitRate);
            break;
          default:
            break;
        }
      };

      const updateMessage = async (newQuality) => {
        try {
          await applyQualitySettings(newQuality);
          const qualityImage = await createQualityImage(
            newQuality,
            currentTheme
          );
          const embed = new EmbedBuilder()
            .setTitle("🎧 Avon HD Audio Experience")
            .setDescription(
              `Quality has been set to **${newQuality.toUpperCase()}**.\n\n${
                qualityDescriptions[newQuality]
              }`
            )
            .setColor("#ff00ff")
            .setImage("attachment://avon_tejas_quality_settings.png");
          const components = createComponents(newQuality);
          await sentMessage.edit({
            embeds: [embed],
            files: [qualityImage],
            components: components,
          });
        } catch (error) {
          console.error("Error updating message:", error);
          await message.channel.send(
            "An error occurred while updating the quality settings. Please try again."
          );
        }
      };
      const createComponents = (currentQuality) => {
        const qualityButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("low")
            .setLabel("Low 480p")
            .setEmoji("🔈")
            .setStyle(
              currentQuality === "low"
                ? ButtonStyle.Success
                : ButtonStyle.Secondary
            )
            .setDisabled(currentQuality === "low"),
          new ButtonBuilder()
            .setCustomId("medium")
            .setLabel("Medium 720p")
            .setEmoji("🔉")
            .setStyle(
              currentQuality === "medium"
                ? ButtonStyle.Success
                : ButtonStyle.Secondary
            )
            .setDisabled(currentQuality === "medium"),
          new ButtonBuilder()
            .setCustomId("high")
            .setLabel("High 4K")
            .setEmoji("🔊")
            .setStyle(
              currentQuality === "high"
                ? ButtonStyle.Success
                : ButtonStyle.Secondary
            )
            .setDisabled(currentQuality === "high")
          // new ButtonBuilder()
          //   .setCustomId("Ultra")
          //   .setLabel("Ultra 8K")
          //   .setEmoji(`1217567225725190267`)
          //   .setStyle(
          //     currentQuality === "Ultra"
          //       ? ButtonStyle.Success
          //       : ButtonStyle.Secondary
          //   )
          //   .setDisabled(true)
        );
        const equalizerMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("equalizer")
            .setPlaceholder("Apply Equalizer Preset")
            .addOptions([
              {
                label: "Balanced",
                description: "A well-rounded sound profile",
                value: "balanced",
              },
              {
                label: "Flat",
                description: "Pristine, unaltered audio",
                value: "flat",
              },
              {
                label: "Bass Boost",
                description: "Enhanced low frequencies for extra punch",
                value: "bass",
              },
              {
                label: "Treble Boost",
                description: "Crisp and clear high frequencies",
                value: "treble",
              },
              {
                label: "Vocal Boost",
                description: "Enhanced mid-range for vocal clarity",
                value: "vocal",
              },
              {
                label: "Electronic",
                description: "Optimized for electronic music",
                value: "electronic",
              },
              {
                label: "Classical",
                description: "Balanced for orchestral pieces",
                value: "classical",
              },
            ])
        );

        return [qualityButtons, equalizerMenu];
      };
      // const applyEqualizerPreset = async (player, preset) => {
      //   let equalizer;
      //   switch (preset) {
      //     case "balanced":
      //       equalizer = [
      //         { band: 0, gain: 0.1 }, // 25 Hz
      //         { band: 1, gain: 0.1 }, // 40 Hz
      //         { band: 2, gain: 0.05 }, // 63 Hz
      //         { band: 3, gain: 0 }, // 100 Hz
      //         { band: 4, gain: -0.05 }, // 160 Hz
      //         { band: 5, gain: -0.05 }, // 250 Hz
      //         { band: 6, gain: 0 }, // 400 Hz
      //         { band: 7, gain: 0.05 }, // 630 Hz
      //         { band: 8, gain: 0.1 }, // 1 kHz
      //         { band: 9, gain: 0.1 }, // 1.6 kHz
      //         { band: 10, gain: 0.05 }, // 2.5 kHz
      //         { band: 11, gain: 0.1 }, // 4 kHz
      //         { band: 12, gain: 0.1 }, // 6.3 kHz
      //         { band: 13, gain: 0.05 }, // 10 kHz
      //         { band: 14, gain: 0 }, // 16 kHz
      //       ];
      //       break;
      //     case "bass":
      //       equalizer = [
      //         { band: 0, gain: 0.4 },
      //         { band: 1, gain: 0.5 },
      //         { band: 2, gain: 0.6 },
      //         { band: 3, gain: 0.4 },
      //         { band: 4, gain: 0.2 },
      //         { band: 5, gain: 0.1 },
      //         { band: 6, gain: 0.05 },
      //         { band: 7, gain: 0.05 },
      //         { band: 8, gain: 0 },
      //         { band: 9, gain: 0 },
      //         { band: 10, gain: 0 },
      //         { band: 11, gain: 0 },
      //         { band: 12, gain: 0 },
      //         { band: 13, gain: 0 },
      //         { band: 14, gain: 0 },
      //       ];
      //       break;
      //     case "treble":
      //       equalizer = [
      //         { band: 0, gain: -0.2 },
      //         { band: 1, gain: 0 },
      //         { band: 2, gain: 0 },
      //         { band: 3, gain: 0 },
      //         { band: 4, gain: 0 },
      //         { band: 5, gain: 0.1 },
      //         { band: 6, gain: 0.2 },
      //         { band: 7, gain: 0.3 },
      //         { band: 8, gain: 0.4 },
      //         { band: 9, gain: 0.5 },
      //         { band: 10, gain: 0.6 },
      //         { band: 11, gain: 0.6 },
      //         { band: 12, gain: 0.6 },
      //         { band: 13, gain: 0.5 },
      //         { band: 14, gain: 0.4 },
      //       ];
      //       break;
      //     case "vocal":
      //       equalizer = [
      //         { band: 0, gain: -0.2 },
      //         { band: 1, gain: -0.1 },
      //         { band: 2, gain: 0 },
      //         { band: 3, gain: 0.1 },
      //         { band: 4, gain: 0.2 },
      //         { band: 5, gain: 0.3 },
      //         { band: 6, gain: 0.4 },
      //         { band: 7, gain: 0.5 },
      //         { band: 8, gain: 0.6 },
      //         { band: 9, gain: 0.5 },
      //         { band: 10, gain: 0.4 },
      //         { band: 11, gain: 0.3 },
      //         { band: 12, gain: 0.2 },
      //         { band: 13, gain: 0.1 },
      //         { band: 14, gain: 0 },
      //       ];
      //       break;
      //     default:
      //       equalizer = Array(15)
      //         .fill()
      //         .map((_, i) => ({ band: i, gain: 0 }));
      //       break;
      //   }

      //   await player.setFilters({ equalizer });
      // };

      const applyEqualizerPreset = async (preset) => {
        let equalizer;
        switch (preset) {
          case "bass":
            equalizer = [
              { band: 0, gain: 0.4 },
              { band: 1, gain: 0.5 },
              { band: 2, gain: 0.6 },
              { band: 3, gain: 0.4 },
              { band: 4, gain: 0.2 },
              { band: 5, gain: 0.1 },
              { band: 6, gain: 0.05 },
              { band: 7, gain: 0.05 },
              { band: 8, gain: 0 },
              { band: 9, gain: 0 },
              { band: 10, gain: 0 },
              { band: 11, gain: 0 },
              { band: 12, gain: 0 },
              { band: 13, gain: 0 },
              { band: 14, gain: 0 },
            ];
            break;
          case "treble":
            equalizer = [
              { band: 0, gain: -0.2 },
              { band: 1, gain: 0 },
              { band: 2, gain: 0 },
              { band: 3, gain: 0 },
              { band: 4, gain: 0 },
              { band: 5, gain: 0.1 },
              { band: 6, gain: 0.2 },
              { band: 7, gain: 0.3 },
              { band: 8, gain: 0.4 },
              { band: 9, gain: 0.5 },
              { band: 10, gain: 0.6 },
              { band: 11, gain: 0.6 },
              { band: 12, gain: 0.6 },
              { band: 13, gain: 0.5 },
              { band: 14, gain: 0.4 },
            ];
            break;
          case "vocal":
            equalizer = [
              { band: 0, gain: -0.2 },
              { band: 1, gain: -0.1 },
              { band: 2, gain: 0 },
              { band: 3, gain: 0.1 },
              { band: 4, gain: 0.2 },
              { band: 5, gain: 0.3 },
              { band: 6, gain: 0.4 },
              { band: 7, gain: 0.5 },
              { band: 8, gain: 0.6 },
              { band: 9, gain: 0.5 },
              { band: 10, gain: 0.4 },
              { band: 11, gain: 0.3 },
              { band: 12, gain: 0.2 },
              { band: 13, gain: 0.1 },
              { band: 14, gain: 0 },
            ];
            break;
          case "electronic":
            equalizer = [
              { band: 0, gain: 0.1 },
              { band: 1, gain: 0.2 },
              { band: 2, gain: 0.3 },
              { band: 3, gain: 0.4 },
              { band: 4, gain: 0.5 },
              { band: 5, gain: 0.6 },
              { band: 6, gain: 0.7 },
              { band: 7, gain: 0.8 },
              { band: 8, gain: 0.9 },
              { band: 9, gain: 1.0 },
              { band: 10, gain: 1.1 },
              { band: 11, gain: 1.2 },
              { band: 12, gain: 1.3 },
              { band: 13, gain: 1.4 },
              { band: 14, gain: 1.5 },
            ];
            break;
          case "classical":
            equalizer = [
              { band: 0, gain: 0.01 },
              { band: 1, gain: 0.02 },
              { band: 2, gain: 0.03 },
              { band: 3, gain: 0.04 },
              { band: 4, gain: 0.05 },
              { band: 5, gain: 0.06 },
              { band: 6, gain: 0.07 },
              { band: 7, gain: 0.08 },
              { band: 8, gain: 0.09 },
              { band: 9, gain: 0.1 },
              { band: 10, gain: 0.11 },
              { band: 11, gain: 0.12 },
              { band: 12, gain: 0.13 },
              { band: 13, gain: 0.14 },
              { band: 14, gain: 0.15 },
            ];
            break;
          case "balanced":
            equalizer = [
              { band: 0, gain: 0.1 },
              { band: 1, gain: 0.1 },
              { band: 2, gain: 0.05 },
              { band: 3, gain: 0 },
              { band: 4, gain: -0.05 },
              { band: 5, gain: -0.05 },
              { band: 6, gain: 0 },
              { band: 7, gain: 0.05 },
              { band: 8, gain: 0.1 },
              { band: 9, gain: 0.1 },
              { band: 10, gain: 0.05 },
              { band: 11, gain: 0.1 },
              { band: 12, gain: 0.1 },
              { band: 13, gain: 0.05 },
              { band: 14, gain: 0 },
            ];
            break;
          default:
            equalizer = [
              { band: 0, gain: 0 },
              { band: 1, gain: 0 },
              { band: 2, gain: 0 },
              { band: 3, gain: 0 },
              { band: 4, gain: 0 },
              { band: 5, gain: 0 },
              { band: 6, gain: 0 },
              { band: 7, gain: 0 },
              { band: 8, gain: 0 },
              { band: 9, gain: 0 },
              { band: 10, gain: 0 },
              { band: 11, gain: 0 },
              { band: 12, gain: 0 },
              { band: 13, gain: 0 },
              { band: 14, gain: 0 },
            ];
            break;
        }

        await player.setFilters({ equalizer });
      };

      const components = createComponents(getCurrentQuality());
      const qualityImage = await createQualityImage(
        getCurrentQuality(),
        currentTheme
      );
      const embed = new EmbedBuilder()
        .setTitle("🎧 Avon HD Audio Experience")
        .setDescription(
          `Quality has been set to **${getCurrentQuality().toUpperCase()}**.\n\n${
            qualityDescriptions[getCurrentQuality()]
          }\n\nImmerse yourself in a world of unparalleled audio fidelity!`
        )
        .setColor("#7289DA")
        .setImage("attachment://avon_tejas_quality_settings.png");
      const sentMessage = await message.reply({
        embeds: [embed],
        files: [qualityImage],
        components: components,
      });

      const filter = (interaction) => interaction.user.id === message.author.id;
      const collector = sentMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        try {
          if (interaction.isButton()) {
            await interaction.deferUpdate();
            await updateMessage(interaction.customId);
          } else if (
            interaction.isStringSelectMenu() &&
            interaction.customId === "equalizer"
          ) {
            await interaction.deferUpdate();
            await applyEqualizerPreset(interaction.values[0]);
            await sentMessage
              .reply({
                content: `Equalizer preset **${interaction.values[0]}** has been applied.`,
              })
              .then((m) => m.delete({ timeout: 5000 }));
          }
        } catch (error) {
          console.error("Error handling interaction:", error);
          await message.channel.send(
            "An error occurred while processing your request. Please try again."
          );
        }
      });
      collector.on("end", async () => {
        try {
          const disabledComponents = components.map((row) => {
            return ActionRowBuilder.from(row).setComponents(
              row.components.map((component) => component.setDisabled(true))
            );
          });
          await sentMessage.edit({ components: disabledComponents });
        } catch (error) {
          console.error("Error disabling components:", error);
        }
      });
    } catch (error) {
      console.error("Error in quality command:", error);
      await message.reply(
        "An error occurred while processing the command. Please try again later."
      );
    }
  },
};

/** 

@code Fucked by manas 
@for support join https://discord.gg/coderz
@this code is licensed give credits to me before using
@enjoy the skidded and chatgpt. Dumped bit code

**/
const { EmbedBuilder } = require("discord.js");
const ctx = async (
  channel,
  content,
  color = "#2f3136",
  timeout = 5000
) => {
  const embed = new EmbedBuilder().setDescription(content).setColor(color);
  const msg = await channel.send({ embeds: [embed] });
};
const applyEqualizerPreset = async (player, preset) => {
  const equalizerPresets = {
    bass: [
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
    ],
    vocal: [
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
    ],
    electronic: [
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
    ],

    treble: [
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
    ],
    classical: [
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
    ],
    balanced: [
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
    ],
    default: Array(15).fill({ band: 0, gain: 0 }),
  };

  const equalizer = equalizerPresets[preset] || equalizerPresets["default"];
  await player.setFilters({ equalizer });
};

module.exports = {
  name: "balanced",
  aliases: ["bal"],
  category: "Filters",
  desc: "Apply Balanced Filter to the Music!",dev: false,
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

  run: async ({ client, message }) => {
    try {
      if (!message.member.voice.channel) {
        return ctx(
          message.channel,
          "You need to be in a voice channel to use this command.",
          client.config.color
        );
      }
      let aplayer = client.kazagumo.players.get(message.guild.id);
      let player = aplayer.shoukaku;
      if (!player) {
        return ctx(
          message.channel,
          "There is no song currently playing.",
          "Red"
        );
      }
      await applyEqualizerPreset(player, "balanced");
      return ctx(
        message.channel,
        "Balanced Filter Applied",
        client.config.color,
        10000
      );
    } catch (e) {
      console.error(e);
      return ctx(
        message.channel,
        "An error occurred while applying the filter.",
        "Red"
      );
    }
  },
};

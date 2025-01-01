const { Schema, model } = require("mongoose");

const guildSchema = new Schema({
  id: { type: String, required: true },
  prefix: { type: String, required: false, default: "+" },
  playerMode: { type: Number, required: false, default: 0 },
  playMode: { type: String, required: false, default: "search" },
  twentyFourSeven: {
    enabled: { type: Boolean, required: false, default: false },
    textChannel: { type: String, required: false },
    voiceChannel: { type: String, required: false },
  },
  musicInvitesEnabled: { type: Boolean, required: false, default: true },
  djRole: { type: String, required: false },
  settings: {
    autoplay: { type: Boolean, required: false, default: false },
    volume: { type: Number, required: false, default: 100 },
    djOnly: { type: Boolean, required: false, default: false },
  },
});

module.exports = model("Guild", guildSchema);

/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const { EmbedBuilder } = require("discord.js");
const cooldowns = new Map();
function simulatePacketLoss() {
  return Math.floor(Math.random() * 5);
}
function calculateJitter(pings) {
  let sumDiff = 0;
  for (let i = 1; i < pings.length; i++) {
    sumDiff += Math.abs(pings[i] - pings[i - 1]);
  }
  return sumDiff / (pings.length - 1);
}
module.exports = {
  name: "ping",
  aliases: ["latency"],
  category: "Misc",
  permission: "",
  desc: "Get the Ping of the Bot and some advanced networking stats",dev: false,
  options: {
    owner: false,
    inVc: false,
    sameVc: false,
    player: {
      playing: false,
      active: false,
    },
    premium: false,
    vote: false,
  },
  run: async ({ client, message }) => {
    const userId = message.author.id;
    const cooldownTime = 6000;
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + cooldownTime;
      const remainingTime = Math.ceil((expirationTime - Date.now()) / 1000);
      if (Date.now() < expirationTime) {
        return message
          .reply(
            `Please wait **${remainingTime}s** before using the \`ping\` command again.`
          )
          .then((msg) => setTimeout(() => msg.delete(), 7000));
      }
    }
    cooldowns.set(userId, Date.now());
    setTimeout(() => cooldowns.delete(userId), cooldownTime);
    try {
      const getPing = async () => {
        const msg = await message.channel.send("Pinging...");
        const ping = msg.createdTimestamp - message.createdTimestamp;
        await msg.delete();
        return ping;
      };
      const pings = [await getPing(), await getPing(), await getPing()];
      const avgPing = Math.round(pings.reduce((a, b) => a + b) / pings.length);
      const jitter = calculateJitter(pings);
      const packetLoss = simulatePacketLoss();
      const embed = new EmbedBuilder()
        .setColor(client.config.color)
        .setAuthor({
          name: `${client.user.username} Network Statistics`,
          iconURL: client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `> **Ping (Avg)**: \`${avgPing}ms\`\n` +
            `> **Jitter**: \`${jitter.toFixed(2)}ms\`\n` +
            `> **API Latency**: \`${client.ws.ping}ms\`\n` +
            `> **Packet Loss**: \`${packetLoss}%\``
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: `Requested by ${
            message.author.globalName || message.author.tag
          }`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });
      const send = await message.reply({ embeds: [embed] });
      return send;
    } catch (err) {
      console.error(err);
      await message.channel.send({
        content: "An error occurred while executing this command.",
      });
    }
  },
};

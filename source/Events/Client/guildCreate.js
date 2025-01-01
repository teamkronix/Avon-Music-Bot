const { EmbedBuilder, WebhookClient, ChannelType } = require("discord.js");

module.exports = async (client, guild) => {
  try {
    const owner = await fetchGuildOwner(guild);
    const formatUser = (user) =>
      user
        ? `${user.globalName ? user.globalName : user.username} (${user.id})`
        : "Unknown User";
    const formatTimestamp = (timestamp) => {
      const unixTime = Math.round(timestamp / 1000);
      return `<t:${unixTime}> [<t:${unixTime}:R>]`;
    };
    const guildInfo = [
      `**Guild ID:** ${guild.id}`,
      `**Guild Name:** ${guild.name}`,
      `**Guild Owner:** ${
        owner ? formatUser(owner.user) : "Unable to fetch owner"
      }`,
      `**Member Count:** ${guild.memberCount}`,
      `**Joined At:** ${formatTimestamp(guild.joinedTimestamp)}`,
      `**Guild Created At:** ${formatTimestamp(guild.createdTimestamp)}`,
      `**Shard ID:** ${guild.shardId}`,
    ].join("\n");
    const [serverCount, userCount] = await fetchStats(client);
    const statsInfo = [
      `**Server Count:** ${serverCount}`,
      `**Users Count:** ${userCount}`,
    ].join("\n");
    const embed = new EmbedBuilder()
      .setColor("00ff00")
      .setAuthor({
        name: "Guild Joined",
        iconURL: guild.iconURL({ dynamic: true }) || null,
      })
      .setDescription([guildInfo, statsInfo].join("\n\n"))
      .setThumbnail(guild.iconURL({ dynamic: true, size: 4096 }) || null)
      .setTimestamp();
    await sendNotification(client, embed);
  } catch (error) {
    console.error("Error in guild join event:", error);
    await sendFallbackNotification(client, guild);
  }
};

async function fetchGuildOwner(guild) {
  try {
    return await guild.members.cache.get(guild.ownerId);
  } catch (error) {
    console.error("Error fetching guild owner:", error);
    return null;
  }
}

async function fetchStats(client) {
  try {
    const [serverCount, userCount] = await Promise.all([
      client.cluster
        .fetchClientValues("guilds.cache.size")
        .then((sizes) => sizes.reduce((acc, size) => acc + size, 0)),
      client.cluster
        .broadcastEval((c) =>
          c.guilds.cache.reduce(
            (acc, guild) => acc + (guild.available ? guild.memberCount : 0),
            0
          )
        )
        .then((counts) => counts.reduce((acc, count) => acc + count, 0)),
    ]);
    return [serverCount, userCount];
  } catch (error) {
    console.error("Error fetching stats:", error);
    return [0, 0];
  }
}

async function sendNotification(client, embed) {
  try {
    const webhook = new WebhookClient({ url: `https://discord.com/api/webhooks/1246792443261747271/mYXEIHpuiw7hs9X5mA8mI5AfdBAxBx3jZjC5Vmjx1ShKxdDbkp1P7-hWwQ4RdEwYzk10` });
    await webhook.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error sending webhook:", error);
  }
}

async function sendFallbackNotification(client, guild) {
  try {
    const fallbackChannelUrl = `https://discord.com/api/webhooks/1286973865716875274/mNpzHrOfg_7LuwTiz7vaeMOy498Bth4TzOYqFvKoAg7u8GLWeER0a5etg5m7dc6Rq0gT`;
    const fallbackEmbed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("New Guild Joined (Fallback Notification)")
      .setDescription(`Bot joined a new guild: ${guild.name} (${guild.id})`)
      .addFields(
        {
          name: "Member Count",
          value: `${guild.memberCount}`,
          inline: true,
        },
        {
          name: "Created At",
          value: `${new Date(guild.createdTimestamp).toUTCString()}`,
          inline: true,
        }
      )
      .setTimestamp();
    await new WebhookClient({ url: fallbackChannelUrl }).send({
      embeds: [fallbackEmbed],
    });
  } catch (error) {
    console.error("Error sending fallback notification:", error);
  }
}

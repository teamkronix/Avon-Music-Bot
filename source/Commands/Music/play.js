module.exports = {
  name: "play",
  aliases: ["p"],
  category: "Music",
  desc: "Play a song of your favorite choice",
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
      if (!message.member.voice.channel) {
        const payload = {
          content: "- You need to be in a **voice channel** to play music.",
        };
        return client.message.send(message, payload);
      }
      const query = args.join(" ");
      if (!query) {
        const payload = {
          content:
            "- Please provide a song name or URL to play. Example: `play Faded`",
        };
        return await client.message.send(message, payload);
      }
      await client.music.Play(message, query);
    } catch (error) {
      console.error(error);
      // const payload = {
      //   content:
      //     "- An error occurred while playing the song. Try Reporting it to the Developer [Team Avon](<https://discord.gg/S5zmG2RtJ3>)",
      // };
      // return await client.message.send(message, payload);
    }
  },
};

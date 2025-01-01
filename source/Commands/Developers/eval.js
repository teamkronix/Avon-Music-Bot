const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const { inspect } = require("util");

module.exports = {
  name: "eval",
  aliases: ["jsk"],
  category: "Misc",
  dev: true,
  options: {
    owner: true,
    inVc: false,
    sameVc: false,
    player: {
      playing: false,
      active: false,
    },
    premium: false,
    vote: false,
  },
  run: async ({ client, message, args ,player}) => {
    const tezz = [
      "900981299022536757",
      "765841266181144596",
      "785708354445508649",
    ];
    if (!tezz.includes(message.author.id)) {
      return message.channel
        .send({
          content: "You are not authorized to use this command.",
        })
        .then((m) => setTimeout(() => m.delete(), 5000));
    }
    const code = args.join(" ");
    if (!code) {
      return message.channel
        .send({
          content: "Please provide code to evaluate.",
        })
        .then((m) => setTimeout(() => m.delete(), 5000));
    }
    let evaled;
    try {
      const startTime = Date.now();
      evaled = eval(code);
      if (evaled instanceof Promise) evaled = await evaled;
      let evaledShallow = inspect(evaled, { depth: 0 });
      let evaledInDepth = inspect(evaled, { depth: null });
      const pages = [];
      const pageSize = 1900;
      for (let i = 0; i < evaledShallow.length; i += pageSize) {
        pages.push(evaledShallow.slice(i, i + pageSize));
      }
      let currentPage = 0;
      let currentView = "shallow";
      const executionTime = Date.now() - startTime;
      const createEmbed = () => {
        return new EmbedBuilder()
          .setAuthor({
            name: "Eval Results",
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(`\`\`\`js\n${pages[currentPage]}\n\`\`\``)
          .setColor(client.config.color || "#00FF00")
          .addFields({
            name: "Execution Time",
            value: `${executionTime}ms`,
            inline: true,
          })
          .setFooter({
            text: `Page ${currentPage + 1}/${pages.length} | View: ${
              currentView === "shallow" ? "Shallow" : "In-depth"
            }`,
          })
          .setTimestamp();
      };
      const createButtons = () => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("◀️ Previous")
            .setStyle("Primary")
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶️ Next")
            .setStyle("Primary")
            .setDisabled(currentPage === pages.length - 1),
          new ButtonBuilder()
            .setCustomId("toggleView")
            .setLabel(currentView === "shallow" ? "🔍 In-depth" : "🔙 Shallow")
            .setStyle("Secondary"),
          new ButtonBuilder()
            .setCustomId("delete")
            .setLabel("🗑️ Delete")
            .setStyle("Danger")
        );
      };
      const msg = await message.channel.send({
        embeds: [createEmbed()],
        components: [createButtons()],
      });
      const filter = (interaction) => interaction.user.id === message.author.id;
      const collector = msg.createMessageComponentCollector({
        filter,
        time: 60000,
      });
      collector.on("collect", async (interaction) => {
        if (interaction.customId === "next") {
          currentPage++;
        } else if (interaction.customId === "prev") {
          currentPage--;
        } else if (interaction.customId === "toggleView") {
          if (currentView === "shallow") {
            currentView = "in-depth";
            pages.length = 0;
            for (let i = 0; i < evaledInDepth.length; i += pageSize) {
              pages.push(evaledInDepth.slice(i, i + pageSize));
            }
          } else {
            currentView = "shallow";
            pages.length = 0;
            for (let i = 0; i < evaledShallow.length; i += pageSize) {
              pages.push(evaledShallow.slice(i, i + pageSize));
            }
          }
          currentPage = 0;
        } else if (interaction.customId === "delete") {
          await msg.delete();
          return collector.stop();
        }
        await interaction.update({
          embeds: [createEmbed()],
          components: [createButtons()],
        });
      });
      collector.on("end", async () => {
        await msg.edit({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("delete")
                .setLabel("🗑️ Delete")
                .setStyle("Danger")
                .setDisabled(false)
            ),
          ],
        });
      });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("Eval Error")
        .setColor("#FF0000")
        .setDescription(`\`\`\`js\n${error.toString()}\n\`\`\``)
        .setTimestamp();
      await message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
/** 

@code Fucked by manas 
@for support join https://discord.gg/coderz
@this code is licensed give credits to me before using
@enjoy the skidded and chatgpt. Dumped bit code

**/
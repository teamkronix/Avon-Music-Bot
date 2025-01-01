/** 

@code Fucked by manas 

@for support join https://discord.gg/coderz

@this code is licensed give credits to me before using

@enjoy the skidded and chatgpt. Dumped bit code

**/const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
} = require("discord.js");

function tezz(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

module.exports = {
  name: "help",
  aliases: ["h"],
  category: "Misc",
  permission: "",
  desc: "Displays all available commands or details for a specific command",
  dev: false,
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
  run: async ({ client, message, args, guildData }) => {
    try {
      const categoryEmojis = {
        Misc: "<:misc:1301837560758276107>",
        Music: "<:music_avon:1064924736833986642>",
        Config: "<:x_setting:1301356402182324235>",
        Filters: "<:Avon_Filters:1130897583242485891>",
        Settings: "<:settings_avon:1066317766312874004>",
        Games: "<:games_red:1246412396080140338>",
      };
      const getCategories = () => {
        const categories = [...new Set(client.commands.map((c) => c.category))];
        return categories.filter(
          (category) => category && category.trim().length > 0
        );
      };
      const getCommandsByCategory = (category) =>
        client.commands.filter((c) => c.category === category);
      const getAllCommands = () =>
        client.commands.map((cmd) => ({
          name: cmd.name || "Unknown",
          category: cmd.category || "Uncategorized",
          desc: cmd.desc || "No description available",
          permission: cmd.permission || "",
          aliases: cmd.aliases || [],
        }));
      const searchCommands = (query) => {
        query = query.toLowerCase();
        const commands = getAllCommands();
        return commands.filter((cmd) => {
          if (cmd.name.toLowerCase() === query) return true;
          if (cmd.aliases.some((alias) => alias.toLowerCase() === query))
            return true;
          const nameDistance = tezz(query, cmd.name.toLowerCase());
          if (nameDistance <= 2) return true;
          if (cmd.name.toLowerCase().includes(query)) return true;
          if (cmd.desc.toLowerCase().includes(query)) return true;
          return false;
        });
      };
      if (args.length > 0) {
        const query = args.join(" ");
        const searchResults = searchCommands(query);
        const searchEmbed = new EmbedBuilder()
          .setColor(client.config.color)
          .setTitle(`Search Results for "${query}"`)
          .setDescription(
            searchResults.length > 0
              ? searchResults
                  .map(
                    (cmd) =>
                      `**${cmd.name}** ${
                        cmd.aliases.length > 0
                          ? `(${cmd.aliases.join(", ")})`
                          : ""
                      }\n` + `└ *${cmd.desc}*`
                  )
                  .join("\n\n")
              : "No commands found matching your search."
          )
          .setFooter({
            text: `Found ${searchResults.length} command${
              searchResults.length !== 1 ? "s" : ""
            }`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          });

        return message.channel.send({ embeds: [searchEmbed] });
      }
      const MainEmbed = () => {
        return new EmbedBuilder()
          .setColor(client.config.color)
          .setAuthor({
            name: `${client.user.username} Help Menu`,
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `<:Musica:1065097555039494144> Namaskar! <@${message.author.id}> to the Avon Help Desk!\n\n` +
              `<:arrow:1031935599340437594> Use the buttons below to navigate\n` +
              `<:arrow:1031935599340437594> Search for commands using \`${guildData.prefix}help <query>\`\n` +
              `<:arrow:1031935599340437594> Select categories from the dropdown menu`
          )
          .addFields(
            {
              name: "<:Stats:1286972586592309309> Stats",
              value: `Commands: ${client.commands.size} | Categories: ${
                getCategories().length
              }`,
              inline: false,
            },
            {
              name: "<:sia_waoo:1068431077573660754> Quick Search",
              value: `Use \`${guildData.prefix}help <query>\` to search for commands!`,
              inline: false,
            }
          )
          .setImage(
            "https://cdn.discordapp.com/attachments/971701889223782400/1286758037817921607/Sia_Canary.gif?ex=6725c88f&is=6724770f&hm=3fbac60141df32658b20c849b2bd10566d311bd2a51d5c76bc53bed1a742e08d&"
          )
          .setFooter({
            text: `Requested by ${
              message.author.globalName || message.author.tag
            }`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));
      };
      if (args.length > 0) {
        const query = args.join(" ");
        const searchResults = searchCommands(query);
        const searchEmbed = new EmbedBuilder()
          .setColor(client.config.color)
          .setTitle(`Search Results for "${query}"`)
          .setDescription(
            searchResults.length > 0
              ? searchResults
                  .map(
                    (cmd) =>
                      `**${cmd.name}** ${
                        cmd.aliases.length > 0
                          ? `(${cmd.aliases.join(", ")})`
                          : ""
                      }\n` + `└ *${cmd.desc}*`
                  )
                  .join("\n\n")
              : "No commands found matching your search."
          )
          .setFooter({
            text: `Found ${searchResults.length} command${
              searchResults.length !== 1 ? "s" : ""
            }`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          });
        return message.channel.send({ embeds: [searchEmbed] });
      }
      const createSelectMenu = () => {
        return new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("help_category_select")
            .setPlaceholder("Select a category")
            .addOptions(
              getCategories().map((category) => ({
                label: category,
                value: category,
                description: `View all ${category} commands`,
              }))
            )
        );
      };
      const createMainButtons = () => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("help_home")
            .setLabel("Home")
            .setEmoji("1301355658607595552")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("help_search")
            .setLabel("Search")
            .setEmoji("990697555438497802")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("all_commands")
            .setLabel("All Commands")
            .setEmoji("1109988487207338044")
            .setStyle(ButtonStyle.Secondary)
        );
      };
      const formatCommandList = () => {
        const categories = getCategories();
        return categories
          .map((category) => {
            const commands = getCommandsByCategory(category);
            const emoji = categoryEmojis[category] || "📁";
            return (
              `${emoji} **${category}**\n` +
              commands.map((cmd) => `\`${cmd.name}\``).join(", ")
            );
          })
          .join("\n\n");
      };
      const helpMessage = await message.channel.send({
        embeds: [MainEmbed()],
        components: [createSelectMenu(), createMainButtons()],
      });
      const collector = helpMessage.createMessageComponentCollector({
        time: 300000,
      });
      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "This help menu is not for you!",
            ephemeral: true,
          });
        }
        try {
          if (interaction.isButton()) {
            if (interaction.customId === "help_home") {
              await interaction.update({
                embeds: [MainEmbed()],
                components: [createSelectMenu(), createMainButtons()],
              });
            } else if (interaction.customId === "all_commands") {
              const allCommandsEmbed = new EmbedBuilder()
                .setColor(client.config.color)
                .setTitle("All Commands")
                .setDescription(formatCommandList())
                .setFooter({
                  text: `Requested by ${
                    message.author.globalName || message.author.tag
                  }`,
                  iconURL: message.author.displayAvatarURL({ dynamic: true }),
                })
                .setImage(
                  "https://cdn.discordapp.com/attachments/971701889223782400/1286758037817921607/Sia_Canary.gif?ex=6725c88f&is=6724770f&hm=3fbac60141df32658b20c849b2bd10566d311bd2a51d5c76bc53bed1a742e08d&"
                );
              await interaction.update({
                embeds: [allCommandsEmbed],
                components: [createSelectMenu(), createMainButtons()],
              });
            } else if (interaction.customId === "help_search") {
              let searchEmbed = new EmbedBuilder()
                .setColor(client.config.color)
                .setTitle("Search Commands")
                .setDescription(
                  "- Enter a command name or category to search in the help menu."
                )
                .setFooter({
                  text: `Requested by ${
                    message.author.globalName || message.author.tag
                  }`,
                  iconURL: message.author.displayAvatarURL({ dynamic: true }),
                });
              const searchMessage = await interaction.update({
                embeds: [searchEmbed],
                components: [],
              });
              const filter = (m) => m.author.id === message.author.id;
              const searchCollector = message.channel.createMessageCollector({
                filter,
                time: 30000,
              });
              searchCollector.on("collect", async (msg) => {
                const query = msg.content.trim();
                const searchResults = searchCommands(query);
                searchEmbed = new EmbedBuilder()
                  .setColor(client.config.color)
                  .setTitle(`Search Results for "${query}"`)
                  .setDescription(
                    searchResults.length > 0
                      ? searchResults
                          .map(
                            (cmd) =>
                              `- **${cmd.name}** ${
                                cmd.aliases.length > 0
                                  ? `(${cmd.aliases.join(", ")})`
                                  : ""
                              }\n` + `└ *${cmd.desc}*`
                          )
                          .join("\n\n")
                      : "No commands found matching your search."
                  )
                  .setFooter({
                    text: `Found ${searchResults.length} command${
                      searchResults.length !== 1 ? "s" : ""
                    }`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true }),
                  });
                await searchMessage
                  .edit({ embeds: [searchEmbed] })
                  .catch(console.error);
                searchCollector.stop();
              });
              searchCollector.on("end", (t, r) => {
                const content =
                  r === "time"
                    ? "Session expired! Please run Help command again."
                    : "Search cancelled!";
                searchMessage.edit({ components: [] }).catch(console.error);
              });
            }
          } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "help_category_select") {
              const category = interaction.values[0];
              const commands = getCommandsByCategory(category);
              const emoji = categoryEmojis[category] || "📁";
              const categoryEmbed = new EmbedBuilder()
                .setColor(client.config.color)
                .setTitle(`${emoji} ${category} Commands`)
                .setDescription(
                  commands
                    .map(
                      (cmd) =>
                        `- **${cmd.name}** ${
                          cmd.aliases.length > 0
                            ? `(${cmd.aliases.join(", ")})`
                            : ""
                        }\n` + `└ *${cmd.desc}*`
                    )
                    .join("\n\n")
                )
                .setFooter({
                  text: `${commands.size} commands in this category`,
                  iconURL: message.author.displayAvatarURL({ dynamic: true }),
                });
              await interaction.update({
                embeds: [categoryEmbed],
                components: [createSelectMenu(), createMainButtons()],
              });
            }
          }
        } catch (error) {
          console.error("Interaction error:", error);
          await interaction
            .reply({
              content: "An error occurred while processing your request.",
              ephemeral: true,
            })
            .catch(console.error);
        }
      });
      collector.on("end", () => {
        helpMessage
          .edit({
            components: [],
            content: "Help menu expired! Please run the command again.",
          })
          .catch(console.error);
      });
    } catch (error) {
      console.error("Command error:", error);
      message.channel
        .send("An error occurred while displaying the help menu.")
        .catch(console.error);
    }
  },
};
// const {
//   EmbedBuilder,
//   ActionRowBuilder,
//   ButtonBuilder,
//   StringSelectMenuBuilder,
//   ButtonStyle,
// } = require("discord.js");

// function tezz(a, b) {
//   const matrix = [];
//   for (let i = 0; i <= b.length; i++) {
//     matrix[i] = [i];
//   }
//   for (let j = 0; j <= a.length; j++) {
//     matrix[0][j] = j;
//   }
//   for (let i = 1; i <= b.length; i++) {
//     for (let j = 1; j <= a.length; j++) {
//       if (b.charAt(i - 1) === a.charAt(j - 1)) {
//         matrix[i][j] = matrix[i - 1][j - 1];
//       } else {
//         matrix[i][j] = Math.min(
//           matrix[i - 1][j - 1] + 1,
//           matrix[i][j - 1] + 1,
//           matrix[i - 1][j] + 1
//         );
//       }
//     }
//   }
//   return matrix[b.length][a.length];
// }

// module.exports = {
//   name: "help",
//   aliases: ["h"],
//   category: "Misc",
//   permission: "",
//   desc: "Displays all available commands or details for a specific command",
//   dev: false,
//   options: {
//     owner: false,
//     inVc: false,
//     sameVc: false,
//     player: {
//       playing: false,
//       active: false,
//     },
//     premium: false,
//     vote: false,
//   },
//   run: async ({ client, message, args }) => {
//     try {
//       const getCategories = () => {
//         const categories = [...new Set(client.commands.map((c) => c.category))];
//         // Filter out any undefined, null, or empty categories
//         return categories.filter(category => category && category.trim().length > 0);
//       };

//       const getCommandsByCategory = (category) =>
//         client.commands.filter((c) => c.category === category);

//       const getAllCommands = () =>
//         client.commands.map((c) => ({
//           name: c.name || "Unknown",
//           category: c.category || "Uncategorized",
//           desc: c.desc || "No description available",
//           permission: c.permission || "",
//         }));

//       const MainEmbed = () => {
//         return new EmbedBuilder()
//           .setColor(client.config.color)
//           .setAuthor({
//             name: `${client.user.username} Help Desk`,
//             iconURL: client.user.displayAvatarURL({ dynamic: true }),
//           })
//           .setDescription(
//             `<:Musica:1065097555039494144> Namaskar! <@${message.author.id}> to the Avon Help Desk! Here's how to use it:\n\n<a:cyandot:1286945331866632245> Use the buttons below to navigate\n<a:cyandot:1286945331866632245> Select a category to see its commands`
//           )
//           .addFields(
//             {
//               name: "<:Stats:1286972586592309309> Stats",
//               value: `Commands: ${client.commands.size} | Categories: ${
//                 getCategories().length
//               }`,
//               inline: false,
//             },
//             {
//               name: "<:sia_waoo:1068431077573660754> Need help?",
//               value:
//                 "Avon Search is here to help you! Search for a command or category to get more details",
//               inline: false,
//             }
//           )
//           .setFooter({
//             text: `Requested by ${
//               message.author.globalName || message.author.tag
//             }`,
//             iconURL: message.author.displayAvatarURL({ dynamic: true }),
//           })
//           .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
//           .setImage(
//             "https://cdn.discordapp.com/attachments/971701889223782400/1286758037817921607/Sia_Canary.gif"
//           );
//       };
//       const createSelectMenuOptions = () => {
//         const categories = getCategories();
//         return categories.map(category => ({
//           label: category || "Uncategorized",
//           value: category || "uncategorized",
//           description: `View all ${category || "Uncategorized"} commands`,
//         }));
//       };
//       const firstRow = new ActionRowBuilder().addComponents(
//         new StringSelectMenuBuilder()
//           .setCustomId('help_category_select')
//           .setPlaceholder('Select a category')
//           .setDisabled(false)
//           .addOptions(createSelectMenuOptions())
//       );

//       // Second row of components - Main navigation buttons
//       const secondRow = new ActionRowBuilder().addComponents(
//         new ButtonBuilder()
//           .setCustomId('help_home')
//           .setLabel('Home')
//           .setStyle(ButtonStyle.Primary)
//           .setDisabled(true),
//         new ButtonBuilder()
//           .setCustomId('help_categories')
//           .setLabel('Categories')
//           .setStyle(ButtonStyle.Secondary),
//         new ButtonBuilder()
//           .setCustomId('help_search')
//           .setLabel('Search')
//           .setStyle(ButtonStyle.Success),
//       );
//       const createCategoryButtons = () => {
//         const rows = [];
//         const categories = getCategories();
//         const buttonsPerRow = 5;
//         for (let i = 0; i < categories.length; i += buttonsPerRow) {
//           const row = new ActionRowBuilder();
//           const rowCategories = categories.slice(i, i + buttonsPerRow);
//           rowCategories.forEach(category => {
//             if (category && category.trim().length > 0) {
//               row.addComponents(
//                 new ButtonBuilder()
//                   .setCustomId(`category_${category}`)
//                   .setLabel(category)
//                   .setStyle(ButtonStyle.Secondary)
//               );
//             }
//           });
//           if (row.components.length > 0) {
//             rows.push(row);
//           }
//         }
//         return rows;
//       };
//       const helpMessage = await message.channel.send({
//         embeds: [MainEmbed()],
//         components: [firstRow, secondRow],
//       });
//       const collector = helpMessage.createMessageComponentCollector({
//         time: 300000, // 5 minutes
//       });

//       collector.on('collect', async (interaction) => {
//         try {
//           if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
//           if (interaction.user.id !== message.author.id) {
//             return interaction.reply({
//               content: 'This help menu is not for you!',
//               ephemeral: true,
//             });
//           }

//           // Handle different interactions
//           if (interaction.customId === 'help_categories') {
//             const categoryRows = createCategoryButtons();
//             if (categoryRows.length === 0) {
//               return interaction.reply({
//                 content: 'No valid categories found!',
//                 ephemeral: true,
//               });
//             }

//             await interaction.update({
//               components: [
//                 new ActionRowBuilder().addComponents(
//                   new ButtonBuilder()
//                     .setCustomId('help_back')
//                     .setLabel('Back')
//                     .setStyle(ButtonStyle.Danger)
//                 ),
//                 ...categoryRows,
//               ],
//             });
//           }

//           else if (interaction.customId === 'help_back') {
//             await interaction.update({
//               embeds: [MainEmbed()],
//               components: [firstRow, secondRow],
//             });
//           }

//           else if (interaction.customId.startsWith('category_')) {
//             const category = interaction.customId.replace('category_', '');
//             const commands = getCommandsByCategory(category);

//             if (!commands.size) {
//               return interaction.reply({
//                 content: `No commands found in the ${category} category!`,
//                 ephemeral: true,
//               });
//             }

//             const categoryEmbed = new EmbedBuilder()
//               .setColor(client.config.color)
//               .setTitle(`${category} Commands`)
//               .setDescription(
//                 commands
//                   .map(
//                     (cmd) =>
//                       `\`${cmd.name || "Unknown"}\` - ${cmd.desc || "No description"} ${
//                         cmd.permission ? `(Requires: ${cmd.permission})` : ''
//                       }`
//                   )
//                   .join('\n')
//               );

//             await interaction.update({
//               embeds: [categoryEmbed],
//               components: [
//                 new ActionRowBuilder().addComponents(
//                   new ButtonBuilder()
//                     .setCustomId('help_back')
//                     .setLabel('Back')
//                     .setStyle(ButtonStyle.Danger)
//                 ),
//               ],
//             });
//           }

//           else if (interaction.customId === 'help_search') {
//             // Enable the select menu for searching
//             firstRow.components[0].setDisabled(false);
//             await interaction.update({
//               components: [firstRow, secondRow],
//             });
//           }

//           else if (interaction.customId === 'help_category_select') {
//             const selectedCategory = interaction.values[0];
//             const commands = getCommandsByCategory(selectedCategory);

//             if (!commands.size) {
//               return interaction.reply({
//                 content: `No commands found in the ${selectedCategory} category!`,
//                 ephemeral: true,
//               });
//             }

//             const categoryEmbed = new EmbedBuilder()
//               .setColor(client.config.color)
//               .setTitle(`${selectedCategory} Commands`)
//               .setDescription(
//                 commands
//                   .map(
//                     (cmd) =>
//                       `\`${cmd.name || "Unknown"}\` - ${cmd.desc || "No description"} ${
//                         cmd.permission ? `(Requires: ${cmd.permission})` : ''
//                       }`
//                   )
//                   .join('\n')
//               );

//             await interaction.update({
//               embeds: [categoryEmbed],
//               components: [
//                 new ActionRowBuilder().addComponents(
//                   new ButtonBuilder()
//                     .setCustomId('help_back')
//                     .setLabel('Back')
//                     .setStyle(ButtonStyle.Danger)
//                 ),
//               ],
//             });
//           }
//         } catch (error) {
//           console.error('Interaction error:', error);
//           interaction.reply({
//             content: 'An error occurred while processing your request.',
//             ephemeral: true,
//           }).catch(console.error);
//         }
//       });

//       collector.on('end', () => {
//         helpMessage.edit({
//           components: [],
//           content: 'Help menu expired! Please run the command again.',
//         }).catch(console.error);
//       });

//     } catch (error) {
//       console.error('Command error:', error);
//       message.channel.send('An error occurred while displaying the help menu.').catch(console.error);
//     }
//   },
// };

// const {
//   EmbedBuilder,
//   ActionRowBuilder,
//   ButtonBuilder,
//   StringSelectMenuBuilder,
//   ButtonStyle,
// } = require("discord.js");

// function tezz(a, b) {
//   const matrix = [];
//   for (let i = 0; i <= b.length; i++) {
//     matrix[i] = [i];
//   }
//   for (let j = 0; j <= a.length; j++) {
//     matrix[0][j] = j;
//   }
//   for (let i = 1; i <= b.length; i++) {
//     for (let j = 1; j <= a.length; j++) {
//       if (b.charAt(i - 1) === a.charAt(j - 1)) {
//         matrix[i][j] = matrix[i - 1][j - 1];
//       } else {
//         matrix[i][j] = Math.min(
//           matrix[i - 1][j - 1] + 1,
//           matrix[i][j - 1] + 1,
//           matrix[i - 1][j] + 1
//         );
//       }
//     }
//   }
//   return matrix[b.length][a.length];
// }
// module.exports = {
//   name: "help",
//   aliases: ["h"],
//   category: "Misc",
//   permission: "",
//   desc: "Displays all available commands or details for a specific command",
//   dev: false,
//   options: {
//     owner: false,
//     inVc: false,
//     sameVc: false,
//     player: {
//       playing: false,
//       active: false,
//     },
//     premium: false,
//     vote: false,
//   },
//   run: async ({ client, message, args }) => {
//     try {
//       const getCategories = () => [
//         ...new Set(client.commands.map((c) => c.category)),
//       ];
//       const getCommandsByCategory = (category) =>
//         client.commands.filter((c) => c.category === category);
//       const getAllCommands = () =>
//         client.commands.map((c) => ({
//           name: c.name,
//           category: c.category,
//           desc: c.desc,
//         }));
//       const createMainEmbed = () => {
//         return new EmbedBuilder()
//           .setColor(client.config.color)
//           .setAuthor({
//             name: `${client.user.username} Help Menu`,
//             iconURL: client.user.displayAvatarURL({ dynamic: true }),
//           })
//           .setDescription(
//             `Namaskar! <@${message.author.id}> to the Avon Help Desk! Here's how to use it:\n\n<a:cyandot:1286945331866632245> Use the buttons below to navigate\n<a:cyandot:1286945331866632245> Select a category to see its commands\n\n📝 Tip: You can also use \`${client.config.def_prefix}help <command/category>\` for quick info`
//           )
//           .addFields(
//             {
//               name: "<:Stats:1286972586592309309> Stats",
//               value: `Commands: ${client.commands.size} | Categories: ${
//                 getCategories().length
//               }`,
//               inline: false,
//             },
//             {
//               name: "<:sia_waoo:1068431077573660754> Need help?",
//               value:
//                 "Can't find what you're looking for? Dont Worry i got you Use the Avon search!",
//               inline: false,
//             }
//           )
//           .setFooter({
//             text: `Requested by ${
//               message.author.globalName || message.author.tag
//             } | Tip: This help menu will timeout after 5 minutes`,
//             iconURL: message.author.displayAvatarURL({ dynamic: true }),
//           })
//           .setImage(
//             "https://cdn.discordapp.com/attachments/971701889223782400/1286758037817921607/Sia_Canary.gif?ex=66ef124f&is=66edc0cf&hm=de9ae78dba8c727822c825ee40709d0550c995679c09e665e37fbaf116336140&"
//           );
//       };
//       const createCategoryEmbed = (category) => {
//         const commands = getCommandsByCategory(category);
//         return new EmbedBuilder()
//           .setColor(client.config.color)
//           .setTitle(`<:utitlit:1031929991841202258> ${category} Commands`)
//           .setDescription(
//             commands.map((cmd) => `\`${cmd.name}\`: ${cmd.desc}`).join("\n")
//           )
//           .setFooter({
//             text: `${commands.size} commands in this category | Use the buttons to navigate`,
//             iconURL: message.author.displayAvatarURL({ dynamic: true }),
//           })
//           .setImage(
//             "https://cdn.discordapp.com/attachments/971701889223782400/1286758037817921607/Sia_Canary.gif?ex=66ef124f&is=66edc0cf&hm=de9ae78dba8c727822c825ee40709d0550c995679c09e665e37fbaf116336140&"
//           );
//       };
//       const createCommandEmbed = (command) => {
//         return new EmbedBuilder()
//           .setColor(client.config.color)
//           .setTitle(`ℹ️ Command: ${command.name}`)
//           .setDescription(command.desc)
//           .addFields(
//             {
//               name: "🏷️ Aliases",
//               value: command.aliases.join(", ") || "None",
//               inline: true,
//             },
//             { name: "<:utitlit:1031929991841202258> Category", value: command.category, inline: true },
//             {
//               name: "🖥️ Usage",
//               value: `\`${client.config.def_prefix}${command.name}\``,
//               inline: true,
//             },
//             {
//               name: "<:zZ_aryan_smile:1068420133900529724> Tip",
//               value:
//                 "Use the buttons below to go back or explore more commands!",
//               inline: false,
//             }
//           )
//           .setFooter({
//             text: `Requested by ${
//               message.author.globalName || message.author.tag
//             }`,
//             iconURL: message.author.displayAvatarURL({ dynamic: true }),
//           })
//           .setImage(
//             "https://cdn.discordapp.com/attachments/971701889223782400/1286758037817921607/Sia_Canary.gif?ex=66ef124f&is=66edc0cf&hm=de9ae78dba8c727822c825ee40709d0550c995679c09e665e37fbaf116336140&"
//           );
//       };
//       const createDynamicComponents = (
//         currentView = "main",
//         currentCategory = null
//       ) => {
//         const rows = [];
//         const mainRow = new ActionRowBuilder().addComponents(
//           new ButtonBuilder()
//             .setCustomId("main")
//             .setLabel("Main Menu")
//             .setEmoji("1131648273137029233")
//             .setStyle(
//               currentView === "main"
//                 ? ButtonStyle.Primary
//                 : ButtonStyle.Secondary
//             )
//             .setDisabled(currentView === "main"),
//           new ButtonBuilder()
//             .setCustomId("categories")
//             .setLabel("Categories")
//             .setEmoji("<:utitlit:1031929991841202258>")
//             .setStyle(
//               currentView === "categories"
//                 ? ButtonStyle.Primary
//                 : ButtonStyle.Secondary
//             )
//             .setDisabled(currentView === "categories"),
//           new ButtonBuilder()
//             .setCustomId("all_commands")
//             .setLabel("All Commands")
//             .setEmoji("📜")
//             .setStyle(
//               currentView === "all_commands"
//                 ? ButtonStyle.Primary
//                 : ButtonStyle.Secondary
//             )
//             .setDisabled(currentView === "all_commands"),
//           new ButtonBuilder()
//             .setCustomId("search")
//             .setLabel("Search")
//             .setEmoji("<:sia_waoo:1068431077573660754>")
//             .setStyle(ButtonStyle.Success)
//         );
//         rows.push(mainRow);
//         if (currentView === "categories" || currentView === "category") {
//           const categories = getCategories();
//           if (categories.length <= 5) {
//             const categoryRow = new ActionRowBuilder();
//             let catEmojis = {};
//             categories.forEach((cat) => {
//               categoryRow.addComponents(
//                 new ButtonBuilder()
//                   .setCustomId(`category_${cat}`)
//                   .setLabel(cat)
//                   .setStyle(
//                     currentCategory === cat
//                       ? ButtonStyle.Primary
//                       : ButtonStyle.Secondary
//                   )
//               );
//             });
//             rows.push(categoryRow);
//           } else {
//             const categorySelect = new StringSelectMenuBuilder()
//               .setCustomId("category_select")
//               .setPlaceholder("Select a category")
//               .addOptions(
//                 categories.map((cat) => ({
//                   label: cat,
//                   description: `View commands in the ${cat} category`,
//                   value: cat,
//                   default: currentCategory === cat,
//                 }))
//               );
//             rows.push(new ActionRowBuilder().addComponents(categorySelect));
//           }
//         }
//         return rows;
//       };
//       const findSimilarCommands = (query, threshold = 3) => {
//         return getAllCommands().filter(
//           (cmd) =>
//             tezz(query, cmd.name) <= threshold ||
//             (Array.isArray(cmd.aliases) &&
//               cmd.aliases.join(" ").includes(query))
//         );
//       };
//       const handleSearch = (query) => {
//         const command =
//           client.commands.get(query) ||
//           client.commands.find((cmd) => cmd.aliases.includes(query));
//         const category = getCategories().find(
//           (cat) => cat.toLowerCase() === query
//         );
//         if (command) {
//           return { embed: createCommandEmbed(command), view: "command" };
//         } else if (category) {
//           return {
//             embed: createCategoryEmbed(category),
//             view: "category",
//             category,
//           };
//         } else {
//           const similarCommands = findSimilarCommands(query);
//           if (similarCommands.length > 0) {
//             const searchEmbed = new EmbedBuilder()
//               .setColor(client.config.color)
//               .setTitle("<:sia_waoo:1068431077573660754> Search Results")
//               .setDescription(
//                 similarCommands
//                   .map(
//                     (cmd) => `\`${cmd.name}\` (${cmd.category}): ${cmd.desc}`
//                   )
//                   .join("\n")
//               )
//               .addFields({
//                 name: "<:zZ_aryan_smile:1068420133900529724> Tip",
//                 value: "Click on a command name to see more details!",
//                 inline: false,
//               })
//               .setFooter({
//                 text: `${similarCommands.length} similar commands found | Use the buttons to navigate`,
//               });
//             return { embed: searchEmbed, view: "search" };
//           } else {
//             return {
//               embed: createMainEmbed().setDescription(
//                 "No matching commands found. Try searching again or use the navigation buttons."
//               ),
//               view: "main",
//             };
//           }
//         }
//       };
//       let initialView = "main";
//       let initialCategory = null;
//       let initialEmbed = createMainEmbed();
//       if (args.length > 0) {
//         const query = args.join(" ").toLowerCase();
//         const searchResult = handleSearch(query);
//         initialView = searchResult.view;
//         initialCategory = searchResult.category;
//         initialEmbed = searchResult.embed;
//       }
//       const helpMessage = await message.channel.send({
//         embeds: [initialEmbed],
//         components: createDynamicComponents(initialView, initialCategory),
//       });
//       const collector = helpMessage.createMessageComponentCollector({
//         filter: (i) => i.user.id === message.author.id,
//         time: 300000,
//       });
//       collector.on("collect", async (interaction) => {
//         let newView = initialView;
//         let newCategory = initialCategory;
//         let newEmbed = initialEmbed;
//         if (interaction.isButton()) {
//           if (interaction.customId === "main") {
//             newView = "main";
//             newEmbed = createMainEmbed();
//           } else if (interaction.customId === "categories") {
//             newView = "categories";
//             newEmbed = new EmbedBuilder()
//               .setColor(client.config.color)
//               .setTitle("<:utitlit:1031929991841202258> Command Categories")
//               .setDescription(
//                 getCategories()
//                   .map((cat) => `• ${cat}`)
//                   .join("\n")
//               )
//               .addFields({
//                 name: "<:zZ_aryan_smile:1068420133900529724> Tip",
//                 value: "Click on a category to see its commands!",
//                 inline: false,
//               });
//           } else if (interaction.customId === "all_commands") {
//             newView = "all_commands";
//             newEmbed = new EmbedBuilder()
//               .setColor(client.config.color)
//               .setTitle("📜 All Commands")
//               .setDescription(
//                 `Here are all the commands, organized by category:\n\n${getCategories()
//                   .map(
//                     (cat) =>
//                       `<:utitlit:1031929991841202258> **${cat}**\n${getCommandsByCategory(cat)
//                         .map((cmd) => `\`${cmd.name}\``)
//                         .join(", ")}`
//                   )
//                   .join("\n\n")}`
//               )
//               .addFields({
//                 name: "<:zZ_aryan_smile:1068420133900529724> Tip",
//                 value:
//                   "Use the Avon search or navigate to a specific category for more details!",
//                 inline: false,
//               });
//           } else if (interaction.customId === "search") {
//             await interaction.deferReply({ ephemeral: true });
//             await interaction.followUp({
//               content:
//                 "Please enter command or category name to search for below this message.",
//             });
//             const filter = (m) => m.author.id === interaction.user.id;
//             const collected = await interaction.channel.awaitMessages({
//               filter,
//               max: 1,
//               time: 30000,
//               errors: ["time"],
//             });
//             const query = collected.first().content.toLowerCase();
//             const searchResult = handleSearch(query);
//             newView = searchResult.view;
//             newCategory = searchResult.category;
//             newEmbed = searchResult.embed;
//             await interaction.message.edit({
//               embeds: [newEmbed],
//               content: "",
//             });
//             return await interaction.editReply({
//               content:
//                 "-# **You can dismiss this message now, Happy Listening!!**",
//             });
//           } else if (interaction.customId.startsWith("category_")) {
//             newCategory = interaction.customId.split("_")[1];
//             newView = "category";
//             newEmbed = createCategoryEmbed(newCategory);
//           }
//         } else if (interaction.isStringSelectMenu()) {
//           if (interaction.customId === "category_select") {
//             newCategory = interaction.values[0];
//             newView = "category";
//             newEmbed = createCategoryEmbed(newCategory);
//           }
//         }
//         await interaction.update({
//           embeds: [newEmbed],
//           components: createDynamicComponents(newView, newCategory),
//         });
//       });
//       collector.on("end", () => {
//         helpMessage.edit({
//           components: [],
//           content:
//             "This help menu has expired. Use the help command again to start a new session.",
//         });
//       });
//     } catch (error) {
//       console.error(error);
//       await message.channel.send({
//         content:
//           "An error occurred while executing the help command. Please try again later or contact support if the issue persists.",
//         ephemeral: true,
//       });
//     }
//   },
// };

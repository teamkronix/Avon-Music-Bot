// const userSchema = require("../../Models/User");
// const {
//     EmbedBuilder,
//     ActionRowBuilder,
//     ButtonBuilder,
//     ButtonStyle,
//     ComponentType,
//     StringSelectMenuBuilder
// } = require("discord.js");

// module.exports = {
//     name: "mines",
//     aliases: ["sweeper-mines", "mine"],
//     category: "Games",
//     permission: "",
//     desc: "Advanced Customizable Minesweeper Game",
//     dev: false,
//     options: {
//         owner: false,
//         inVc: false,
//         sameVc: false,
//         player: {
//             playing: false,
//             active: false,
//         },
//         premium: false,
//         vote: false,
//     },
//     run: async ({ client, message, args }) => {
//         const GAME_CONFIG = {
//             GRID_SIZES: {
//                 small: { size: 3, baseMultiplier: 1.2, maxMines: 2 },
//                 medium: { size: 4, baseMultiplier: 1.5, maxMines: 4 },
//                 large: { size: 5, baseMultiplier: 1.8, maxMines: 6 }
//             },
//             RISK_LEVELS: {
//                 low: { mines: 2, multiplierFactor: 1.1 },
//                 moderate: { mines: 4, multiplierFactor: 1.3 },
//                 high: { mines: 6, multiplierFactor: 1.5 },
//                 extreme: { mines: 10, multiplierFactor: 2.0 }
//             },
//             MAX_MULTIPLIER: 25,
//             MIN_BET: 100,
//             MAX_BET: 100000
//         };

//         const userData = await userSchema.findOne({ id: message.author.id });
//         if (!userData) return message.reply("You need to create a profile first!");

//         // Embed and menu configurations
//         const createConfigMenus = () => {
//             return {
//                 gridSizeRow: new ActionRowBuilder().addComponents(
//                     new StringSelectMenuBuilder()
//                         .setCustomId('grid_size_select')
//                         .setPlaceholder('Select Grid Size')
//                         .addOptions(
//                             { label: 'Small (3x3)', value: 'small' },
//                             { label: 'Medium (4x4)', value: 'medium' },
//                             { label: 'Large (5x5)', value: 'large' }
//                         )
//                 ),
//                 riskLevelRow: new ActionRowBuilder().addComponents(
//                     new StringSelectMenuBuilder()
//                         .setCustomId('risk_level_select')
//                         .setPlaceholder('Select Risk Level')
//                         .addOptions(
//                             { label: 'Low Risk', value: 'low' },
//                             { label: 'Moderate Risk', value: 'moderate' },
//                             { label: 'High Risk', value: 'high' },
//                             { label: 'Extreme Risk', value: 'extreme' }
//                         )
//                 ),
//                 betRow: new ActionRowBuilder().addComponents(
//                     new StringSelectMenuBuilder()
//                         .setCustomId('bet_amount_select')
//                         .setPlaceholder('Select Bet Multiplier')
//                         .addOptions(
//                             { label: '1x Bet', value: '1' },
//                             { label: '5x Bet', value: '5' },
//                             { label: '10x Bet', value: '10' },
//                             { label: '25x Bet', value: '25' }
//                         )
//                 ),
//                 withdrawRow: new ActionRowBuilder().addComponents(
//                     new StringSelectMenuBuilder()
//                         .setCustomId('withdraw_threshold_select')
//                         .setPlaceholder('Select Auto Withdraw Threshold')
//                         .addOptions(
//                             { label: '10x Multiplier', value: '10' },
//                             { label: '15x Multiplier', value: '15' },
//                             { label: '20x Multiplier', value: '20' },
//                             { label: 'Max Multiplier (25x)', value: '25' }
//                         )
//                 )
//             };
//         };

//         const gameSettings = {
//             gridSize: GAME_CONFIG.GRID_SIZES.medium.size,
//             mines: GAME_CONFIG.RISK_LEVELS.moderate.mines,
//             betMultiplier: 1,
//             baseMultiplier: GAME_CONFIG.GRID_SIZES.medium.baseMultiplier,
//             autoWithdrawMultiplier: GAME_CONFIG.MAX_MULTIPLIER
//         };

//         // Embed for the game setup
//         const configEmbed = new EmbedBuilder()
//             .setTitle("💎 Mines Game Configuration 💣")
//             .setDescription(`**Current Settings:**\n• Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}\n• Mines: ${gameSettings.mines}\n• Bet Multiplier: ${gameSettings.betMultiplier}x\n• Auto-Withdraw at: ${gameSettings.autoWithdrawMultiplier}x\n\n**Your Balance:** ${userData.balance} coins`)
//             .setColor("#2f3136")
//             .setFooter({ text: `Player: ${message.author.tag}` });

//         const { gridSizeRow, riskLevelRow, betRow, withdrawRow } = createConfigMenus();

//         const startButton = new ButtonBuilder()
//             .setCustomId('start_mines_game')
//             .setLabel('Start Game')
//             .setStyle(ButtonStyle.Primary);

//         const configMessage = await message.reply({
//             embeds: [configEmbed],
//             components: [gridSizeRow, riskLevelRow, betRow, withdrawRow, new ActionRowBuilder().addComponents(startButton)]
//         });

//         const configCollector = configMessage.createMessageComponentCollector({
//             componentType: ComponentType.StringSelect,
//             time: 300000
//         });

//         // Config collection logic
//         configCollector.on('collect', async (interaction) => {
//             if (interaction.user.id !== message.author.id) {
//                 return interaction.reply({
//                     content: "This is not your configuration!",
//                     ephemeral: true
//                 });
//             }

//             switch (interaction.customId) {
//                 case 'grid_size_select':
//                     const selectedGridSize = GAME_CONFIG.GRID_SIZES[interaction.values[0]];
//                     gameSettings.gridSize = selectedGridSize.size;
//                     gameSettings.baseMultiplier = selectedGridSize.baseMultiplier;
//                     break;

//                 case 'risk_level_select':
//                     const selectedRiskLevel = GAME_CONFIG.RISK_LEVELS[interaction.values[0]];
//                     gameSettings.mines = selectedRiskLevel.mines;
//                     break;

//                 case 'bet_amount_select':
//                     gameSettings.betMultiplier = parseInt(interaction.values[0]);
//                     break;

//                 case 'withdraw_threshold_select':
//                     gameSettings.autoWithdrawMultiplier = parseInt(interaction.values[0]);
//                     break;

//                 case 'start_mines_game':
//                     configCollector.stop();
//                     await startMinesGame(interaction);
//                     return;
//             }

//             configEmbed.setDescription(`**Current Settings:**\n• Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}\n• Mines: ${gameSettings.mines}\n• Bet Multiplier: ${gameSettings.betMultiplier}x\n• Auto-Withdraw at: ${gameSettings.autoWithdrawMultiplier}x\n\n**Your Balance:** ${userData.balance} coins`);
//             await interaction.update({ embeds: [configEmbed], components: [gridSizeRow, riskLevelRow, betRow, withdrawRow, new ActionRowBuilder().addComponents(startButton)] });
//         });

//         // Game Logic
//         async function startMinesGame(interaction) {
//             const { gridSize, mines, betMultiplier, autoWithdrawMultiplier } = gameSettings;
//             let revealedCells = new Set();
//             let gameEnded = false;
//             let currentMultiplier = 1.0;
//             const minePositions = new Set();

//             while (minePositions.size < mines) {
//                 const pos = Math.floor(Math.random() * (gridSize * gridSize));
//                 minePositions.add(pos);
//             }

//             const gameEmbed = new EmbedBuilder()
//                 .setTitle("💎 Mines Game 💣")
//                 .setDescription(`**Bet Multiplier:** ${betMultiplier}x\n**Current Multiplier:** ${currentMultiplier}x\n**Mines:** ${mines}\n**Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}`)
//                 .setColor("#2f3136")
//                 .setFooter({ text: `Player: ${message.author.tag}` });

//             const gameMessage = await interaction.update({
//                 embeds: [gameEmbed],
//                 components: createButtons(gridSize)
//             });

//             const collector = gameMessage.createMessageComponentCollector({
//                 componentType: ComponentType.Button,
//                 time: 300000
//             });

//             // Game logic to handle interaction
//             const handleGameLogic = async (buttonInteraction, position) => {
//                 if (minePositions.has(position)) {
//                     gameEnded = true;
//                     gameEmbed.setDescription("💥 **BOOM! You hit a mine!**");
//                     collector.stop();
//                 } else {
//                     revealedCells.add(position);
//                     currentMultiplier = calculateMultiplier({
//                         gridSize,
//                         mines,
//                         revealedCells: revealedCells.size
//                     });

//                     if (currentMultiplier >= autoWithdrawMultiplier) {
//                         gameEmbed.setDescription("✅ **Auto-withdraw activated!**");
//                         collector.stop();
//                     }
//                 }
//             };

//             collector.on('collect', async (buttonInteraction) => {
//                 const position = parseInt(buttonInteraction.customId.split('_')[1]);
//                 await handleGameLogic(buttonInteraction, position);
//                 await buttonInteraction.update({
//                     embeds: [gameEmbed],
//                     components: createButtons(gridSize)
//                 });
//             });

//             collector.on('end', () => {
//                 gameEmbed.setDescription(gameEnded ? "💥 **Game Over**" : "✅ **Game Concluded.**");
//                 gameMessage.edit({
//                     embeds: [gameEmbed],
//                     components: []
//                 });
//             });
//         }
//     }
// };

// function createButtons(gridSize) {
//     const buttons = [];
//     for (let i = 0; i < gridSize * gridSize; i++) {
//         buttons.push(
//             new ButtonBuilder()
//                 .setCustomId(`cell_${i}`)
//                 .setLabel("❓")
//                 .setStyle(ButtonStyle.Secondary)
//         );
//     }
//     return [new ActionRowBuilder().addComponents(buttons)];
// }

// function calculateMultiplier({ gridSize, mines, revealedCells }) {
//     const riskMultiplier = (gridSize * gridSize - mines) / revealedCells;
//     return Math.min(riskMultiplier, GAME_CONFIG.MAX_MULTIPLIER);
// }

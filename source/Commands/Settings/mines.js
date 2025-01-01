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
//                 small: { size: 3, baseMultiplier: 1.2 },
//                 medium: { size: 4, baseMultiplier: 1.5 },
//                 large: { size: 5, baseMultiplier: 1.8 }
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

//         const createConfigMenus = () => {
//             const gridSizeMenu = new StringSelectMenuBuilder()
//                 .setCustomId('grid_size_select')
//                 .setPlaceholder('Select Grid Size')
//                 .addOptions(
//                     { label: 'Small (3x3)', value: 'small', description: 'Easier, lower rewards' },
//                     { label: 'Medium (4x4)', value: 'medium', description: 'Balanced' },
//                     { label: 'Large (5x5)', value: 'large', description: 'Challenging, high rewards' }
//                 );

//             const riskLevelMenu = new StringSelectMenuBuilder()
//                 .setCustomId('risk_level_select')
//                 .setPlaceholder('Select Risk Level')
//                 .addOptions(
//                     { label: 'Low Risk', value: 'low', description: 'Low multiplier' },
//                     { label: 'Moderate Risk', value: 'moderate', description: 'Balanced' },
//                     { label: 'High Risk', value: 'high', description: 'High multiplier' },
//                     { label: 'Extreme Risk', value: 'extreme', description: 'Very high multiplier' }
//                 );

//             const betMenu = new StringSelectMenuBuilder()
//                 .setCustomId('bet_amount_select')
//                 .setPlaceholder('Select Bet Multiplier')
//                 .addOptions(
//                     { label: '1x Bet', value: '1', description: 'Low stakes' },
//                     { label: '5x Bet', value: '5', description: 'Moderate stakes' },
//                     { label: '10x Bet', value: '10', description: 'High stakes' },
//                     { label: '25x Bet', value: '25', description: 'Max stakes' }
//                 );

//             return {
//                 gridSizeRow: new ActionRowBuilder().addComponents(gridSizeMenu),
//                 riskLevelRow: new ActionRowBuilder().addComponents(riskLevelMenu),
//                 betRow: new ActionRowBuilder().addComponents(betMenu)
//             };
//         };

//         const calculateMultiplier = (gameConfig) => {
//             const { gridSize, mines, revealedCells } = gameConfig;
//             const totalCells = gridSize * gridSize;
//             const safeCells = totalCells - mines;

//             const riskFactor = Math.pow(1 + (mines / totalCells), 1.5);
//             const safetyFactor = Math.log(1 + (revealedCells / safeCells)) + 1;
//             const baseMultiplier = 1 + (mines * 0.4);

//             return Math.min((baseMultiplier * riskFactor * safetyFactor).toFixed(2), GAME_CONFIG.MAX_MULTIPLIER);
//         };

//         const gameSettings = {
//             gridSize: GAME_CONFIG.GRID_SIZES.medium.size,
//             mines: GAME_CONFIG.RISK_LEVELS.moderate.mines,
//             betMultiplier: 1,
//             baseMultiplier: GAME_CONFIG.GRID_SIZES.medium.baseMultiplier
//         };

//         const configEmbed = new EmbedBuilder()
//             .setTitle("💎 Mines Game Configuration 💣")
//             .setDescription(`
//                 **Current Settings:**
//                 • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
//                 • Mines: ${gameSettings.mines}
//                 • Bet Multiplier: ${gameSettings.betMultiplier}x
                
//                 **Your Balance:** ${userData.balance} coins
//             `)
//             .setColor("#2f3136")
//             .setFooter({ text: `Player: ${message.author.tag}` });

//         const { gridSizeRow, riskLevelRow, betRow } = createConfigMenus();

//         const startButton = new ButtonBuilder()
//             .setCustomId('start_mines_game')
//             .setLabel('Start Game')
//             .setStyle(ButtonStyle.Primary);

//         const startRow = new ActionRowBuilder().addComponents(startButton);

//         const configMessage = await message.reply({
//             embeds: [configEmbed],
//             components: [gridSizeRow, riskLevelRow, betRow, startRow]
//         });

//         const configCollector = configMessage.createMessageComponentCollector({
//             time: 300000
//         });

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

//                 case 'start_mines_game':
//                     configCollector.stop();
//                     await startMinesGame(interaction);
//                     return;
//             }

//             configEmbed.setDescription(`
//                 **Current Settings:**
//                 • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
//                 • Mines: ${gameSettings.mines}
//                 • Bet Multiplier: ${gameSettings.betMultiplier}x
                
//                 **Your Balance:** ${userData.balance} coins
//             `);

//             await interaction.update({ 
//                 embeds: [configEmbed],
//                 components: [gridSizeRow, riskLevelRow, betRow, startRow] 
//             });
//         });

//         async function startMinesGame(interaction) {
//             const { gridSize, mines, betMultiplier, baseMultiplier } = gameSettings;
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
//                 .setDescription(`
//                     **Bet Multiplier:** ${betMultiplier}x
//                     **Current Multiplier:** ${currentMultiplier}x
//                     **Mines:** ${mines}
//                     **Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}
//                 `)
//                 .setColor("#2f3136")
//                 .setFooter({ text: `Player: ${message.author.tag}` });

//             const gameMessage = await interaction.update({
//                 embeds: [gameEmbed],
//                 components: createButtons()
//             });

//             const collector = gameMessage.createMessageComponentCollector({
//                 componentType: ComponentType.Button,
//                 time: 300000
//             });

//             const autoWithdrawMultiplier = GAME_CONFIG.MAX_MULTIPLIER;

//             const handleGameLogic = async (buttonInteraction, position) => {
//                 if (minePositions.has(position)) {
//                     gameEnded = true;
//                     minePositions.forEach(pos => revealedCells.add(pos));

//                     await userSchema.updateOne(
//                         { id: message.author.id },
//                         { 
//                             $inc: { 
//                                 balance: -betMultiplier,
//                                 "gameStats.mines.gamesPlayed": 1,
//                                 "gameStats.total.gamesPlayed": 1,
//                                 "gameStats.mines.totalBet": betMultiplier
//                             }
//                         }
//                     );

//                     gameEmbed.setDescription(`💥 **BOOM! You hit a mine!**`);
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
//                     components: createButtons()
//                 });
//             });

//             collector.on('end', () => {
//                 if (gameEnded) {
//                     gameEmbed.setDescription("💥 **Game Over**");
//                 } else {
//                     gameEmbed.setDescription("✅ **Game Concluded.**");
//                 }

//                 gameMessage.edit({
//                     embeds: [gameEmbed],
//                     components: []
//                 });
//             });
//         }

//         function createButtons() {
//             const buttonRows = [];
//             const gridSize = gameSettings.gridSize;

//             for (let i = 0; i < gridSize; i++) {
//                 const row = new ActionRowBuilder();
//                 for (let j = 0; j < gridSize; j++) {
//                     const buttonId = `button_${i * gridSize + j}`;
//                     row.addComponents(
//                         new ButtonBuilder()
//                             .setCustomId(buttonId)
//                             .setLabel("💠")
//                             .setStyle(ButtonStyle.Secondary)
//                     );
//                 }
//                 buttonRows.push(row);
//             }
//             return buttonRows;
//         }
//     }
// };



// // const userSchema = require("../../Models/User");
// // const { 
// //     EmbedBuilder, 
// //     ActionRowBuilder, 
// //     ButtonBuilder, 
// //     ButtonStyle, 
// //     ComponentType, 
// //     StringSelectMenuBuilder 
// // } = require("discord.js");

// // module.exports = {
// //     name: "mines",
// //     aliases: ["sweeper-mines", "mine"],
// //     category: "Games",
// //     permission: "",
// //     desc: "Advanced Customizable Minesweeper Game",
// //     dev: false,
// //     options: {
// //         owner: false,
// //         inVc: false,
// //         sameVc: false,
// //         player: {
// //             playing: false,
// //             active: false,
// //         },
// //         premium: false,
// //         vote: false,
// //     },
// //     run: async ({ client, message, args }) => {
// //         const GAME_CONFIG = {
// //             GRID_SIZES: {
// //                 small: { size: 5, baseMultiplier: 1.2 },
// //                 medium: { size: 7, baseMultiplier: 1.5 },
// //                 large: { size: 9, baseMultiplier: 1.8 }
// //             },
// //             RISK_LEVELS: {
// //                 easy: { mines: 3, multiplierFactor: 1.2 },
// //                 medium: { mines: 5, multiplierFactor: 1.5 },
// //                 hard: { mines: 8, multiplierFactor: 2.0 },
// //                 extreme: { mines: 12, multiplierFactor: 3.0 }
// //             },
// //             MAX_GAME_TIME: 600000,
// //             MIN_BET: 50,
// //             MAX_BET: 50000
// //         };

// //         const userData = await userSchema.findOne({ id: message.author.id });
// //         if (!userData) {
// //             return message.reply("You need to create a profile first!");
// //         }

// //         const createConfigMenus = () => {
// //             const gridSizeMenu = new StringSelectMenuBuilder()
// //                 .setCustomId('grid_size_select')
// //                 .setPlaceholder('Select Grid Size')
// //                 .addOptions(
// //                     { label: 'Small (5x5)', value: 'small', description: 'Easier gameplay, lower rewards' },
// //                     { label: 'Medium (7x7)', value: 'medium', description: 'Balanced gameplay and rewards' },
// //                     { label: 'Large (9x9)', value: 'large', description: 'Challenging, high potential rewards' }
// //                 );

// //             const riskLevelMenu = new StringSelectMenuBuilder()
// //                 .setCustomId('risk_level_select')
// //                 .setPlaceholder('Select Risk Level')
// //                 .addOptions(
// //                     { label: 'Easy (3 Mines)', value: 'easy', description: 'Low risk, low multiplier' },
// //                     { label: 'Medium (5 Mines)', value: 'medium', description: 'Balanced risk and reward' },
// //                     { label: 'Hard (8 Mines)', value: 'hard', description: 'High risk, high multiplier' },
// //                     { label: 'Extreme (12 Mines)', value: 'extreme', description: 'Extreme risk, massive potential' }
// //                 );

// //             const betMenu = new StringSelectMenuBuilder()
// //                 .setCustomId('bet_amount_select')
// //                 .setPlaceholder('Select Bet Amount')
// //                 .addOptions(
// //                     { label: '100 Coins', value: '100', description: 'Conservative bet' },
// //                     { label: '500 Coins', value: '500', description: 'Moderate stakes' },
// //                     { label: '1000 Coins', value: '1000', description: 'High stakes' },
// //                     { label: '5000 Coins', value: '5000', description: 'Very high stakes' }
// //                 );

// //             return {
// //                 gridSizeRow: new ActionRowBuilder().addComponents(gridSizeMenu),
// //                 riskLevelRow: new ActionRowBuilder().addComponents(riskLevelMenu),
// //                 betRow: new ActionRowBuilder().addComponents(betMenu)
// //             };
// //         };

// //         const calculateMultiplier = (gameConfig) => {
// //             const { gridSize, mines, revealedCells } = gameConfig;
// //             const totalCells = gridSize * gridSize;
// //             const safeCells = totalCells - mines;
            
// //             const riskFactor = Math.pow(1 + (mines / totalCells), 2);
// //             const safetyFactor = Math.log(1 + (revealedCells / safeCells)) + 1;
// //             const baseMultiplier = 1 + (mines * 0.5);
            
// //             return Number((baseMultiplier * riskFactor * safetyFactor).toFixed(2));
// //         };

// //         const gameSettings = {
// //             gridSize: GAME_CONFIG.GRID_SIZES.medium.size,
// //             mines: GAME_CONFIG.RISK_LEVELS.medium.mines,
// //             betAmount: 500,
// //             baseMultiplier: GAME_CONFIG.GRID_SIZES.medium.baseMultiplier
// //         };

// //         const configEmbed = new EmbedBuilder()
// //             .setTitle("💎 Mines Game Configuration 💣")
// //             .setDescription(`
// //                 **Current Settings:**
// //                 • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
// //                 • Mines: ${gameSettings.mines}
// //                 • Bet Amount: ${gameSettings.betAmount} coins
                
// //                 **Your Balance:** ${userData.balance} coins
// //             `)
// //             .setColor("#2f3136")
// //             .setFooter({ text: `Player: ${message.author.tag}` });

// //         const { gridSizeRow, riskLevelRow, betRow } = createConfigMenus();

// //         const startButton = new ButtonBuilder()
// //             .setCustomId('start_mines_game')
// //             .setLabel('Start Game')
// //             .setStyle(ButtonStyle.Primary);

// //         const startRow = new ActionRowBuilder().addComponents(startButton);

// //         const configMessage = await message.reply({
// //             embeds: [configEmbed],
// //             components: [gridSizeRow, riskLevelRow, betRow, startRow]
// //         });

// //         const configCollector = configMessage.createMessageComponentCollector({
// //             time: 300000
// //         });

// //         configCollector.on('collect', async (interaction) => {
// //             if (interaction.user.id !== message.author.id) {
// //                 return interaction.reply({
// //                     content: "This is not your configuration!",
// //                     ephemeral: true
// //                 });
// //             }

// //             switch (interaction.customId) {
// //                 case 'grid_size_select':
// //                     const selectedGridSize = GAME_CONFIG.GRID_SIZES[interaction.values[0]];
// //                     gameSettings.gridSize = selectedGridSize.size;
// //                     gameSettings.baseMultiplier = selectedGridSize.baseMultiplier;
// //                     break;
                
// //                 case 'risk_level_select':
// //                     const selectedRiskLevel = GAME_CONFIG.RISK_LEVELS[interaction.values[0]];
// //                     gameSettings.mines = selectedRiskLevel.mines;
// //                     break;
                
// //                 case 'bet_amount_select':
// //                     gameSettings.betAmount = parseInt(interaction.values[0]);
// //                     break;

// //                 case 'start_mines_game':
// //                     // if (gameSettings.betAmount > userData.balance) {
// //                     //     return interaction.reply({
// //                     //         content: "Insufficient balance for this bet!",
// //                     //         ephemeral: true
// //                     //     });
// //                     // }
// //                     configCollector.stop();
// //                     await startMinesGame(interaction);
// //                     return;
// //             }

// //             configEmbed.setDescription(`
// //                 **Current Settings:**
// //                 • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
// //                 • Mines: ${gameSettings.mines}
// //                 • Bet Amount: ${gameSettings.betAmount} coins
                
// //                 **Your Balance:** ${userData.balance} coins
// //             `);

// //             await interaction.update({ 
// //                 embeds: [configEmbed],
// //                 components: [gridSizeRow, riskLevelRow, betRow, startRow] 
// //             });
// //         });

// //         async function startMinesGame(interaction) {
// //             const { gridSize, mines, betAmount, baseMultiplier } = gameSettings;
// //             let revealedCells = new Set();
// //             let gameEnded = false;
// //             let currentMultiplier = 1.0;

// //             const minePositions = new Set();
// //             while (minePositions.size < mines) {
// //                 const pos = Math.floor(Math.random() * (gridSize * gridSize));
// //                 minePositions.add(pos);
// //             }

// //             const withdrawButton = new ButtonBuilder()
// //                 .setCustomId('withdraw_winnings')
// //                 .setLabel('Cash Out')
// //                 .setStyle(ButtonStyle.Success);

// //             const createButtons = () => {
// //                 const rows = [];
// //                 for (let i = 0; i < gridSize; i++) {
// //                     const row = new ActionRowBuilder();
// //                     for (let j = 0; j < gridSize; j++) {
// //                         const position = i * gridSize + j;
// //                         const button = new ButtonBuilder()
// //                             .setCustomId(`mine_${position}`)
// //                             .setStyle(revealedCells.has(position) 
// //                                 ? (minePositions.has(position) 
// //                                     ? ButtonStyle.Danger 
// //                                     : ButtonStyle.Success)
// //                                 : ButtonStyle.Secondary)
// //                             .setLabel(revealedCells.has(position) 
// //                                 ? (minePositions.has(position) ? "💥" : "💎")
// //                                 : "?");
                        
// //                         if (gameEnded || revealedCells.has(position)) {
// //                             button.setDisabled(true);
// //                         }
                        
// //                         row.addComponents(button);
// //                     }
// //                     rows.push(row);
// //                 }

// //                 if (!gameEnded) {
// //                     const withdrawRow = new ActionRowBuilder().addComponents(withdrawButton);
// //                     rows.push(withdrawRow);
// //                 }

// //                 return rows;
// //             };

// //             const gameEmbed = new EmbedBuilder()
// //                 .setTitle("💎 Mines Game 💣")
// //                 .setDescription(`
// //                     **Bet Amount:** ${betAmount} coins
// //                     **Current Multiplier:** ${currentMultiplier}x
// //                     **Mines:** ${mines}
// //                     **Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}
// //                 `)
// //                 .setColor("#2f3136")
// //                 .setFooter({ text: `Player: ${message.author.tag}` });

// //             const gameMessage = await interaction.update({
// //                 embeds: [gameEmbed],
// //                 components: createButtons()
// //             });

// //             const collector = gameMessage.createMessageComponentCollector({
// //                 componentType: ComponentType.Button,
// //                 time: GAME_CONFIG.MAX_GAME_TIME
// //             });

// //             const autoWithdrawMultiplier = 1.5;

// //             const handleGameLogic = async (buttonInteraction, position) => {
// //                 if (minePositions.has(position)) {
// //                     gameEnded = true;
// //                     minePositions.forEach(pos => revealedCells.add(pos));
                    
// //                     await userSchema.updateOne(
// //                         { id: message.author.id },
// //                         { 
// //                             $inc: { 
// //                                 balance: -betAmount,
// //                                 "gameStats.mines.gamesPlayed": 1,
// //                                 "gameStats.total.gamesPlayed": 1,
// //                                 "gameStats.mines.totalBet": betAmount
// //                             }
// //                         }
// //                     );

// //                     gameEmbed.setDescription(`
// //                         💥 **BOOM! You hit a mine!**
// //                         **Lost:** ${betAmount} coins
// //                         **Final Multiplier:** ${currentMultiplier}x
// //                     `).setColor("#ff0000");

// //                     return { update: true, end: true };
// //                 }

// //                 revealedCells.add(position);
                
// //                 currentMultiplier = calculateMultiplier({
// //                     gridSize, 
// //                     mines, 
// //                     revealedCells: revealedCells.size
// //                 }) * baseMultiplier;

// //                 if (currentMultiplier >= autoWithdrawMultiplier) {
// //                     const winAmount = Math.floor(betAmount * currentMultiplier);
                    
// //                     await userSchema.updateOne(
// //                         { id: message.author.id },
// //                         { 
// //                             $inc: { 
// //                                 balance: winAmount - betAmount,
// //                                 "gameStats.mines.gamesPlayed": 1,
// //                                 "gameStats.mines.gamesWon": 1,
// //                                 "gameStats.total.gamesPlayed": 1,
// //                                 "gameStats.total.gamesWon": 1,
// //                                 "gameStats.mines.totalBet": betAmount,
// //                                 "gameStats.mines.totalWon": winAmount
// //                             }
// //                         }
// //                     );

// //                     gameEmbed.setDescription(`
// //                         🎉 **Auto Cash Out! Multiplier exceeded ${autoWithdrawMultiplier}x**
// //                         **Won:** ${winAmount} coins
// //                         **Multiplier:** ${currentMultiplier.toFixed(2)}x
// //                     `).setColor("#00ff00");

// //                     return { update: true, end: true };
// //                 }

// //                 if (revealedCells.size === gridSize * gridSize - mines) {
// //                     gameEnded = true;
// //                     const winAmount = Math.floor(betAmount * currentMultiplier);
                    
// //                     await userSchema.updateOne(
// //                         { id: message.author.id },
// //                         { 
// //                             $inc: { 
// //                                 balance: winAmount - betAmount,
// //                                 "gameStats.mines.gamesPlayed": 1,
// //                                 "gameStats.mines.gamesWon": 1,
// //                                 "gameStats.total.gamesPlayed": 1,
// //                                 "gameStats.total.gamesWon": 1,
// //                                 "gameStats.mines.totalBet": betAmount,
// //                                 "gameStats.mines.totalWon": winAmount
// //                             }
// //                         }
// //                     );

// //                     gameEmbed.setDescription(`
// //                         🎉 **WINNER! You found all diamonds!**
// //                         **Won:** ${winAmount} coins
// //                         **Multiplier:** ${currentMultiplier}x
// //                     `).setColor("#00ff00");

// //                     return { update: true, end: true };
// //                 }

// //                 gameEmbed.setDescription(`
// //                     **Bet Amount:** ${betAmount} coins
// //                     **Current Multiplier:** ${currentMultiplier.toFixed(2)}x
// //                     **Mines:** ${mines}
// //                     **Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}
// //                 `);

// //                 return { update: true, end: false };
// //             };

// //             collector.on("collect", async (buttonInteraction) => {
// //                 if (buttonInteraction.user.id !== message.author.id) {
// //                     return buttonInteraction.reply({
// //                         content: "This is not your game!",
// //                         ephemeral: true
// //                     });
// //                 }

// //                 let result;
// //                 if (buttonInteraction.customId === 'withdraw_winnings') {
// //                     const winAmount = Math.floor(betAmount * currentMultiplier);
                    
// //                     await userSchema.updateOne(
// //                         { id: message.author.id },
// //                         { 
// //                             $inc: { 
// //                                 balance: winAmount - betAmount,
// //                                 "gameStats.mines.gamesPlayed": 1,
// //                                 "gameStats.mines.gamesWon": 1,
// //                                 "gameStats.total.gamesPlayed": 1,
// //                                 "gameStats.total.gamesWon": 1,
// //                                 "gameStats.mines.totalBet": betAmount,
// //                                 "gameStats.mines.totalWon": winAmount
// //                             }
// //                         }
// //                     );

// //                     gameEmbed.setDescription(`
// //                         💰 **Cashed Out!**
// //                         **Won:** ${winAmount} coins
// //                         **Multiplier:** ${currentMultiplier}x
// //                     `).setColor("#00ff00");

// //                     result = { update: true, end: true };
// //                 }
// //                 else {
// //                     const position = parseInt(buttonInteraction.customId.split('_')[1]);
// //                     result = await handleGameLogic(buttonInteraction, position);
// //                 }

// //                 if (result.update) {
// //                     await buttonInteraction.update({
// //                         embeds: [gameEmbed],
// //                         components: createButtons()
// //                     });
// //                 }

// //                 if (result.end) {
// //                     collector.stop();
// //                 }

// //             });
// //         }
// //     }
// // }


// // // const userSchema = require("../../Models/User");
// // // const { 
// // //     EmbedBuilder, 
// // //     ActionRowBuilder, 
// // //     ButtonBuilder, 
// // //     ButtonStyle, 
// // //     ComponentType, 
// // //     StringSelectMenuBuilder 
// // // } = require("discord.js");

// // // module.exports = {
// // //     name: "mines",
// // //     aliases: ["sweeper-mines", "mine"],
// // //     category: "Games",
// // //     permission: "",
// // //     desc: "Advanced Customizable Minesweeper Game",
// // //     dev: false,
// // //     options: {
// // //         owner: false,
// // //         inVc: false,
// // //         sameVc: false,
// // //         player: {
// // //             playing: false,
// // //             active: false,
// // //         },
// // //         premium: false,
// // //         vote: false,
// // //     },
// // //     run: async ({ client, message, args }) => {
// // //         try {
// // //             // Enhanced game configuration
// // //             const GAME_CONFIG = {
// // //                 GRID_SIZES: {
// // //                     small: { size: 5, baseMultiplier: 1.2 },
// // //                     medium: { size: 7, baseMultiplier: 1.5 },
// // //                     large: { size: 9, baseMultiplier: 1.8 }
// // //                 },
// // //                 RISK_LEVELS: {
// // //                     easy: { mines: 3, multiplierFactor: 1.2 },
// // //                     medium: { mines: 5, multiplierFactor: 1.5 },
// // //                     hard: { mines: 8, multiplierFactor: 2.0 },
// // //                     extreme: { mines: 12, multiplierFactor: 3.0 }
// // //                 },
// // //                 MAX_GAME_TIME: 600000, // 10 minutes
// // //                 MIN_BET: 50,
// // //                 MAX_BET: 50000
// // //             };

// // //             // Retrieve user data
// // //             const userData = await userSchema.findOne({ id: message.author.id });
// // //             if (!userData) {
// // //                 return message.reply("You need to create a profile first!");
// // //             }

// // //             // Configuration menus
// // //             const createConfigMenus = () => {
// // //                 const gridSizeMenu = new StringSelectMenuBuilder()
// // //                     .setCustomId('grid_size_select')
// // //                     .setPlaceholder('Select Grid Size')
// // //                     .addOptions(
// // //                         { label: 'Small (5x5)', value: 'small', description: 'Easier gameplay, lower rewards' },
// // //                         { label: 'Medium (7x7)', value: 'medium', description: 'Balanced gameplay and rewards' },
// // //                         { label: 'Large (9x9)', value: 'large', description: 'Challenging, high potential rewards' }
// // //                     );

// // //                 const riskLevelMenu = new StringSelectMenuBuilder()
// // //                     .setCustomId('risk_level_select')
// // //                     .setPlaceholder('Select Risk Level')
// // //                     .addOptions(
// // //                         { label: 'Easy (3 Mines)', value: 'easy', description: 'Low risk, low multiplier' },
// // //                         { label: 'Medium (5 Mines)', value: 'medium', description: 'Balanced risk and reward' },
// // //                         { label: 'Hard (8 Mines)', value: 'hard', description: 'High risk, high multiplier' },
// // //                         { label: 'Extreme (12 Mines)', value: 'extreme', description: 'Extreme risk, massive potential' }
// // //                     );

// // //                 const betMenu = new StringSelectMenuBuilder()
// // //                     .setCustomId('bet_amount_select')
// // //                     .setPlaceholder('Select Bet Amount')
// // //                     .addOptions(
// // //                         { label: '100 Coins', value: '100', description: 'Conservative bet' },
// // //                         { label: '500 Coins', value: '500', description: 'Moderate stakes' },
// // //                         { label: '1000 Coins', value: '1000', description: 'High stakes' },
// // //                         { label: '5000 Coins', value: '5000', description: 'Very high stakes' }
// // //                     );

// // //                 return {
// // //                     gridSizeRow: new ActionRowBuilder().addComponents(gridSizeMenu),
// // //                     riskLevelRow: new ActionRowBuilder().addComponents(riskLevelMenu),
// // //                     betRow: new ActionRowBuilder().addComponents(betMenu)
// // //                 };
// // //             };

// // //             // Advanced multiplier calculation
// // //             const calculateMultiplier = (gameConfig) => {
// // //                 const { gridSize, mines, revealedCells } = gameConfig;
// // //                 const totalCells = gridSize * gridSize;
// // //                 const safeCells = totalCells - mines;
                
// // //                 // Exponential risk factor
// // //                 const riskFactor = Math.pow(1 + (mines / totalCells), 2);
                
// // //                 // Safety factor with diminishing returns
// // //                 const safetyFactor = Math.log(1 + (revealedCells / safeCells)) + 1;
                
// // //                 // Base multiplier with dynamic scaling
// // //                 const baseMultiplier = 1 + (mines * 0.5);
                
// // //                 return Number((baseMultiplier * riskFactor * safetyFactor).toFixed(2));
// // //             };

// // //             // Game configuration state
// // //             const gameSettings = {
// // //                 gridSize: GAME_CONFIG.GRID_SIZES.medium.size,
// // //                 mines: GAME_CONFIG.RISK_LEVELS.medium.mines,
// // //                 betAmount: 500,
// // //                 baseMultiplier: GAME_CONFIG.GRID_SIZES.medium.baseMultiplier
// // //             };

// // //             // Initial configuration embed
// // //             const configEmbed = new EmbedBuilder()
// // //                 .setTitle("💎 Mines Game Configuration 💣")
// // //                 .setDescription(`
// // //                     **Current Settings:**
// // //                     • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
// // //                     • Mines: ${gameSettings.mines}
// // //                     • Bet Amount: ${gameSettings.betAmount} coins
                    
// // //                     **Your Balance:** ${userData.balance} coins
// // //                 `)
// // //                 .setColor("#2f3136")
// // //                 .setFooter({ text: `Player: ${message.author.tag}` });

// // //             const { gridSizeRow, riskLevelRow, betRow } = createConfigMenus();

// // //             // Send initial configuration message
// // //             const configMessage = await message.reply({
// // //                 embeds: [configEmbed],
// // //                 components: [gridSizeRow, riskLevelRow, betRow]
// // //             });

// // //             // Configuration collector
// // //             const configCollector = configMessage.createMessageComponentCollector({
// // //                 time: 300000 // 5 minutes
// // //             });

// // //             configCollector.on('collect', async (interaction) => {
// // //                 if (interaction.user.id !== message.author.id) {
// // //                     return interaction.reply({
// // //                         content: "This is not your configuration!",
// // //                         ephemeral: true
// // //                     });
// // //                 }

// // //                 // Update game settings based on selection
// // //                 switch (interaction.customId) {
// // //                     case 'grid_size_select':
// // //                         const selectedGridSize = GAME_CONFIG.GRID_SIZES[interaction.values[0]];
// // //                         gameSettings.gridSize = selectedGridSize.size;
// // //                         gameSettings.baseMultiplier = selectedGridSize.baseMultiplier;
// // //                         break;
                    
// // //                     case 'risk_level_select':
// // //                         const selectedRiskLevel = GAME_CONFIG.RISK_LEVELS[interaction.values[0]];
// // //                         gameSettings.mines = selectedRiskLevel.mines;
// // //                         break;
                    
// // //                     case 'bet_amount_select':
// // //                         gameSettings.betAmount = parseInt(interaction.values[0]);
// // //                         break;
// // //                 }

// // //                 // Validate bet amount
// // //                 // if (gameSettings.betAmount > userData.balance) {
// // //                 //     return interaction.reply({
// // //                 //         content: "Insufficient balance for this bet!",
// // //                 //         ephemeral: true
// // //                 //     });
// // //                 // }

// // //                 // Update configuration embed
// // //                 configEmbed.setDescription(`
// // //                     **Current Settings:**
// // //                     • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
// // //                     • Mines: ${gameSettings.mines}
// // //                     • Bet Amount: ${gameSettings.betAmount} coins
                    
// // //                     **Your Balance:** ${userData.balance} coins
// // //                 `);

// // //                 await interaction.update({ 
// // //                     embeds: [configEmbed],
// // //                     components: [gridSizeRow, riskLevelRow, betRow] 
// // //                 });
// // //             });

// // //             // Main game function
// // //             async function startMinesGame(interaction) {
// // //                 const { gridSize, mines, betAmount, baseMultiplier } = gameSettings;
// // //                 let revealedCells = new Set();
// // //                 let gameEnded = false;
// // //                 let currentMultiplier = 1.0;

// // //                 // Generate mine positions
// // //                 const minePositions = new Set();
// // //                 while (minePositions.size < mines) {
// // //                     const pos = Math.floor(Math.random() * (gridSize * gridSize));
// // //                     minePositions.add(pos);
// // //                 }

// // //                 // Withdrawal button
// // //                 const withdrawButton = new ButtonBuilder()
// // //                     .setCustomId('withdraw_winnings')
// // //                     .setLabel('Cash Out')
// // //                     .setStyle(ButtonStyle.Success);

// // //                 // Create game buttons
// // //                 const createButtons = () => {
// // //                     const rows = [];
// // //                     for (let i = 0; i < gridSize; i++) {
// // //                         const row = new ActionRowBuilder();
// // //                         for (let j = 0; j < gridSize; j++) {
// // //                             const position = i * gridSize + j;
// // //                             const button = new ButtonBuilder()
// // //                                 .setCustomId(`mine_${position}`)
// // //                                 .setStyle(revealedCells.has(position) 
// // //                                     ? (minePositions.has(position) 
// // //                                         ? ButtonStyle.Danger 
// // //                                         : ButtonStyle.Success)
// // //                                     : ButtonStyle.Secondary)
// // //                                 .setLabel(revealedCells.has(position) 
// // //                                     ? (minePositions.has(position) ? "💥" : "💎")
// // //                                     : "?");
                            
// // //                             if (gameEnded || revealedCells.has(position)) {
// // //                                 button.setDisabled(true);
// // //                             }
                            
// // //                             row.addComponents(button);
// // //                         }
// // //                         rows.push(row);
// // //                     }

// // //                     // Add withdrawal button if game is in progress
// // //                     if (!gameEnded) {
// // //                         const withdrawRow = new ActionRowBuilder().addComponents(withdrawButton);
// // //                         rows.push(withdrawRow);
// // //                     }

// // //                     return rows;
// // //                 };

// // //                 // Create game embed
// // //                 const gameEmbed = new EmbedBuilder()
// // //                     .setTitle("💎 Mines Game 💣")
// // //                     .setDescription(`
// // //                         **Bet Amount:** ${betAmount} coins
// // //                         **Current Multiplier:** ${currentMultiplier}x
// // //                         **Mines:** ${mines}
// // //                         **Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}
// // //                     `)
// // //                     .setColor("#2f3136")
// // //                     .setFooter({ text: `Player: ${message.author.tag}` });

// // //                 // Send game message
// // //                 const gameMessage = await interaction.update({
// // //                     embeds: [gameEmbed],
// // //                     components: createButtons()
// // //                 });

// // //                 // Button collector
// // //                 const collector = gameMessage.createMessageComponentCollector({
// // //                     componentType: ComponentType.Button,
// // //                     time: GAME_CONFIG.MAX_GAME_TIME
// // //                 });

// // //                 // Handle game logic
// // //                 const handleGameLogic = async (buttonInteraction, position) => {
// // //                     // Mine hit logic
// // //                     if (minePositions.has(position)) {
// // //                         gameEnded = true;
// // //                         minePositions.forEach(pos => revealedCells.add(pos));
                        
// // //                         // Update user balance (lose bet)
// // //                         await userSchema.updateOne(
// // //                             { id: message.author.id },
// // //                             { 
// // //                                 $inc: { 
// // //                                     balance: -betAmount,
// // //                                     "gameStats.mines.gamesPlayed": 1,
// // //                                     "gameStats.total.gamesPlayed": 1,
// // //                                     "gameStats.mines.totalBet": betAmount
// // //                                 }
// // //                             }
// // //                         );

// // //                         gameEmbed.setDescription(`
// // //                             💥 **BOOM! You hit a mine!**
// // //                             **Lost:** ${betAmount} coins
// // //                             **Final Multiplier:** ${currentMultiplier}x
// // //                         `).setColor("#ff0000");

// // //                         return { update: true, end: true };
// // //                     }

// // //                     // Safe cell reveal logic
// // //                     revealedCells.add(position);
                    
// // //                     // Advanced multiplier calculation
// // //                     currentMultiplier = calculateMultiplier({
// // //                         gridSize, 
// // //                         mines, 
// // //                         revealedCells: revealedCells.size
// // //                     }) * baseMultiplier;

// // //                     // Win condition
// // //                     if (revealedCells.size === gridSize * gridSize - mines) {
// // //                         gameEnded = true;
// // //                         const winAmount = Math.floor(betAmount * currentMultiplier);
                        
// // //                         // Update user balance (win)
// // //                         await userSchema.updateOne(
// // //                             { id: message.author.id },
// // //                             { 
// // //                                 $inc: { 
// // //                                     balance: winAmount - betAmount,
// // //                                     "gameStats.mines.gamesPlayed": 1,
// // //                                     "gameStats.mines.gamesWon": 1,
// // //                                     "gameStats.total.gamesPlayed": 1,
// // //                                     "gameStats.total.gamesWon": 1,
// // //                                     "gameStats.mines.totalBet": betAmount,
// // //                                     "gameStats.mines.totalWon": winAmount
// // //                                 }
// // //                             }
// // //                         );

// // //                         gameEmbed.setDescription(`
// // //                             🎉 **WINNER! You found all diamonds!**
// // //                             **Won:** ${winAmount} coins
// // //                             **Multiplier:** ${currentMultiplier}x
// // //                         `).setColor("#00ff00");

// // //                         return { update: true, end: true };
// // //                     }

// // //                     gameEmbed.setDescription(`
// // //                         **Bet Amount:** ${betAmount} coins
// // //                         **Current Multiplier:** ${currentMultiplier.toFixed(2)}x
// // //                         **Mines:** ${mines}
// // //                         **Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}
// // //                     `);

// // //                     return { update: true, end: false };
// // //                 };

// // //                 // Collector event handler
// // //                 collector.on("collect", async (buttonInteraction) => {
// // //                     if (buttonInteraction.user.id !== message.author.id) {
// // //                         return buttonInteraction.reply({
// // //                             content: "This is not your game!",
// // //                             ephemeral: true
// // //                         });
// // //                     }

// // //                     let result;
// // //                     if (buttonInteraction.customId === 'withdraw_winnings') {
// // //                         // Cash out logic
// // //                         const winAmount = Math.floor(betAmount * currentMultiplier);
                        
// // //                         await userSchema.updateOne(
// // //                             { id: message.author.id },
// // //                             { 
// // //                                 $inc: { 
// // //                                     balance: winAmount - betAmount,
// // //                                     "gameStats.mines.gamesPlayed": 1,
// // //                                     "gameStats.mines.gamesWon": 1,
// // //                                     "gameStats.total.gamesPlayed": 1,
// // //                                     "gameStats.total.gamesWon": 1,
// // //                                     "gameStats.mines.totalBet": betAmount,
// // //                                     "gameStats.mines.totalWon": winAmount
// // //                                 }
// // //                             }
// // //                         );

// // //                         gameEmbed.setDescription(`
// // //                             💰 **Cashed Out!**
// // //                             **Won:** ${winAmount} coins
// // //                             **Multiplier:** ${currentMultiplier}x
// // //                         `).setColor("#00ff00");

// // //                         result = { update: true, end: true };
// // //                     }
// // //                     else {
// // //                         const position = parseInt(buttonInteraction.customId.split('_')[1]);
// // //                         result = await handleGameLogic(buttonInteraction, position);
// // //                     }

// // //                     if (result.update) {
// // //                         await buttonInteraction.update({
// // //                             embeds: [gameEmbed],
// // //                             components: createButtons()
// // //                         });
// // //                     }

// // //                     if (result.end) {
// // //                         collector.stop();
// // //                     }

// // //                 }
// // //                 );

// // //             }
// // //         } catch (e) {
// // //             console.log(e);
// // //         }
// // //     }
// // // }
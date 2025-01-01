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
//     desc: "Play Customizable Minesweeper Game",
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
//         try {
//             // Retrieve user data
//             const userData = await userSchema.findOne({ id: message.author.id });
//             if (!userData) {
//                 return message.reply("You need to create a profile first!");
//             }

//             // Game configuration select menu
//             const configMenu = new StringSelectMenuBuilder()
//                 .setCustomId('mines_config')
//                 .setPlaceholder('Configure Your Mines Game')
//                 .addOptions([
//                     {
//                         label: 'Number of Mines',
//                         description: 'Choose how many mines to place',
//                         value: 'mines_select'
//                     },
//                     {
//                         label: 'Bet Amount',
//                         description: 'Select your bet size',
//                         value: 'bet_select'
//                     },
//                     {
//                         label: 'Risk Level',
//                         description: 'Choose game difficulty',
//                         value: 'risk_select'
//                     },
//                     {
//                         label: 'Start Game',
//                         description: 'Begin the Mines game with current settings',
//                         value: 'start_game'
//                     }
//                 ]);

//             const configRow = new ActionRowBuilder().addComponents(configMenu);

//             // Mines number select menu
//             const minesMenu = new StringSelectMenuBuilder()
//                 .setCustomId('mines_number')
//                 .setPlaceholder('Select Number of Mines')
//                 .addOptions([
//                     { label: '1 Mine', value: '1', description: 'Lowest risk, lowest reward' },
//                     { label: '3 Mines', value: '3', description: 'Medium risk, medium reward' },
//                     { label: '5 Mines', value: '5', description: 'High risk, high reward' },
//                     { label: '10 Mines', value: '10', description: 'Extreme risk, extreme reward' }
//                 ]);

//             const minesRow = new ActionRowBuilder().addComponents(minesMenu);

//             // Bet amount select menu
//             const betMenu = new StringSelectMenuBuilder()
//                 .setCustomId('bet_amount')
//                 .setPlaceholder('Select Bet Amount')
//                 .addOptions([
//                     { label: '100 Coins', value: '100', description: 'Safe bet for beginners' },
//                     { label: '500 Coins', value: '500', description: 'Medium stakes' },
//                     { label: '1000 Coins', value: '1000', description: 'High stakes' },
//                     { label: '5000 Coins', value: '5000', description: 'Extreme stakes' }
//                 ]);

//             const betRow = new ActionRowBuilder().addComponents(betMenu);

//             // Game settings object
//             const gameSettings = {
//                 mines: 1,
//                 betAmount: 100,
//                 gridSize: 5,
//                 maxMultiplier: 5
//             };

//             // Multiplier calculation logic
//             const calculateMultiplier = (mines, cellsRevealed) => {
//                 const baseMultiplier = 1;
//                 const multiplierFactor = 0.3; // Adjustable risk factor
                
//                 // More complex multiplier calculation
//                 const riskMultiplier = 1 + (mines * 0.5);
//                 const safetyMultiplier = 1 - (cellsRevealed / (gameSettings.gridSize * gameSettings.gridSize - mines));
                
//                 return Number((baseMultiplier * riskMultiplier * (1 + safetyMultiplier * multiplierFactor)).toFixed(2));
//             };

//             // Initial configuration embed
//             const configEmbed = new EmbedBuilder()
//                 .setTitle("💎 Mines Game Configuration 💣")
//                 .setDescription(`
//                     **Current Settings:**
//                     • Mines: ${gameSettings.mines}
//                     • Bet Amount: ${gameSettings.betAmount} coins
//                     • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
                    
//                     **Your Balance:** ${userData.balance} coins
//                 `)
//                 .setColor("#2f3136")
//                 .setFooter({ text: `Player: ${message.author.tag}` });

//             // Send initial configuration message
//             const configMessage = await message.reply({
//                 embeds: [configEmbed],
//                 components: [configRow]
//             });

//             // Configuration collector
//             const configCollector = configMessage.createMessageComponentCollector({
//                 time: 300000 // 5 minutes
//             });

//             configCollector.on('collect', async (interaction) => {
//                 if (interaction.user.id !== message.author.id) {
//                     return interaction.reply({
//                         content: "This is not your configuration!",
//                         ephemeral: true
//                     });
//                 }

//                 switch(interaction.values[0]) {
//                     case 'mines_select':
//                         await interaction.update({ 
//                             embeds: [configEmbed],
//                             components: [minesRow] 
//                         });
//                         break;
                    
//                     case 'bet_select':
//                         await interaction.update({ 
//                             embeds: [configEmbed],
//                             components: [betRow] 
//                         });
//                         break;
                    
//                     case 'start_game':
//                         // Validate bet amount
//                         // if (userData.balance < gameSettings.betAmount) {
//                         //     return interaction.reply({
//                         //         content: "Insufficient balance to start the game!",
//                         //         ephemeral: true
//                         //     });
//                         // }
//                         configCollector.stop('game_start');
//                         startMinesGame(interaction);
//                         break;
//                 }

//                 // Handle mines selection
//                 if (interaction.customId === 'mines_number') {
//                     gameSettings.mines = parseInt(interaction.values[0]);
//                     configEmbed.setDescription(`
//                         **Updated Settings:**
//                         • Mines: ${gameSettings.mines}
//                         • Bet Amount: ${gameSettings.betAmount} coins
//                         • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
                        
//                         **Your Balance:** ${userData.balance} coins
//                     `);
//                     await interaction.update({ 
//                         embeds: [configEmbed],
//                         components: [configRow] 
//                     });
//                 }

//                 // Handle bet amount selection
//                 if (interaction.customId === 'bet_amount') {
//                     gameSettings.betAmount = parseInt(interaction.values[0]);
//                     configEmbed.setDescription(`
//                         **Updated Settings:**
//                         • Mines: ${gameSettings.mines}
//                         • Bet Amount: ${gameSettings.betAmount} coins
//                         • Grid Size: ${gameSettings.gridSize}x${gameSettings.gridSize}
                        
//                         **Your Balance:** ${userData.balance} coins
//                     `);
//                     await interaction.update({ 
//                         embeds: [configEmbed],
//                         components: [configRow] 
//                     });
//                 }
//             });

//             // Main game function
//             async function startMinesGame(interaction) {
//                 const { mines, betAmount, gridSize } = gameSettings;
//                 let revealedCells = new Set();
//                 let gameEnded = false;
//                 let currentMultiplier = 1.0;

//                 // Generate mine positions
//                 const minePositions = new Set();
//                 while (minePositions.size < mines) {
//                     const pos = Math.floor(Math.random() * (gridSize * gridSize));
//                     minePositions.add(pos);
//                 }

//                 // Create game buttons
//                 const createButtons = () => {
//                     const rows = [];
//                     for (let i = 0; i < gridSize; i++) {
//                         const row = new ActionRowBuilder();
//                         for (let j = 0; j < gridSize; j++) {
//                             const position = i * gridSize + j;
//                             const button = new ButtonBuilder()
//                                 .setCustomId(`mine_${position}`)
//                                 .setStyle(revealedCells.has(position) 
//                                     ? (minePositions.has(position) 
//                                         ? ButtonStyle.Danger 
//                                         : ButtonStyle.Success)
//                                     : ButtonStyle.Secondary)
//                                 .setLabel(revealedCells.has(position) 
//                                     ? (minePositions.has(position) ? "💥" : "💎")
//                                     : "?");
                            
//                             if (gameEnded || revealedCells.has(position)) {
//                                 button.setDisabled(true);
//                             }
                            
//                             row.addComponents(button);
//                         }
//                         rows.push(row);
//                     }
//                     return rows;
//                 };

//                 // Create game embed
//                 const gameEmbed = new EmbedBuilder()
//                     .setTitle("💎 Mines Game 💣")
//                     .setDescription(`
//                         **Bet Amount:** ${betAmount} coins
//                         **Current Multiplier:** ${currentMultiplier}x
//                         **Mines:** ${mines}
//                         **Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}
//                     `)
//                     .setColor("#2f3136")
//                     .setFooter({ text: `Player: ${message.author.tag}` });

//                 // Send game message
//                 const gameMessage = await interaction.update({
//                     embeds: [gameEmbed],
//                     components: createButtons()
//                 });

//                 // Button collector
//                 const collector = gameMessage.createMessageComponentCollector({
//                     componentType: ComponentType.Button,
//                     time: 300000 // 5 minutes
//                 });

//                 collector.on("collect", async (buttonInteraction) => {
//                     if (buttonInteraction.user.id !== message.author.id) {
//                         return buttonInteraction.reply({
//                             content: "This is not your game!",
//                             ephemeral: true
//                         });
//                     }

//                     const position = parseInt(buttonInteraction.customId.split("_")[1]);
                    
//                     // Mine hit logic
//                     if (minePositions.has(position)) {
//                         gameEnded = true;
//                         minePositions.forEach(pos => revealedCells.add(pos));
                        
//                         // Update user balance (lose bet)
//                         await userSchema.updateOne(
//                             { id: message.author.id },
//                             { 
//                                 $inc: { 
//                                     balance: -betAmount,
//                                     "gameStats.mines.gamesPlayed": 1,
//                                     "gameStats.total.gamesPlayed": 1,
//                                     "gameStats.mines.totalBet": betAmount
//                                 }
//                             }
//                         );

//                         gameEmbed.setDescription(`
//                             💥 **BOOM! You hit a mine!**
//                             **Lost:** ${betAmount} coins
//                             **Final Multiplier:** ${currentMultiplier}x
//                         `).setColor("#ff0000");
//                     } else {
//                         // Safe cell reveal logic
//                         revealedCells.add(position);
//                         currentMultiplier = calculateMultiplier(mines, revealedCells.size);
                        
//                         // Win condition
//                         if (revealedCells.size === gridSize * gridSize - mines) {
//                             gameEnded = true;
//                             const winAmount = Math.floor(betAmount * currentMultiplier);
                            
//                             // Update user balance (win)
//                             await userSchema.updateOne(
//                                 { id: message.author.id },
//                                 { 
//                                     $inc: { 
//                                         balance: winAmount - betAmount,
//                                         "gameStats.mines.gamesPlayed": 1,
//                                         "gameStats.mines.gamesWon": 1,
//                                         "gameStats.total.gamesPlayed": 1,
//                                         "gameStats.total.gamesWon": 1,
//                                         "gameStats.mines.totalBet": betAmount,
//                                         "gameStats.mines.totalWon": winAmount
//                                     }
//                                 }
//                             );

//                             gameEmbed.setDescription(`
//                                 🎉 **WINNER! You found all diamonds!**
//                                 **Won:** ${winAmount} coins
//                                 **Multiplier:** ${currentMultiplier}x
//                             `).setColor("#00ff00");
//                         } else {
//                             gameEmbed.setDescription(`
//                                 **Bet Amount:** ${betAmount} coins
//                                 **Current Multiplier:** ${currentMultiplier}x
//                                 **Mines:** ${mines}
//                                 **Safe Diamonds Left:** ${gridSize * gridSize - mines - revealedCells.size}
//                             `);
//                         }
//                     }

//                     // Update game message
//                     await buttonInteraction.update({
//                         embeds: [gameEmbed],
//                         components: createButtons()
//                     });

//                     if (gameEnded) {
//                         collector.stop();
//                     }
//                 });

//                 // Game timeout handler
//                 collector.on("end", (collected, reason) => {
//                     if (reason === "time") {
//                         gameEmbed.setDescription("Game timed out!");
//                         gameMessage.edit({
//                             embeds: [gameEmbed],
//                             components: []
//                         });
//                     }
//                 });
//             }
//         } catch (e) {
//             console.error(e);
//             message.reply("An error occurred while running the game!");
//         }
//     }
// };


const userSchema = require("../../Models/User");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,StringSelectMenuBuilder,StringSelectMenuComponent } = require("discord.js");

module.exports = {
    name: "mines",
    aliases: ["sweeper-mines","mine"],
    category: "Games",
    permission: "",
    desc: "Play Minesweeper",
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
    run: async ({ client, message, args }) => {
        try {
            // Game configuration
            const GRID_SIZE = 5;
            const DEFAULT_MINES = 1;
            const MAX_MINES = 24;
            const BASE_BET = 100;
            let activeMines = DEFAULT_MINES;
            let currentMultiplier = 1.0;
            
            // Parse bet amount from args
            const betAmount = parseInt(args[0]) || BASE_BET;
            
            // Check user balance
            const userData = await userSchema.findOne({ userId: message.author.id });
            if (!userData || userData.balance < betAmount) {
                return message.reply("You don't have enough balance for this bet!");
            }

            // Game state
            let gameBoard = Array(GRID_SIZE * GRID_SIZE).fill(null);
            let revealedCells = new Set();
            let gameEnded = false;
            
            // Generate mine positions
            const minePositions = new Set();
            while (minePositions.size < activeMines) {
                const pos = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
                minePositions.add(pos);
            }

            // Calculate multiplier based on remaining safe cells
            const calculateMultiplier = (revealed) => {
                return (1 + (revealed * 0.2)).toFixed(2);
            };

            // Create game buttons
            const createButtons = () => {
                const rows = [];
                for (let i = 0; i < GRID_SIZE; i++) {
                    const row = new ActionRowBuilder();
                    for (let j = 0; j < GRID_SIZE; j++) {
                        const position = i * GRID_SIZE + j;
                        const button = new ButtonBuilder()
                            .setCustomId(`mine_${position}`)
                            .setStyle(revealedCells.has(position) 
                                ? (minePositions.has(position) 
                                    ? ButtonStyle.Danger 
                                    : ButtonStyle.Success)
                                : ButtonStyle.Secondary)
                            .setLabel(revealedCells.has(position) 
                                ? (minePositions.has(position) ? "💥" : "💎")
                                : "?");
                        
                        if (gameEnded || revealedCells.has(position)) {
                            button.setDisabled(true);
                        }
                        
                        row.addComponents(button);
                    }
                    rows.push(row);
                }
                return rows;
            };

            // Create initial embed
            const gameEmbed = new EmbedBuilder()
                .setTitle("💎 Mines Game 💣")
                .setDescription(`
                    **Bet Amount:** ${betAmount} coins
                    **Current Multiplier:** ${currentMultiplier}x
                    **Mines:** ${activeMines}
                    **Safe Diamonds Left:** ${GRID_SIZE * GRID_SIZE - activeMines - revealedCells.size}
                `)
                .setColor("#2f3136")
                .setFooter({ text: `Player: ${message.author.tag}` });

            // Send initial message with buttons
            const gameMessage = await message.reply({
                embeds: [gameEmbed],
                components: createButtons()
            });

            // Create button collector
            const collector = gameMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000 // 5 minutes
            });

            collector.on("collect", async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: "This is not your game!",
                        ephemeral: true
                    });
                }

                const position = parseInt(interaction.customId.split("_")[1]);
                
                // Check if it's a mine
                if (minePositions.has(position)) {
                    gameEnded = true;
                    // Reveal all mines
                    minePositions.forEach(pos => revealedCells.add(pos));
                    
                    // Update user balance (lose bet)
                    await userSchema.updateOne(
                        { userId: message.author.id },
                        { $inc: { balance: -betAmount } }
                    );

                    gameEmbed.setDescription(`
                        💥 **BOOM! You hit a mine!**
                        **Lost:** ${betAmount} coins
                        **Final Multiplier:** ${currentMultiplier}x
                    `).setColor("#ff0000");
                } else {
                    // Reveal safe cell
                    revealedCells.add(position);
                    currentMultiplier = calculateMultiplier(revealedCells.size);
                    
                    // Check if all safe cells are revealed
                    if (revealedCells.size === GRID_SIZE * GRID_SIZE - activeMines) {
                        gameEnded = true;
                        const winAmount = Math.floor(betAmount * currentMultiplier);
                        
                        // Update user balance (win)
                        await userSchema.updateOne(
                            { userId: message.author.id },
                            { $inc: { balance: winAmount - betAmount } }
                        );

                        gameEmbed.setDescription(`
                            🎉 **WINNER! You found all diamonds!**
                            **Won:** ${winAmount} coins
                            **Multiplier:** ${currentMultiplier}x
                        `).setColor("#00ff00");
                    } else {
                        gameEmbed.setDescription(`
                            **Bet Amount:** ${betAmount} coins
                            **Current Multiplier:** ${currentMultiplier}x
                            **Mines:** ${activeMines}
                            **Safe Diamonds Left:** ${GRID_SIZE * GRID_SIZE - activeMines - revealedCells.size}
                        `);
                    }
                }

                // Update message
                await interaction.update({
                    embeds: [gameEmbed],
                    components: createButtons()
                });

                if (gameEnded) {
                    collector.stop();
                }
            });

            collector.on("end", (collected, reason) => {
                if (reason === "time") {
                    gameEmbed.setDescription("Game timed out!");
                    gameMessage.edit({
                        embeds: [gameEmbed],
                        components: []
                    });
                }
            });

        } catch (e) {
            console.error(e);
            message.reply("An error occurred while running the game!");
        }
    }
};
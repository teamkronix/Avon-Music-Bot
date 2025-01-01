const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    id: { type: String, required: true },
    songsPlayed: { type: Number, required: false, default: 0 },
    commandsUsed: { type: Number, required: false, default: 0 },
    favTracks: {
        songs: { type: Array, required: false, default: [] },
    },
    noPrefix: { type: Boolean, required: false, default: false },
    botAddCount: { type: Number, required: false, default: 0 },
    botRemoveCount: { type: Number, required: false, default: 0 },
    invitesCooldown: { type: Date, required: false },
    settings: {
        bio: { type: String, required: false },
        theme: { type: String, required: false },
        partner: { type: String, required: false },
        partnerStatus: { type: String, required: false },
        togetherListned: { type: Number, required: false, default: 0 },
        partnerFrom: { type: String, required: false },
    },
    balance: { type: Number, required: false, default: 1000 },
    bank: { type: Number, required: false, default: 0 },
    bankLimit: { type: Number, required: false, default: 10000 },
    lastDaily: { type: Date, required: false },
    lastWeekly: { type: Date, required: false },
    lastMonthly: { type: Date, required: false },
    gameStats: {
        mines: {
            gamesPlayed: { type: Number, default: 0 },
            gamesWon: { type: Number, default: 0 },
            totalBet: { type: Number, default: 0 },
            totalWon: { type: Number, default: 0 },
            highestWin: { type: Number, default: 0 },
            highestMultiplier: { type: Number, default: 0 },
            lastPlayed: { type: Date },
        },
        total: {
            gamesPlayed: { type: Number, default: 0 },
            gamesWon: { type: Number, default: 0 },
            totalBet: { type: Number, default: 0 },
            totalWon: { type: Number, default: 0 },
        }
    },
    inventory: {
        items: [{ 
            id: { type: String },
            name: { type: String },
            amount: { type: Number, default: 1 },
            type: { type: String },
            rarity: { type: String },
            acquired: { type: Date, default: Date.now }
        }],
        lastUpdated: { type: Date, default: Date.now }
    },
    achievements: {
        completed: [{ 
            id: { type: String },
            name: { type: String },
            completedAt: { type: Date, default: Date.now },
            reward: { type: Number }
        }],
        progress: [{
            id: { type: String },
            name: { type: String },
            current: { type: Number, default: 0 },
            required: { type: Number },
            type: { type: String }
        }]
    },
    cooldowns: {
        work: { type: Date },
        rob: { type: Date },
        crime: { type: Date },
        gamble: { type: Date }
    },
    stats: {
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        reputation: { type: Number, default: 0 },
        lastRepGiven: { type: Date },
        joinedAt: { type: Date, default: Date.now },
        streak: {
            current: { type: Number, default: 0 },
            highest: { type: Number, default: 0 },
            lastClaimed: { type: Date }
        }
    },
    preferences: {
        notifications: { type: Boolean, default: true },
        privateProfile: { type: Boolean, default: false },
        language: { type: String, default: 'en' },
        timezone: { type: String },
        customColors: {
            primary: { type: String },
            secondary: { type: String }
        }
    }
});
userSchema.index({ id: 1 });
userSchema.index({ "stats.xp": -1 });
userSchema.index({ balance: -1 });
userSchema.virtual('netWorth').get(function() {
    return this.balance + this.bank;
});
userSchema.methods.addBalance = function(amount) {
    if (amount < 0) return false;
    this.balance += amount;
    return true;
};
userSchema.methods.removeBalance = function(amount) {
    if (amount < 0 || this.balance < amount) return false;
    this.balance -= amount;
    return true;
};
userSchema.methods.updateGameStats = function(game, won, betAmount, winAmount, multiplier) {
    this.gameStats[game].gamesPlayed++;
    if (won) {
        this.gameStats[game].gamesWon++;
        if (winAmount > this.gameStats[game].highestWin) {
            this.gameStats[game].highestWin = winAmount;
        }
        if (multiplier > this.gameStats[game].highestMultiplier) {
            this.gameStats[game].highestMultiplier = multiplier;
        }
    }
    this.gameStats[game].totalBet += betAmount;
    this.gameStats[game].totalWon += won ? winAmount : 0;
    this.gameStats[game].lastPlayed = new Date();
    this.gameStats.total.gamesPlayed++;
    this.gameStats.total.gamesWon += won ? 1 : 0;
    this.gameStats.total.totalBet += betAmount;
    this.gameStats.total.totalWon += won ? winAmount : 0;
};

module.exports = model("User", userSchema);



// const { Schema, model } = require("mongoose");

// const userSchema = new Schema({
//     id: { type: String, required: true },
//     songsPlayed: { type: Number, required :false, default: 0 },
//     commandsUsed : { type: Number, required: false, default: 0 },
//     favTracks: {
//         songs: { type: Array, required: false, default: [] },
//     },
//     noPrefix: { type: Boolean, required: false, default: false },
//     botAddCount : { type: Number, required: false, default: 0 },
//     botRemoveCount : { type: Number, required: false, default: 0 },
//     settings: {
//         bio : { type: String, required: false },
//         theme : { type: String, required: false },
//         partner : { type: String, required: false },
//         partnerStatus : { type: String, required: false },
//         togetherListned : { type: Number, required: false, default: 0 },
//         partnerFrom : { type: String, required: false },
//     }
// });

// module.exports = model("User", userSchema);



        

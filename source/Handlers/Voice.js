const { ChannelType, EmbedBuilder } = require('discord.js');
const guildSchema = require('../Models/Guild');
const avonTimer = new Map();
class VoiceStateHandler {
    constructor(client) {
        this.client = client;
    }
    async handle(oldState, newState) {
        try {
            const guildId = newState.guild.id;
            if (!guildId) return;
            const player = this.client.kazagumo.players.get(guildId);
            if (!player) return;
            if (!player.voiceChannelId) return;
            const voiceChannel = newState.guild.channels.cache.get(player.voiceChannelId);
            if (!voiceChannel || !(voiceChannel.members instanceof Map)) return;
            const is247Enabled = await this.twenty4seven(guildId);
            if (!newState.guild.members.cache.get(this.client.user.id)?.voice.channelId && !is247Enabled && player) {
                return player.destroy();
            }
            const changeType = this.getStateChangeType(oldState, newState);
            switch (changeType) {
                case 'join':
                    await this.handleJoin(newState);
                    break;
                case 'leave':
                    await this.handleLeave(newState, is247Enabled);
                    break;
                case 'move':
                    await this.handleMove(newState);
                    break;
            }
        } catch (error) {
            console.error('Error in voice state update:', error);
        }
    }
    getStateChangeType(oldState, newState) {
        if (!oldState.channelId && newState.channelId) return 'join';
        if (oldState.channelId && !newState.channelId) return 'leave';
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) return 'move';
        return null;
    }
    async handleJoin(newState) {
        await this.delay(3000);
        const bot = newState.guild.voiceStates.cache.get(this.client.user.id);
        if (!bot) return;
        if (this.umm(bot)) {
            await this.Stage(bot);
        }
        if (newState.id === this.client.user.id && !newState.serverDeaf) {
            await this.Deafen(newState);
        }
        if (newState.id === this.client.user.id) {
            await this.Mute(newState);
        }
    }
    async handleLeave(newState, is247Enabled) {
        const player = this.client.kazagumo.players.get(newState.guild.id);
        if (!player?.voiceChannelId) return;
        const voiceChannel = newState.guild.channels.cache.get(player.voiceChannelId);
        if (!voiceChannel || !(voiceChannel.members instanceof Map)) return;
        const dd = [...voiceChannel.members.values()].filter(member => !member.user.bot);
        if (dd.length === 0) {
            if (avonTimer.has(newState.guild.id)) {
                clearTimeout(avonTimer.get(newState.guild.id));
            }
            const timer = setTimeout(async () => {
                if (!player?.voiceChannelId) return;
                const currentChannel = newState.guild.channels.cache.get(player.voiceChannelId);
                const currentdd = currentChannel?.members instanceof Map 
                    ? [...currentChannel.members.values()].filter(member => !member.user.bot)
                    : [];
                if (currentdd.length === 0 && !is247Enabled) {
                    await this.destroyPlayer(newState.guild.id);
                }
                avonTimer.delete(newState.guild.id);
            }, 300000);
            avonTimer.set(newState.guild.id, timer);
        }
    }
    async handleMove(newState) {
        await this.delay(3000);
        const bot = newState.guild.voiceStates.cache.get(this.client.user.id);
        if (!bot) return;
        if (this.umm(bot)) {
            await this.Stage(bot);
        }
    }
    async destroyPlayer(guildId) {
        const player = this.client.kazagumo.players.get(guildId);
        if (player) {
            try {
                const channel = await this.avonChannel(guildId);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setColor(this.client.config?.color || '#ff0000')
                        .setAuthor({name:`Avon Music System`,iconURL:this.client.user.displayAvatarURL()})
                        .setDescription(`Left the voice channel due to inactivity (5 minutes with no listeners).\n-# Use 24/7 to keep the bot in the voice channel.`);
                    await channel.send({ embeds: [embed] }).catch(() => {});
                }
                await player.destroy();
            } catch (error) {
                console.error('Error destroying player:', error);
            }
        }
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    umm(voiceState) {
        return (
            voiceState.channelId &&
            voiceState.channel?.type === ChannelType.GuildStageVoice &&
            voiceState.suppress
        );
    }
    async Stage(voiceState) {
        if (voiceState.channel?.permissionsFor(voiceState.member)?.has('MuteMembers')) {
            await voiceState.setSuppressed(false).catch(() => {});
        }
    }
    async Deafen(voiceState) {
        const permissions = voiceState.channel?.permissionsFor(voiceState.guild.members.me);
        if (permissions?.has('DeafenMembers')) {
            await voiceState.setDeaf(true).catch(() => {});
        }
    }
    async Mute(newState) {
        const player = this.client.manager.getPlayer(newState.guild.id);
        if (!player) return;
        if (newState.serverMute && !player.paused) {
            await player.pause(true);
        } else if (!newState.serverMute && player.paused) {
            await player.pause(false);
        }
    }
    async twenty4seven(guildId) {
        try {
            const guildData = await guildSchema.findOne({ id: guildId });
            return guildData?.twentyFourSeven?.enabled ? true : false;
        } catch (error) {
            console.error('Error getting 24/7 status:', error);
            return false;
        }
    }
    async avonChannel(guildId) {
        try {
            const player = this.client.kazagumo.players.get(guildId);
            if (!player) return null
            const channel = this.client.channels.cache.get(player.textId);
            return channel;
        } catch (error) {
            console.error('Error getting text channel:', error);
            return null;
        }
    }
}

module.exports = VoiceStateHandler;
const EventEmitter = require("events");
const Denque = require("denque");

class AntiRatelimit extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queue = new Denque();
    this.userCooldowns = new Map();
    this.userWarnings = new Map();
    this.bannedUsers = new Map();
    this.globalCooldown = false;
    this.processing = false;
    this.bannedMessageSent = new Set();
    this.options = {
      globalDelay: options.globalDelay || 1000,
      userCooldown: options.userCooldown || 5000,
      maxQueueSize: options.maxQueueSize || 100,
      maxUserQueueSize: options.maxUserQueueSize || 5,
      banLimit: options.banLimit || 5,
      banDuration: options.banDuration || 10 * 60 * 1000,
    };
  }
  async processQueue() {
    if (this.processing || this.queue.isEmpty()) return;
    this.processing = true;
    while (!this.queue.isEmpty()) {
      const { payload, message } = this.queue.shift();
      try {
        await message.channel.send(payload);
        this.userCooldowns.set(message.author.id, Date.now());
        this._scheduleCooldownClear(
          message.author.id,
          this.options.userCooldown
        );
        this.emit("messageSent", {
          userId: message.author.id,
          channel: message.channel,
        });
      } catch (error) {
        this.emit("error", error);
        this.queue.unshift({ payload, message });
      }
      await this._wait(this.options.globalDelay);
    }
    this.processing = false;
  }
  async send(message, payload = {}) {
    const userId = message.author.id;
    const now = Date.now();
    const lastSendTime = this.userCooldowns.get(userId) || 0;
    if (this.bannedUsers.has(userId)) {
      const banTime = this.bannedUsers.get(userId);
      const timeLeft = Math.ceil(
        (banTime + this.options.banDuration - now) / 1000
      );
      if (!this.bannedMessageSent.has(userId)) {
        this._notifyBan(message, timeLeft);
        this.bannedMessageSent.add(userId);
      }
      return;
    }
    if (now - lastSendTime < this.options.userCooldown) {
      const userQueueSize = this.queue
        .toArray()
        .filter((item) => item.message.author.id === userId).length;
      if (userQueueSize >= this.options.maxUserQueueSize) {
        this._notifyUser(
          message,
          `> You have reached the maximum message queue size of **${this.options.maxUserQueueSize}**. Please wait for your messages to be sent.`
        );
        this._trackUserViolation(userId, message);
        return;
      }
      if (this.queue.length >= this.options.maxQueueSize) {
        this._notifyUser(
          message,
          `> The message queue is full. Please wait for the queue to clear.`
        );
        this._trackUserViolation(userId, message);
        return;
      }
      this._trackUserViolation(userId, message);
      this.queue.push({ payload, message });
      this.emit("queued", { userId, channel: message.channel });
      this.emit("queueStatus", this.getQueueStatus());
      this.processQueue();
    } else {
      try {
        await message.channel.send(payload);
        this.userCooldowns.set(userId, now);
        this._scheduleCooldownClear(userId, this.options.userCooldown);
        this.emit("sent", { userId, channel: message.channel });
      } catch (error) {
        this.emit("error", error);
      }
    }
  }
  async _notifyUser(message, notification) {
    await message.react("⚠️");
    message.author.send({ content: notification }).catch(() => {
      message.channel.send({ content: notification }).then((sent) => {
        setTimeout(() => sent.delete(), 5000);
      });
    });
  }
  manualUnban(userId) {
    if (this.bannedUsers.has(userId)) {
      this.bannedUsers.delete(userId);
      this.bannedMessageSent.delete(userId);
      return `User with ID ${userId} has been unbanned.`;
    }
  }
  async _notifyBan(message, timeLeft) {
    await message.react("⚠️");
    await message.author
      .send({
        content: `You are temporarily banned from Avon for ${timeLeft} seconds.`,
      })
      .catch(async () => {
        await message.channel
          .send({
            content: `You are temporarily banned from Avon for ${timeLeft} seconds.`,
          })
          .then((sent) => {
            setTimeout(() => sent.delete(), 5000);
          });
      });
  }
  _trackUserViolation(userId, message) {
    const violations = this.userWarnings.get(userId) || 0;
    const newViolations = violations + 1;
    if (newViolations >= this.options.banLimit) {
      this._banUser(userId, message);
    } else {
      this.userWarnings.set(userId, newViolations);
      this._notifyUser(
        message,
        "> You are sending messages too quickly. Please slow down or you will be temporarily banned from **Avon**."
      );
      this._scheduleWarningClear(userId);
    }
  }
  _banUser(userId, message) {
    this.bannedUsers.set(userId, Date.now());
    this.userWarnings.delete(userId);
    this._notifyUser(
      message,
      "- You have been **Temporarily Banned** from Avon for 10 minutes. For Trying to bypass Avon Anti ratelimit."
    );
    this.bannedMessageSent.add(userId);
    setTimeout(() => {
      this.bannedUsers.delete(userId);
      this.bannedMessageSent.delete(userId);
      this.emit("banLifted", userId);
      let user = message.guild.members.cache.get(userId);
      user
        .send({
          content:
            "## You have been **Unbanned** from Avon Service. Please do not bypass the anti ratelimit again.",
        })
        .catch(() => {
          message.channel
            .send({
              content: `<@${userId}> You have been **Unbanned** from Avon Service. Please do not bypass the anti ratelimit again.`,
            })
            .then((sent) => {
              setTimeout(() => sent.delete(), 5000);
            });
        });
    }, this.options.banDuration);
  }
  _scheduleCooldownClear(userId, cooldownTime) {
    setTimeout(() => {
      this.userCooldowns.delete(userId);
      this.emit("cooldownCleared", userId);
    }, cooldownTime);
  }
  _scheduleWarningClear(userId) {
    setTimeout(() => {
      if (this.userWarnings.has(userId)) {
        this.userWarnings.delete(userId);
      }
    }, this.options.userCooldown);
  }
  clearUserCooldown(userId) {
    this.userCooldowns.delete(userId);
  }
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      userCooldowns: Object.fromEntries(this.userCooldowns),
      bannedUsers: [...this.bannedUsers.keys()],
    };
  }
  autoSpawnMessageAfterCooldown(message, payload = {}) {
    const userId = message.author.id;
    const lastSendTime = this.userCooldowns.get(userId) || 0;
    const nextmsg = Math.max(
      0,
      this.options.userCooldown - (Date.now() - lastSendTime)
    );
    setTimeout(() => {
      this.send(message, payload);
    }, nextmsg);
  }
  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = AntiRatelimit;

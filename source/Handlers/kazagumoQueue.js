const { KazagumoQueue } = require("kazagumo");

class QueueError extends Error {
  constructor(message) {
    super(message);
    this.name = "AvonQueueError";
  }
}

module.exports = class SiaQueue extends KazagumoQueue {
  constructor(player) {
    super(player);
    this.maxLength = 1000;
    this.avon = "Avon Custom Url Queue";
    this.current = null;
    this.tracks = [];
  }

  async previous() {
    if (this.tracks.length === 0) {
      return null;
    }
    const previousTrack = this.shift();
    if (previousTrack) {
      this.unshift(previousTrack);
    }
    return previousTrack;
  }

  async next() {
    if (this.tracks.length === 0) {
      return null;
    }
    const nextTrack = this.shift();
    if (nextTrack) {
      this.current = nextTrack;
    }
    return nextTrack;
  }

  async playPrevious() {
    const previousTrack = await this.previous();
    if (previousTrack) {
      await this.player.play(previousTrack);
    } else {
      await this.player.skip();
    }
    return previousTrack;
  }

  async setMaxSize(size) {
    if (size !== null && (typeof size !== "number" || size < 0)) {
      throw new QueueError("Max size must be a non-negative number or null");
    }
    this.maxLength = size;
  }

  async disableMaxSize() {
    this.maxLength = null;
  }

  async enableMaxSize() {
    this.maxLength = 1000;
  }

  async isMaxSizeEnabled() {
    return this.maxLength !== null;
  }

  async getMaxSize() {
    return this.maxLength;
  }

  add(track) {
    if (this.maxLength !== null && this.tracks.length >= this.maxLength) {
      throw new QueueError("Queue is full");
    }
    if (!this.isValidTrack(track)) {
      console.error("Invalid track format:", track);
      return;
    }
    this.tracks.push(track);
    if (!player.playing) {
      this.current = track;
      this.player.play(track);
    }
    if (this.tracks.length === 1) {
      this.current = track;
    }
  }

  push(track) {
    if (!this.isValidTrack(track)) {
      console.error("Invalid track format:", track);
      return;
    }
    this.tracks.push(track);
  }

  isValidTrack(track) {
    return (
      track && typeof track.title === "string" && typeof track.uri === "string"
    );
  }

  remove(index) {
    if (index >= 0 && index < this.tracks.length) {
      const [removedTrack] = this.tracks.splice(index, 1);
      if (this.current === removedTrack) {
        this.current = this.tracks[0] || null;
      }
    } else {
      console.error("Invalid track index:", index);
    }
  }

  clear() {
    this.tracks = [];
    this.current = null;
  }

  getCurrentTrack() {
    return this.current;
  }

  getAllTracks() {
    return this.tracks;
  }

  bump(index) {
    if (index >= 0 && index < this.tracks.length) {
      const track = this.tracks.splice(index, 1)[0];
      this.tracks.unshift(track);
    } else {
      console.error("Invalid track index:", index);
    }
  }

  shift() {
    const track = this.tracks.shift();
    if (track) {
      this.current = this.tracks[0] || null;
    }
    return track;
  }

  move(from, to) {
    if (
      from < 0 ||
      from >= this.tracks.length ||
      to < 0 ||
      to >= this.tracks.length
    ) {
      throw new QueueError("Invalid index");
    }
    const [track] = this.tracks.splice(from, 1);
    this.tracks.splice(to, 0, track);
    if (this.current === track) {
      this.current = this.tracks[to];
    }
  }

  shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  async getTrack(index) {
    return this.tracks[index];
  }

  async getTracks(indices) {
    return indices.map((index) => this.tracks[index]).filter(Boolean);
  }

  async dynamicSort(property) {
    return (a, b) => {
      if (a[property] < b[property]) return -1;
      if (a[property] > b[property]) return 1;
      return 0;
    };
  }

  async sort(property) {
    this.tracks.sort(await this.dynamicSort(property));
  }

  async filter(callback) {
    this.tracks = this.tracks.filter(callback);
  }

  async map(callback) {
    this.tracks = this.tracks.map(callback);
  }

  async reduce(callback, initialValue) {
    return this.tracks.reduce(callback, initialValue);
  }

  async find(callback) {
    return this.tracks.find(callback);
  }

  async findIndex(callback) {
    return this.tracks.findIndex(callback);
  }

  async some(callback) {
    return this.tracks.some(callback);
  }

  async every(callback) {
    return this.tracks.every(callback);
  }

  async dynamicSortWithAlphabet(property) {
    return (a, b) => {
      if (a[property] < b[property]) return -1;
      if (a[property] > b[property]) return 1;
      return 0;
    };
  }

  async sortWithAlphabet(property) {
    this.tracks.sort(await this.dynamicSortWithAlphabet(property));
  }

  async filterWithAlphabet(callback) {
    this.tracks = this.tracks.filter(callback);
  }
  async skip(amount = 1) {
    if (amount < 0) {
      throw new QueueError("Amount must be a non-negative number");
    }
    this.tracks = this.tracks.slice(amount);
    await this.player.skip();
  }
};

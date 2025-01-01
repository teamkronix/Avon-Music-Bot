const SpotifyWebApi = require("spotify-web-api-node");
const { google } = require("googleapis");
const axios = require("axios");
const NodeCache = require("node-cache");
const RateLimit = require("axios-rate-limit");

class OptimizedMusicRecommendationSystem {
  constructor(config) {
    this.spotifyApi = new SpotifyWebApi({
      clientId: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret,
    });
    this.youtube = google.youtube({
      version: "v3",
      auth: config.youtube.apiKey,
    });
    this.lastfmApiKey = config.lastfm.apiKey;
    this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

    this.axiosInstances = {
      spotify: RateLimit(axios.create(), {
        maxRequests: 100,
        perMilliseconds: 60000,
      }),
      youtube: RateLimit(axios.create(), {
        maxRequests: 100,
        perMilliseconds: 60000,
      }),
      lastfm: RateLimit(axios.create(), {
        maxRequests: 200,
        perMilliseconds: 60000,
      }),
    };

    this.initSpotifyToken();
  }

  async initSpotifyToken() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body["access_token"]);
      setTimeout(
        () => this.initSpotifyToken(),
        (data.body["expires_in"] - 60) * 1000
      );
    } catch (error) {
      console.error("Spotify token initialization failed:", error.message);
      setTimeout(() => this.initSpotifyToken(), 60000);
    }
  }

  async getRecommendations(query, limit = 10) {
    const cacheKey = `rec:${query}:${limit}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    try {
      const seedTrack = await this.findSeedTrack(query);
      if (!seedTrack) {
        console.log("No seed track found for query:", query);
        return [];
      }

      console.log("Seed track found:", seedTrack);

      const recommendations = await this.fetchRecommendations(
        seedTrack,
        limit - 1
      );
      const result = [seedTrack, ...recommendations];

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error in getRecommendations:", error);
      return [];
    }
  }

  async fetchRecommendations(seed, limit) {
    const tasks = [
      this.spRec(seed, Math.ceil(limit / 3)).catch(
        (error) => {
          console.error("Spotify recommendations failed:", error);
          return [];
        }
      ),
      this.ytRec(seed, Math.ceil(limit / 3)).catch(
        (error) => {
          console.error("YouTube recommendations failed:", error);
          return [];
        }
      ),
      this.lastFm(seed, Math.ceil(limit / 3)).catch(
        (error) => {
          console.error("Last.fm recommendations failed:", error);
          return [];
        }
      ),
    ];
    const results = await Promise.all(tasks);
    return results.flat().slice(0, limit);
  }

  async findSeedTrack(query) {
    const sources = ["searchSpotify", "searchYouTube", "searchLastFM"];
    for (const source of sources) {
      const results = await this[source](query, 1);
      if (results.length > 0) return results[0];
    }
    return null;
  }

  async fetchRecommendations(seed, limit) {
    const tasks = [
      this.spRec(seed, Math.ceil(limit / 3)).catch(
        (error) => {
          console.error("Spotify recommendations failed:", error);
          return [];
        }
      ),
      this.ytRec(seed, Math.ceil(limit / 3)).catch(
        (error) => {
          console.error("YouTube recommendations failed:", error);
          return [];
        }
      ),
      this.lastFm(seed, Math.ceil(limit / 3)).catch(
        (error) => {
          console.error("Last.fm recommendations failed:", error);
          return [];
        }
      ),
    ];
    const results = await Promise.all(tasks);
    return results.flat().slice(0, limit);
  }

  async searchSpotify(query, limit) {
    try {
      const data = await this.spotifyApi.searchTracks(query, { limit });
      return data.body.tracks.items.map((track) =>
        this.formatTrack(track, "Spotify")
      );
    } catch (error) {
      console.error("Spotify search failed:", error.message);
      return [];
    }
  }

  async spRec(seed, limit) {
    try {
      const data = await this.spotifyApi.getRecommendations({
        seed_tracks: [seed.id],
        limit,
      });
      return data.body.tracks.map((track) =>
        this.formatTrack(track, "Spotify")
      );
    } catch (error) {
      console.error("Spotify recommendations failed:", error.message);
      return [];
    }
  }

  async searchYouTube(query, limit) {
    try {
      const response = await this.youtube.search.list({
        part: "snippet",
        q: query,
        type: "video",
        videoCategoryId: "10",
        maxResults: limit,
      });
      return response.data.items.map((item) =>
        this.formatTrack(item, "YouTube")
      );
    } catch (error) {
      console.error("YouTube search failed:", error.message);
      return [];
    }
  }

  async searchLastFM(query, limit) {
    try {
      const response = await this.axiosInstances.lastfm.get(
        "http://ws.audioscrobbler.com/2.0/",
        {
          params: {
            method: "track.search",
            track: query,
            api_key: this.lastfmApiKey,
            format: "json",
            limit,
          },
        }
      );
      return response.data.results.trackmatches.track.map((track) =>
        this.formatTrack(track, "Last.fm")
      );
    } catch (error) {
      console.error("Last.fm search failed:", error.message);
      return [];
    }
  }
  async ytRec(seed, limit) {
    try {
      const videoId =
        seed.source === "YouTube"
          ? seed.id
          : await this.getYouTubeVideoId(seed);
      const response = await this.youtube.search.list({
        part: "snippet",
        relatedToVideoId: videoId,
        type: "video",
        maxResults: limit,
      });
      return response.data.items.map((item) =>
        this.formatTrack(item, "YouTube", videoId)
      );
    } catch (error) {
      console.error("YouTube recommendations failed:", error.message);
      return [];
    }
  }

  async lastFm(seed, limit) {
    try {
      const response = await this.axiosInstances.lastfm.get(
        "http://ws.audioscrobbler.com/2.0/",
        {
          params: {
            method: "track.getSimilar",
            artist: seed.artist,
            track: seed.name,
            api_key: this.lastfmApiKey,
            format: "json",
            limit,
          },
        }
      );
      if (
        response.data &&
        response.data.similartracks &&
        response.data.similartracks.track
      ) {
        return response.data.similartracks.track.map((track) =>
          this.formatTrack(track, "Last.fm")
        );
      } else {
        console.error(
          "Unexpected Last.fm API response structure:",
          response.data
        );
        return [];
      }
    } catch (error) {
      console.error("Last.fm recommendations failed:", error);
      return [];
    }
  }

  async getYouTubeVideoId(track) {
    const response = await this.youtube.search.list({
      part: "id",
      q: `${track.artist} ${track.name}`,
      type: "video",
      maxResults: 1,
    });
    return response.data.items[0]?.id.videoId;
  }

  formatTrack(track, source, relatedVideoId = null) {
    switch (source) {
      case "Spotify":
        return {
          name: track.name,
          url: track.external_urls.spotify,
          source,
        };
      case "YouTube":
        return {
          name: track.snippet.title,
          url: relatedVideoId
            ? `https://www.youtube.com/watch?v=${track.id.videoId}&list=RD${relatedVideoId}`
            : `https://www.youtube.com/watch?v=${track.id.videoId}`,
          source,
        };
      case "Last.fm":
        return {
          name: track.name,
          url: track.url,
          source,
        };
    }
  }
}

async function main() {
  const system = new OptimizedMusicRecommendationSystem({
    spotify: {
      clientId: "83c98500a89a4a5eae6fa819643644b8",
      clientSecret: "b2627d1bf6c846d98e102fe58e656892",
    },
    youtube: {
      apiKey: "AIzaSyAHHUTA6G8FjSjry1Cb6PbNND-AF0TTzsM",
    },
    lastfm: {
      apiKey: "595da9688e54e93b21ad5a2603f6d46c",
    },
  });

  // Wait for Spotify token initialization
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const results = await system.getRecommendations("hasi ban gaye");
    console.log(results);
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main();

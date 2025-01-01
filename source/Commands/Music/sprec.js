const axios = require('axios');
const { LRUCache } = require('lru-cache');
const { SpotifyWebApi } = require('spotify-web-api-node');
const { google } = require('googleapis');

class avonRecommendations {
  constructor(config) {
    this.config = {
      cacheTTL: 3600, // 1 hour
      cacheMaxSize: 1000,
      weights: {
        spotify: 0.35,
        youtube: 0.35,
        lastfm: 0.3,
      },
      similarityThreshold: 0.6,
      ...config,
    };

    this.setupCache();
    this.setupAPIs();
  }

  setupCache() {
    this.cache = new LRUCache({
      max: this.config.cacheMaxSize,
      ttl: this.config.cacheTTL * 1000,
    });
  }

  setupAPIs() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: "83c98500a89a4a5eae6fa819643644b8",
      clientSecret: "b2627d1bf6c846d98e102fe58e656892"
    });

    this.youtubeApi = google.youtube({
      version: 'v3',
      auth: "AIzaSyAHHUTA6G8FjSjry1Cb6PbNND"
    });

    this.lastfmApiKey = "595da9688e54e93b21ad5a2603f6d46c"
  }
  async searchSongs(client, query, limit, message) {
    const cacheKey = `search:${query}:${limit}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    try {
      const youtubeResults = await client.kazagumo.search(query, {
        source: "ytsearch:",
        requester: message.author,
      });

      if (!youtubeResults.tracks || youtubeResults.tracks.length === 0) return [];

      const firstSong = youtubeResults.tracks[0];
      const secondSong = youtubeResults.tracks[1];

      const seedTrack = {
        id: firstSong.identifier,
        name: firstSong.title,
        artist: firstSong.author,
      };

      const recommendations = await this.getRecommendations(seedTrack, limit - 2);
      
      const enhancedRecommendations = await this.enhanceRecommendations(recommendations, client, message);

      const result = [firstSong, ...enhancedRecommendations, secondSong].slice(0, limit);
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error in searchSongs:", error);
      return [];
    }
  }

  async getRecommendations(seedTrack, limit) {
    const [spotifyRecs, youtubeRecs, lastfmRecs] = await Promise.all([
      this.getSpotifyRecommendations(seedTrack, Math.ceil(limit * this.config.weights.spotify)),
      this.getYoutubeRecommendations(seedTrack, Math.ceil(limit * this.config.weights.youtube)),
      this.getLastfmRecommendations(seedTrack, Math.ceil(limit * this.config.weights.lastfm)),
    ]);

    return this.combineAndRankRecommendations(seedTrack, spotifyRecs, youtubeRecs, lastfmRecs, limit);
  }

  async getSpotifyRecommendations(seedTrack, limit) {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body['access_token']);

      const searchResults = await this.spotifyApi.searchTracks(`track:${seedTrack.name} artist:${seedTrack.artist}`);
      if (searchResults.body.tracks.items.length === 0) return [];

      const trackId = searchResults.body.tracks.items[0].id;
      const response = await this.spotifyApi.getRecommendations({
        seed_tracks: [trackId],
        limit: limit,
      });

      return response.body.tracks.map(track => ({
        name: track.name,
        artist: track.artists[0].name,
        popularity: track.popularity,
        source: 'Spotify',
      }));
    } catch (error) {
      console.error('Spotify recommendations failed:', error);
      return [];
    }
  }

  async getYoutubeRecommendations(seedTrack, limit) {
    try {
      const searchResponse = await this.youtubeApi.search.list({
        part: 'snippet',
        q: `${seedTrack.name} ${seedTrack.artist}`,
        type: 'video',
        videoCategoryId: '10',
        maxResults: 1,
      });

      if (searchResponse.data.items.length === 0) return [];

      const videoId = searchResponse.data.items[0].id.videoId;
      const relatedResponse = await this.youtubeApi.search.list({
        part: 'snippet,statistics',
        relatedToVideoId: videoId,
        type: 'video',
        maxResults: limit,
      });

      return relatedResponse.data.items.map(item => ({
        name: item.snippet.title,
        artist: item.snippet.channelTitle,
        viewCount: parseInt(item.statistics.viewCount, 10),
        source: 'YouTube',
      }));
    } catch (error) {
      console.error('YouTube recommendations failed:', error);
      return [];
    }
  }

  async getLastfmRecommendations(seedTrack, limit) {
    try {
      const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'track.getSimilar',
          artist: seedTrack.artist,
          track: seedTrack.name,
          api_key: this.lastfmApiKey,
          format: 'json',
          limit: limit,
        },
      });

      if (!response.data?.similartracks?.track) return [];

      return response.data.similartracks.track.map(track => ({
        name: track.name,
        artist: track.artist.name,
        match: parseFloat(track.match),
        source: 'Last.fm',
      }));
    } catch (error) {
      console.error('Last.fm recommendations failed:', error);
      return [];
    }
  }

  combineAndRankRecommendations(seedTrack, spotifyRecs, youtubeRecs, lastfmRecs, limit) {
    const allRecs = [...spotifyRecs, ...youtubeRecs, ...lastfmRecs];
    
    // Calculate Jaccard similarity for artist and title
    const calculateJaccardSimilarity = (str1, str2) => {
      const set1 = new Set(str1.toLowerCase().split(' '));
      const set2 = new Set(str2.toLowerCase().split(' '));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      return intersection.size / (set1.size + set2.size - intersection.size);
    };

    // Normalize scores
    const normalizeScore = (score, min, max) => (score - min) / (max - min);

    // Calculate scores and similarities
    const scoredRecs = allRecs.map(rec => {
      let score;
      switch (rec.source) {
        case 'Spotify':
          score = normalizeScore(rec.popularity, 0, 100);
          break;
        case 'YouTube':
          score = normalizeScore(Math.log(rec.viewCount), 0, Math.log(1e9)); // Assuming max views of 1 billion
          break;
        case 'Last.fm':
          score = rec.match;
          break;
        default:
          score = 0;
      }

      const artistSimilarity = calculateJaccardSimilarity(seedTrack.artist, rec.artist);
      const titleSimilarity = calculateJaccardSimilarity(seedTrack.name, rec.name);
      const overallSimilarity = (artistSimilarity + titleSimilarity) / 2;

      return { ...rec, score, similarity: overallSimilarity };
    });

    // Filter out recommendations below similarity threshold
    const filteredRecs = scoredRecs.filter(rec => rec.similarity >= this.config.similarityThreshold);

    // Rank recommendations based on a combination of score and similarity
    const rankedRecs = filteredRecs.sort((a, b) => {
      const scoreA = a.score * 0.7 + a.similarity * 0.3;
      const scoreB = b.score * 0.7 + b.similarity * 0.3;
      return scoreB - scoreA;
    });

    // Remove duplicates based on title and artist similarity
    const uniqueRecs = this.removeDuplicates(rankedRecs);

    return uniqueRecs.slice(0, limit);
  }

  removeDuplicates(recommendations) {
    const uniqueRecs = [];
    const seen = new Set();

    for (const rec of recommendations) {
      const key = `${rec.name.toLowerCase()}|${rec.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRecs.push(rec);
      }
    }

    return uniqueRecs;
  }

  async enhanceRecommendations(recommendations, client, message) {
    return Promise.all(recommendations.map(async (rec) => {
      const searchQuery = `${rec.name} ${rec.artist}`;
      const result = await client.kazagumo.search(searchQuery, {
        requester: message.author,
      });
      return result.tracks[0] || null;
    }));
  }
}

module.exports = avonRecommendations;
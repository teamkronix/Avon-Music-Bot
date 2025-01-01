const axios = require("axios");
const { google } = require("googleapis");
const SpotifyWebApi = require("spotify-web-api-node");
const youtube = google.youtube({
  version: "v3",
  auth: "AIzaSyAHHUTA6G8FjSjry1Cb6PbNND",
});
const lastfmApiKey = "595da9688e54e93b21ad5a2603f6d46c";
const spotifyApi = new SpotifyWebApi({
  clientId: "83c98500a89a4a5eae6fa819643644b8",
  clientSecret: "b2627d1bf6c846d98e102fe58e656892",
});

async function avonRecommendations(seedTrack, limit = 10) {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body["access_token"]);
    const [spotifyRecs, youtubeRecs, lastfmRecs] = await Promise.all([
      spRec(seedTrack, 1),
      ytRec(seedTrack, 5),
      lastFm(seedTrack, 4),
    ]);
    const a = shuffleArray([...spotifyRecs, ...youtubeRecs, ...lastfmRecs]);
    return a.slice(0, limit);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}
async function spRec(seedTrack, limit) {
  try {
    const response = await spotifyApi.getRecommendations({
      seed_tracks: [seedTrack.id],
      limit: limit,
    });
    return response.body.tracks.map((track) => ({
      name: track.name,
      artist: track.artists[0].name,
      url: track.external_urls.spotify,
      source: "Spotify",
    }));
  } catch (error) {
    console.error("Spotify recommendations failed:", error);
    return [];
  }
}
async function ytRec(seedTrack, limit) {
  try {
    const searchResponse = await youtube.search.list({
      part: "snippet",
      q: `${seedTrack.name} ${seedTrack.artist}`,
      type: "video",
      videoCategoryId: "10",
      maxResults: 1,
    });
    if (searchResponse.data.items.length === 0) return [];
    const videoId = searchResponse.data.items[0].id.videoId;
    const relatedResponse = await youtube.search.list({
      part: "snippet",
      relatedToVideoId: videoId,
      type: "video",
      maxResults: limit,
    });
    return relatedResponse.data.items.map((item) => ({
      name: item.snippet.title,
      artist: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: "YouTube",
    }));
  } catch (error) {
    console.error("YouTube recommendations failed:", error);
    return [];
  }
}
async function lastFm(seedTrack, limit) {
  try {
    const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
      params: {
        method: "track.getSimilar",
        artist: seedTrack.artist,
        track: seedTrack.name,
        api_key: lastfmApiKey,
        format: "json",
        limit: limit,
      },
    });
    if (
      !response.data ||
      !response.data.similartracks ||
      !response.data.similartracks.track
    ) {
      return [];
    }
    return response.data.similartracks.track.map((track) => ({
      name: track.name,
      artist: track.artist.name,
      url: track.url,
      source: "Last.fm",
    }));
  } catch (error) {
    console.error("Last.fm recommendations failed:", error);
    return [];
  }
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
module.exports = { avonRecommendations };

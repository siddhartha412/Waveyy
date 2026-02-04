const callPublicApi = (path, params = {}) => {
  const search = new URLSearchParams(params);
  search.set("path", path);
  return fetch(`/api/jiosaavn?${search.toString()}`);
};

export const searchSongsPublic = (query) =>
  callPublicApi("searchSongs", { q: query });

export const topChartsPublic = () => callPublicApi("topCharts");

export const albumDetailsPublic = (albumId) =>
  callPublicApi("albumDetails", { albumId });

export const artistDetailsPublic = (artistId) =>
  callPublicApi("artistDetails", { artistId });

export const recommendedSongsPublic = (songId) =>
  callPublicApi("recommendedSongs", { songId });


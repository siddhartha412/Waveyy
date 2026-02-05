const api_url = process.env.NEXT_PUBLIC_API_URL;
if (!api_url) {
    throw new Error('Missing NEXT_PUBLIC_API_URL environment variable');
};

export const getSongsByQuery = async (query, limit = 10) => {
    try {
        return await fetch(`${api_url}search/songs?query=${query}&limit=${limit}`);
    }
    catch (e) {
        console.log(e);
    }
};

export const getSongsById = async (e) => {
    try {
        return await fetch(`${api_url}songs/` + e);
    }
    catch (e) {
        console.log(e);
    }
};

export const getSongsSuggestions = async (e) => {
    try {
        return await fetch(`${api_url}songs/${e}/suggestions`);
    }
    catch (e) {
        console.log(e);
    }
};

export const searchAlbumByQuery = async (e) => {
    try {
        return await fetch(`${api_url}search/albums?query=` + e);
    }
    catch (e) {
        console.log(e);
    }
};

export const getAlbumById = async (e) => {
    try {
        return await fetch(`${api_url}albums?id=` + e);
    }
    catch (e) {
        console.log(e);
    }
};

export const getArtistById = async (id) => {
    try {
        const res = await fetch(`${api_url}artists?id=${id}`);
        const data = await res.json();

        if (data.success && data.data) {
            return { json: () => data };
        }
        throw new Error("Artist details failed");
    }
    catch (e) {
        console.log("Primary fetch failed, trying fallback...", e);
        try {
            // Fallback: Fetch songs and albums separately to reconstruct artist data
            const [songsRes, albumsRes] = await Promise.all([
                fetch(`${api_url}artists/${id}/songs`),
                fetch(`${api_url}artists/${id}/albums`)
            ]);

            const songsData = await songsRes.json();
            const albumsData = await albumsRes.json();

            if (songsData.data && songsData.data.songs && songsData.data.songs.length > 0) {
                const representativeSong = songsData.data.songs[0];
                const artistInfo = representativeSong.artists.primary.find(a => a.id === id) || representativeSong.artists.all.find(a => a.id === id);

                const reconstructedData = {
                    success: true,
                    data: {
                        id: id,
                        name: artistInfo ? artistInfo.name : "Unknown Artist",
                        image: artistInfo ? artistInfo.image : [],
                        followerCount: 0,
                        isVerified: false,
                        dominantLanguage: representativeSong.language,
                        dominantType: "Artist",
                        bio: [],
                        topSongs: songsData.data.songs,
                        topAlbums: albumsData.data ? albumsData.data.albums : []
                    }
                };
                return { json: () => reconstructedData };
            }
        } catch (fallbackError) {
            console.log("Fallback failed", fallbackError);
        }
        return { json: () => ({ success: false }) };
    }
};
import { getSongsById } from "@/lib/fetch";
import Player from "@/components/player/full-player";

export const generateMetadata = async ({ params }) => {
  try {
    const { id } = await params;
    const title = await getSongsById(id);
    const data = await title.json();
    const song = data?.data?.[0];

    if (!song) {
      return {
        title: "Song Not Found",
        description: "The requested song could not be found.",
      };
    }

    return {
      title: song.name,
      description: `Listen to "${song.name}" by ${song.artists?.primary?.[0]?.name || "unknown"} from the album "${song.album?.name || "unknown"}".`,
      openGraph: {
        title: song.name,
        description: `Listen to "${song.name}" by ${song.artists?.primary?.[0]?.name || "unknown"}.`,
        type: "music.song",
        url: song.url,
        images: [
          {
            url: song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url,
            width: 1200,
            height: 630,
            alt: song.name,
          },
        ],
        music: {
          album: song.album?.url,
          release_date: song.releaseDate,
          musician: song.artists?.primary?.[0]?.name || "unknown",
        },
      },
      twitter: {
        card: "summary_large_image",
        title: song.name,
        description: `Listen to "${song.name}" by ${song.artists?.primary?.[0]?.name || "unknown"}.`,
        images: song.image?.[0]?.url,
      },
    };
  } catch (error) {
    return {
      title: "Wavelength Player",
      description: "Listen to your favorite music on Wavelength.",
    };
  }
};

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <div>
      <Player id={id} />
    </div>
  );
}

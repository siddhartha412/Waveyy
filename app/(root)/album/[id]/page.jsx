import { getAlbumById } from "@/lib/fetch";
import Album from "../_components/Album";

export const generateMetadata = async ({ params }) => {
    const title = await getAlbumById(params.id);
    const data = await title.json();
    return {
        title: `Album - ${data.data.name}`,
    };
}
export default async function Page({ params }) {
    const res = await getAlbumById(params.id);
    const json = await res.json();
    return (
        <main>
            <Album data={json.data} />
        </main>
    )
}
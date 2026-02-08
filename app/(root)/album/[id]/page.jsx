import { getAlbumById } from "@/lib/fetch";
import Album from "../_components/Album";

export const generateMetadata = async ({ params }) => {
    const { id } = await params;
    const title = await getAlbumById(id);
    const data = await title.json();
    return {
        title: `Album - ${data.data.name}`,
    };
}
export default async function Page({ params }) {
    const { id } = await params;
    const res = await getAlbumById(id);
    const json = await res.json();
    return (
        <main>
            <Album data={json.data} />
        </main>
    )
}

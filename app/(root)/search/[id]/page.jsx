import Search from "../_components/Search";

export const generateMetadata = async ({ params }) => {
    const { id } = await params;
    return {
        title: `Search Results - ${decodeURI(id).toLocaleUpperCase()}`,
        description: `Viewing search results for ${decodeURI(id)}`,
    };
};
export default async function Page({ params }) {
    const resolvedParams = await params;
    return(
        <Search params={resolvedParams}/>
    )
}

import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="select-none">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-700 hover:text-sky-500 transition-all duration-300 ease-in-out">
                    <span className="text-gray-700">Wave</span>
                    <span className="text-gray-700">yy</span>
                </h1>
            </div>
        </Link>
    )
}

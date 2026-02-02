import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="select-none">
            <div>
                <h1 className="text-3xl font-extrabold text-black hover:text-blue-500 transition-all duration-300 ease-in-out">
                    <span className="text-black">Wave</span>
                    <span className="text-white">yy</span>
                </h1>
            </div>
        </Link>
    )
}

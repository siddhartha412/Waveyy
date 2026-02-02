import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="select-none">
            <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-black via-white to-blue-500 text-transparent bg-clip-text hover:scale-105 transition-all duration-300 ease-in-out">
                    Waveyy
                </h1>
            </div>
        </Link>
    )
}

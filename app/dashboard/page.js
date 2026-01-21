import { Terminal } from "lucide-react"

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

const DashboardPage = async () => {

    await sleep(3000);

    return (
        <div className="min-h-[calc(100vh-68px)] flex items-center justify-center">
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-center flex items-center gap-3">
                <Terminal className="size-10 sm:size-14 opacity-80" />
                Developer Playground
            </h1>
        </div>
    )
}


export default DashboardPage
import { Terminal } from "lucide-react"

const DashboardPage = () => {
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
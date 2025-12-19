import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const DashboardPage = () => {
    return (
        <div className="flex flex-col items-center min-h-[calc(100vh-68px)] py-4">
            <Card className="w-full max-w-xl">
                <CardHeader className="space-y-3 text-center">
                    <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Developer Playground
                    </CardTitle>

                    <CardDescription className="text-balance text-base leading-relaxed text-muted-foreground">
                        Teszteld az API-kat, funkciókat és ötleteidet egy biztonságos sandboxban.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}

export default DashboardPage
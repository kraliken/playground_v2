import MicrosoftSignInButton from "@/components/MicrosoftSignInButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {

    return (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
            <Card className="w-full max-w-xl">
                <CardHeader className="space-y-3 text-center">
                    <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Developer Playground
                    </CardTitle>

                    <CardDescription className="text-balance text-base leading-relaxed text-muted-foreground">
                        Moduláris fejlesztői játszótér demókhoz és teszteléshez.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center pt-2 space-y-3">
                    <MicrosoftSignInButton />
                    <p className="text-center text-xs text-muted-foreground">
                        Belépés után a dashboardon éred el a modulokat.
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}

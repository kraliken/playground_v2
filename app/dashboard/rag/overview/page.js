import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function Pill({ children }) {
    return (
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
            {children}
        </span>
    );
}

export default function RagOverviewPage() {

    return (
        <main className="mx-auto w-full max-w-6xl p-6">
            {/* Header */}
            <div className="flex flex-col gap-3">
                {/* <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Retrieval-Augmented Generation</Badge>
                    <Pill>MongoDB Atlas Vector Search</Pill>
                    <Pill>Basic / “naive” RAG architektúra</Pill>
                </div> */}

                <h1 className="text-2xl font-semibold tracking-tight">Áttekintés: RAG architektúra MongoDB-vel</h1>
                <p className="text-sm text-muted-foreground">
                    A RAG (Retrieval-Augmented Generation) egy architektúra, amely a nagy nyelvi modelleket (LLM-eket) kiegészíti
                    külső adatokkal: előbb releváns dokumentumokat keresünk a tudásbázisban, majd ezeket kontextusként adjuk az LLM-nek
                    a pontosabb válasz érdekében.
                </p>
            </div>

            <Separator className="my-6" />

            {/* Hero: diagram + limitations */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* FULL-WIDTH diagram */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader>
                        <CardTitle>Folyamatábra</CardTitle>
                        <CardDescription>Ingesztálás → Visszakeresés → Generálás</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-hidden rounded-xl border bg-background">
                            {/* Adjunk neki elég “vásznat”, hogy olvasható legyen */}
                            <div className="relative h-130 w-full lg:h-160">
                                <Image
                                    src="/images/rag-flowchart.webp"
                                    alt="RAG architektúra folyamatábra (Ingestion, Retrieval, Generation)"
                                    fill
                                    priority
                                    className="object-contain"
                                    sizes="100vw"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Jobb oldali két kártya mehet fél-félben alatta */}
                <div className="lg:col-span-2 flex items-stretch gap-6">
                    <div className="flex-1 flex flex-col gap-6 h-full">
                        <Alert className="h-full flex flex-col gap-6 p-6">
                            <AlertTitle>Milyen LLM-korlátokat kezel a RAG?</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc space-y-1 pl-5">
                                    <li>
                                        <span className="font-medium text-foreground">Elavult tudás</span>: az LLM-ek egy adott időpontig betanított,
                                        statikus adathalmazon tanulnak.
                                    </li>
                                    <li>
                                        <span className="font-medium text-foreground">Nincs hozzáférés saját adatokhoz</span>: lokális, személyre szabott,
                                        vagy szűk domain adatok tipikusan nincsenek “benne” a modellben.
                                    </li>
                                    <li>
                                        <span className="font-medium text-foreground">Hallucináció</span>: hiányos vagy elavult kontextus mellett a modell
                                        pontatlan választ generálhat.
                                    </li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                    <div className="flex-1 flex flex-col gap-6 h-full">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Mi történik egy kérdésnél?</CardTitle>
                                <CardDescription>„Kérdés → keresés → kontextus → válasz”</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-3 text-sm">
                                    <li className="flex gap-3">
                                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">1</span>
                                        <div>
                                            <div className="font-medium">A kérdésből embedding készül</div>
                                            <div className="text-muted-foreground">
                                                A rendszer a felhasználói kérdést vektoros reprezentációvá (embeddinggé) alakítja.
                                            </div>
                                        </div>
                                    </li>

                                    <li className="flex gap-3">
                                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">2</span>
                                        <div>
                                            <div className="font-medium">Vector Search a MongoDB-ben</div>
                                            <div className="text-muted-foreground">
                                                A kérdés embeddingje alapján a Vector Search szemantikailag hasonló dokumentumokat keres az indexelt embeddingek között.
                                            </div>
                                        </div>
                                    </li>

                                    <li className="flex gap-3">
                                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">3</span>
                                        <div>
                                            <div className="font-medium">LLM válasz a kontextus felhasználásával</div>
                                            <div className="text-muted-foreground">
                                                A prompt a kérdést és a visszakeresett dokumentumokat együtt adja az LLM-nek, amely ezekből generál választ.
                                            </div>
                                        </div>
                                    </li>
                                </ol>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>


            <Separator className="my-6" />

            {/* 3 pillars */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>1) Ingesztálás</CardTitle>
                        <CardDescription>Adat előkészítése → chunkolás → embedding → tárolás</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                            <li>
                                <span className="text-foreground font-medium">Adat előkészítése</span>: saját dokumentumok betöltése és feldolgozása.
                            </li>
                            <li>
                                <span className="text-foreground font-medium">Chunkolás</span>: a szöveg felosztása kisebb részekre az optimális visszakereséshez.
                            </li>
                            <li>
                                <span className="text-foreground font-medium">Embedding készítés</span>: a chunkok vektoros reprezentációjának előállítása embedding modellel.
                            </li>
                            <li>
                                <span className="text-foreground font-medium">Tárolás MongoDB-ben</span>: az embedding mező a dokumentum többi adatával együtt kerül a kollekcióba.
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2) Visszakeresés</CardTitle>
                        <CardDescription>Index → kérdés embedding → releváns dokumentumok</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                            <li>
                                <span className="text-foreground font-medium">Vector Search index</span>: vektor index definiálása azon a kollekción, amely az embeddingeket tartalmazza.
                            </li>
                            <li>
                                <span className="text-foreground font-medium">Vector search lekérdezés</span>: a kérdés embeddingje alapján a leginkább hasonló dokumentumok visszaadása.
                            </li>
                            <li>
                                <span className="text-foreground font-medium">Megvalósítási mód</span>: használhatsz MongoDB Vector Search integrációt, vagy építhetsz saját retrieval pipeline-t.
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3) Generálás</CardTitle>
                        <CardDescription>Kérdés + releváns dokumentumok → LLM válasz</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                            <li>
                                <span className="text-foreground font-medium">Kontextus összeállítása</span>: a visszakeresett dokumentumok a kérdéssel együtt kerülnek a promptba.
                            </li>
                            <li>
                                <span className="text-foreground font-medium">LLM kapcsolódás</span>: integráción keresztül, az LLM API-jának hívásával, vagy lokálisan futtatott open-source modellel.
                            </li>
                            <li>
                                <span className="text-foreground font-medium">Kimenet</span>: a válasz a kapott kontextus alapján készül, így relevánsabb és pontosabb lehet.
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Separator className="my-6" />

            {/* Decisions / FAQ focused on demo */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Architekturális alapelvek</CardTitle>
                        <CardDescription>
                            A RAG alapvető működési modellje: a válasz keresésen és kontextuson alapul
                        </CardDescription>

                    </CardHeader>
                    <CardContent className="text-sm">
                        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                            <li>
                                A tudásbázist a rendszer <span className="text-foreground font-medium">embeddingekkel</span> reprezentálja, és Vector Search-sel keres benne.
                            </li>
                            <li>
                                A generálásnál a promptban <span className="text-foreground font-medium">kérdés + releváns dokumentumok</span> szerepelnek.
                            </li>
                            <li>
                                Ez az architektúra alapvetően azért kell, mert az LLM tudása <span className="text-foreground font-medium">időben és domainben korlátos</span>.
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>GYIK</CardTitle>
                        <CardDescription>Rövid, architektúra-fókuszú válaszok</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="a">
                                <AccordionTrigger>Miért kell chunkolni?</AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground">
                                    A chunkolás a dokumentumot kisebb egységekre bontja, hogy a visszakeresés célzottan tudjon releváns részleteket találni.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="b">
                                <AccordionTrigger>Mi tárolódik a MongoDB-ben?</AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground">
                                    A dokumentum (chunk) szövege és az ahhoz tartozó embedding vektor ugyanabban a kollekcióban tárolódik, az embedding egy mezőként szerepel.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="c">
                                <AccordionTrigger>Mitől “RAG” a megoldás?</AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground">
                                    Attól, hogy az LLM nem önmagában válaszol, hanem a retrieval rendszer által visszahozott dokumentumokat kontextusként megkapja a generáláshoz.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

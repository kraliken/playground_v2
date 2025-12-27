"use client";

import { useEffect, useState, useTransition } from "react";
import { getEmbeddedSubTopicsAndChunksByTopicAction } from "@/action/topic";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import SelectedTopicContentSkeleton from "../skeletons/content/SelectedTopicContentSkeleton";

export default function SelectedTopicContent({ topicId }) {

    const [isPending, startTransition] = useTransition();

    const [subTopics, setSubTopics] = useState([]);
    const [loadedTopicId, setLoadedTopicId] = useState(null);

    useEffect(() => {

        if (!topicId) return;

        let ignore = false;

        startTransition(() => {
            (async () => {
                const res = await getEmbeddedSubTopicsAndChunksByTopicAction(topicId);
                if (ignore) return;

                if (!res?.ok) {
                    toast({
                        variant: "destructive",
                        title: "Hiba történt",
                        description: res?.error || "Ismeretlen hiba",
                    });

                    // ✅ setState csak callbackban
                    setSubTopics([]);
                    setLoadedTopicId(topicId);
                    return;
                }

                // ✅ setState csak callbackban
                setSubTopics(Array.isArray(res.data) ? res.data : []);
                setLoadedTopicId(topicId);
            })();
        });

        return () => {
            ignore = true;
        };
    }, [topicId]);

    // 1) nincs topic
    if (!topicId) {
        return (
            <div className="rounded-lg border border-dashed p-4">
                <p className="text-sm text-muted-foreground">
                    Válassz egy témakört a fenti listából, és itt megjelennek az <span className="font-medium">EMBEDDED</span>{" "}
                    altémák és a hozzájuk tartozó chunkok.
                </p>
            </div>
        );
    }

    // 2) topic váltás / töltés: ha a betöltött adat nem ehhez a topicId-hez tartozik, skeleton
    const isStale = loadedTopicId !== topicId;
    if (isPending || isStale) {
        return <SelectedTopicContentSkeleton />;
    }

    // 3) betöltött, de üres
    if (subTopics.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-4">
                <p className="text-sm text-muted-foreground">
                    Ehhez a témához még nincs <span className="font-medium">EMBEDDED</span> státuszú altémakör.
                </p>
            </div>
        );
    }

    // 4) betöltött, van adat
    return (
        <div className="flex flex-col gap-3">
            <Accordion type="single" collapsible className="w-full">
                {subTopics.map((s) => (
                    <AccordionItem key={s.id} value={`subtopic:${s.id}`}>
                        <AccordionTrigger className="text-left">
                            <div className="flex w-full items-center justify-between gap-3">
                                <span className="font-medium">{s.title}</span>
                                <span className="text-xs text-muted-foreground">{s.chunks?.length ?? 0} chunk</span>
                            </div>
                        </AccordionTrigger>

                        <AccordionContent>
                            {(s.chunks ?? []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">Ehhez az altémához nincs chunk.</p>
                            ) : (
                                <div className="pl-1">
                                    {/* BELSŐ Accordion: chunkok lenyithatóak */}
                                    <Accordion type="multiple" className="w-full">
                                        {(s.chunks ?? []).map((c) => (
                                            <AccordionItem key={c.id} value={`chunk:${c.id}`}>
                                                <AccordionTrigger className="text-left">
                                                    <div className="flex w-full items-center justify-between gap-3">
                                                        <span className="font-medium">{c.title || "Chunk"}</span>
                                                        <span className="text-xs text-muted-foreground">{c.embeddingModel || ""}</span>
                                                    </div>
                                                </AccordionTrigger>

                                                <AccordionContent>
                                                    <div className="rounded-md border p-3">
                                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.text}</p>

                                                        {!!c.createdAt && (
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                Létrehozva: {new Date(c.createdAt).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
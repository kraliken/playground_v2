"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { embedDocumentAction } from "@/lib/actions/embeddings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Badge({ children }) {
    return <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs">{children}</span>;
}

export default function DocumentEmbeddingList({ documents }) {
    const [pending, startTransition] = useTransition();

    const runEmbedding = (documentId) => {
        const fd = new FormData();
        fd.set("documentId", documentId);

        startTransition(async () => {
            const res = await embedDocumentAction(null, fd);

            if (res?.ok) toast.success(`Embedding kész. Subchunkok: ${res.embeddedCount ?? 0}`);
            else toast.error(res?.error || "Embedding indítása sikertelen.");
        });
    };

    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle className="text-base">Dokumentumok</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                        <div className="min-w-0">
                            <div className="truncate font-medium">Forrás: {d.title}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge>Témakör: {d.topicName}</Badge>
                                <Badge>Status: {d.status || "—"}</Badge>
                                <Badge>{d.isEmbedded ? "✅ Embedded" : "⏳ Nincs embedding"}</Badge>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            disabled={pending || d.isEmbedded}
                            onClick={() => runEmbedding(d.id)}
                            title={d.isEmbedded ? "Már embedelt" : "Embedding indítása"}
                        >
                            Embedding indítása
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

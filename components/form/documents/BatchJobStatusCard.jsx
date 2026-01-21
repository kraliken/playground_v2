"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getJobStatusAction, syncExtractedDataAction } from "@/action/upload";

function statusBadgeVariant(status) {
    if (status === "succeeded") return "default";
    if (status === "failed") return "destructive";
    if (status === "running") return "secondary";
    return "outline";
}

const BatchJobStatusCard = ({ jobId }) => {
    const [job, setJob] = useState(null);
    const [error, setError] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncCompleted, setSyncCompleted] = useState(false);
    const syncTriggeredRef = useRef(false);

    useEffect(() => {
        if (!jobId) return;

        let stopped = false;

        const tick = async () => {
            const res = await getJobStatusAction(jobId);
            if (stopped) return;

            if (!res?.ok) {
                setError(res?.error || "Státusz lekérdezés hiba");
                return;
            }

            setError("");
            setJob(res.data);

            // ha befejezödött és még nem szinkronizáltunk, szinkronizáljunk
            if (
                (res.data?.status === "succeeded" || res.data?.status === "failed") &&
                !syncTriggeredRef.current &&
                !syncCompleted
            ) {
                syncTriggeredRef.current = true;
                triggerSync();
            }

            // ha befejezödött, nem pollozunk továbbá
            if (res.data?.status === "succeeded" || res.data?.status === "failed") {
                stopped = true;
            }
        };

        tick();
        const id = setInterval(tick, 10000);

        return () => {
            stopped = true;
            clearInterval(id);
        };
    }, [jobId, syncCompleted]);

    const triggerSync = async () => {
        setIsSyncing(true);
        try {
            const syncRes = await syncExtractedDataAction(jobId);

            if (syncRes?.ok) {
                toast.success("Számla adatok szinkronizálva");
                // Frissítjük a job adatait az új extractált adatokkal
                if (syncRes.data) {
                    setJob(syncRes.data);
                }
                setSyncCompleted(true);
            } else {
                toast.error(syncRes?.error || "Szinkronizációs hiba");
            }
        } catch (err) {
            toast.error(err?.message || "Hiba a szinkronizáció során");
        } finally {
            setIsSyncing(false);
        }
    };

    if (!jobId) return null;

    return (
        <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="text-sm text-muted-foreground">Batch job</div>
                        <div className="font-mono text-xs">{jobId}</div>
                    </div>
                    <Badge variant={statusBadgeVariant(job?.status || "uploaded")}>
                        {job?.status || "uploaded"}
                    </Badge>
                </div>

                {error && <div className="text-sm text-red-500">{error}</div>}

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {job?.succeededCount ?? 0} sikeres · {job?.failedCount ?? 0} sikertelen ·{" "}
                            {job?.skippedCount ?? 0} kihagyott · {job?.totalFiles ?? 0} összesen
                        </span>
                        <span>{job?.percentCompleted ?? 0}%</span>
                    </div>
                    <Progress value={job?.percentCompleted ?? 0} />
                </div>

                {/* Szinkronizáció gomb, ha a feldolgozás befejeződött */}
                {(job?.status === "succeeded" || job?.status === "failed") && !syncCompleted && (
                    <Button
                        onClick={triggerSync}
                        disabled={isSyncing}
                        className="w-full"
                        variant="outline"
                    >
                        {isSyncing ? "Adatok szinkronizálása..." : "Számla adatok szinkronizálása"}
                    </Button>
                )}

                {(isSyncing || syncCompleted) && (
                    <div className="text-sm text-green-600 font-medium">
                        {isSyncing ? "⏳ Szinkronizálás folyamatban..." : "✓ Adatok sikeresen szinkronizálva"}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium">Fájlok</div>

                    <div className="max-h-90 overflow-auto rounded-md border">
                        <div className="grid grid-cols-12 gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
                            <div className="col-span-7">Fájl</div>
                            <div className="col-span-3">Státusz</div>
                            <div className="col-span-2">Hiba</div>
                        </div>

                        {(job?.files || []).map((f) => (
                            <div
                                key={f.blobName}
                                className="grid grid-cols-12 gap-2 px-3 py-2 text-sm border-b last:border-b-0 hover:bg-gray-50"
                            >
                                <div className="col-span-7 truncate" title={f.originalName}>
                                    {f.originalName}
                                </div>
                                <div className="col-span-3">
                                    <Badge variant={statusBadgeVariant(f.status)}>
                                        {f.status}
                                    </Badge>
                                </div>
                                <div
                                    className="col-span-2 truncate text-xs text-muted-foreground"
                                    title={f.errorMessage || ""}
                                >
                                    {f.errorMessage || ""}
                                </div>
                            </div>
                        ))}

                        {(job?.files || []).length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground">Nincs fájl adat.</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default BatchJobStatusCard;

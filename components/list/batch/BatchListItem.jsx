"use client";

import { Item, ItemActions, ItemContent } from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCcw, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { startBatchInvoiceAction } from "@/action/batch";

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getStatusMeta(status) {
    switch (status) {
        case "uploaded":
            return {
                label: "Feltöltve",
                // pending / várakozik
                badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                icon: <Clock className="h-4 w-4" />,
                actionLabel: "Feldolgozás indítása",
                actionIcon: <Play className="h-4 w-4" />,
                actionEnabled: true,
            };

        case "submitted":
            return {
                label: "Beküldve",
                // queued / sorban áll
                badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
                icon: <Clock className="h-4 w-4" />,
                actionLabel: "Folyamatban",
                actionIcon: <Loader2 className="h-4 w-4 animate-spin" />,
                actionEnabled: false,
            };

        case "running":
            return {
                label: "Feldolgozás",
                // in progress
                badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                actionLabel: "Folyamatban",
                actionIcon: <Loader2 className="h-4 w-4 animate-spin" />,
                actionEnabled: false,
            };

        case "succeeded":
            return {
                label: "Feldolgozva",
                // success
                badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                icon: <CheckCircle2 className="h-4 w-4" />,
                actionLabel: "Kész",
                actionIcon: <CheckCircle2 className="h-4 w-4" />,
                actionEnabled: false,
            };

        case "failed":
            return {
                label: "Hibás",
                // error
                badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
                icon: <XCircle className="h-4 w-4" />,
                actionLabel: "Újrapróbál",
                actionIcon: <RefreshCcw className="h-4 w-4" />,
                actionEnabled: true,
            };

        default:
            return {
                label: status || "Ismeretlen",
                badgeClass: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
                icon: <Clock className="h-4 w-4" />,
                actionLabel: "N/A",
                actionIcon: null,
                actionEnabled: false,
            };
    }
}


const BatchListItem = ({ batch }) => {

    const { id, jobId, status, totalFiles, createdAt } = batch || {};
    const meta = getStatusMeta(status);

    const createdText = formatDate(createdAt);

    const [isStartingBatch, startBatchTransition] = useTransition();

    const handleStartBatch = async () => {
        if (!jobId) return;

        startBatchTransition(async () => {
            try {
                const started = await startBatchInvoiceAction(jobId);

                if (!started?.ok) {
                    toast.error(started?.error || "Batch indítás hiba");
                    return;
                }

                toast.success(`Batch feldolgozás elindítva. Job: ${jobId}`);
            } catch (error) {
                toast.error(error?.message || "Hiba a batch indítás során");
            }
        })
    }

    return (
        <>
            <Item variant="muted" className="flex items-start gap-12">
                <ItemContent className="gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className={meta.badgeClass}>
                                <span className="mr-2 inline-flex items-center">{meta.icon}</span>
                                {meta.label}
                            </Badge>
                            <span className="font-medium">Job: {jobId}</span>


                            <span className="text-sm text-muted-foreground">
                                Fájlok: {Number(totalFiles || 0)}
                            </span>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Létrehozva: {createdText}
                        </div>

                        {/* opcionális: id megjelenítés debughoz */}
                        {/* <div className="text-xs text-muted-foreground">id: {id}</div> */}
                    </div>
                </ItemContent>
                <ItemActions className="flex gap-2">
                    <Button
                        type="button"
                        onClick={handleStartBatch}
                        disabled={!meta.actionEnabled || isStartingBatch}
                        className="min-w-42.5"
                    >
                        <span className="mr-2 inline-flex items-center">{meta.actionIcon}</span>
                        {meta.actionLabel}
                    </Button>
                </ItemActions>
            </Item>
        </>
    )
}

export default BatchListItem
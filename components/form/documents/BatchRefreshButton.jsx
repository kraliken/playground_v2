"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshDocJobStatusesAction } from "@/action/batch";

export default function BatchRefreshButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        startTransition(async () => {
            const res = await refreshDocJobStatusesAction();
            if (!res?.ok) {
                toast.error(res?.error || "Frissítés hiba");
                return;
            }
            toast.success("Sikeres frissítés");
            // opcionális: toast.success(`Frissítve: ${res.data.updated}`);
            router.refresh();
        });
    };

    return (
        <Button variant="secondary" onClick={onClick} disabled={isPending}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Frissítés
        </Button>
    );
}

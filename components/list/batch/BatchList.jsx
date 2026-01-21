"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import BatchListItem from "./BatchListItem"
import BatchRefreshButton from "@/components/form/documents/BatchRefreshButton";

const BatchList = ({ data }) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Feltöltött számlacsomagok</CardTitle>
                    <BatchRefreshButton />
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {data.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nincsenek számlacsomagok</p>
                ) : (
                    data.map((batch) => (
                        <BatchListItem key={batch.id} batch={batch} />
                    ))
                )}
            </CardContent>
        </Card>
    )
}

export default BatchList
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, ChevronRight, Eye } from "lucide-react";
import { getJobsAction } from "@/action/upload";

const DocumentResultsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [expandedFile, setExpandedFile] = useState(null);

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 5000);
        return () => clearInterval(interval);

    }, []);

    const fetchJobs = async () => {
        try {
            const response = await getJobsAction();

            console.log("[UI] jobs:", response.data);
            console.log(
                "[UI] first extractedData:",
                response.data?.[0]?.files?.[0]?.extractedData
            );

            if (!response?.ok) {
                setError(response?.error || "Nem sikerült a feladatok betöltése");
                return;
            }

            setJobs(response.data || []);
            setError("");
        } catch (err) {
            setError("Hiba a feladatok betöltésekor");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = useMemo(() => {
        return (jobs || []).filter((job) =>
            (job.jobId || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [jobs, searchQuery]);

    const getStatusColor = (status) => {
        switch (status) {
            case "succeeded":
                return "bg-green-100 text-green-800";
            case "failed":
                return "bg-red-100 text-red-800";
            case "running":
            case "submitted":
                return "bg-blue-100 text-blue-800";
            case "uploaded":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const downloadResult = async (file) => {
        if (!file.resultUrl) {
            alert("Eredmény még nem elérhető");
            return;
        }
        window.open(file.resultUrl, "_blank");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Feladatok betöltése...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-6">
            <div>
                <h1 className="text-3xl font-bold">Feldolgozási eredmények</h1>
                <p className="text-gray-600 mt-1">
                    Összes feltöltött szövegből feldolgozott dokumentum
                </p>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-700">{error}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Keresés</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="Keresés job ID alapján..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                </CardContent>
            </Card>

            {filteredJobs.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-gray-600 text-center py-8">
                            {searchQuery
                                ? "Nincs találat a kereséshez"
                                : "Nincs feldolgozva dokumentum"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredJobs.map((job) => {
                        const isExpanded = expandedJobId === job.jobId;

                        return (
                            <Card
                                key={job.jobId}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="font-mono text-sm text-gray-600">
                                                        {(job.jobId || "").substring(0, 8)}...
                                                    </div>
                                                    <Badge className={getStatusColor(job.status)}>
                                                        {job.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {job.createdAt
                                                        ? new Date(job.createdAt).toLocaleString("hu-HU")
                                                        : "-"}
                                                </p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setExpandedJobId((prev) =>
                                                        prev === job.jobId ? null : job.jobId
                                                    );
                                                    setExpandedFile(null);
                                                }}
                                                title={isExpanded ? "Bezárás" : "Részletek"}
                                            >
                                                <ChevronRight
                                                    className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""
                                                        }`}
                                                />
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>
                                                {job.succeededCount} sikeres · {job.failedCount}{" "}
                                                sikertelen · {job.skippedCount} kihagyott ·{" "}
                                                {job.totalFiles} összesen
                                            </span>
                                            <span className="font-semibold">
                                                {job.percentCompleted}%
                                            </span>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${job.percentCompleted || 0}%` }}
                                            ></div>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-6 pt-6 border-t">
                                                <h4 className="font-semibold mb-4">
                                                    Fájlok részletei
                                                </h4>

                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Fájlnév</TableHead>
                                                                <TableHead>Státusz</TableHead>
                                                                <TableHead>Utolsó frissítés</TableHead>
                                                                <TableHead>Hiba</TableHead>
                                                                <TableHead className="text-right">
                                                                    Műveletek
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>

                                                        <TableBody>
                                                            {(job.files || []).map((file) => {
                                                                const isFileExpanded =
                                                                    expandedFile === file.blobName;

                                                                return (
                                                                    <>
                                                                        <TableRow key={file.blobName}>
                                                                            <TableCell
                                                                                className="font-mono text-xs truncate max-w-xs"
                                                                                title={file.originalName}
                                                                            >
                                                                                {file.originalName}
                                                                            </TableCell>

                                                                            <TableCell>
                                                                                <Badge
                                                                                    className={getStatusColor(file.status)}
                                                                                    variant="secondary"
                                                                                >
                                                                                    {file.status}
                                                                                </Badge>
                                                                            </TableCell>

                                                                            <TableCell className="text-xs text-gray-600">
                                                                                {file.lastUpdatedAt
                                                                                    ? new Date(
                                                                                        file.lastUpdatedAt
                                                                                    ).toLocaleTimeString("hu-HU")
                                                                                    : "-"}
                                                                            </TableCell>

                                                                            <TableCell
                                                                                className="text-xs text-red-600 truncate max-w-xs"
                                                                                title={file.errorMessage}
                                                                            >
                                                                                {file.errorMessage || "-"}
                                                                            </TableCell>

                                                                            <TableCell className="text-right">
                                                                                <div className="flex gap-2 justify-end">
                                                                                    {file.status === "succeeded" &&
                                                                                        file.extractedData && (
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() => {
                                                                                                    setExpandedFile((prev) =>
                                                                                                        prev === file.blobName
                                                                                                            ? null
                                                                                                            : file.blobName
                                                                                                    );
                                                                                                }}
                                                                                                title="Adatok megtekintése"
                                                                                            >
                                                                                                <Eye className="w-4 h-4" />
                                                                                            </Button>
                                                                                        )}

                                                                                    {file.status === "succeeded" &&
                                                                                        file.resultUrl && (
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    downloadResult(file)
                                                                                                }
                                                                                                title="Eredmény megtekintése"
                                                                                            >
                                                                                                <Download className="w-4 h-4" />
                                                                                            </Button>
                                                                                        )}
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>

                                                                        {/* ✅ A RÉSZLETEK BLOKK KÖZVETLENÜL A SOR UTÁN, TABLE-BEN */}
                                                                        {isFileExpanded && file.extractedData && (
                                                                            <TableRow key={`details-${file.blobName}`}>
                                                                                <TableCell colSpan={5}>
                                                                                    <div className="bg-gray-50 rounded-md p-4 border">
                                                                                        <h5 className="font-semibold mb-4">
                                                                                            Kiolvasott adatok
                                                                                        </h5>

                                                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                            <div>
                                                                                                <p className="text-gray-600">
                                                                                                    Számla száma
                                                                                                </p>
                                                                                                <p className="font-mono">
                                                                                                    {file.extractedData
                                                                                                        .invoiceNumber || "-"}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-gray-600">
                                                                                                    Számla dátuma
                                                                                                </p>
                                                                                                <p className="font-mono">
                                                                                                    {file.extractedData
                                                                                                        .invoiceDate || "-"}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-gray-600">
                                                                                                    Esedékesség
                                                                                                </p>
                                                                                                <p className="font-mono">
                                                                                                    {file.extractedData.dueDate ||
                                                                                                        "-"}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-gray-600">
                                                                                                    Teljes összeg
                                                                                                </p>
                                                                                                <p className="font-mono font-bold">
                                                                                                    {file.extractedData
                                                                                                        .totalAmount || "-"}{" "}
                                                                                                    {file.extractedData.currency ||
                                                                                                        ""}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-gray-600">
                                                                                                    Szállító
                                                                                                </p>
                                                                                                <p className="font-mono whitespace-pre-line">
                                                                                                    {file.extractedData
                                                                                                        .vendorName || "-"}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-gray-600">
                                                                                                    Vevő
                                                                                                </p>
                                                                                                <p className="font-mono whitespace-pre-line">
                                                                                                    {file.extractedData
                                                                                                        .customerName || "-"}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>

                                                                                        {Array.isArray(
                                                                                            file.extractedData.lineItems
                                                                                        ) &&
                                                                                            file.extractedData.lineItems
                                                                                                .length > 0 && (
                                                                                                <div className="mt-6">
                                                                                                    <h6 className="font-semibold mb-3">
                                                                                                        Tételek
                                                                                                    </h6>
                                                                                                    <div className="overflow-x-auto">
                                                                                                        <table className="w-full text-xs">
                                                                                                            <thead>
                                                                                                                <tr className="border-b">
                                                                                                                    <th className="text-left py-2 px-2">
                                                                                                                        Leírás
                                                                                                                    </th>
                                                                                                                    <th className="text-center py-2 px-2">
                                                                                                                        Mennyiség
                                                                                                                    </th>
                                                                                                                    <th className="text-right py-2 px-2">
                                                                                                                        Egységár
                                                                                                                    </th>
                                                                                                                    <th className="text-right py-2 px-2">
                                                                                                                        Összeg
                                                                                                                    </th>
                                                                                                                </tr>
                                                                                                            </thead>
                                                                                                            <tbody>
                                                                                                                {file.extractedData.lineItems.map(
                                                                                                                    (item, idx) => (
                                                                                                                        <tr
                                                                                                                            key={idx}
                                                                                                                            className="border-b"
                                                                                                                        >
                                                                                                                            <td className="py-2 px-2 whitespace-pre-line">
                                                                                                                                {item.description}
                                                                                                                            </td>
                                                                                                                            <td className="text-center py-2 px-2">
                                                                                                                                {item.quantity}
                                                                                                                            </td>
                                                                                                                            <td className="text-right py-2 px-2">
                                                                                                                                {item.unitPrice}
                                                                                                                            </td>
                                                                                                                            <td className="text-right py-2 px-2 font-mono">
                                                                                                                                {item.amount}
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    )
                                                                                                                )}
                                                                                                            </tbody>
                                                                                                        </table>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        )}
                                                                    </>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DocumentResultsPage;

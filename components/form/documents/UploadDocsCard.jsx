"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// import UploadPdfJobForm from "./UploadPdfJobForm";
// import BatchJobStatusCard from "./BatchJobStatusCard";
import InvoiceUploadForm from "./InvoiceUploadForm";

const UploadDocsCard = () => {
    const [jobId, setJobId] = useState("");

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardContent className="">
                    {/* <UploadPdfJobForm /> */}
                    <InvoiceUploadForm />
                    {/* <UploadPdfJobForm onJobReady={setJobId} /> */}
                </CardContent>
            </Card>

            {/* {jobId && <BatchJobStatusCard jobId={jobId} />} */}
        </div>
    );
};

export default UploadDocsCard;

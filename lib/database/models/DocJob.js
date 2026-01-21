import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
    {
        originalName: { type: String, required: true },
        blobName: { type: String, required: true }, // source containerben: `${jobId}/...`
        status: {
            type: String,
            enum: ["uploaded", "running", "succeeded", "failed", "skipped"],
            default: "uploaded",
        },
        resultUrl: { type: String, default: "" },
        errorMessage: { type: String, default: "" },
        lastUpdatedAt: { type: Date, default: Date.now },

        // Extractált számlaadat
        extractedData: {
            invoiceNumber: { type: String, default: "" },
            invoiceDate: { type: String, default: "" },
            dueDate: { type: String, default: "" },
            vendorName: { type: String, default: "" },
            vendorAddress: { type: String, default: "" },
            customerName: { type: String, default: "" },
            customerAddress: { type: String, default: "" },
            totalAmount: { type: String, default: "" },
            currency: { type: String, default: "" },
            lineItems: [
                {
                    description: { type: String, default: "" },
                    quantity: { type: String, default: "" },
                    unitPrice: { type: String, default: "" },
                    amount: { type: String, default: "" },
                }
            ],
            rawJson: { type: mongoose.Schema.Types.Mixed, default: {} }, // teljes DI válasz
        },
    },
    { _id: false }
);

const DocJobSchema = new mongoose.Schema(
    {
        jobId: { type: String, required: true, unique: true, index: true },
        prefix: { type: String, required: true }, // `${jobId}/`
        modelId: { type: String, default: "prebuilt-invoice" },

        status: {
            type: String,
            enum: ["uploaded", "submitted", "running", "succeeded", "failed"],
            default: "uploaded",
        },

        percentCompleted: { type: Number, default: 0 },

        // DI Operation-Location teljes URL
        operationLocation: { type: String, default: "" },
        resultId: { type: String, default: "" },

        totalFiles: { type: Number, default: 0 },
        succeededCount: { type: Number, default: 0 },
        failedCount: { type: Number, default: 0 },
        skippedCount: { type: Number, default: 0 },

        files: { type: [FileSchema], default: [] },
    },
    { timestamps: true }
);

export default mongoose.models.DocJob || mongoose.model("DocJob", DocJobSchema);
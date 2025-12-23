import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UploadContentForm from "./UploadContentForm"


const UploadContentCard = ({ topics }) => {
    return (
        <Card className="h-full ">
            <CardHeader>
                <CardTitle className="text-base">Tartalom feltöltés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 h-full">
                <UploadContentForm topics={topics} />
            </CardContent>
        </Card>
    )
}

export default UploadContentCard
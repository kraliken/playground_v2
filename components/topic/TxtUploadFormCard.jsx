import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import TxtUploadForm from './TxtUploadForm'

const TxtUploadFormCard = ({ topics }) => {
    return (
        <Card className="h-full ">
            <CardHeader>
                <CardTitle className="text-base">Tartalom feltöltés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 h-full">
                <TxtUploadForm topics={topics} />
            </CardContent>
        </Card>
    )
}

export default TxtUploadFormCard
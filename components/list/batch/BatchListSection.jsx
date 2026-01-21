import { getAllDocJobAction } from "@/action/batch";
import BatchList from "./BatchList";


const BatchListSection = async () => {

    const { data } = await getAllDocJobAction()
    console.log(data);

    return (
        <BatchList data={data} />
    )
}

export default BatchListSection
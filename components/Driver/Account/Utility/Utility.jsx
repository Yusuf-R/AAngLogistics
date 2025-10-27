import {Text, View} from "react-native";
import UnderConstruction from "../../../UnderConstruction"

function Utility () {
    const onRefresh = () => {
        console.log("Refresh")
    }
    return (
        <>
            <UnderConstruction
                title="Utility"
                description="We're building something amazing!"
                onRefresh={() => {}}
            />

        </>
    )
}

export default Utility;
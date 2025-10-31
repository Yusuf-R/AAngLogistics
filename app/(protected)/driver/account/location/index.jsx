// app/(protected)/driver/account/location/index.jsx
import LocationManagement from "../../../../../components/Driver/Account/Locations/LocationManagement";
import {useSessionStore} from "../../../../../store/useSessionStore";
import {Text} from "react-native";

function LocationManagementScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <LocationManagement userData={userData}/>
        </>
    )
}

export default LocationManagementScreen

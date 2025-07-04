import Locations from "../../../../../components/Client/Profile/Locations/Locations";
import {useSessionStore} from "../../../../../store/useSessionStore";

function LocationSettingsScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <Locations
                userData={userData}
            />
        </>
    )
}

export default LocationSettingsScreen;
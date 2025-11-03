// app/(protected)/driver/discover/index.jsx
import Discover from "/components/Driver/Discover/Discover"
import {useSessionStore} from "../../../../store/useSessionStore";

function DiscoverScreen() {
    const userData = useSessionStore(state => state.user);
    return (
        <Discover
            userData={userData}
        />
    );
}

export default DiscoverScreen;

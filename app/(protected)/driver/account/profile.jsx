import Profile from "/components/Driver/Account/Profile/Profile"
import {useSessionStore} from "../../../../store/useSessionStore";

function ProfileScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <Profile
                userData={userData}
            />
        </>
    )
}

export default ProfileScreen;
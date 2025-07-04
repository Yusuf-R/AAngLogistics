import EditProfile from "../../../../components/Client/Profile/Security/Profile/EditProfile";
import {useSessionStore} from "../../../../store/useSessionStore";

function EditProfileScreen() {
    const userData = useSessionStore((state) => state.user);
    return (
        <>
            <EditProfile
                userData={userData}
            />
        </>
    )
}

export default EditProfileScreen;
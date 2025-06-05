import UpdateAvatar from "../../../../components/Client/Security/Profile/UpdateAvatar";
import {useSessionStore} from "../../../../store/useSessionStore";


function UpdateAvatarScreen () {
    const userData = useSessionStore((state) => state.user);
    return(
        <>
            <UpdateAvatar
                userData={userData}
            />
        </>
    )
}

export default UpdateAvatarScreen;
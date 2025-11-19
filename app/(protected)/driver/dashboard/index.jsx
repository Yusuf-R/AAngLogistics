// app/(protected)/driver/dashboard/index.jsx
import Dashboard from "/components/Driver/Dashborad/Dashboard"
import {useSessionStore} from "../../../../store/useSessionStore";


export default function DriverDashboard() {
    const userData = useSessionStore((state) => state.user);
    console.log({
        userData,
    })
    return (
        <>
            <Dashboard userData={userData}/>
        </>
    )
}

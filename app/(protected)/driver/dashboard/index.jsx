// app/(protected)/driver/dashboard/index.jsx
import Dashboard from "/components/Driver/Dashborad/Dashboard"
import {useSessionStore} from "../../../../store/useSessionStore";


export default function DriverDashboard() {
    const userData = useSessionStore((state) => state.user);

    return (
        <>
            <Dashboard userData={userData}/>
        </>
    )
}

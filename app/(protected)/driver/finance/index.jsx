// app/(protected)/driver/finance/index.jsx
import React from 'react';
import {Text, View} from 'react-native';
import {useSessionStore} from "../../../../store/useSessionStore";
import FinanceManager from "../../../../components/Driver/FinanceManager/FinanceManager";

function FinanceManagerScreen() {
    const userData = useSessionStore((state) => state.user);

    return (
        <>
            <FinanceManager
                userData={userData}
            />
        </>
    );
}

export default FinanceManagerScreen;
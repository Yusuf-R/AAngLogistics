// app/(protected)/driver/finance/(finance-tabs)/_layout.jsx

import {Stack} from 'expo-router';

export default function FinanceTabsLayout() {
    return (

            <Stack>
                <Stack.Screen name="manager" options={{headerShown: false}}/>
                <Stack.Screen name="topup" options={{headerShown: false}}/>
            </Stack>

    );
}
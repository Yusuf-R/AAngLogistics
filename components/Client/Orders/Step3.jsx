import {Text, View, Pressable} from "react-native";
import {forwardRef} from "react";

const Step3 = forwardRef(({defaultValues}, ref) => {
    return (
        <>
            <View className="flex-1 items-center justify-center">
                <Text className="text-lg font-bold text-gray-800">Step 3: Review & Confirm</Text>
                <Text className="text-sm text-gray-600 mt-2">Please review your order details before proceeding.</Text>
            </View>
            <Pressable
                className="bg-blue-500 p-4 rounded-full mt-4"
                onPress={() => console.log('Confirm Order')}
            >
                <Text className="text-white font-semibold">Confirm Order</Text>
            </Pressable>
        </>
    )
});

export default Step3;
import {forwardRef} from "react";
import {Text, View} from "react-native";

const Step2 = forwardRef(({defaultValues}, ref) => {
    return (
        <View ref={ref} style={{flex: 1, padding: 20}}>
            <Text style={{fontSize: 18, fontWeight: 'bold'}}>Step 2: Order Details</Text>
            <Text style={{marginTop: 10}}>Please fill in the order details below:</Text>
            {/* Add form fields here using defaultValues */}
            {/* Example field */}
        </View>
    );
});

export default Step2;

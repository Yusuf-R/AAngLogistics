import React, {useState, forwardRef, useImperativeHandle, useMemo} from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    TextInput,
    Dimensions,
    Alert
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useOrderStore} from "../../../store/useOrderStore";

const Payment = forwardRef(({defaultValues}, ref) => {
    const orderData = useOrderStore((state) => state.orderData);

    const formatCurrency = (amount) => {
        return `₦${amount.toLocaleString()}`;
    };
    return (
        <>
            <View style={styles.container}>
                {/* Proceed to Payment Button */}
                <View style={styles.actionButtonContainer}>
                    <LinearGradient
                        colors={["#3b82f6", "#60a5fa"]}
                        style={styles.actionButton}
                    >
                        <Pressable
                            style={styles.actionButtonContent}
                            onPress={() => {
                                // This will be handled by parent component or navigation
                                Alert.alert('Proceed to Payment', `Total: ${formatCurrency(orderData?.pricing?.totalAmount)}`);
                            }}
                        >
                            <View style={styles.buttonTextContainer}>
                                <Ionicons name="card" size={20} color="#ffffff" />
                                <Text style={styles.actionButtonText}>
                                    Proceed to Payment • {formatCurrency(orderData?.pricing?.totalAmount)}
                                </Text>
                            </View>
                        </Pressable>
                    </LinearGradient>
                </View>
            </View>
        </>
    )

});

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    actionButtonContainer: {
        marginHorizontal: 16,
        marginBottom: 32,
        marginTop: 8,
    },
    actionButton: {
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    actionButtonContent: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    buttonTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#ffffff',
        marginLeft: 8,
        textAlign: 'center',
    },
})


export default Payment;
import {Text, StyleSheet, SafeAreaView, View, Image, TouchableOpacity, Alert} from "react-native";
import PasswordReset from "../../../../assets/images/updaate-password.jpg";
import React, {useState} from "react";
import {Ionicons} from "@expo/vector-icons";
import KeyBoardAvoidingHook from '@/hooks/KeyBoardAvoidingHook'
import SecureStorage from "../../../../lib/SecureStorage";
import {router} from "expo-router";

// Form and validation
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Components
import {FormControl, FormControlError, FormControlErrorIcon} from '@/components/ui/form-control';
import {Input, InputField, InputSlot, InputIcon} from '@/components/ui/input';
import StatusModal from "../../../StatusModal/StatusModal";
import {useMutation} from "@tanstack/react-query";
import ClientUtils from "../../../../utils/ClientUtilities";

const EyeIcon = () => <Ionicons name="eye" size={26} color="#666"/>;
const EyeOffIcon = () => <Ionicons name="eye-off" size={26} color="#666"/>;
const AlertIcon = () => <Ionicons name="alert-circle" size={16} color="red"/>;

// Validation schema
const passwordSchema = yup.object().shape({
    currPassword: yup
        .string()
        .required('Password is required')
        .min(8, 'at least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/,
            'include uppercase, lowercase, number, and special character'),
    newPassword: yup
        .string()
        .required('Password is required')
        .min(8, 'at least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/,
            'include uppercase, lowercase, number, and special character'),
});

function UpdatePassword() {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Sending request...');

    const mutation = useMutation({
        mutationKey: ['UpdatePassword'],
        mutationFn: ClientUtils.UpdatePassword,
    });


    const {control, handleSubmit, reset, formState: {errors, isValid}} = useForm({
        resolver: yupResolver(passwordSchema),
        defaultValues: {currPassword: '', newPassword: ''},
        mode: 'onChange',
    });

    const onSubmit = async (data) => {

        data.refreshToken = await SecureStorage.getRefreshToken();

        setModalMessage('Sending new request...');
        setModalStatus('loading');
        setModalVisible(true);

        mutation.mutate(data, {
            onSuccess: () => {
                setModalStatus('success');
                setModalMessage('Password update successfully!');

                // delay navigation slightly after success animation plays
                setTimeout(() => {
                    setModalVisible(false);
                    router.replace({
                        pathname: '/client/profile/security',
                    });
                }, 2500);
            },
            onError: () => {
                setModalStatus('error');
                setModalMessage('Error Updating Password. Please try again.');
            }
        })
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* Illustration */}
            <View style={styles.illustrationContainer}>
                <Image
                    source={PasswordReset}
                    resizeMode='contain'
                    style={styles.illustration}
                />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <Text style={styles.title}>Create Your New Password</Text>

                <KeyBoardAvoidingHook>
                    <View style={styles.formContainer}>
                        {/* Password Field */}
                        <FormControl
                            isInvalid={!!errors.currPassword}
                            style={styles.formControl}
                        >
                            <Controller
                                name="currPassword"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <Input
                                        variant="rounded"
                                        size="xl"
                                        isInvalid={!!errors.currPassword}
                                        className="shadow-2xl bg-white/100 elevation-2xl border-1 h-14"
                                        style={{
                                            elevation: 5,
                                            shadowColor: '#000',
                                            shadowOffset: {width: 0, height: 2},
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                        }}
                                    >
                                        <InputField
                                            placeholder="Current Password"
                                            secureTextEntry={!showOldPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                        <TouchableOpacity className="pr-3"
                                                          onPress={() => setShowOldPassword((prev) => !prev)}>
                                            <InputIcon as={showOldPassword ? EyeOffIcon : EyeIcon}/>
                                        </TouchableOpacity>
                                    </Input>
                                )}
                            />
                            {errors.currPassword && (
                                <View style={styles.errorContainer}>
                                    <AlertIcon />
                                    <Text style={styles.errorText}>{errors.currPassword?.message}</Text>
                                </View>
                            )}
                        </FormControl>

                        {/* Confirm Password Field */}
                        <FormControl
                            isInvalid={!!errors.newPassword}
                            style={styles.formControl}
                        >
                            <Controller
                                name="newPassword"
                                control={control}
                                render={({field: {value, onChange, onBlur}}) => (
                                    <Input
                                        variant="rounded"
                                        size="xl"
                                        isInvalid={!!errors.newPassword}
                                        className="shadow-2xl bg-white/100 elevation-2xl border-1 h-14"
                                        style={{
                                            elevation: 5,
                                            shadowColor: '#000',
                                            shadowOffset: {width: 0, height: 2},
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                        }}
                                    >
                                        <InputField
                                            placeholder="New Password"
                                            secureTextEntry={!showNewPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                        <TouchableOpacity className="pr-3"
                                                          onPress={() => setShowNewPassword((prev) => !prev)}>
                                            <InputIcon as={showNewPassword ? EyeOffIcon : EyeIcon}/>
                                        </TouchableOpacity>
                                    </Input>

                                )}
                            />
                            {errors.newPassword && (
                                <View style={styles.errorContainer}>
                                    <AlertIcon />
                                    <Text style={styles.errorText}>{errors.newPassword?.message}</Text>
                                </View>
                            )}
                        </FormControl>

                        {/* Continue Button */}
                        <TouchableOpacity
                            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={!isValid}
                        >
                            <Text style={styles.continueButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </KeyBoardAvoidingHook>
            </View>

            <StatusModal
                visible={modalVisible}
                status={modalStatus}
                message={modalMessage}
                onRetry={onSubmit}
                onClose={() => setModalVisible(false)}
                showRetryOnError={false} // ❌ No retry in this case
            />
        </SafeAreaView>
    );
}

export default UpdatePassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    illustrationContainer: {
        alignItems: 'center',
    },
    illustration: {
        width: 320,
        height: 320,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4070f1',
        marginBottom: 40,
        textAlign: 'left',
    },
    formContainer: {
        flex: 1,
    },
    formControl: {
        marginBottom: 40,
    },
    inputContainer: {
        position: 'relative',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 18,
        minHeight: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    hiddenText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        letterSpacing: 2,
    },
    eyeIconContainer: {
        padding: 4,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        height: 0,
        width: 0,
    },
    hiddenInputField: {
        height: 0,
        width: 0,
        color: '#000'

    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginLeft: 6,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    continueButton: {
        backgroundColor: '#60a5fa',
        borderRadius: 28,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 32,
    },
    continueButtonDisabled: {
        backgroundColor: '#d1d5db',
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
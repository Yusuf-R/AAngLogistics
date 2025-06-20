import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import KeyBoardAvoidingHook from '@/hooks/KeyBoardAvoidingHook';
import SecureStorage from '../../../../lib/SecureStorage';
import StatusModal from '../../../StatusModal/StatusModal';
import ClientUtils from '../../../../utils/ClientUtilities';
import PasswordReset from '../../../../assets/images/updaate-password.jpg';
import {queryClient} from "../../../../lib/queryClient";

// Validation Schema
const passwordSchema = yup.object().shape({
    currPassword: yup
        .string()
        .required('Password is required')
        .min(8, 'At least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/, 'Include upper, lower, number, special character'),
    newPassword: yup
        .string()
        .required('Password is required')
        .min(8, 'At least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/, 'Include upper, lower, number, special character'),
});

export default function UpdatePassword() {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStatus, setModalStatus] = useState('loading');
    const [modalMessage, setModalMessage] = useState('Sending request...');

    const { control, handleSubmit, formState: { errors, isValid } } = useForm({
        resolver: yupResolver(passwordSchema),
        defaultValues: { currPassword: '', newPassword: '' },
        mode: 'onChange',
    });

    const mutation = useMutation({
        mutationKey: ['UpdatePassword'],
        mutationFn: ClientUtils.UpdatePassword,
    });

    const onSubmit = async (data) => {
        data.refreshToken = await SecureStorage.getRefreshToken();

        setModalMessage('Sending new request...');
        setModalStatus('loading');
        setModalVisible(true);

        mutation.mutate(data, {
            onSuccess: () => {
                setModalStatus('success');
                setModalMessage('Password updated successfully!');

                setTimeout(() => {
                    setModalVisible(false);
                    router.replace('/client/profile/security');
                }, 2500);

                queryClient.invalidateQueries({
                    queryKey: ['GetUnreadCount'],
                });
                queryClient.invalidateQueries({
                    queryKey: ['GetNotifications'],
                });

            },
            onError: () => {
                setModalStatus('error');
                setModalMessage('Error updating password. Please try again.');
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.illustrationContainer}>
                <Image source={PasswordReset} resizeMode='contain' style={styles.illustration} />
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>Create Your New Password</Text>

                <KeyBoardAvoidingHook>
                    <View style={styles.formContainer}>
                        {/* Current Password */}
                        <Controller
                            control={control}
                            name="currPassword"
                            render={({ field: { value, onChange, onBlur } }) => (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            placeholder="Current Password"
                                            style={styles.input}
                                            secureTextEntry={!showOldPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                        <TouchableOpacity onPress={() => setShowOldPassword(prev => !prev)}>
                                            <Ionicons name={showOldPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.currPassword && <Text style={styles.errorText}>{errors.currPassword.message}</Text>}
                                </>
                            )}
                        />

                        {/* New Password */}
                        <Controller
                            control={control}
                            name="newPassword"
                            render={({ field: { value, onChange, onBlur } }) => (
                                <>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-open-outline" size={22} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            placeholder="New Password"
                                            style={styles.input}
                                            secureTextEntry={!showNewPassword}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                        <TouchableOpacity onPress={() => setShowNewPassword(prev => !prev)}>
                                            <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword.message}</Text>}
                                </>
                            )}
                        />

                        {/* Submit */}
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
                onClose={() => setModalVisible(false)}
                showRetryOnError={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    illustrationContainer: { alignItems: 'center' },
    illustration: { width: 320, height: 320 },
    contentContainer: { flex: 1, paddingHorizontal: 20 },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4070f1',
        marginBottom: 40,
    },
    formContainer: { flex: 1 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 48,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 12,
        marginLeft: 4,
    },
    continueButton: {
        backgroundColor: '#60a5fa',
        borderRadius: 30,
        paddingVertical: 16,
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

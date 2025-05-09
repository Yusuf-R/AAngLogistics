// KeyBoardAvoidingHook.jsx
import React from 'react';
import {
    Platform,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';

export default function KeyboardAvoidingHook({ children }) {
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    {children}
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

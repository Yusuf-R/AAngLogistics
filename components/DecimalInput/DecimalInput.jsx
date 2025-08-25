// components/form/DecimalInput.jsx
import React from 'react';
import { TextInput, Platform } from 'react-native';
import { Controller } from 'react-hook-form';

/** --- Internal helpers --- **/
const sanitizeDecimalInput = (text, { allowNegative = false } = {}) => {
    let s = String(text ?? '').replace(',', '.');

    // keep only digits, dot, and (optionally) leading minus
    s = s.replace(allowNegative ? /[^0-9.\-]/g : /[^0-9.]/g, '');

    // minus only at the beginning (if allowed)
    if (allowNegative) {
        const neg = s.startsWith('-');
        s = s.replace(/\-/g, '');
        if (neg) s = '-' + s;
    }

    // keep only the first dot
    const i = s.indexOf('.');
    if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');

    // handle intermediates
    if (s === '.') s = '0.';
    if (s === '-.') s = '-0.';

    return s;
};

const finalizeDecimalValue = (value, { precision = null } = {}) => {
    let raw = String(value ?? '').replace(',', '.');

    // empty or dangling symbols -> empty field
    if (!raw || raw === '-' || raw === '0-' || raw === '-0.' || raw === '.') return '';

    if (raw.endsWith('.')) raw = raw.slice(0, -1);
    const num = Number(raw);
    if (!Number.isFinite(num)) return '';

    return precision == null ? num : Number(num.toFixed(precision));
};

/** --- Component --- **/
export default function DecimalInput({
                                         control,
                                         name,
                                         style,
                                         placeholder = '0.0',
                                         allowNegative = false,
                                         precision = null,
                                         inputProps = {},     // any extra TextInput props you want to pass
                                     }) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <TextInput
                    style={style}
                    placeholder={placeholder}
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    value={String(field.value ?? '')}
                    onChangeText={(t) => field.onChange(sanitizeDecimalInput(t, { allowNegative }))}
                    onBlur={() => {
                        field.onChange(finalizeDecimalValue(field.value, { precision }));
                        field.onBlur(); // mark as touched for RHF
                    }}
                    {...inputProps}
                />
            )}
        />
    );
}

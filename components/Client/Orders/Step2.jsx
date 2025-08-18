// components/Step2.jsx
import React, {forwardRef, useImperativeHandle, useMemo, useState} from 'react';
import {View, Text, TextInput, ScrollView, Pressable, StyleSheet, Animated, Dimensions, Easing} from 'react-native';
import {useForm, FormProvider} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepTwoSchema} from '../../../validators/orderValidationSchemas';
import {useSessionStore} from "../../../store/useSessionStore";
import Step2TabsBar from './Step2TabBar';
import PickUpPanel from './PickUpPanel';
import DropOffPanel from "./DropOffPanel";
import SummaryPanel from "./SummaryPanel";
import {useOrderStore} from "../../../store/useOrderStore";


const PHONE_HINT = 'e.g., 07012345678 or +2347012345678';
const PHONE_REGEX = /^(\+2340\d{10}|\+234\d{10}|0\d{10})$/;
const { width: SCREEN_WIDTH } = Dimensions.get('window');


function hasMin(loc) {
    if (!loc) return false;
    const hasAddr = !!(loc.address && String(loc.address).trim());
    const coords = loc.coordinates?.coordinates;
    const hasCoords = Array.isArray(coords) && coords.length === 2 && coords.every(n => typeof n === 'number' && !Number.isNaN(n));
    const name = loc.contactPerson?.name;
    const phone = loc.contactPerson?.phone;
    const hasContact = !!(name && String(name).trim()) && !!(phone && PHONE_REGEX.test(String(phone).trim()));
    return hasAddr && hasCoords && hasContact;
}

function debounce(fn, ms = 500) {
    let t;
    return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), ms);
    };
}


const Step2 = forwardRef(({defaultValues}, ref) => {
    const userData = useSessionStore((state) => state.user);
    const {orderData, updateOrderData, saveDraft} = useOrderStore();
    const savedPlaces = userData.savedLocations;
    const methods = useForm({
        resolver: yupResolver(stepTwoSchema),
        mode: 'onChange',
        defaultValues: defaultValues || {
            location: {
                pickUp: {
                    address: '', coordinates: {type: 'Point', coordinates: []},
                    contactPerson: {name: '', phone: '', alternatePhone: ''},
                    landmark: '', extraInformation: '', locationType: 'residential',
                    building: {name: '', floor: '', unit: ''}
                },
                dropOff: {
                    address: '', coordinates: {type: 'Point', coordinates: []},
                    contactPerson: {name: '', phone: '', alternatePhone: ''},
                    landmark: '', extraInformation: '', locationType: 'residential',
                    building: {name: '', floor: '', unit: ''}
                },
            }
        }
    });
    const {control, handleSubmit, setValue, formState: {errors}, getValues} = methods;

    // Expose imperative API just like Step1

    const [activeTab, setActiveTab] = useState('pickup'); // 'pickup' | 'dropoff' | 'summary'
    const [nudge, setNudge] = useState('');
    const [slideAnim] = useState(new Animated.Value(0));

    const pickup = getValues('location.pickUp');
    const dropoff = getValues('location.dropOff');

    const pickupComplete = useMemo(() => hasMin(pickup), [pickup?.address, pickup?.coordinates, pickup?.contactPerson]);
    const dropoffComplete = useMemo(() => hasMin(dropoff), [dropoff?.address, dropoff?.coordinates, dropoff?.contactPerson]);
    const summaryLocked = !(pickupComplete && dropoffComplete);

    // Persist (debounced)
    const persist = debounce(() => {
        const data = getValues();
        console.log({
            data
        })
        // updateOrderData({ ...orderData, ...data });
        // saveDraft().catch(()=>{});
    }, 500);


    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise((resolve) => {
                handleSubmit(
                    (data) => resolve({valid: true, data}),
                    (errs) => resolve({valid: false, errors: errs})
                )();
            }),
    }));

    const handleTabChange = (key) => {
        if (key === 'summary' && summaryLocked) {
            setNudge('Complete Pick-up and Drop-off to review the route.');
            setTimeout(() => setNudge(''), 3000);
            return;
        }
        setNudge('');
        setActiveTab(key);

        // Animate tab transition
        Animated.timing(slideAnim, {
            toValue: key === 'pickup' ? 0 : key === 'dropoff' ? 1 : 2,
            duration: 300,
            useNativeDriver: false,
            easing: Easing.out(Easing.cubic),
        }).start();
    };

    const onSelectSavedPlace = (place) => {
        // place: { address, coordinates:{ lat, lng }, landmark, contactPerson, ... }
        methods.setValue('location.pickUp', {
            address: place.address || '',
            coordinates: {type: 'Point', coordinates: [place.coordinates?.lng ?? 0, place.coordinates?.lat ?? 0]},
            landmark: place.landmark || '',
            contactPerson: place.contactPerson || {name: '', phone: '', alternatePhone: ''},
            extraInformation: place.extraInformation || '',
            locationType: place.locationType || 'residential',
            building: place.building || {name: '', floor: '', unit: ''}
        }, {shouldValidate: true});
        persist();
    };

    const onLocationUpdate = (type, locationData) => {
        const path = type === 'pickup' ? 'location.pickUp' : 'location.dropOff';
        methods.setValue(path, locationData, {shouldValidate: true});
        persist();
    };

    const onOpenAutocomplete = () => {
        // you’ll wire this to your Google Places sheet; when user picks:
        // methods.setValue('location.pickUp.address', selectedAddress, { shouldValidate:true });
        // methods.setValue('location.pickUp.coordinates', { type:'Point', coordinates:[lng,lat] }, { shouldValidate:true });
        // persist();
    };

    return (
        <>
            <View style={styles.container}>
                <FormProvider {...methods}>

                        <Step2TabsBar
                            active={activeTab}
                            onChange={handleTabChange}
                            pickupComplete={pickupComplete}
                            dropoffComplete={dropoffComplete}
                            summaryLocked={summaryLocked}
                        />

                        {/* Nudge Message */}
                        {nudge ? (
                            <View style={styles.nudgeContainer}>
                                <Text style={styles.nudgeText}>{nudge}</Text>
                            </View>
                        ) : null}
                    {/* Content Area with Animation */}
                    <View style={styles.contentContainer}>
                        <Animated.View style={[
                            styles.panelContainer,
                            {
                                transform: [{
                                    translateX: slideAnim.interpolate({
                                        inputRange: [0, 1, 2],
                                        outputRange: [0, -SCREEN_WIDTH, -2 * SCREEN_WIDTH]
                                    })
                                }]
                            }
                        ]}>
                            {/* Pickup Panel */}
                            <View style={styles.panel}>
                                {activeTab === 'pickup' && (
                                    <PickUpPanel
                                        control={methods.control}
                                        errors={errors}
                                        savedPlaces={savedPlaces}
                                        onLocationUpdate={(data) => onLocationUpdate('pickup', data)}
                                        onPersist={persist}
                                    />
                                )}
                            </View>

                            {/* Dropoff Panel */}
                            <View style={styles.panel}>
                                {activeTab === 'dropoff' && (
                                    <DropOffPanel
                                        control={methods.control}
                                        errors={errors}
                                        savedPlaces={savedPlaces}
                                        onLocationUpdate={(data) => onLocationUpdate('dropoff', data)}
                                        onPersist={persist}
                                    />
                                )}
                            </View>

                            {/* Summary Panel */}
                            <View style={styles.panel}>
                                {activeTab === 'summary' && (
                                    <SummaryPanel
                                        pickup={pickup}
                                        dropoff={dropoff}
                                        pickupComplete={pickupComplete}
                                        dropoffComplete={dropoffComplete}
                                    />
                                )}
                            </View>
                        </Animated.View>
                    </View>

                    {/* Bottom spacer for floating buttons */}
                    <View style={styles.bottomSpacer} />
                </FormProvider>
            </View>
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    nudgeContainer: {
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fef3c7',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    nudgeText: {
        fontSize: 14,
        color: '#92400e',
        fontFamily: 'PoppinsRegular',
    },
    contentContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    panelContainer: {
        flexDirection: 'row',
        flex: 1,
        width: 3 * SCREEN_WIDTH,
    },
    panel: {
        width: SCREEN_WIDTH,
        flex: 1,
    },
    bottomSpacer: {
        height: 100,
    },
});

export default Step2;

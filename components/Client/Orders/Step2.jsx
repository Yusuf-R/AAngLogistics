// components/Step2.jsx
import React, {forwardRef, useImperativeHandle, useMemo, useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
    Modal
} from 'react-native';
import {useForm, FormProvider, useWatch} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepTwoSchema} from '../../../validators/orderValidationSchemas';
import {useSessionStore} from "../../../store/useSessionStore";
import Step2TabsBar from './Step2TabBar';
import PickUpPanel from './PickUpPanel';
import DropOffPanel from "./DropOffPanel";
import SummaryPanel from "./SummaryPanel";
import CustomAlert from "./CustomAlert";
import {useOrderStore} from "../../../store/useOrderStore";
import {useOrderLocationStore} from "../../../store/useOrderLocationStore";
import SearchMap from "./SearchMap"


const PHONE_REGEX = /^(\+2340\d{10}|\+234\d{10}|0\d{10})$/;
const {width: SCREEN_WIDTH} = Dimensions.get('window');


function hasMin(loc) {
    console.log({
        loc
    })
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
    // Zustand store for map management
    const {
        isMapOpen,
        selectedPickupLocation,
        selectedDropoffLocation,
        openMapForPickup,
        openMapForDropoff,
        closeMap
    } = useOrderLocationStore();
    const methods = useForm({
        resolver: yupResolver(stepTwoSchema),
        mode: 'onChange',
        shouldUnregister: false,
        defaultValues: defaultValues || {
            defaultValues: defaultValues || {
                location: {
                    pickUp: {
                        address: '',
                        coordinates: {type: 'Point', coordinates: []},
                        contactPerson: {name: '', phone: '', alternatePhone: ''},
                        landmark: '',
                        extraInformation: '',
                        locationType: 'residential',
                        building: {name: '', floor: '', unit: ''}
                    },
                    dropOff: {
                        address: '',
                        coordinates: {type: 'Point', coordinates: []},
                        contactPerson: {name: '', phone: '', alternatePhone: ''},
                        landmark: '',
                        extraInformation: '',
                        locationType: 'residential',
                        building: {name: '', floor: '', unit: ''}
                    }
                }
            }
        }
    });
    const {control, handleSubmit, setValue, formState: {errors}, getValues, trigger} = methods;


    const [activeTab, setActiveTab] = useState('pickup'); // 'pickup' | 'dropoff' | 'summary'
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [nudge, setNudge] = useState('');
    const [alert, setAlert] = useState(null);
    const [slideAnim] = useState(new Animated.Value(0));

    const pickup = useWatch({control: methods.control, name: 'location.pickUp'});
    const dropoff = useWatch({control: methods.control, name: 'location.dropOff'});

    const pickupComplete = useMemo(() => hasMin(pickup), [pickup]);
    const dropoffComplete = useMemo(() => hasMin(dropoff), [dropoff]);

    // Persist (debounced)
    const persist = debounce(() => {
        const data = getValues();
        console.log({
            data
        })
        // updateOrderData({ ...orderData, ...data });
        // saveDraft().catch(()=>{});
    }, 500);


    // Expose imperative API just like Step1
    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise((resolve) => {
                handleSubmit(
                    (data) => resolve({valid: true, data}),
                    (errs) => resolve({valid: false, errors: errs})
                )();
            }),
    }));


    // Handle map location updates
    useEffect(() => {
        if (!selectedPickupLocation) return;
        const lat = selectedPickupLocation.latitude ?? 0;
        const lng = selectedPickupLocation.longitude ?? 0;

        // ✅ Update form ONLY
        setValue('location.pickUp.address',
            selectedPickupLocation.address || selectedPickupLocation.formattedAddress || '',
            {shouldDirty: true, shouldValidate: true}
        );
        setValue('location.pickUp.coordinates.coordinates', [lng, lat],
            {shouldDirty: true, shouldValidate: true}
        );
        // closeMap();
    }, [selectedPickupLocation]);

    useEffect(() => {
        if (!selectedDropoffLocation) return;
        const lat = selectedDropoffLocation.latitude ?? 0;
        const lng = selectedDropoffLocation.longitude ?? 0;

        // ✅ Update form ONLY
        setValue('location.dropOff.address',
            selectedDropoffLocation.address || selectedDropoffLocation.formattedAddress || '',
            {shouldDirty: true, shouldValidate: true}
        );
        setValue('location.dropOff.coordinates.coordinates', [lng, lat],
            {shouldDirty: true, shouldValidate: true}
        );
        // closeMap();
    }, [selectedDropoffLocation]);


    const handleTabChange = (key) => {
        setActiveTab(key);

        // Animate tab transition
        Animated.timing(slideAnim, {
            toValue: key === 'pickup' ? 0 : key === 'dropoff' ? 1 : 2,
            duration: 300,
            useNativeDriver: false,
            easing: Easing.out(Easing.cubic),
        }).start();
    };

    const validateAndSavePickup = async () => {
        try {
            // Validate pickup data
            const isValid = await trigger('location.pickUp');
            if (!isValid) {
                setAlert({
                    type: 'error',
                    title: 'Validation Failed',
                    message: 'Please fix the errors in pickup information',
                    duration: 4000
                });
                return false;
            }

            // Additional business logic validation
            const currentPickup = getValues('location.pickUp');
            if (!hasMin(currentPickup)) {
                setAlert({
                    type: 'error',
                    title: 'Incomplete Pickup',
                    message: 'Address, coordinates, and contact information are required',
                    duration: 4000
                });
                return false;
            }

            setAlert({
                type: 'success',
                title: 'Pickup Saved',
                message: 'Pickup information saved successfully!',
                duration: 3000
            });
            return true;
        } catch (error) {
            setAlert({
                type: 'error',
                title: 'Save Failed',
                message: 'Failed to save pickup information',
                duration: 4000
            });
            return false;
        }
    };

    const validateAndSaveDropoff = async () => {
        try {
            const isValid = await trigger('location.dropOff');
            if (!isValid) {
                setAlert({
                    type: 'error',
                    title: 'Validation Failed',
                    message: 'Please fix the errors in dropoff information',
                    duration: 3000
                });
                return false;
            }

            const currentDropoff = getValues('location.dropOff');
            if (!hasMin(currentDropoff)) {
                setAlert({
                    type: 'error',
                    title: 'Incomplete Dropoff',
                    message: 'Address, coordinates, and contact information are required',
                    duration: 3000
                });
                return false;
            }

            setAlert({
                type: 'success',
                title: 'Dropoff Saved',
                message: 'Dropoff information saved successfully!',
                duration: 3000
            });
            return true;
        } catch (error) {
            setAlert({
                type: 'error',
                title: 'Save Failed',
                message: 'Failed to save dropoff information',
                duration: 3000
            });
            return false;
        }
    };

    const notify = (type, title, message, duration = 3000) => setAlert({type, title, message, duration});


    return (
        <>
            <View style={styles.container}>
                <FormProvider {...methods}>

                    <Step2TabsBar
                        active={activeTab}
                        onChange={handleTabChange}
                    />

                    {alert && (
                        <CustomAlert
                            type={alert.type}
                            title={alert.title}
                            message={alert.message}
                            onClose={() => setAlert(null)}
                            duration={alert.duration}
                        />
                    )}

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
                                <PickUpPanel
                                    control={methods.control}
                                    errors={methods.formState.errors}
                                    savedPlaces={userData.savedLocations}
                                    onOpenMap={openMapForPickup}
                                    onValidateAndSave={validateAndSavePickup}
                                    notify={notify}
                                />
                            </View>

                            {/* Dropoff Panel */}
                            <View style={styles.panel}>
                                <DropOffPanel
                                    control={methods.control}
                                    errors={methods.formState.errors}
                                    savedPlaces={userData.savedLocations}
                                    onOpenMap={openMapForDropoff}
                                    onValidateAndSave={validateAndSaveDropoff}
                                    notify={notify}
                                />
                            </View>

                            {/* Summary Panel */}
                            <View style={styles.panel}>
                                <SummaryPanel
                                    pickupData={pickup}
                                    dropoffData={dropoff}
                                    pickupComplete={pickupComplete}
                                    dropoffComplete={dropoffComplete}
                                    onSwitchToPickup={() => handleTabChange('pickup')}
                                    onSwitchToDropoff={() => handleTabChange('dropoff')}
                                />
                            </View>

                        </Animated.View>
                    </View>

                    {/* Map Modal */}
                    <Modal
                        visible={isMapOpen}
                        animationType="slide"
                        presentationStyle="fullScreen"
                        onRequestClose={closeMap}
                    >
                        <SearchMap/>
                    </Modal>
                    {/* Bottom spacer for floating buttons */}
                    <View style={styles.bottomSpacer}/>
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
        height: 80,
    },
});

export default Step2;

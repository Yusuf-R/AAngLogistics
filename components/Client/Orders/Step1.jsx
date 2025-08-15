// components/Step1.jsx
import React, {useState, forwardRef, useImperativeHandle, useRef, useEffect} from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    ScrollView,
    StyleSheet,
    TextInput,
    Switch,
    Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import {ORDER_TYPES, PACKAGE_CATEGORIES} from '../../../utils/Constant';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {stepOneSchema} from "../../../validators/orderValidationSchemas";
import {Picker} from '@react-native-picker/picker';
import useMediaStore from "../../../store/useMediaStore";
import MediaImageUploader from "./MediaImageUploader";
import MediaVideoUploader from "./MediaVideoUploader";
import {useSessionStore} from "../../../store/useSessionStore";
import {useOrderStore} from "../../../store/useOrderStore";


const Step1 = forwardRef(({defaultValues}, ref) => {
    const {
        orderData,
    } = useOrderStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const {images, video } = useMediaStore();

    const {control, handleSubmit, watch, setValue, formState: {errors}} = useForm({
        defaultValues: {
            orderType: defaultValues.orderType || "instant",
            scheduledPickup: defaultValues.scheduledPickup || null,
            package: {
                category: defaultValues.package?.category || "",
                description: defaultValues.package?.description || "",
                dimensions: {
                    length: defaultValues.package?.dimensions?.length ?? "",
                    width: defaultValues.package?.dimensions?.width ?? "",
                    height: defaultValues.package?.dimensions?.height ?? "",
                    unit: defaultValues.package?.dimensions?.unit ?? "cm"
                },
                weight: {
                    value: defaultValues.package?.weight?.value ?? "",
                    unit: defaultValues.package?.weight?.unit ?? "kg"
                },
                isFragile: defaultValues.package?.isFragile || false,
                requiresSpecialHandling: defaultValues.package?.requiresSpecialHandling || false,
                specialInstructions: defaultValues.package?.specialInstructions || "",
                images: defaultValues.package?.images || [],
                video: defaultValues.package?.video || null,
            },
        },
        resolver: yupResolver(stepOneSchema),
        mode: "onChange",
        reValidateMode: "onChange"
    });

    const selectedType = watch("orderType");
    const selectedCategory = watch("package.category");
    const scheduledPickup = watch("scheduledPickup");

    // 🟢 Expose submit()
    useImperativeHandle(ref, () => ({
        submit: () =>
            new Promise((resolve) => {
                handleSubmit(
                    (data) => {
                        // const {images, video} = useMediaStore.getState();
                        const completeData = {
                            ...data,
                            package: {
                                ...data.package,
                            }
                        };
                        resolve({valid: true, data: completeData});
                    },
                    (errors) => {
                        console.log("Validation errors:", errors);
                        resolve({valid: false, errors});
                    }
                )();
            }),
    }));
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const scaleValues = useRef(
        ORDER_TYPES.reduce((acc, type) => {
            acc[type.id] = new Animated.Value(type.id === selectedType ? 1 : 0.95);
            return acc;
        }, {})
    ).current;

    // Handle order type selection
    const handleTypeSelect = async (typeId) => {
        if (selectedType === typeId) return;

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setValue("orderType", typeId);

        // Handle scheduled pickup pre-fill / clear
        if (typeId === "scheduled" && !scheduledPickup) {
            setValue("scheduledPickup", new Date(Date.now() + 30 * 60 * 1000));
        }
        if (typeId !== "scheduled") {
            setValue("scheduledPickup", null);
        }

        // Animate selection
        Object.keys(scaleValues).forEach(key => {
            Animated.spring(scaleValues[key], {
                toValue: key === typeId ? 1 : 0.95,
                useNativeDriver: true,
                tension: 100,
                friction: 8
            }).start();
        });
    };

    // Handle category selection
    const handleCategorySelect = async (categoryId, onChange) => {
        onChange(categoryId);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    function mergeDateAndTime(current, newDatePart) {
        const result = new Date(current);
        result.setFullYear(newDatePart.getFullYear());
        result.setMonth(newDatePart.getMonth());
        result.setDate(newDatePart.getDate());
        return result;
    }

    function mergeTimeIntoDate(current, newTimePart) {
        const result = new Date(current);
        result.setHours(newTimePart.getHours());
        result.setMinutes(newTimePart.getMinutes());
        result.setSeconds(0);
        result.setMilliseconds(0);
        return result;
    }

    // keep form in sync
    useEffect(() => {
        setValue('package.images', images, {shouldValidate: true});
    }, [images, setValue]);

    useEffect(() => {
        setValue('package.video', video, {shouldValidate: true});
    }, [video, setValue]);

    return (
        <>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                {/* Order Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Priority</Text>
                    <View style={styles.typeGrid}>
                        {ORDER_TYPES.map((type) => (
                            <Animated.View
                                key={type.id}
                                style={[
                                    styles.typeCardContainer,
                                    {transform: [{scale: scaleValues[type.id]}]}
                                ]}
                            >
                                <Pressable
                                    style={[
                                        styles.typeCard,
                                        selectedType === type.id && {
                                            ...styles.selectedCard,
                                            borderColor: type.color[0]
                                        }
                                    ]}
                                    onPress={() => handleTypeSelect(type.id)}
                                >
                                    <LinearGradient
                                        colors={type.color}
                                        style={styles.typeGradient}
                                        start={{x: 0, y: 0}}
                                        end={{x: 1, y: 1}}
                                    >
                                        <View style={styles.typeHeader}>
                                            <View style={styles.typeIcon}>
                                                <Ionicons name={type.icon} size={20} color="white"/>
                                            </View>
                                            {type.popular && (
                                                <View style={styles.popularBadge}>
                                                    <Text style={styles.popularText}>Popular</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.typeContent}>
                                            <Text style={styles.typeTitle}>{type.title}</Text>
                                            <Text style={styles.typeSubtitle}>{type.subtitle}</Text>
                                        </View>
                                    </LinearGradient>
                                </Pressable>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                {/* Schedule Date and Time */}
                {selectedType === "scheduled" && (
                    <>
                        {/* Scheduled Pickup Date/Time */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Scheduled Pickup</Text>
                            <View style={styles.datetimeRow}>
                                <Pressable
                                    style={styles.datetimeInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons
                                        name="calendar"
                                        size={20}
                                        color="#10b981"
                                        style={{marginRight: 6}}
                                    />
                                    <Text style={styles.datetimeText}>
                                        {scheduledPickup
                                            ? (() => {
                                                const date = new Date(scheduledPickup);
                                                return `${date.getDate()}/${date.toLocaleString('en-US', {month: 'long'})}/${date.getFullYear()}`;
                                            })()
                                            : "Select Date"}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={styles.datetimeInput}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons
                                        name="time"
                                        size={20}
                                        color="#10b981"
                                        style={{marginRight: 6}}
                                    />
                                    <Text style={styles.datetimeText}>
                                        {scheduledPickup ? scheduledPickup.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : "Select Time"}
                                    </Text>
                                </Pressable>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={scheduledPickup || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (date) {
                                            const newDate = mergeDateAndTime(scheduledPickup || new Date(), date);
                                            setValue("scheduledPickup", newDate);
                                        }
                                    }}
                                />
                            )}

                            {showTimePicker && (
                                <DateTimePicker
                                    value={scheduledPickup || new Date()}
                                    mode="time"
                                    display="default"
                                    onChange={(event, time) => {
                                        setShowTimePicker(false);
                                        if (time) {
                                            const newTime = mergeTimeIntoDate(scheduledPickup || new Date(), time);
                                            setValue("scheduledPickup", newTime);
                                        }
                                    }}
                                />
                            )}
                        </View>

                    </>
                )}

                {/* Package Category Selection */}
                <Controller
                    control={control}
                    name="package.category"
                    render={({field}) => (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Type</Text>
                            <View style={styles.categoryGrid}>
                                {PACKAGE_CATEGORIES.map((category) => {
                                    const isSelected = field.value === category.id;
                                    return (
                                        <Pressable
                                            key={category.id}
                                            style={[
                                                styles.categoryCard,
                                                isSelected && [styles.selectedCategory, {borderColor: category.color}]
                                            ]}
                                            onPress={() => handleCategorySelect(category.id, field.onChange)}
                                        >
                                            <View style={[
                                                styles.categoryIcon,
                                                {backgroundColor: category.color + '20'}
                                            ]}>
                                                <Ionicons name={category.icon} size={18} color={category.color}/>
                                            </View>
                                            <Text style={[
                                                styles.categoryTitle,
                                                isSelected && {color: category.color}
                                            ]}>
                                                {category.title}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                />
                {errors?.package?.category && (
                    <Text style={styles.errorText}>{errors.package.category.message}</Text>
                )}

                {/* Package Description */}
                <Controller
                    control={control}
                    name="package.description"
                    render={({field}) => (
                        <View style={styles.sectionDescription}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, errors?.package?.description && styles.inputError]}
                                placeholder="Enter package description"
                                value={field.value}
                                onChangeText={field.onChange}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>
                    )}
                />
                {errors?.package?.description && (
                    <Text style={styles.errorText}>{errors.package.description.message}</Text>
                )}

                {/* Package Dimension */}
                <View style={styles.section}>
                    <Text style={styles.label}>Dimension (Optional)</Text>
                    <View style={styles.dimensionsRow}>
                        <Controller
                            control={control}
                            name="package.dimensions.length"
                            render={({field}) => (
                                <View style={styles.dimensionInput}>
                                    <TextInput
                                        style={styles.dimensionField}
                                        placeholder="L"
                                        keyboardType="numeric"
                                        value={field.value?.toString() ?? ''}
                                        onChangeText={(val) => field.onChange(Number(val))}
                                    />
                                </View>
                            )}
                        />
                        <Text style={styles.dimensionSeparator}>x</Text>
                        <Controller
                            control={control}
                            name="package.dimensions.width"
                            render={({field}) => (
                                <View style={styles.dimensionInput}>
                                    <TextInput
                                        style={styles.dimensionField}
                                        placeholder="W"
                                        keyboardType="numeric"
                                        value={field.value?.toString() ?? ''}
                                        onChangeText={(val) => field.onChange(Number(val))}
                                    />
                                </View>
                            )}
                        />
                        <Text style={styles.dimensionSeparator}>x</Text>
                        <Controller
                            control={control}
                            name="package.dimensions.height"
                            render={({field}) => (
                                <View style={styles.dimensionInput}>
                                    <TextInput
                                        style={styles.dimensionField}
                                        placeholder="H"
                                        keyboardType="numeric"
                                        value={field.value?.toString() ?? ''}
                                        onChangeText={(val) => field.onChange(Number(val))}
                                    />
                                </View>
                            )}
                        />
                    </View>
                </View>

                {/* Weight Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Weight</Text>
                    <View style={styles.weightRow}>
                        {/* Weight numeric input */}
                        <Controller
                            control={control}
                            name="package.weight.value"
                            render={({field}) => (
                                <TextInput
                                    style={[
                                        styles.weightInput,
                                        errors?.package?.weight?.value && styles.inputError
                                    ]}
                                    placeholder="0.0"
                                    keyboardType="numeric"
                                    value={field.value?.toString() ?? ''}
                                    onChangeText={(val) => field.onChange(Number(val))}
                                />
                            )}
                        />

                        {/* Unit dropdown */}
                        <Controller
                            control={control}
                            name="package.weight.unit"
                            render={({field}) => (
                                <View style={styles.unitDropdownContainer}>
                                    <Picker
                                        selectedValue={field.value}
                                        style={styles.unitDropdown}
                                        onValueChange={field.onChange}
                                        prompt="Select unit"
                                        mode="dropdown"
                                    >
                                        <Picker.Item label="kg" value="kg"/>
                                        <Picker.Item label="g" value="g"/>
                                    </Picker>
                                </View>
                            )}
                        />
                    </View>
                </View>
                {/* Show error if needed */}
                {errors?.package?.weight?.value && (
                    <Text style={styles.errorText}>{errors.package.weight.value.message}</Text>
                )}

                {/* Fragile and Special Handling Toggles */}
                <Controller
                    control={control}
                    name="package.isFragile"
                    render={({field}) => (
                        <View style={styles.section}>
                            <Animated.View style={[styles.advancedContainer]}>
                                <Pressable
                                    style={styles.toggleRow}
                                    onPress={() => field.onChange(!field.value)}
                                >
                                    <View style={styles.toggleInfo}>
                                        <Text style={styles.toggleTitle}>Fragile</Text>
                                        <Text style={styles.toggleSubtitle}>
                                            Is this package fragile?
                                        </Text>
                                    </View>
                                    <Switch
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        trackColor={{false: "#d1d5db", true: "#10b981"}}
                                        thumbColor={field.value ? "#ffffff" : "#f3f4f6"}
                                        ios_backgroundColor="#d1d5db"
                                    />
                                </Pressable>
                            </Animated.View>
                        </View>

                    )}
                />

                <Controller
                    control={control}
                    name="package.requiresSpecialHandling"
                    render={({field}) => (
                        <View style={styles.section}>
                            <Animated.View style={[styles.advancedContainer]}>
                                <Pressable
                                    style={styles.toggleRow}
                                    onPress={() => field.onChange(!field.value)}
                                >
                                    <View style={styles.toggleInfo}>
                                        <Text style={styles.toggleTitle}>Handling</Text>
                                        <Text style={styles.toggleSubtitle}>
                                            does it require special handling?
                                        </Text>
                                    </View>
                                    <Switch
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        trackColor={{false: "#d1d5db", true: "#10b981"}}
                                        thumbColor={field.value ? "#ffffff" : "#f3f4f6"}
                                        ios_backgroundColor="#d1d5db"
                                    />
                                </Pressable>
                            </Animated.View>
                        </View>

                    )}
                />

                {/* Special Instructions */}
                <Controller
                    control={control}
                    name="package.specialInstructions"
                    render={({field}) => (
                        <View style={styles.sectionDescription}>
                            <Text style={styles.label}>Special Instructions</Text>
                            <TextInput
                                style={[styles.input, errors?.package?.description && styles.inputError]}
                                placeholder="Enter any special instructions"
                                value={field.value}
                                onChangeText={field.onChange}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>
                    )}
                />
                {errors?.package?.specialInstructions && (
                    <Text style={styles.errorText}>{errors.package.specialInstructions.message}</Text>
                )}

                {/* Special Instructions */}
                <Controller
                    control={control}
                    name="package.images"
                    render={({field}) => (
                        <View style={styles.sectionDescription}>
                            <Text style={styles.label}>Images Upload</Text>
                            <MediaImageUploader orderId={orderData?._id}/>
                        </View>
                    )}
                />
                {errors?.package?.images && (
                    <Text style={styles.errorText}>{errors.package.images.message}</Text>
                )}

                <Controller
                    control={control}
                    name="package.video"
                    render={({field}) => (
                        <View style={styles.sectionDescription}>
                            <Text style={styles.label}>Video Upload</Text>
                            <MediaVideoUploader orderId={orderData?._id}/>
                        </View>
                    )}
                />
                {errors?.package?.video && (
                    <Text style={styles.errorText}>{errors.package.video.message}</Text>
                )}


                <View style={styles.section}>
                    <View style={styles.mediaStatusContainer}>
                        <Text style={styles.mediaStatusTitle}>Upload Progress</Text>
                        <View style={styles.mediaStatusRow}>
                            <View style={styles.mediaStatusItem}>
                                <Ionicons
                                    name={images.length >= 3 ? "checkmark-circle" : "alert-circle"}
                                    size={20}
                                    color={images.length >= 3 ? "#10b981" : "#f59e0b"}
                                />
                                <Text style={[
                                    styles.mediaStatusText,
                                    {color: images.length >= 3 ? "#10b981" : "#f59e0b"}
                                ]}>
                                    Images: {images.length}/6 {images.length >= 3 ? "✓" : "(Min 3 required)"}
                                </Text>
                            </View>
                            <View style={styles.mediaStatusItem}>
                                <Ionicons
                                    name={video ? "checkmark-circle" : "alert-circle"}
                                    size={20}
                                    color={video ? "#10b981" : "#9ca3af"}
                                />
                                <Text style={[
                                    styles.mediaStatusText,
                                    {color: video ? "#10b981" : "#9ca3af"}
                                ]}>
                                    Video: {video ? "Uploaded" : "Optional"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom spacing */}
                <View style={styles.bottomSpacing}/>
            </ScrollView>
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    section: {
        marginTop: 12,
        marginHorizontal: 15,
        marginBottom: 12,
        fontFamily: 'PoppinsRegular',
    },
    sectionDescription: {
        marginTop: 12,
        marginHorizontal: 15,
        fontFamily: 'PoppinsRegular',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 6,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 16,
        fontFamily: 'PoppinsRegular',
    },

    // Order Type Styles
    typeGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    typeCardContainer: {
        flex: 1,
    },
    typeCard: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedCard: {
        elevation: 12,
        shadowOpacity: 0.8,
        shadowRadius: 16,
        shadowColor: '#000',
        borderWidth: 3,
        borderRadius: 20,
    },
    typeGradient: {
        padding: 8,
        minHeight: 100,
    },
    typeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    typeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popularBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    popularText: {
        fontSize: 9,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
    },
    typeContent: {
        marginTop: 'auto',
    },
    typeTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: 'white',
        marginBottom: 2,
    },
    typeSubtitle: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#FFF'
    },

    // Date Picker Styles
    datetimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    datetimeInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flex: 1,
        marginRight: 8
    },

    datetimeText: {
        fontSize: 14,
        color: '#111827',
    },
    schedulePicker: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    schedulePickerText: {
        fontSize: 12,
        color: "#374151",
    },

    // Quick Reorder Styles
    reorderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    reorderIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    reorderContent: {
        flex: 1,
    },
    reorderTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    reorderSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    reorderPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#667eea',
    },

    // Category Styles
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryCard: {
        width: '31%',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        position: 'relative',
    },
    selectedCategory: {
        borderWidth: 2,
        backgroundColor: '#f8fafc',
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryTitle: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        textAlign: 'center',
        color: '#374151',
    },
    popularDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#f59e0b',
    },

    // Input Styles
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        color: '#000',
        fontFamily: 'PoppinsBold',
        marginBottom: 6,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 14,
        padding: 12,
        fontFamily: 'PoppinsRegular',
        fontSize: 14,
        color: '#111827',
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 11,
        marginTop: -5,
        marginLeft: 14,
        fontFamily: 'PoppinsRegular',
        color: '#ef4444',

    },

    // Dimensions Styles
    dimensionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 40,
    },
    dimensionInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 5,
    },
    dimensionField: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontFamily: 'PoppinsRegular',
    },
    dimensionSeparator: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsBold',
    },
    unitLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'PoppinsBold',
        marginLeft: 4,
    },

    // Weight Styles
    weightRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    weightInput: {
        flex: 2.0,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 20,
        marginRight: 25,
    },

    unitDropdownContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 50,
        overflow: 'hidden',
    },

    unitDropdown: {
        height: Platform.OS === 'android' ? 40 : undefined,
        width: '100%',
        fontFamily: 'PoppinsRegular',
        backgroundColor: '#d4dfed',
    },

    // Toggle Styles
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    toggleInfo: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 16,
        fontFamily: "PoppinsSemiBold",
        color: "#374151",
    },
    toggleSubtitle: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },

    // Advanced Options Styles
    advancedToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    advancedToggleText: {
        fontSize: 16,
        color: '#667eea',
        fontFamily: 'PoppinsSemiBold',
    },
    advancedContainer: {
        marginBottom: 10,
    },
    bottomSpacing: {
        height: 80,
    },

    // Image and Video Upload Styles
    mediaStatusContainer: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    mediaStatusTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
        marginBottom: 8,
    },
    mediaStatusRow: {
        gap: 8,
    },
    mediaStatusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mediaStatusText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
    },
});

export default Step1;
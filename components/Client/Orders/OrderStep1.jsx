// components/OrderStep1.js
import React, {useState, useRef, useEffect} from 'react';
import {
    View,
    Text,
    Pressable,
    Animated,
    ScrollView,
    StyleSheet,
    TextInput,
    Switch
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const ORDER_TYPES = [
    {
        id: 'instant',
        title: 'Send Now',
        subtitle: 'Immediate pickup',
        icon: 'flash',
        color: ['#ff6b6b', '#ee5a24'],
        popular: true
    },
    {
        id: 'scheduled',
        title: 'Schedule',
        subtitle: 'Pick a time',
        icon: 'time',
        color: ['#667eea', '#764ba2']
    },
    {
        id: 'recurring',
        title: 'Recurring',
        subtitle: 'Regular deliveries',
        icon: 'repeat',
        color: ['#2ecc71', '#27ae60']
    }
];

const PACKAGE_CATEGORIES = [
    {id: 'document', title: 'Documents', icon: 'document-text', color: '#3b82f6'},
    {id: 'parcel', title: 'Parcel', icon: 'cube', color: '#8b5cf6'},
    {id: 'food', title: 'Food', icon: 'restaurant', color: '#f59e0b'},
    {id: 'clothing', title: 'Clothing', icon: 'shirt', color: '#f472b6'},
    {id: 'furniture', title: 'Furniture', icon: 'bed', color: '#f97316'},
    {id: 'electronics', title: 'Electronics', icon: 'phone-portrait', color: '#06b6d4'},
    {id: 'jewelry', title: 'Jewelry', icon: 'diamond', color: '#facc15'},
    {id: 'gifts', title: 'Gifts', icon: 'gift', color: '#f43f5e'},
    {id: 'books', title: 'Books', icon: 'book', color: '#8b5cf6'},
    {id: 'fragile', title: 'Fragile', icon: 'warning', color: '#ef4444'},
    {id: 'medicine', title: 'Medicine', icon: 'medical', color: '#10b981'},
    {id: 'others', title: 'Others', icon: 'ellipsis-horizontal', color: '#9ca3af'}
];

const OrderStep1 = ({orderData, onUpdate, smartSuggestions = {}, validationErrors = {}}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedType, setSelectedType] = useState(orderData.orderType || 'instant');
    const [selectedCategory, setSelectedCategory] = useState(orderData.package?.category || '');

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
        setSelectedType(typeId);
        onUpdate('orderType', typeId);

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
    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        onUpdate('package', {...orderData.package, category: categoryId});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Toggle advanced options
    const toggleAdvanced = () => {
        setShowAdvanced(!showAdvanced);
        Animated.timing(animatedHeight, {
            toValue: showAdvanced ? 0 : 150,
            duration: 300,
            useNativeDriver: false
        }).start();
    };

    // Quick reorder handler
    const handleQuickReorder = (order) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onUpdate('package', {
            ...order.package,
            description: order.package.description || ''
        });
        if (order.package.category) {
            setSelectedCategory(order.package.category);
        }
    };

    // Input field component
    const InputField = ({
                            label,
                            value,
                            onChangeText,
                            placeholder,
                            keyboardType = 'default',
                            multiline = false,
                            error
                        }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multilineInput,
                    error && styles.inputError
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
                multiline={multiline}
                placeholderTextColor="#9ca3af"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    // Quick reorder card
    const QuickReorderCard = ({order, index}) => (
        <Pressable
            key={index}
            style={styles.reorderCard}
            onPress={() => handleQuickReorder(order)}
        >
            <View style={styles.reorderIcon}>
                <Ionicons name="refresh" size={16} color="#667eea"/>
            </View>
            <View style={styles.reorderContent}>
                <Text style={styles.reorderTitle} numberOfLines={1}>
                    {order.package?.description || 'Previous Order'}
                </Text>
                <Text style={styles.reorderSubtitle} numberOfLines={1}>
                    To: {order.dropoff?.address?.slice(0, 25)}...
                </Text>
            </View>
            <Text style={styles.reorderPrice}>₦{order.pricing?.totalAmount || '0'}</Text>
        </Pressable>
    );

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
                                        selectedType === type.id && styles.selectedCard
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

                {/* Quick Reorder Section */}
                {smartSuggestions.quickReorder?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Reorder</Text>
                        <Text style={styles.sectionSubtitle}>Repeat a recent delivery</Text>
                        {smartSuggestions.quickReorder.map((order, index) => (
                            <QuickReorderCard key={order.id || index} order={order} index={index}/>
                        ))}
                    </View>
                )}

                {/* Package Category Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Type</Text>
                    <View style={styles.categoryGrid}>
                        {PACKAGE_CATEGORIES.map((category) => {
                            const isSelected = selectedCategory === category.id;
                            const isPopular = smartSuggestions.popularCategories?.includes(category.id);

                            return (
                                <Pressable
                                    key={category.id}
                                    style={[
                                        styles.categoryCard,
                                        isSelected && [styles.selectedCategory, {borderColor: category.color}]
                                    ]}
                                    onPress={() => handleCategorySelect(category.id)}
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
                                    {isPopular && <View style={styles.popularDot}/>}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Package Description */}
                <View style={styles.section}>
                    <InputField
                        label="Description"
                        value={orderData.package?.description || ''}
                        onChangeText={(text) => onUpdate('package', {
                            ...orderData.package,
                            description: text
                        })}
                        styles={styles.input}
                        placeholder="What's inside? (e.g., Confidential, Legal, Birthday cake)"
                        multiline
                        numberOfLines={3}
                        error={validationErrors['package.description']}
                    />
                </View>

                {/* Package Dimensions */}
                <View style={styles.section}>
                    <Text style={styles.label}>Dimension (Optional)</Text>
                    <View style={styles.dimensionsRow}>
                        <View style={styles.dimensionInput}>
                            <TextInput
                                style={styles.dimensionField}
                                value={orderData.package?.dimensions?.length || ''}
                                onChangeText={(text) => onUpdate('package', {
                                    ...orderData.package,
                                    dimensions: {...orderData.package?.dimensions, length: text}
                                })}
                                placeholder="L"
                                keyboardType="numeric"
                            />
                            <Text style={styles.unitLabel}>cm</Text>
                        </View>
                        <Text style={styles.dimensionSeparator}>×</Text>
                        <View style={styles.dimensionInput}>
                            <TextInput
                                style={styles.dimensionField}
                                value={orderData.package?.dimensions?.width || ''}
                                onChangeText={(text) => onUpdate('package', {
                                    ...orderData.package,
                                    dimensions: {...orderData.package?.dimensions, width: text}
                                })}
                                placeholder="W"
                                keyboardType="numeric"
                            />
                            <Text style={styles.unitLabel}>cm</Text>
                        </View>
                        <Text style={styles.dimensionSeparator}>×</Text>
                        <View style={styles.dimensionInput}>
                            <TextInput
                                style={styles.dimensionField}
                                value={orderData.package?.dimensions?.height || ''}
                                onChangeText={(text) => onUpdate('package', {
                                    ...orderData.package,
                                    dimensions: {...orderData.package?.dimensions, height: text}
                                })}
                                placeholder="H"
                                keyboardType="numeric"
                            />
                            <Text style={styles.unitLabel}>cm</Text>
                        </View>
                    </View>
                </View>

                {/* Weight Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Weight (Optional)</Text>
                    <View style={styles.weightRow}>
                        <TextInput
                            style={styles.weightInput}
                            value={orderData.package?.weight?.value || ''}
                            onChangeText={(text) => onUpdate('package', {
                                ...orderData.package,
                                weight: {...orderData.package?.weight, value: text}
                            })}
                            placeholder="0.0"
                            keyboardType="numeric"
                        />
                        <Text style={styles.unitLabel}>kg</Text>
                    </View>
                </View>


                {/* Advanced Options */}
                <View style={styles.section}>

                    <Animated.View style={[styles.advancedContainer]}>
                        <InputField
                            label="Special Instructions"
                            value={orderData.package?.specialInstructions || ''}
                            onChangeText={(text) => onUpdate('package', {
                                ...orderData.package,
                                specialInstructions: text
                            })}
                            placeholder="Any special handling requirements"
                            multiline
                        />
                    </Animated.View>
                </View>


                {/* Bottom spacing */}
                <View style={styles.bottomSpacing}/>
            </ScrollView>
        </>
    );
};

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
    sectionTitle: {
        fontSize: 16,
        marginBottom: 6,
        fontFamily: 'PoppinsSemiBold',
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
    },
    selectedCard: {
        elevation: 18,
        shadowOpacity: 0.8,
        shadowRadius: 16,
        shadowColor: '#000',
    },
    typeGradient: {
        padding: 10,
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
        color: '#374151',
        fontFamily: 'PoppinsRegular',
        marginBottom: 6,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 14,
        padding: 12,
        fontFamily: 'PoppinsRegular',
        fontSize: 14,
        color: '#111827',
        // height: 150,
    },
    multilineInput: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
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
        fontSize: 18,
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
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    weightInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
    },

    // Toggle Styles
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    toggleInfo: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsSemiBold',
        color: '#374151',
    },
    toggleSubtitle: {
        fontSize: 12,
        color: '#6b7280',
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
        height: 50,
    },
});

export default OrderStep1;
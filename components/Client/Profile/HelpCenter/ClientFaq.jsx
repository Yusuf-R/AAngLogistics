import React, {useState, useMemo} from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StatusBar,
    StyleSheet,
    Dimensions,
    Modal,
    Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
    Ionicons,
    MaterialIcons,
    FontAwesome5,
    MaterialCommunityIcons,
    Feather,
} from '@expo/vector-icons';
import {clientFaqData} from '../../../../utils/Constant';
import {toast} from 'sonner-native';
import {router, useRouter} from 'expo-router';
import CustomHeader from "../../../CustomHeader";

const {width} = Dimensions.get('window');

function ClientFaq() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Getting Started');
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const [showContactModal, setShowContactModal] = useState(false);

    const categories = Object.keys(clientFaqData);
    const router = useRouter();

    const filteredQuestions = useMemo(() => {
        if (!searchQuery.trim()) {
            return clientFaqData[activeCategory]?.questions || [];
        }

        const allQuestions = [];
        Object.entries(clientFaqData).forEach(([category, data]) => {
            data.questions.forEach(q => {
                if (
                    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    q.answer.toLowerCase().includes(searchQuery.toLowerCase())
                ) {
                    allQuestions.push({...q, category});
                }
            });
        });
        return allQuestions;
    }, [searchQuery, activeCategory]);

    const toggleQuestion = (index) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const renderIcon = (iconName, iconFamily, size = 24, color = '#000') => {
        const iconProps = {name: iconName, size, color};

        switch (iconFamily) {
            case 'Ionicons':
                return <Ionicons {...iconProps} />;
            case 'MaterialIcons':
                return <MaterialIcons {...iconProps} />;
            case 'FontAwesome5':
                return <FontAwesome5 {...iconProps} />;
            case 'MaterialCommunityIcons':
                return <MaterialCommunityIcons {...iconProps} />;
            default:
                return <Ionicons {...iconProps} />;
        }
    };

    const currentCategoryData = clientFaqData[activeCategory];

    const handleContactSupport = () => {
        setShowContactModal(true);
    };

    const handleCloseModal = () => {
        setShowContactModal(false);
    };

    const handleChatSupport = () => {
        handleCloseModal();
        router.push('/client/profile/help-center/chat');
    };

    const handleCreateTicket = () => {
        handleCloseModal();
        router.push('/client/profile/help-center/ticket/create');
    };

    const renderHelpButtons = () => (
        <View style={styles.helpButtonsContainer}>
            <TouchableOpacity
                style={styles.helpButtonPrimary}
                onPress={handleContactSupport}
            >
                <Ionicons name="chatbubbles" size={18} color="#1F2937"/>
                <Text style={styles.helpButtonPrimaryText}>Contact Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpButtonSecondary}>
                <Ionicons name="call" size={18} color="#fff"/>
                <Text style={styles.helpButtonSecondaryText}>Call Hotline</Text>
            </TouchableOpacity>
        </View>
    );

    // Add the modal component
    const renderContactModal = () => (
        <Modal
            visible={showContactModal}
            transparent
            animationType="fade"
            onRequestClose={handleCloseModal}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={handleCloseModal}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconCircle}>
                                <Ionicons name="headset" size={24} color="#3B82F6"/>
                            </View>
                            <Text style={styles.modalTitle}>How can we help you?</Text>
                            <Text style={styles.modalSubtitle}>
                                Choose your preferred support method
                            </Text>
                        </View>

                        {/* Support Options */}
                        <View style={styles.supportOptions}>
                            {/* Live Chat Option */}
                            <TouchableOpacity
                                style={styles.supportOption}
                                onPress={handleChatSupport}
                            >
                                <View style={[styles.optionIcon, {backgroundColor: '#EFF6FF'}]}>
                                    <Ionicons name="chatbubble-ellipses" size={24} color="#3B82F6"/>
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>Live Chat Support</Text>
                                    <Text style={styles.optionDescription}>
                                        Get instant help from our support team in real-time
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF"/>
                            </TouchableOpacity>

                            {/* Support Ticket Option */}
                            <TouchableOpacity
                                style={styles.supportOption}
                                onPress={handleCreateTicket}
                            >
                                <View style={[styles.optionIcon, {backgroundColor: '#F0F9FF'}]}>
                                    <Ionicons name="ticket" size={24} color="#0EA5E9"/>
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>Create Support Ticket</Text>
                                    <Text style={styles.optionDescription}>
                                        Submit a detailed request for complex issues
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF"/>
                            </TouchableOpacity>
                        </View>

                        {/* Modal Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCloseModal}
                            >
                                <Ionicons
                                    name="close"
                                    style={styles.cancelButtonIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const onBackPress = () => {
        router.replace('/client/profile/help-center');
    };

    return (
        <>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.headerIconBox}>
                        <Pressable onPress={onBackPress}>
                            <MaterialCommunityIcons name="arrow-left-bold-circle" size={28} color="#fff"/>
                        </Pressable>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
                        <Text style={styles.headerSubtitle}>Everything you need to know</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon}/>
                    <TextInput
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Category Horizontal Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScrollContainer}
                    contentContainerStyle={styles.categoryContent}
                >
                    {categories.map((category) => {
                        const categoryData = clientFaqData[category];
                        const isActive = activeCategory === category;

                        return (
                            <TouchableOpacity
                                key={category}
                                onPress={() => {
                                    setActiveCategory(category);
                                    setSearchQuery('');
                                }}
                                style={[
                                    styles.categoryCard,
                                    isActive && {
                                        backgroundColor: categoryData.color,
                                        borderColor: categoryData.color
                                    }
                                ]}
                            >
                                <View style={styles.categoryIconContainer}>
                                    {renderIcon(
                                        categoryData.icon,
                                        categoryData.iconFamily,
                                        20,
                                        isActive ? '#fff' : categoryData.color
                                    )}
                                </View>
                                <Text style={[
                                    styles.categoryText,
                                    isActive && styles.activeCategoryText
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Category Header Banner */}
                {!searchQuery && currentCategoryData && (
                    <View style={[styles.categoryBanner, {backgroundColor: currentCategoryData.color}]}>
                        <View style={styles.bannerIconBox}>
                            {renderIcon(currentCategoryData.icon, currentCategoryData.iconFamily, 32, '#fff')}
                        </View>
                        <View style={styles.bannerTextContainer}>
                            <Text style={styles.bannerTitle}>{activeCategory}</Text>
                            <Text style={styles.bannerSubtitle}>
                                {currentCategoryData.questions.length} questions answered
                            </Text>
                        </View>
                    </View>
                )}

                {/* Search Results Info */}
                {searchQuery && (
                    <View style={styles.searchResultsInfo}>
                        <Ionicons name="search-circle" size={20} color="#3B82F6"/>
                        <Text style={styles.searchResultsText}>
                            Found <Text style={styles.searchResultsBold}>{filteredQuestions.length}</Text> result
                            {filteredQuestions.length !== 1 ? 's' : ''} for "{searchQuery}"
                        </Text>
                    </View>
                )}

                {/* FAQ Questions */}
                <View style={styles.questionsContainer}>
                    {filteredQuestions.length > 0 ? (
                        filteredQuestions.map((q, index) => {
                            const isExpanded = expandedQuestions[index];

                            return (
                                <View key={index} style={styles.questionCard}>
                                    <TouchableOpacity
                                        onPress={() => toggleQuestion(index)}
                                        style={styles.questionHeader}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.questionHeaderContent}>
                                            <View style={[
                                                styles.questionIconCircle,
                                                {backgroundColor: isExpanded ? currentCategoryData?.color + '20' : '#F3F4F6'}
                                            ]}>
                                                <Ionicons
                                                    name={isExpanded ? "chevron-down" : "chevron-forward"}
                                                    size={20}
                                                    color={isExpanded ? currentCategoryData?.color : '#6B7280'}
                                                />
                                            </View>
                                            <View style={styles.questionTextContainer}>
                                                <Text style={styles.questionText}>{q.question}</Text>
                                                {searchQuery && q.category && (
                                                    <View style={styles.categoryBadge}>
                                                        <Text style={styles.categoryBadgeText}>{q.category}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.answerContainer}>
                                            <View
                                                style={[styles.answerDivider, {backgroundColor: currentCategoryData?.color}]}/>
                                            <Text style={styles.answerText}>{q.answer}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.noResultsContainer}>
                            <View style={styles.noResultsIconBox}>
                                <Ionicons name="search-outline" size={48} color="#9CA3AF"/>
                            </View>
                            <Text style={styles.noResultsTitle}>No results found</Text>
                            <Text style={styles.noResultsSubtitle}>
                                Try different keywords or browse categories above
                            </Text>
                        </View>
                    )}
                </View>

                {/* Still Need Help Section */}
                <View style={styles.helpFooter}>
                    <MaterialIcons name="support-agent" size={32} color="#fff" style={styles.helpIcon}/>
                    <Text style={styles.helpTitle}>Still need help?</Text>
                    <Text style={styles.helpSubtitle}>
                        Our support team is ready to assist you 24/7
                    </Text>
                    {renderHelpButtons()}
                </View>
                {renderContactModal()}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsSemiBold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 24,
    },
    categoryScrollContainer: {
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryContent: {
        paddingHorizontal: 16,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginRight: 10,
    },
    categoryIconContainer: {
        marginRight: 8,
    },
    categoryText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600',
        color: '#374151',
    },
    activeCategoryText: {
        color: '#fff',
    },
    categoryBanner: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bannerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    bannerTextContainer: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 22,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
    },
    bannerSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    searchResultsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    searchResultsText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#1E40AF',
        marginLeft: 8,
        flex: 1,
    },
    searchResultsBold: {
        fontFamily: 'PoppinsSemiBold',
    },
    questionsContainer: {
        paddingHorizontal: 16,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    questionHeader: {
        padding: 16,
    },
    questionHeaderContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    questionIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    questionTextContainer: {
        flex: 1,
    },
    questionText: {
        fontSize: 16,
        fontFamily: 'PoppinsLight',
        fontWeight: '600',
        color: '#111827',
        lineHeight: 22,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 18,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        fontWeight: '500',
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        marginTop: -20
    },
    answerDivider: {
        height: 2,
        width: 40,
        borderRadius: 1,
        marginBottom: 12,
        marginLeft: 48,
    },
    answerText: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        lineHeight: 24,
        color: '#4B5563',
        marginLeft: 48,
        fontWeight: '500',
        textAlign: 'justify',
    },
    noResultsContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    noResultsIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    noResultsTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    noResultsSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
    },
    helpFooter: {
        marginHorizontal: 16,
        marginTop: 24,
        padding: 24,
        backgroundColor: '#1F2937',
        borderRadius: 16,
        alignItems: 'center',
    },
    helpIcon: {
        marginBottom: 12,
    },
    helpTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsSemiBold',
        color: '#fff',
        marginBottom: 8,
    },
    helpSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#D1D5DB',
        textAlign: 'center',
        marginBottom: 20,
    },
    helpButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    helpButtonPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    helpButtonPrimaryText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600',
        color: '#1F2937',
    },
    helpButtonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    helpButtonSecondaryText: {
        fontSize: 14,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsMedium',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    supportOptions: {
        padding: 20,
    },
    supportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontFamily: 'PoppinsMedium',
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#6B7280',
        lineHeight: 18,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'green',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonIcon: {
        fontSize: 30,
        color: '#FFF',
    },
});

export default ClientFaq;
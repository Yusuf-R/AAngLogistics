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
} from 'react-native';
import {
    Ionicons,
    MaterialIcons,
    FontAwesome5,
    AntDesign,
} from '@expo/vector-icons';
import {faqData} from "../../../../../utils/Constant";

const {width} = Dimensions.get('window');

function HelpCenter() {
    const [activeTab, setActiveTab] = useState('FAQ');
    const [activeCategory, setActiveCategory] = useState('General');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState({});

    const contactOptions = [
        {icon: 'headset', iconType: 'MaterialIcons', label: "Customer Service", color: "#3B82F6"},
        {icon: 'logo-whatsapp', iconType: 'Ionicons', label: "WhatsApp", color: "#25D366"},
        {icon: 'language', iconType: 'MaterialIcons', label: "Website", color: "#6B7280"},
        // { icon: 'twitter', iconType: 'AntDesign', label: "Twitter", color: "#1DA1F2" },
        // { icon: 'instagram', iconType: 'AntDesign', label: "Instagram", color: "#E4405F" }
    ];

    const categories = Object.keys(faqData);

    const filteredFAQs = useMemo(() => {
        if (!searchQuery) return faqData[activeCategory];

        const allFAQs = Object.values(faqData).flat();
        return allFAQs.filter(
            faq =>
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, activeCategory]);

    const toggleExpanded = (index) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const renderIcon = (iconName, iconType, size = 24, color = '#000') => {
        const iconProps = {name: iconName, size, color};

        switch (iconType) {
            case 'Ionicons':
                return <Ionicons {...iconProps} />;
            case 'MaterialIcons':
                return <MaterialIcons {...iconProps} />;
            case 'FontAwesome5':
                return <FontAwesome5 {...iconProps} />;
            case 'AntDesign':
                return <AntDesign {...iconProps} />;
            default:
                return <Ionicons {...iconProps} />;
        }
    };

    return (
        <>
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                {['FAQ', 'Contact us'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[
                            styles.tab,
                            activeTab === tab && styles.activeTab
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab && styles.activeTabText
                        ]}>
                            {tab}
                        </Text>
                        {activeTab === tab && <View style={styles.tabIndicator}/>}
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'FAQ' ? (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Category Pills */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryContainer}
                        contentContainerStyle={styles.categoryContent}
                    >
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                onPress={() => setActiveCategory(category)}
                                style={[
                                    styles.categoryPill,
                                    activeCategory === category && styles.activeCategoryPill
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    activeCategory === category && styles.activeCategoryText
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon}/>
                            <TextInput
                                placeholder="Search for help..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* FAQ Items */}
                    <View style={styles.faqContainer}>
                        {filteredFAQs.map((faq, index) => (
                            <View key={index} style={styles.faqItem}>
                                <TouchableOpacity
                                    onPress={() => toggleExpanded(index)}
                                    style={styles.faqQuestion}
                                >
                                    <Text style={styles.questionText}>{faq.question}</Text>
                                    <Ionicons
                                        name={expandedItems[index] ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                                {expandedItems[index] && (
                                    <View style={styles.faqAnswer}>
                                        <Text style={styles.answerText}>{faq.answer}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    {filteredFAQs.length === 0 && searchQuery && (
                        <View style={styles.noResults}>
                            <Text style={styles.noResultsText}>
                                No results found for "{searchQuery}"
                            </Text>
                            <Text style={styles.noResultsSubtext}>
                                Try different keywords or browse our categories above
                            </Text>
                        </View>
                    )}
                </ScrollView>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.contactContainer}>
                        {contactOptions.map((option, index) => (
                            <TouchableOpacity key={index} style={styles.contactOption}>
                                <View style={styles.contactIconContainer}>
                                    {renderIcon(option.icon, option.iconType, 24, option.color)}
                                </View>
                                <Text style={styles.contactLabel}>{option.label}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF"/>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    tabContainer: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        position: 'relative',
    },
    activeTab: {
        // Active tab styling handled by indicator
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#111827',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 2,
        width: '80%',
        backgroundColor: '#111827',
    },
    content: {
        flex: 1,
        backgroundColor: '#fff',
    },
    categoryContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    categoryContent: {
        paddingRight: 16,
    },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    activeCategoryPill: {
        backgroundColor: '#111827',
    },
    categoryText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'PoppinsMedium',
    },
    activeCategoryText: {
        color: '#fff',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    searchBar: {
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
    faqContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    faqItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
        overflow: 'hidden',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginRight: 12,
    },
    faqAnswer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    answerText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6B7280',
    },
    noResults: {
        padding: 32,
        alignItems: 'center',
    },
    noResultsText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    noResultsSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    contactContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    contactOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    contactIconContainer: {
        marginRight: 16,
    },
    contactLabel: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'PoppinsRegular',
        color: '#111827',
    },
});

export default HelpCenter;
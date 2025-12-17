// screens/support/SupportHomeScreen.jsx
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar,
    Platform, Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
    MessageCircle,
    Mail,
    BookOpen,
    Clock,
    Shield,
    Zap,
    FileText,
    ChevronRight,
    Headphones,
    AlertCircle, ShieldCheck, DollarSign
} from 'lucide-react-native';
import CustomHeader from '../../../CustomHeader';
import {router, useRouter} from 'expo-router';
import {MaterialCommunityIcons} from "@expo/vector-icons";

function HomeScreen({navigation}) {
    const router = useRouter()
    const onBackPress = () => {
        router.back();
    };
    return (
        <>
            <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconBox}>
                    <Pressable onPress={onBackPress}>
                        <MaterialCommunityIcons name="arrow-left-bold-circle" size={28} color="#fff"/>
                    </Pressable>
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Support Center</Text>
                    <Text style={styles.headerSubtitle}>Get instant help from our support team</Text>
                </View>
            </View>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>

                            <View style={styles.statusContainer}>
                                <View style={styles.statusBadge}>
                                    <View style={styles.statusIndicator}>
                                        <View style={[styles.statusDot, styles.statusOnline]} />
                                        <Text style={styles.statusLabel}>Live Support</Text>
                                    </View>
                                    <View style={styles.statusDivider} />
                                    <Text style={styles.statusDetail}>
                                        Avg. response: 2-5 min
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action Cards */}
                    <View style={styles.cardsContainer}>
                        {/* Help Resources Card */}
                        <TouchableOpacity
                            style={[styles.card, styles.resourcesCard]}
                            onPress={() => router.push('/driver/account/support/faq')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.cardIcon, styles.resourcesIcon]}>
                                    <BookOpen color="#FFFFFF" size={28} strokeWidth={2}/>
                                </View>

                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>Help Resources</Text>
                                    <Text style={styles.cardDescription}>
                                        Browse FAQs, guides, and tutorials
                                    </Text>

                                    <View style={styles.cardFeatures}>
                                        <View style={styles.feature}>
                                            <FileText color="#10B981" size={16} strokeWidth={2}/>
                                            <Text style={styles.featureText}>Self-service</Text>
                                        </View>
                                    </View>
                                </View>

                                <ChevronRight color="#94A3B8" size={24} strokeWidth={2}/>
                            </View>
                        </TouchableOpacity>

                        {/* Live Chat Card */}
                        <TouchableOpacity
                            style={[styles.card, styles.chatCard]}
                            onPress={() => router.push('/driver/account/support/chat')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.cardIcon, styles.chatIcon]}>
                                    <MessageCircle color="#FFFFFF" size={28} strokeWidth={2}/>
                                </View>

                                <View style={styles.cardTextContainer}>
                                    <View style={styles.cardTitleRow}>
                                        <Text style={styles.cardTitle}>Live Chat Support</Text>
                                        <Zap color="#FCD34D" size={20} strokeWidth={2}/>
                                    </View>
                                    <Text style={styles.cardDescription}>
                                        Get instant help from our support team
                                    </Text>

                                    <View style={styles.cardFeatures}>
                                        <View style={styles.feature}>
                                            <Clock color="#10B981" size={16} strokeWidth={2}/>
                                            <Text style={styles.featureText}>Real-time</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Shield color="#3B82F6" size={16} strokeWidth={2}/>
                                            <Text style={styles.featureText}>Secure</Text>
                                        </View>
                                    </View>
                                </View>

                                <ChevronRight color="#94A3B8" size={24} strokeWidth={2}/>
                            </View>
                        </TouchableOpacity>

                        {/* Send Message Card */}
                        <TouchableOpacity
                            style={[styles.card, styles.messageCard]}
                            onPress={() => router.push('/driver/account/support/ticket')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.cardIcon, styles.messageIcon]}>
                                    <Mail color="#FFFFFF" size={28} strokeWidth={2}/>
                                </View>

                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>Send Us a Message</Text>
                                    <Text style={styles.cardDescription}>
                                        Describe your issue in detail with attachments
                                    </Text>

                                    <View style={styles.cardFeatures}>
                                        <View style={styles.feature}>
                                            <Clock color="#A855F7" size={16} strokeWidth={2}/>
                                            <Text style={styles.featureText}>2-4 hours</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <FileText color="#64748B" size={16} strokeWidth={2}/>
                                            <Text style={styles.featureText}>Detailed</Text>
                                        </View>
                                    </View>
                                </View>

                                <ChevronRight color="#94A3B8" size={24} strokeWidth={2}/>
                            </View>
                        </TouchableOpacity>

                        {/* Terms and Conditions */}
                        <TouchableOpacity
                            style={[styles.card, styles.tcsCard]}
                            onPress={() => router.push('/driver/tcs')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.cardIcon, styles.tcsIcon]}>
                                    <FileText color="#FFFFFF" size={28} strokeWidth={2} />
                                </View>

                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>Review Terms & Conditions</Text>
                                    <Text style={styles.cardDescription}>
                                        Important updates to our service agreement and driver policies
                                    </Text>

                                    <View style={styles.cardFeatures}>
                                        <View style={styles.feature}>
                                            <Clock color="#3B82F6" size={16} strokeWidth={2} />
                                            <Text style={styles.featureText}>5-7 minutes</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Shield color="#10B981" size={16} strokeWidth={2} />
                                            <Text style={styles.featureText}>Legal Protection</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <AlertCircle color="#F59E0B" size={16} strokeWidth={2} />
                                            <Text style={styles.featureText}>Required</Text>
                                        </View>
                                    </View>
                                </View>

                                <ChevronRight color="#94A3B8" size={24} strokeWidth={2} />
                            </View>
                        </TouchableOpacity>


                    </View>

                    {/* Info Banner */}
                    {/*<View style={styles.infoBanner}>*/}
                    {/*    <Text style={styles.infoBannerTitle}>💡 Quick Tip</Text>*/}
                    {/*    <Text style={styles.infoBannerText}>*/}
                    {/*        Chat history is preserved for 3 days to help us serve you better.*/}
                    {/*        After that, conversations are automatically cleared.*/}
                    {/*    </Text>*/}
                    {/*</View>*/}
                </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 10,
        paddingBottom: 40,
    },
    header: {
        backgroundColor: 'white',
        padding: 6,
        marginVertical: 6,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 20
    },
    headerContent: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    statusContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9ff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e8edff',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusOnline: {
        backgroundColor: '#10b981',
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    statusDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#e2e8f0',
        marginRight: 12,
    },
    statusDetail: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    supportHours: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '400',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#3B82F6',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    title: {
        fontSize: 28,
        fontFamily: 'PoppinsSemiBold',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 16,
        fontFamily: 'PoppinsRegular',
    },
    statusText: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: '#047857',
    },
    cardsContainer: {
        gap: 30,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    chatCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    messageCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#A855F7',
    },
    resourcesCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    chatIcon: {
        backgroundColor: '#3B82F6',
    },
    messageIcon: {
        backgroundColor: '#A855F7',
    },
    resourcesIcon: {
        backgroundColor: '#10B981',
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsMedium',
        color: '#0F172A',
        marginRight: 8,
    },
    cardDescription: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 20,
    },
    cardFeatures: {
        flexDirection: 'row',
        gap: 16,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    featureText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    infoBanner: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    infoBannerTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsMedium',
        fontWeight: 'bold',
        color: '#92400E',
        marginBottom: 8,
    },
    infoBannerText: {
        fontSize: 14,
        fontFamily: 'PoppinsRegular',
        color: '#78350F',
        lineHeight: 20,
    },
    tcsCard: {
        backgroundColor: '#FFFFFF',
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    tcsIcon: {
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },

    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
    },
    headerIconBox: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
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
    headerTextContainer: {
        flex: 1,
    },
});

export default HomeScreen;
import React, {useState} from "react";
import {SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import CustomHeader from "../CustomHeader";
import { router } from "expo-router";

function ManageOrder ({userData}) {
    const [activeTab, setActiveTab] = useState('Draft');
    return (
        <>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                {/* Header */}
                <CustomHeader
                    title="Manage Order"
                    onBackPress={() => router.back()}
                />
                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    {['Draft', 'Ongoing'].map((tab) => (
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
                            {activeTab === tab && <View style={styles.tabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'Draft' ? (
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            <Text>
                                All drafts order rendered
                            </Text>

                    </ScrollView>
                ) : (
                    /* Contact Us Tab */
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                      <Text>
                          All Ongoing order rendered
                      </Text>
                    </ScrollView>
                )}
            </SafeAreaView>

        </>
    )

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
        fontWeight: '500',
        color: '#6B7280',
    },
    activeCategoryText: {
        color: '#fff',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    contactIconContainer: {
        marginRight: 16,
    },
    contactLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
    },
});

export default ManageOrder;
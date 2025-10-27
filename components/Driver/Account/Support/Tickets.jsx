import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Plus,
    FileText,
    MessageSquare,
    Eye,
    Trash2,
    AlertCircle,
    CheckCircle,
    Clock,
    User,
    Calendar,
    Tag
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmModal from '../../../ConfirmModal'; // Adjust path as needed
import DriverUtils from '../../../../utils/DriverUtilities'; // Adjust path as needed
import StatusModal from '../../../StatusModal/StatusModal';
import { toast } from 'sonner-native';
import { queryClient } from "../../../../lib/queryClient.js"

const STATUS_CONFIG = {
    open: {
        label: 'Open',
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        icon: Clock
    },
    in_progress: {
        label: 'In Progress',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: MessageSquare
    },
    waiting_response: {
        label: 'Waiting Response',
        color: '#8B5CF6',
        bgColor: '#F3E8FF',
        icon: AlertCircle
    },
    resolved: {
        label: 'Resolved',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: CheckCircle
    },
    closed: {
        label: 'Closed',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: CheckCircle
    }
};

function Tickets({
                     tickets,
                     stats,
                     selectedFilter,
                     onFilterChange,
                     isRefetching,
                     onRefresh
                 }) {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [deleteStatus, setDeleteStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [deleteMessage, setDeleteMessage] = useState('');

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatDetailedDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setViewModalVisible(true);
    };

    const handleDeleteTicket = (ticket) => {
        setTicketToDelete(ticket);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!ticketToDelete) return;

        // Close delete confirmation modal and show loading status
        setDeleteModalVisible(false);
        setStatusModalVisible(true);
        setDeleteStatus('loading');
        setDeleteMessage('Deleting ticket...');

        try {
            await DriverUtils.deleteSupportTicket(ticketToDelete._id);

            // Show success status
            setDeleteStatus('success');
            setDeleteMessage('Ticket deleted successfully!');

            // Invalidate all relevant queries after a short delay to show success animation
            setTimeout(async () => {
                await queryClient.invalidateQueries({ queryKey: ['Tickets'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'open'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'all'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'closed'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'in_progress'] });
                await queryClient.invalidateQueries({ queryKey: ['FilteredTickets', 'resolved'] });

                // Close status modal after invalidation
                setStatusModalVisible(false);
                setTicketToDelete(null);
            }, 1500);

        } catch (error) {
            console.error('Failed to delete ticket:', error);
            setDeleteStatus('error');
            setDeleteMessage('Failed to delete ticket. Please try again.');
        }
    };

    const handleRetryDelete = () => {
        setDeleteStatus('loading');
        setDeleteMessage('Deleting ticket...');
        confirmDelete();
    };

    const handleCloseStatusModal = () => {
        setStatusModalVisible(false);
        setTicketToDelete(null);
    };

    const handleStatusModalFinish = () => {
        setStatusModalVisible(false);
        setTicketToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteModalVisible(false);
        setTicketToDelete(null);
    };

    const renderTicketCard = (ticket) => {
        const statusConfig = STATUS_CONFIG[ticket.status];
        const StatusIcon = statusConfig.icon;
        const hasUnreadResponses = ticket.responses?.length > 0 &&
            ticket.responses[ticket.responses.length - 1].responderRole === 'Admin';

        return (
            <View key={ticket._id} style={styles.ticketCard}>
                {/* Header */}
                <View style={styles.ticketHeader}>
                    <View style={styles.ticketRefContainer}>
                        <FileText color="#64748B" size={16} />
                        <Text style={styles.ticketRef}>{ticket.ticketRef}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <StatusIcon color={statusConfig.color} size={14} strokeWidth={2} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Subject */}
                <Text style={styles.ticketSubject} numberOfLines={2}>
                    {ticket.subject}
                </Text>

                {/* Category & Date */}
                <View style={styles.ticketMeta}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {ticket.category.replace('_', ' ')}
                        </Text>
                    </View>
                    <Text style={styles.ticketDate}>{formatDate(ticket.createdAt)}</Text>
                </View>

                {/* Response count & Actions */}
                <View style={styles.ticketFooter}>
                    <View style={styles.responseCount}>
                        <MessageSquare color="#64748B" size={14} />
                        <Text style={styles.responseCountText}>
                            {ticket.responses?.length || 0} response{ticket.responses?.length !== 1 ? 's' : ''}
                        </Text>
                        {hasUnreadResponses && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>New</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleViewTicket(ticket)}
                        >
                            <Eye color="#3B82F6" size={18} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeleteTicket(ticket)}
                        >
                            <Trash2 color="#EF4444" size={18} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderTicketDetails = () => {
        if (!selectedTicket) return null;

        const statusConfig = STATUS_CONFIG[selectedTicket.status];
        const StatusIcon = statusConfig.icon;

        return (
            <View style={styles.detailsContainer}>
                {/* Header */}
                <View style={styles.detailsHeader}>
                    <Text style={styles.detailsTitle}>Ticket Details</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setViewModalVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailsContent}>
                    {/* Ticket Reference & Status */}
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Ticket Ref</Text>
                            <Text style={styles.detailValue}>{selectedTicket.ticketRef}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                <StatusIcon color={statusConfig.color} size={14} />
                                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                    {statusConfig.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Subject */}
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Subject</Text>
                        <Text style={styles.detailValue}>{selectedTicket.subject}</Text>
                    </View>

                    {/* Description */}
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Description</Text>
                        <Text style={styles.detailDescription}>{selectedTicket.description}</Text>
                    </View>

                    {/* Category & Priority */}
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Category</Text>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>
                                    {selectedTicket.category.replace('_', ' ')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Priority</Text>
                            <Text style={styles.detailValue}>
                                {selectedTicket.priority?.charAt(0).toUpperCase() + selectedTicket.priority?.slice(1)}
                            </Text>
                        </View>
                    </View>

                    {/* Created Date */}
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Created</Text>
                        <Text style={styles.detailValue}>{formatDetailedDate(selectedTicket.createdAt)}</Text>
                    </View>

                    {/* Responses Section */}
                    {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                        <View style={styles.responsesSection}>
                            <Text style={styles.responsesTitle}>Responses ({selectedTicket.responses.length})</Text>
                            {selectedTicket.responses.map((response, index) => (
                                <View key={index} style={styles.responseItem}>
                                    <View style={styles.responseHeader}>
                                        <Text style={styles.responderName}>
                                            {response.responderName || response.responderRole}
                                        </Text>
                                        <Text style={styles.responseDate}>
                                            {formatDetailedDate(response.createdAt)}
                                        </Text>
                                    </View>
                                    <Text style={styles.responseMessage}>{response.message}</Text>
                                    {response.attachments && response.attachments.length > 0 && (
                                        <Text style={styles.attachmentsText}>
                                            📎 {response.attachments.length} attachment(s)
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    return (
        <>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <ArrowLeft color="#0F172A" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Support Tickets</Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => router.push('/driver/account/support/ticket/create')}
                    >
                        <Plus color="#3B82F6" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.open}</Text>
                        <Text style={styles.statLabel}>Open</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.inProgress}</Text>
                        <Text style={styles.statLabel}>In Progress</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.resolved}</Text>
                        <Text style={styles.statLabel}>Resolved</Text>
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filterContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
                    >
                        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterChip,
                                    selectedFilter === filter && styles.filterChipActive
                                ]}
                                onPress={() => onFilterChange(filter)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        selectedFilter === filter && styles.filterChipTextActive
                                    ]}
                                >
                                    {filter === 'all' ? 'All' : STATUS_CONFIG[filter]?.label || filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tickets List */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={onRefresh}
                            tintColor="#3B82F6"
                        />
                    }
                >
                    {tickets.length > 0 ? (
                        tickets.map(renderTicketCard)
                    ) : (
                        <View style={styles.emptyState}>
                            <FileText color="#CBD5E1" size={64} strokeWidth={1.5} />
                            <Text style={styles.emptyTitle}>No Tickets</Text>
                            <Text style={styles.emptyMessage}>
                                {selectedFilter === 'all'
                                    ? "You haven't created any support tickets yet"
                                    : `No ${STATUS_CONFIG[selectedFilter]?.label.toLowerCase()} tickets`}
                            </Text>
                            {selectedFilter === 'all' && (
                                <TouchableOpacity
                                    style={styles.createFirstButton}
                                    onPress={() => router.push('/driver/account/support/ticket/create')}
                                >
                                    <Plus color="#FFFFFF" size={20} />
                                    <Text style={styles.createFirstButtonText}>Create First Ticket</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* View Ticket Modal */}
            <Modal
                visible={viewModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setViewModalVisible(false)}
            >
                {renderTicketDetails()}
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                visible={deleteModalVisible}
                title={`Delete Ticket?`}
                message={`Are you sure you want to delete ticket ${ticketToDelete?.ticketRef}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            {/* Delete Status Modal */}
            <StatusModal
                visible={statusModalVisible}
                status={deleteStatus}
                message={deleteMessage}
                onFinish={handleStatusModalFinish}
                onRetry={deleteStatus === 'error' ? handleRetryDelete : undefined}
                onClose={deleteStatus === 'error' ? handleCloseStatusModal : undefined}
                showRetryOnError={true}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'PoppinsBold',
        color: '#0F172A',
    },
    createButton: {
        padding: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    statValue: {
        fontSize: 24,
        color: '#0F172A',
        fontFamily: 'PoppinsBold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'PoppinsRegular',
    },
    filterContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 12,
    },
    filterContent: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterChipText: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'PoppinsLight',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    ticketCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ticketRefContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ticketRef: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'PoppinsBold',
        color: '#64748B',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PoppinsLight',
        fontWeight: '600',
    },
    ticketSubject: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 12,
        lineHeight: 22,
        fontFamily: 'PoppinsBold',
    },
    ticketMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 12,
        color: '#475569',
        textTransform: 'capitalize',
        fontFamily: 'PoppinsLight',
    },
    ticketDate: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: 'PoppinsLight',
    },
    ticketFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    responseCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    responseCountText: {
        fontSize: 13,
        color: '#64748B',
        fontFamily: 'PoppinsRegular',
    },
    unreadBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    unreadText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'PoppinsRegular',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#0F172A',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'PoppinsLight',
    },
    createFirstButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createFirstButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'PoppinsSemiBold',
    },
    // Modal Styles
    detailsContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    detailsTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#0F172A',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#64748B',
    },
    detailsContent: {
        flex: 1,
        padding: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailItem: {
        flex: 1,
    },
    detailSection: {
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 4,
        fontFamily: 'PoppinsRegular',
    },
    detailValue: {
        fontSize: 16,
        color: '#0F172A',
        fontFamily: 'PoppinsSemiBold',
    },
    detailDescription: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 22,
        fontFamily: 'PoppinsRegular',
    },
    responsesSection: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    responsesTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#0F172A',
        marginBottom: 16,
    },
    responseItem: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    responseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    responderName: {
        fontSize: 14,
        fontFamily: 'PoppinsSemiBold',
        color: '#0F172A',
    },
    responseDate: {
        fontSize: 12,
        color: '#64748B',
        fontFamily: 'PoppinsLight',
    },
    responseMessage: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        fontFamily: 'PoppinsRegular',
    },
    attachmentsText: {
        fontSize: 12,
        color: '#3B82F6',
        marginTop: 8,
        fontFamily: 'PoppinsRegular',
    },
});

export default Tickets;
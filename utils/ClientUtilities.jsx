// 'use server';
import {axiosPrivate, axiosPublic} from "./AxiosInstance";

// const idSecret = process.env.ID_SECRET;
// const dataSecret = process.env.DATA_SECRET;

class ClientUtils {
    static async TestConn() {
        try {
            const response = await axiosPublic({
                method: "GET",
                url: '/auth/test',
            });
            return response.data;
        } catch (error) {
            console.log(error);
            throw new Error('Access Denied');
        }
    }

    static async SignUp(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/auth/signup',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw response;
            }
        } catch (error) {
            // ✅ Pass through actual Axios error
            if (error.response) throw error;
            else throw new Error('Unexpected signup error');
        }
    }

    static async Login(obj) {
        try {
            const response = await axiosPublic.post('/auth/login', obj);
            return response.data;
        } catch (error) {
            // 🔁 Pass the actual Axios error forward so onError can read `error.response.status`
            if (error.response) {
                throw error;
            } else {
                throw new Error("Network error");
            }
        }
    }

    static async GoogleSocialSignUp(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/auth/oauth',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GoogleSocialLogin(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/auth/oauth',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GoogleSocialAuth(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/auth/firebase-oauth',
                data: obj,
            });

            if (response.status === 200 || response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.data?.error || 'Authentication failed');
            }
        } catch (error) {
            console.log('Google Social Auth Error:', error.response?.data || error.message);

            // Re-throw with better error message
            if (error.response?.data) {
                const backendError = new Error(error.response.data.message || error.response.data.error);
                backendError.response = error.response;
                backendError.status = error.response.status;
                throw backendError;
            }

        }
    }

    static async GetToken(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/get-token',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async VerifyEmail(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/verify-email',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }

    }

    static async VerifyPhone(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/verify-phone',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async UpdatePassword(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/update-password',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async RequestPasswordReset(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/auth/request-password-reset',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async ResetPassword(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/auth/reset-password',
                data: obj,
            });

            if (response.status === 201) {
                return response.data;
            }

            // Optional: handle non-201 success responses
            throw new Error(response.data?.error || 'Unexpected response');
        } catch (error) {
            console.log('ResetPassword API Error:', error?.response?.data);

            const backendMessage =
                error?.response?.data?.error || // from backend JSON: { error: '...' }
                error?.message ||               // fallback to Axios generic error
                'Unknown error occurred';
            console.log({backendMessage});

            throw new Error(backendMessage); // This is now a clean readable message
        }
    }

    // PIN API
    static async SetPin(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/set-pin',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }

    }

    // request for token to update/reset your pin
    static async GetPinToken(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/pin-token',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    static async UpdatePin(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: '/auth/update-pin',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error('Unexpected response status');
            }
        } catch (error) {
            console.log('UpdatePin Error:', error);
            throw new Error(error);
        }
    }

    static async ResetPin(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/reset-pin',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async AcceptTCs(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/tcs',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async Dashboard() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/auth/dashboard',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }


    static async getDashboardData() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/auth/dashboard',
            });

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.data?.error || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.log('Dashboard data error:', error);
            throw error;
        }
    }

    static async getFinancialData() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/financial-data',
            });

            if (response.status === 200) {
                return response.data.financialData;
            } else {
                throw new Error(response.data?.error || 'Failed to fetch financial data');
            }
        } catch (error) {
            console.log('Financial data error:', error);
            // Return default data on error
            return {
                totalOrders: 0,
                completedOrders: 0,
                totalPaid: 0,
                walletBalance: 0,
                pendingOrders: 0,
            };
        }
    }

    static async getTransactionHistory(limit = 10, page = 1) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/user/transactions?limit=${limit}&page=${page}`,
            });

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.data?.error || 'Failed to fetch transactions');
            }
        } catch (error) {
            console.log('Transaction history error:', error);
            // Return empty data on error
            return {
                transactions: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalTransactions: 0,
                    hasMore: false,
                }
            };
        }
    }

    static async topUpWallet(amount, paymentMethod = 'paystack') {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/user/wallet/topup',
                data: { amount, paymentMethod },
            });

            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.data?.error || 'Failed to initiate top up');
            }
        } catch (error) {
            console.log('Wallet top up error:', error);
            throw error;
        }
    }

    static async UpdateProfile(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: '/user/update-profile',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // Locations
    static async GetSavedLocations() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/user/location/saved',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async CreateLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/user/location/create',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async UpdateLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: '/user/location/update',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async DeleteLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: "DELETE",
                url: '/user/location/delete',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }


    // Cloudinary
    // get signed URL for image upload
    static async GetSignedUrl() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/auth/get-signed-url',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async UpdateAvatar(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: '/user/update-avatar',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }

    }

    /** Notification **/
    static async GetNotifications() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/notification/get',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // Get unread count
    static async GetUnreadCount() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/notification/unread-count',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // Mark as read
    static async MarkAsRead(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: `/notification/mark-as-read`,
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // Mark all as read
    static async MarkAllAsRead() {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: `/notification/mark-all`,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // Delete Notification
    static async DeleteNotification(obj) {
        try {
            const response = await axiosPrivate({
                method: "DELETE",
                url: `/notification/delete`,
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    /**************** Orders ******************/
    static async InstantiateOrder() {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/order/instantiate',
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async SaveDraft(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/order/save',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async SubmitOrder(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/order/submit',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async InitializePayment(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/order/init-pay',
                data: obj,
            });

            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            // Handle specific error codes
            if (error.response?.status === 409) {
                // Payment already in progress - extract cooldown info
                const errorData = error.response.data;
                const customError = new Error(errorData.details || "Payment already in progress");
                customError.code = 409;
                customError.timeToWait = errorData.timeToWait || 30;
                customError.retryAfter = errorData.retryAfter;
                customError.reference = errorData.reference;
                customError.authorizationUrl = errorData.authorizationUrl;
                throw customError;
            }

            // Handle other status codes
            if (error.response?.status === 500) {
                const customError = new Error("Server error occurred");
                customError.code = 500;
                throw customError;
            }

            if (error.response?.status === 503) {
                const customError = new Error("Service temporarily unavailable");
                customError.code = 503;
                throw customError;
            }

            // Default error handling
            throw new Error(error.response?.data?.error || error.message || "Payment initialization failed");
        }
    }

    static async CheckPaymentStatus(obj) {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/order/payment-status',
                params: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GetAllClientOrders() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/order/all',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GetOrders() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/order/get',
            });
            if (response.status === 200) {

                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async DeleteOrder(obj) {
        try {
            const response = await axiosPrivate({
                method: "DELETE",
                url: '/order/delete',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GetOrderStats() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/order/stats',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GetOrderHistory() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/order/history',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // Image/Video preSigned url for S3 bucket
    static async GetPresignedUrl(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/s3/presigned-url',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async DeleteFile(obj) {
        try {
            const response = await axiosPrivate({
                method: "DELETE",
                url: '/s3/delete',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error.response?.data?.error || 'Failed to delete file');
        }
    }

    // finance
    /**
     * Get comprehensive financial summary (orders + wallet)
     */
    static async getFinancialSummary() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/finance/summary'
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching financial summary:', error);
            throw error;
        }
    }

    /**
     * Get wallet top-up history
     */
    static async getTopUpHistory(params = {}) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/finance/topup/history',
                params: {
                    status: params.status || 'all',
                    page: params.page || 1,
                    limit: params.limit || 20
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching top-up history:', error);
            throw error;
        }
    }

    /**
     * Get wallet balance
     */
    static async getWalletBalance() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/wallet/balance'
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            throw error;
        }
    }

    /**
     * Get all financial transactions (orders + wallet)
     */
    static async getFinancialTransactions(params = {}) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/finance/transactions',
                params: {
                    page: params.page || 1,
                    limit: params.limit || 50,
                    type: params.type || 'all',
                    status: params.status || 'all'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching financial transactions:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to load transaction history';
            throw new Error(errorMessage);
        }
    }

    /**
     * Initiate wallet top-up
     */
    static async initiateTopUp(amount) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/user/wallet/topup/initiate',
                data: { amount }
            });
            return response.data;
        } catch (error) {
            console.error('Error initiating top-up:', error);
            throw error;
        }
    }

    /**
     * Verify top-up payment
     */
    static async verifyTopUp(reference) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/user/wallet/topup/verify',
                data: { reference }
            });
            return response.data;
        } catch (error) {
            console.error('Error verifying top-up:', error);
            throw error;
        }
    }

    /**
     * Generate reference for wallet top-up
     */
    static async generateTopUpReference(amount) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/user/wallet/topup/generate-reference',
                data: { amount }
            });
            return response.data;
        } catch (error) {
            console.error('Error generating top-up reference:', error);
            throw error;
        }
    }

    /**
     * Verify top-up payment after Paystack
     */
    static async verifyTopUpPayment(reference) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/user/wallet/topup/verify',
                data: { reference }
            });
            return response.data;
        } catch (error) {
            console.error('Error verifying top-up:', error);
            throw error;
        }
    }

    /**
     * Check status of pending top-up
     */
    static async checkPendingTopUp(reference) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/user/wallet/topup/check-pending',
                data: { reference }
            });
            return response.data;
        } catch (error) {
            console.log('Error checking pending top-up:', error);
            throw error;
        }
    }


    // Analytics
    static async getAnalytics() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/analytics'
            });
            return response.data;
        } catch (error) {
            console.log('Something went wrong:', error);
            throw new Error(error);
        }
    }

    static async getPaymentsAnalytics() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/payment/analytics'
            });
            return response.data;
        } catch (error) {
            console.log('Something went wrong:', error);
            throw new Error(error);
        }
    }

    static async getSinglePayment(txId) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/user/payment/${txId}`
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }
    }

    static async getDeliveryAnalytics() {
        const queryParams = {
            month: 1,
            year: 2025,
            status: 'all'
        }
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/user/delivery/analytics',
                params: queryParams
            });
            return response.data;
        } catch (error) {
            console.log('Something went wrong:', error);
            throw new Error(error);
        }
    }

    static async getSingleDelivery(orderId) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/user/delivery/${orderId}`,
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }
    }


}

export default ClientUtils;

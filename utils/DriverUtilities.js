// utils/DriverUtils.js
import {axiosPrivate, axiosPublic} from "./AxiosInstance";

class DriverUtils {
    // Helper: truthy string/number
    static #hasVal(v) {
        return typeof v === "string" ? v.trim().length > 0 : !!v;
    }

    /**
     * Compute driver profile completion based on your schema.
     * Returns: { percent: number, isComplete: boolean, missing: string[] }
     */
    static getProfileCompletion(user) {
        if (!user) return {percent: 0, isComplete: false, missing: ["no-user"]};

        const missing = [];

        // Weights (easy to tune later)
        const DOCS_WEIGHT = 60;   // All verification documents share this weight
        const ID_WEIGHT = 20;     // emailVerified (10) + avatar (10)
        const BANK_WEIGHT = 10;   // details (5) + verified (5)
        const VEHICLE_WEIGHT = 10; // vehicle core (10)

        // --- Documents (license, registration, insurance, roadWorthiness, profilePhoto, backgroundCheck)
        const docs = user?.verification?.documentsStatus || {};
        const docKeys = [
            "license",
            "vehicleRegistration",
            "insurance",
            "roadWorthiness",
            "profilePhoto",
            "backgroundCheck",
        ];
        const approvedCount = docKeys.reduce(
            (acc, k) => acc + (docs[k] === "approved" ? 1 : 0),
            0
        );
        const docsScore = Math.round((approvedCount / docKeys.length) * DOCS_WEIGHT);
        docKeys.forEach((k) => {
            if (docs[k] !== "approved") missing.push(`doc:${k}`);
        });

        // --- Identity (emailVerified + avatar)
        let idScore = 0;
        if (user?.emailVerified) idScore += 10;
        else missing.push("email:verify");

        if (this.#hasVal(user?.avatar)) idScore += 10;
        else missing.push("profile:photo");

        // --- Bank / Payout
        let bankScore = 0;
        const bank = user?.wallet?.bankDetails || {};
        const hasBankCore =
            this.#hasVal(bank.accountName) &&
            this.#hasVal(bank.accountNumber) &&
            this.#hasVal(bank.bankName);

        if (hasBankCore) bankScore += 5;
        else missing.push("bank:details");

        if (bank.verified) bankScore += 5;
        else missing.push("bank:verify");

        // --- Vehicle Core
        let vehicleScore = 0;
        const veh = user?.vehicleDetails || {};
        const hasVehicleCore =
            this.#hasVal(veh.type) &&
            this.#hasVal(veh.plateNumber) &&
            this.#hasVal(veh.model);

        if (hasVehicleCore) vehicleScore += 10;
        else missing.push("vehicle:core");

        // --- Sum & clamp
        let percent = docsScore + idScore + bankScore + vehicleScore;
        percent = Math.max(0, Math.min(100, percent));

        // Require overall approved to be considered fully complete (optional gate)
        const overallApproved = user?.verification?.overallStatus === "approved";
        const isComplete = percent === 100 && overallApproved;

        return {percent, isComplete, missing};
    }

    /**
     * Optional helper for availability toggle UX.
     * Returns boolean: should the toggle be disabled?
     */
    static async updateDriverStatus(status) {
        const payload = {status: status}
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/availability',
                data: payload
            });

            return response.data;

        } catch (error) {
            console.log('Driver status update error:', error);
            throw new Error(error);
        }
    }

    static async UpdatePassword(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/driver/auth/password/reset',
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async UpdateProfile(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: '/driver/update-profile',
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GetToken(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/driver/auth/get/token',
                data: obj,
            });
            return response.data
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async VerifyAuthToken(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/driver/auth/verify/auth-token',
                data: obj,
            });
            return response.data
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }


    }

    static async VerifyEmail(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/driver/auth/verify/email',
                data: obj,
            });
            return response.data
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }

    }

    static async SetAuthPin(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/driver/auth/set/auth-pin',
                data: obj,
            });
            return response.data
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }


    static async TermsConditions(payload) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/driver/tcs',
                data: payload,
            });
            return response.data;
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
                url: '/driver/location/saved',
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
                url: '/driver/location/create',
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async UpdateLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: '/driver/location/update',
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }


    static async DeleteLocation(obj) {
        try {
            const response = await axiosPrivate({
                method: "DELETE",
                url: '/driver/location/delete',
                data: obj,
            });
            return response.data;
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
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async UpdateAvatar(obj) {
        try {
            const response = await axiosPrivate({
                method: "PUT",
                url: '/driver/update-avatar',
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

    static async Verification() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/driver/verification/status',
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

    static async GetDriverPresignedUrl(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/s3/driver/presigned-url',
                data: obj,
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({error});
            throw new Error(error.response?.data?.error || 'Failed to get presigned URL');
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

    static async SubmitVerification(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: '/driver/verification/submit',
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error.response?.data?.error || 'Failed to delete file');
        }
    }

    static async sendMessage(conversationId, messageData) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/support/chat/message/send`,
                data: {
                    conversationId,
                    messageData
                }
            });

            return response.data;
        } catch (error) {
            console.log('Send message error:', error);
            return {success: false, error: error.message};
        }
    }

    static async markChatAsRead(conversationId, lastReadSeq) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/support/chat/message/read`,
                data: {
                    conversationId,
                    lastReadSeq
                }
            });

            return response.data;
        } catch (error) {
            console.log('mark chat as read error:', error);
            return {success: false, error: error.message};
        }
    }

    static async createConversation(targetUserId, targetRole, orderId = null) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/support/chat/create`,
                data: {
                    targetUserId,
                    targetRole,
                    orderId,
                }
            });
            return response.data;
        } catch (error) {
            console.log('Creat conversation error:', error);
            return {success: false, error: error.message};
        }
    }

    static async getOrCreateDriverSupportConversation() {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/support/chat/get-or-create`,
            });
            return response.data;
        } catch (error) {
            console.log('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Create support ticket
     */
    static async createSupportTicket(ticketData) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/support/ticket/create`,
                data: ticketData,
            });
            return response.data;
        } catch (error) {
            console.log('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Get user's tickets
     */
    static async getSupportTickets(status) {
        const params = {};
        if (status) {
            params.status = status;
        }
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/support/ticket/all`,
                params: params,
                data: status,
            });
            return response.data;
        } catch (error) {
            console.log('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    /**
     * Get ticket details
     */
    static async getTicketById(ticketId) {

        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/support/ticket/get`,
                prams: ticketId,
            });
            return response.data;
        } catch (error) {
            console.log('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    static async deleteSupportTicket(ticketId) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/driver/support/ticket/delete`,
                data: {ticketId}
            });
            return response.data;
        } catch (error) {
            console.log('Delete error:', error);
            return {success: false, error: error.message};
        }
    }

    static async updateSupportTicket(ticketId, ticketData) {
        try {
            const response = await axiosPrivate({
                method: 'PUT',
                url: `/driver/support/ticket/update`,
                params: ticketId,
                data: ticketData,
            });
            return response.data;
        } catch (error) {
            console.log('Update error:', error);
            return {success: false, error: error.message};
        }
    }

    // Notifications
    static async GetNotification() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/notification/all`,
            });
            return response.data;
        } catch (error) {
            console.log('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    static async GetNotificationStats() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/notification/stats`,
            });
            return response.data;
        } catch (error) {
            console.log('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    static async MarkAsRead(obj) {
        try {
            const response = await axiosPrivate({
                method: "PATCH",
                url: `/driver/notification/mark-as-read`,
                data: obj,
            });
            return response.data;
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
                url: `/driver/notification/mark-all-as-read`,
            });
            return response.data;
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
                url: `/driver/notification/delete`,
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // Delete all notifications
    static async DeleteAllNotification() {
        try {
            const response = await axiosPrivate({
                method: "DELETE",
                url: `/driver/notification/delete/all`,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    // utils/DriverOrdersAPI.js

    /**
     * Fetch available orders based on driver's location and settings
     * @param {Object} params - Query parameters
     * @param {number} params.lat - Driver's latitude
     * @param {number} params.lng - Driver's longitude
     * @param {string} params.area - 'current' | 'territorial'
     * @param {number} params.radius - Search radius in km (for 'current' mode)
     * @param {Array<string>} params.vehicleFilter - Array of vehicle types
     * @param {string} params.priorityFilter - 'all' | 'high_priority' | 'urgent'
     * @param {number} params.maxDistance - Max distance willing to travel
     * @returns {Promise<{success: boolean, orders: Array, count: number}>}
     */
    static async getAvailableOrders(params) {
        try {
            const queryParams = {
                lat: params.lat,
                lng: params.lng,
                area: params.area || 'current',
                radius: params.radius || 15,
                maxDistance: params.maxDistance || 20,
                priorityFilter: params.priorityFilter || 'all'
            };
            console.log({
                queryParams
            })

            // Add vehicle filter if provided
            if (params.vehicleFilter && params.vehicleFilter.length > 0) {
                queryParams.vehicleFilter = params.vehicleFilter.join(',');
            }

            const response = await axiosPrivate({
                method: 'GET',
                url: '/driver/orders/get/available',
                params: queryParams
            });

            return {
                success: true,
                orders: response.data.orders || [],
                count: response.data.count || 0,
                metadata: response.data.metadata
            };

        } catch (error) {
            console.log('Get available orders error:', error);

            // Handle specific error cases
            if (error.response?.status === 400) {
                return {
                    success: false,
                    message: error.response.data.error || 'Invalid request parameters',
                    orders: [],
                    count: 0
                };
            }

            return {
                success: false,
                message: error.response?.data?.error || 'Failed to fetch orders',
                orders: [],
                count: 0
            };
        }
    }

    /**
     * Accept an order
     * @param {string} orderId - Order ID to accept
     * @param {Object} currentLocation - Driver's current location
     * @param {number} currentLocation.lat - Latitude
     * @param {number} currentLocation.lng - Longitude
     * @param {number} currentLocation.accuracy - GPS accuracy in meters
     * @returns {Promise<{success: boolean, order?: Object, warning?: string}>}
     */
    static async acceptOrder(orderId, currentLocation) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/accept',
                data: {
                    orderId,
                    currentLocation: {
                        lat: currentLocation.lat,
                        lng: currentLocation.lng,
                        accuracy: currentLocation.accuracy || 0
                    }
                }
            });

            return {
                success: true,
                user: response.data.dashboard,
                order: response.data.order,
                message: response.data.message,
                warning: response.data.warning || null
            };

        } catch (error) {
            console.log('Accept order error:', error);

            // Handle specific errors
            if (error.response?.status === 400) {
                return {
                    success: false,
                    message: error.response.data.error,
                    currentStatus: error.response.data.currentStatus
                };
            }

            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Order not found or no longer available'
                };
            }

            if (error.response?.status === 409) {
                return {
                    success: false,
                    message: error.response.data.error || 'Order already taken'
                };
            }

            return {
                success: false,
                message: error.response?.data?.error || 'Failed to accept order'
            };
        }
    }

    /**
     * Update driver location during active delivery
     * @param {string} orderId - Active order ID
     * @param {Object} location - Current location
     * @param {string} deliveryStage - Current stage of the delivery (e.g., 'pickup', 'in_transit', 'delivery')
     * @returns {Promise<{success: boolean}>}
     */
    static async updateCurrentLocation(orderId, location, deliveryStage) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/location/update',
                data: {
                    orderId,
                    location: {
                        lat: location.lat,
                        lng: location.lng,
                        accuracy: location.accuracy || 0,
                        speed: location.speed || 0
                    },
                    deliveryStage,
                }
            });

            return {
                success: true,
                message: response.data.message
            };

        } catch (error) {
            console.log('Update location error:', error);

            return {
                success: false,
                message: error.response?.data?.error || 'Failed to update location'
            };
        }
    }

    /**
     * Notify system about location tracking loss
     * @param {string} orderId - Active order ID
     * @param {Object} lastKnownLocation - Last known location
     * @param {number} failureCount - Number of consecutive failures
     * @returns {Promise<{success: boolean, action?: string}>}
     */
    static async notifyLocationLoss(orderId, lastKnownLocation, failureCount) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/driver/location-lost',
                data: {
                    orderId,
                    lastKnownLocation,
                    failureCount
                }
            });

            return {
                success: true,
                message: response.data.message,
                action: response.data.action
            };

        } catch (error) {
            console.log('Something went wrong:', error);

            return {
                success: false,
                message: 'Failed to notify location loss'
            };
        }
    }

    static async arrivePickUp (payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/arrived-pickup',
                data: payload
            });

            return {
                success: true,
                message: response.data.message,
            };

        } catch (error) {
            console.log('Something went wrong:', error);

            return {
                success: false,
                message: 'Something went wrong: Try again'
            };
        }

    }

    static async updateDeliveryStage(payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/arrived-pickup',
                data: payload
            });

            return {
                success: true,
                message: response.data.message,
            };

        } catch (error) {
            console.log('Something went wrong:', error);

            return {
                success: false,
                message: 'Location update faied: Try again'
            };
        }
    }

    /**
     * Confirm package pickup
     * @param {string} orderId - Order ID
     * @param {Object} location - Pickup location
     * @param {Array<string>} photos - Photo URLs/paths
     * @returns {Promise<{success: boolean, penalty?: Object}>}
     */
    static async confirmPickup(payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/confirm-pickup',
                data: payload
            });

            return {
                success: true,
                order: response.data.order,
                penalty: response.data.penalty || null,
                message: response.data.message
            };

        } catch (error) {
            console.log('Confirm pickup error:', error);

            return {
                success: false,
                message: error.response?.data?.error || 'Failed to confirm pickup'
            };
        }
    }

    /**
     * Cancel order (driver-initiated)
     * @param {string} orderId - Order ID
     * @param {string} reason - Cancellation reason
     * @returns {Promise<{success: boolean}>}
     */
    static async cancelOrder(orderId, reason) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/driver/cancel-order',
                data: {
                    orderId,
                    reason
                }
            });

            return {
                success: true,
                message: response.data.message,
                penalty: response.data.penalty || null
            };

        } catch (error) {
            console.log('Cancel order error:', error);

            return {
                success: false,
                message: error.response?.data?.error || 'Failed to cancel order'
            };
        }
    }

    /**
     * Get active order details
     * @param {string} orderId - Order ID
     * @returns {Promise<{success: boolean, order?: Object}>}
     */
    static async getOrderDetails(orderId) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/order/${orderId}`
            });

            return {
                success: true,
                order: response.data.order
            };

        } catch (error) {
            console.log('Get order details error:', error);

            return {
                success: false,
                message: error.response?.data?.error || 'Failed to fetch order details'
            };
        }
    }

    /**
     * Report an issue with the order
     * @param {string} orderId - Order ID
     * @param {Object} issue - Issue details
     * @returns {Promise<{success: boolean}>}
     */
    static async reportIssue(orderId, issue) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: '/driver/report-issue',
                data: {
                    orderId,
                    issueType: issue.type,
                    description: issue.description,
                    photos: issue.photos || []
                }
            });

            return {
                success: true,
                message: response.data.message
            };

        } catch (error) {
            console.log('Report issue error:', error);

            return {
                success: false,
                message: error.response?.data?.error || 'Failed to report issue'
            };
        }
    }

    static async verifyDeliveryToken (payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/verify/delivery-token',
                data: payload
            });

            return {
                success: true,
                message: response.data.message,
            };

        } catch (error) {
            console.log('Something went wrong:', error);

            return {
                success: false,
                message: 'Verification Failed: Try again'
            };
        }
    }

    static async GetPresignedUrlPickup(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/s3/driver/confirmation-presigned-url',
                data: obj,
            });
            if (response.data.success) {
                return {
                    uploadURL: response.data.uploadURL,
                    fileURL: response.data.fileURL,
                    key: response.data.key
                };
            } else {
                throw new Error(response.data.error || 'Failed to get presigned URL');
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GetPickupPresignedUrl(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/s3/driver/pickup-presigned-url',
                data: obj,
            });
            if (response.data.success) {
                return {
                    uploadURL: response.data.uploadURL,
                    fileURL: response.data.fileURL,
                    key: response.data.key
                };
            } else {
                throw new Error(response.data.error || 'Failed to get presigned URL');
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async GetDropoffPresignedUrl(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/s3/driver/dropoff-presigned-url',
                data: obj,
            });
            if (response.data.success) {
                return {
                    uploadURL: response.data.uploadURL,
                    fileURL: response.data.fileURL,
                    key: response.data.key
                };
            } else {
                throw new Error(response.data.error || 'Failed to get presigned URL');
            }
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async arriveDropOff (payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/arrived-dropoff',
                data: payload
            });

            return {
                success: true,
                message: response.data.message,
            };

        } catch (error) {
            console.log('Something went wrong:', error);

            return {
                success: false,
                message: 'Something went wroing: Try again'
            };
        }

    }

    static async completeDelivery (payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/complete-delivery',
                data: payload
            });

            return {
                success: true,
                user: response.data.userData,
                earnings: response.data.earnings,
                nextAction: response.data.nextAction,
            };

        } catch (error) {
            console.log('Something went wrong:', error);

            return {
                success: false,
                message: 'Error: Try again'
            };
        }
    }

    static async submitClientRating (payload) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: '/driver/order/submit/review',
                data: payload
            });

            return {
                success: response.data.success,
            };

        } catch (error) {
            console.log('Something went wrong:', error);

            return {
                success: false,
                message: 'Review Failed'
            };
        }
    }

    static async getData() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/driver/dashboard/data'
            });
            return response.data;
        } catch (error) {
            console.log('Something went wrong:', error);
            throw new Error(error);
        }
    }

    // analytics

    static async getAnalytics() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/driver/analytics'
            });
            return response.data;
        } catch (error) {
            console.log('Something went wrong:', error);
            throw new Error(error);
        }
    }

    static async getEarningsAnalytics() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: '/driver/earning/analytics'
            });
            return response.data;
        } catch (error) {
            console.log('Something went wrong:', error);
            throw new Error(error);
        }
    }

    static async getSingleTransaction(txId) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/earning/${txId}`
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
                url: '/driver/delivery/analytics',
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
                url: `/driver/delivery/${orderId}`
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }
    }


    static async getFinancialSummary() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/finance/summary`
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }
    }

    // utils/DriverUtilities.js
    static async getEarningsHistory(params = {}) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/finance/earning/history`,
                params: {
                    page: params.page || 1,
                    limit: params.limit || 50,
                    type: params.type || 'all',
                    status: params.status || 'all'
                }
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching earnings history:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to load transaction history';
            throw new Error(errorMessage);
        }
    }

    static async getPayoutHistory(queryParams) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/finance/payout/history`,
                params: queryParams
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }
    }


    static async getBanks() {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/finance/bank`
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }
    }

    static async newBankDetails(bankDetails) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/finance/bank/new`,
                data: bankDetails
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }

    }

    static async updateBankDetails(bankDetails) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: `/driver/finance/bank/update`,
                data: bankDetails
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }

    }

    static async requestPayout(payload) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/finance/request/payout`,
                data: payload
            });
            return response.data;
        } catch (error) {
            console.log('Error requesting payout:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to process withdrawal request';
            throw new Error(errorMessage);
        }
    }

    static async getPayoutStatus(payoutId) {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/finance/verify/payout`,
                params: { payoutId }
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching payout status:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to fetch payout status';
            throw new Error(errorMessage);
        }
    }

    static async deleteBankDetails(bankId) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/driver/finance/bank/delete`,
                data: bankId,
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }

    }

    static async setPrimaryBankAccount(bankId) {
        try {
            const response = await axiosPrivate({
                method: 'PATCH',
                url: `/driver/finance/bank/primary`,
                data: bankId,
            });
            return response.data;
        } catch (error) {
            console.log('Error fetching delivery:', error);
            throw new Error(error);
        }
    }

    static async verifyWithdrawalAuthPin(payload ) {
        try {
            const response = await axiosPrivate({
                method: 'POST',
                url: `/driver/finance/verify/pin`,
                data: payload,
            });
            return response.data;
        } catch (error) {
            if (error.response && (error.response.status === 400 || error.response.status === 423)) {
                console.log('Returning error response data for status:', error.response.status);
                return error.response.data;
            }
            console.log('Throwing error for status:', error.response?.status);
            throw error;
        }
    }
}

export default DriverUtils;

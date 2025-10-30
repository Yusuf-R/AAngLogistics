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
                url: '/drver/location/create',
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
                url: '/drver/location/update',
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
                url: '/drver/location/delete',
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
                url: '/drver/update-avatar',
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
            console.error('Send message error:', error);
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
            console.error('mark chat as read error:', error);
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
            console.error('Creat conversation error:', error);
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
            console.error('Get-Create error:', error);
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
            console.error('Get-Create error:', error);
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
            console.error('Get-Create error:', error);
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
            console.error('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    static async deleteSupportTicket(ticketId) {
        try {
            const response = await axiosPrivate({
                method: 'DELETE',
                url: `/driver/support/ticket/delete`,
                data:  {ticketId}
            });
            return response.data;
        } catch (error) {
            console.error('Delete error:', error);
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
            console.error('Update error:', error);
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
            console.error('Get-Create error:', error);
            return {success: false, error: error.message};
        }
    }

    static async GetNotificationStats () {
        try {
            const response = await axiosPrivate({
                method: 'GET',
                url: `/driver/notification/stats`,
            });
            return response.data;
        } catch (error) {
            console.error('Get-Create error:', error);
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








}

export default DriverUtils;

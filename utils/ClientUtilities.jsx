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

}

export default ClientUtils;

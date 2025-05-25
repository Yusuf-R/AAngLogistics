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
            const response = await axiosPublic({
                method: "POST",
                url: '/auth/login',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({ error });
            throw new Error(error);
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
            console.log({ error });
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
            console.log({ error });
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
            console.log({ error });
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
            console.log({ error });
            throw new Error(error);
        }

    }

}

export default ClientUtils;

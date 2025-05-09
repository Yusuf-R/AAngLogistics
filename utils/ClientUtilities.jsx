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
        console.log({ obj })
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/signup',
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

}

export default ClientUtils;

// utils/DriverUtils.js
import { axiosPrivate, axiosPublic } from "./AxiosInstance";

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
        if (!user) return { percent: 0, isComplete: false, missing: ["no-user"] };

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

        return { percent, isComplete, missing };
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



}

export default DriverUtils;

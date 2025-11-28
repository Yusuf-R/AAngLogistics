// hooks/usePayoutPolling.js
import { useEffect, useRef, useState } from 'react';
import DriverUtils from '../utils/DriverUtilities';

const usePayoutPolling = (payoutIds = [], onStatusChange) => {
    const [pollingActive, setPollingActive] = useState(false);
    const intervalsRef = useRef({});
    const attemptsRef = useRef({});
    const startTimesRef = useRef({});
    const completedPayoutsRef = useRef(new Set());

    useEffect(() => {
        if (!payoutIds || payoutIds.length === 0) {
            cleanupAllPolling();
            return;
        }

        setPollingActive(true);

        // Filter out already completed payouts
        const payoutsToPoll = payoutIds.filter(id => !completedPayoutsRef.current.has(id));

        payoutsToPoll.forEach(payoutId => {
            if (!intervalsRef.current[payoutId]) {
                startPollingForPayout(payoutId);
            }
        });

        // Cleanup payouts that are no longer in the list
        Object.keys(intervalsRef.current).forEach(payoutId => {
            if (!payoutIds.includes(payoutId) && !payoutId.includes('_updater')) {
                stopPollingForPayout(payoutId);
            }
        });

        return cleanupAllPolling;
    }, [payoutIds.join(',')]);

    const startPollingForPayout = (payoutId) => {
        attemptsRef.current[payoutId] = 0;
        startTimesRef.current[payoutId] = Date.now();

        const pollPayout = async () => {
            const attempts = attemptsRef.current[payoutId] || 0;
            const startTime = startTimesRef.current[payoutId] || Date.now();
            const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);

            if (elapsedMinutes >= 5) {
                console.log(`Stopping auto-polling for ${payoutId} after 5 minutes`);
                stopPollingForPayout(payoutId);
                return;
            }

            try {
                const result = await DriverUtils.getPayoutStatus(payoutId);

                if (result.status !== 'pending' && result.status !== 'processing') {
                    console.log(`Payout ${payoutId} status changed to ${result.status}`);
                    completedPayoutsRef.current.add(payoutId);
                    stopPollingForPayout(payoutId);
                    onStatusChange?.(payoutId, result);
                    return;
                }

                attemptsRef.current[payoutId] = attempts + 1;
            } catch (error) {
                console.log(`Error polling payout ${payoutId}:`, error);
                if (attempts > 3) {
                    stopPollingForPayout(payoutId);
                }
            }
        };

        // Initial poll
        pollPayout();

        // Set up interval
        const intervalId = setInterval(pollPayout, 10000); // Start with 10 seconds
        intervalsRef.current[payoutId] = intervalId;
    };

    const stopPollingForPayout = (payoutId) => {
        if (intervalsRef.current[payoutId]) {
            clearInterval(intervalsRef.current[payoutId]);
            delete intervalsRef.current[payoutId];
        }
        delete attemptsRef.current[payoutId];
        delete startTimesRef.current[payoutId];

        if (Object.keys(intervalsRef.current).length === 0) {
            setPollingActive(false);
        }
    };

    const cleanupAllPolling = () => {
        Object.values(intervalsRef.current).forEach(clearInterval);
        intervalsRef.current = {};
        attemptsRef.current = {};
        startTimesRef.current = {};
        completedPayoutsRef.current.clear();
        setPollingActive(false);
    };

    return {
        pollingActive,
        stopPolling: stopPollingForPayout,
        cleanup: cleanupAllPolling
    };
};

export default usePayoutPolling; // Make sure it's default export
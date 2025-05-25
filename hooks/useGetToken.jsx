import { useMutation } from '@tanstack/react-query';
import ClientUtils from '../utils/ClientUtilities';

export const useGetToken = () => {
    return useMutation({
        mutationKey: ['GetToken'],
        mutationFn: ClientUtils.GetToken,
    });
};

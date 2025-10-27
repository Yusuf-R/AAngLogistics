import { useEffect, useMemo } from "react";
import { router, usePathname } from "expo-router";
import { useSessionStore } from "../store/useSessionStore";

/**
 * Blocks access to restricted driver routes until T&Cs is accepted.
 * - allowlist: routes you NEVER want to block (tcs screens, login, dashboard, etc.)
 * - restrictedPrefixes: route prefixes you want to protect
 */
export function useTCGuard({
                               allowlist = ["/driver/tcs", "/driver/tcs-required", "/driver/dashboard"],
                               restrictedPrefixes = ["/driver/account", "/driver/discover", "/driver/notifications"],
                           } = {}) {
    const pathname = usePathname();
    const user = useSessionStore((s) => s.user);
    const isAccepted = !!user?.tcs?.isAccepted;

    const isAllowlisted = useMemo(
        () => allowlist.some((p) => pathname === p || pathname.startsWith(p + "/")),
        [allowlist, pathname]
    );

    const isRestricted = useMemo(
        () => restrictedPrefixes.some((p) => pathname.startsWith(p)),
        [restrictedPrefixes, pathname]
    );

    useEffect(() => {
        if (!isAccepted && isRestricted && !isAllowlisted) {
            // prevent loops: don't push if we're already on tcs-required
            if (pathname !== "/driver/tcs-required") {
                router.replace("/driver/tcs-required");
            }
        }
    }, [isAccepted, isRestricted, isAllowlisted, pathname]);

    return { isAccepted, isRestricted, isAllowlisted };
}


export function withTCGuard(Component) {
    return function Guarded(props) {
        const isAccepted = !!useSessionStore((s) => s.user?.tcs?.isAccepted);
        if (!isAccepted) {
            // instant bounce if somehow routed directly
            router.replace("/driver/tcs-required");
            return (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <Text style={{ marginBottom: 12, fontSize: 16, textAlign: "center" }}>
                        Terms & Conditions required
                    </Text>
                    <TouchableOpacity onPress={() => router.replace("/driver/tcs-required")}>
                        <Text style={{ color: "#2563EB", fontWeight: "700" }}>Review T&Cs</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return <Component {...props} />;
    };
}

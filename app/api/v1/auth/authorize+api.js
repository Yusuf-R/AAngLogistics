const GOOGLE_CLIENT_ID=process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const BASE_URL=process.env.EXPO_PUBLIC_BASE_URL;
const APP_SCHEME=process.env.EXPO_PUBLIC_APP_SCHEME;
const GOOGLE_AUTH_URL=process.env.EXPO_PUBLIC_GOOGLE_AUTH_URL;
const GOOGLE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI

export async function GET (request) {
    if (!GOOGLE_CLIENT_ID) {
        return Response.json({ error: "Missing Google Client ID" }, { status: 400 });
    }

    const url = new URL(request.url);
    let idpClientId;

    const internalClient = url.searchParams.get("client_id");

    const redirectUri = url.searchParams.get("redirect_uri");

    let platform;

    if (redirectUri === APP_SCHEME) {
        platform = "mobile";
    } else if (redirectUri === BASE_URL) {
        platform = "web";
    } else {
        return Response.json({ error: "Invalid redirect_uri" }, { status: 400 });
    }

    // use state to drive redirect back to platform
    let state = platform + "|" + url.searchParams.get("state");

    if (internalClient === "google") {
        idpClientId = GOOGLE_CLIENT_ID;
    } else {
        return Response.json({ error: "Invalid client" }, { status: 400 });
    }

    // additional enforcement
    if (!state) {
        return Response.json({ error: "Invalid state" }, { status: 400 });
    }

    const params = new URLSearchParams({
        client_id: idpClientId,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: url.searchParams.get("scope") || "identity",
        state: state,
        prompt: "select_account",
    });

    return Response.redirect(GOOGLE_AUTH_URL + "?" + params.toString());
}
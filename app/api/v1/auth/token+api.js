
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.WEB_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;

export async function POST(request) {
    const body = await request.formData();
    const code = body.get("code");

    if (!code) {
        return Response.json(
            {error: "Missing authorization code"},
            {status: 400}
        );
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
            code: code,
        }),
    });

    const data = await response.json();
    console.log({
        data
    })

    if (!data.id_token) {
        return Response.json(
            {error: "Missing required parameters"},
            {status: 400}
        );
    }
    console.log('I have sent it back to authJson');
    return Response.json(data, { status: 200 });
}
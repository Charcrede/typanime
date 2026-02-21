import { cookies } from 'next/headers';

const API = process.env.NEXT_PUBLIC_API;

export async function GET() {
    const res = await fetch(`${API}challenges`, { cache: 'no-store' });
    const data = await res.json();
    return Response.json(data);
}

export async function POST(request: Request) {
    const tokenRaw = cookies().get('auth_token')?.value;
    const token = tokenRaw ? JSON.parse(tokenRaw.slice(2)).access_token : null;
    if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();

    const res = await fetch(`${API}challenges`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
}
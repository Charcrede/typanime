import { cookies } from 'next/headers';

const API = process.env.NEXT_PUBLIC_API;

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const tokenRaw = cookies().get('auth_token')?.value;
    const token = tokenRaw ? JSON.parse(tokenRaw).access_token : null;
    if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const res = await fetch(`${API}challenges/${params.id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
}
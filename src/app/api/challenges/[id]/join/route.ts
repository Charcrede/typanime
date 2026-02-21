import { cookies } from 'next/headers';

const API = process.env.NEXT_PUBLIC_API;

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const tokenRaw = cookies().get('auth_token')?.value;
    const token = tokenRaw ? JSON.parse(tokenRaw.slice(2)).access_token : null;
    if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json(); // { wpm, accuracy }

    const res = await fetch(`${API}challenges/${params.id}/join`, {
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
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const tokenRaw = cookies().get('auth_token')?.value;
    const token = tokenRaw ? JSON.parse(tokenRaw).access_token : null;
    if (!token) {
        return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API}games`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Erreur backend' }));
        return Response.json(error, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
}
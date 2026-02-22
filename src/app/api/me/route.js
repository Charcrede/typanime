// app/api/me/route.ts
import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('auth_token')?.value;

  console.log(token)
  if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  const user = await fetch(`${process.env.NEXT_PUBLIC_API}users/me`, {
    headers: { Authorization: `Bearer ${JSON.parse(token).access_token}` }
  }).then(r => r.json());

  return Response.json(user);
}
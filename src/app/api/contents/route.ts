import { cookies } from 'next/headers';

const API = process.env.NEXT_PUBLIC_API;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  const tokenRaw = cookies().get('auth_token')?.value;
  const token = tokenRaw ? JSON.parse(tokenRaw).access_token : null;

  const res = await fetch(
    `${API}contents?categoryId=${categoryId}&limit=100`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    }
  );

  const data = await res.json();
  return Response.json(data);
}   
import { cookies } from "next/headers";

export async function apiFetch<T>(
  url: string,
): Promise<T> {
    const token = cookies().get('auth_token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    headers: {
      Authorization: token ? `Bearer ${JSON.parse(token?.slice(2)).access_token}` : '',
    },
    credentials: 'include',
  });
  console.log('API Response:', res.status, res.statusText);
  if (!res.ok) throw new Error('Unauthorized');

  return res.json();
}
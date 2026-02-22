
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',   // 'lax' suffit car same-origin maintenant
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json({ ok: true })
}
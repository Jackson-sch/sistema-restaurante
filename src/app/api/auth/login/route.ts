// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { signInWithCredentials } from '@/actions/auth';

export async function POST(request: Request) {
    const { email, password } = await request.json();
    const result = await signInWithCredentials(email, password);
    if (result.success) {
        return NextResponse.json({ success: true }, { status: 200 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
}

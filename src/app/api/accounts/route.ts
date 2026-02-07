import { NextResponse } from 'next/server';
import { getUserAccounts, createAccount } from '@/lib/actions/accounts';

export async function GET() {
    try {
        const result = await getUserAccounts();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = await createAccount(body);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}

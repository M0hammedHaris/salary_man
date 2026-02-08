import { NextResponse } from 'next/server';
import { getUserCategories } from '@/lib/actions/categories';
import { createCachedResponse, CACHE_DURATIONS } from '@/lib/utils/api-cache';

export async function GET() {
    try {
        const result = await getUserCategories();
        // Categories can be cached similarly to accounts
        return createCachedResponse(result, CACHE_DURATIONS.ACCOUNTS);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}

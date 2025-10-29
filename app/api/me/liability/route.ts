import { NextRequest, NextResponse } from 'next/server';
import ledger from '@/lib/companyLedger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail query parameter is required' },
        { status: 400 }
      );
    }

    const liability = ledger.getUserLiability(userEmail);

    return NextResponse.json({
      success: true,
      liability,
    });
  } catch (error) {
    console.error('Error fetching liability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

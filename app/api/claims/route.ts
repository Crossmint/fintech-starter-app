import { NextRequest, NextResponse } from 'next/server';
import ledger from '@/lib/companyLedger';

const MAX_CLAIM_AMOUNT = 5000; // Max claim amount in USD

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, amountUSD, userId } = body;

    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json(
        { error: 'userEmail is required and must be a string' },
        { status: 400 }
      );
    }

    if (!amountUSD || typeof amountUSD !== 'number' || amountUSD <= 0) {
      return NextResponse.json(
        { error: 'amountUSD is required and must be a positive number' },
        { status: 400 }
      );
    }

    if (amountUSD > MAX_CLAIM_AMOUNT) {
      return NextResponse.json(
        { error: `Amount exceeds maximum claim limit of $${MAX_CLAIM_AMOUNT}` },
        { status: 400 }
      );
    }

    const claim = ledger.addClaim(userEmail, amountUSD, userId);

    const liability = ledger.getUserLiability(userEmail);

    return NextResponse.json(
      {
        success: true,
        claim,
        liability,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

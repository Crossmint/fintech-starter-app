import { NextRequest, NextResponse } from 'next/server';
import ledger from '@/lib/companyLedger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, amountUSD } = body;

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

    const liability = ledger.getUserLiability(userEmail);
    if (amountUSD > liability.availableToWithdraw) {
      return NextResponse.json(
        { 
          error: `Insufficient available balance. You have $${liability.availableToWithdraw.toFixed(2)} available to withdraw.`,
          availableToWithdraw: liability.availableToWithdraw,
        },
        { status: 400 }
      );
    }

    const withdrawal = ledger.addWithdrawal(userEmail, amountUSD);

    setTimeout(() => {
      ledger.completeWithdrawal(withdrawal.id);
    }, 3000);

    const updatedLiability = ledger.getUserLiability(userEmail);

    return NextResponse.json(
      {
        success: true,
        withdrawal,
        liability: updatedLiability,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

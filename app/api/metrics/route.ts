import { NextResponse } from 'next/server';
import ledger from '@/lib/companyLedger';

export async function GET() {
  try {
    const totalMetrics = ledger.getTotalMetrics();
    const contractors = ledger.getAllLiabilities();

    return NextResponse.json({
      success: true,
      totalMetrics,
      contractors,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

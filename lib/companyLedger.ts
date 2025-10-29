
export interface Claim {
  id: string;
  userEmail: string;
  userId?: string;
  amountUSD: number;
  createdAt: Date;
}

export interface Withdrawal {
  id: string;
  userEmail: string;
  amountUSD: number;
  status: 'processing' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface ContractorLiability {
  userEmail: string;
  totalClaimed: number;
  totalCashedOut: number;
  availableToWithdraw: number;
}

class CompanyLedger {
  private claims: Claim[] = [];
  private withdrawals: Withdrawal[] = [];

  addClaim(userEmail: string, amountUSD: number, userId?: string): Claim {
    const claim: Claim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userEmail,
      userId,
      amountUSD,
      createdAt: new Date(),
    };
    this.claims.push(claim);
    return claim;
  }

  addWithdrawal(userEmail: string, amountUSD: number): Withdrawal {
    const withdrawal: Withdrawal = {
      id: `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userEmail,
      amountUSD,
      status: 'processing',
      createdAt: new Date(),
    };
    this.withdrawals.push(withdrawal);
    return withdrawal;
  }

  completeWithdrawal(withdrawalId: string): void {
    const withdrawal = this.withdrawals.find(w => w.id === withdrawalId);
    if (withdrawal) {
      withdrawal.status = 'completed';
      withdrawal.completedAt = new Date();
    }
  }

  getUserLiability(userEmail: string): ContractorLiability {
    const totalClaimed = this.claims
      .filter(c => c.userEmail === userEmail)
      .reduce((sum, c) => sum + c.amountUSD, 0);

    const totalCashedOut = this.withdrawals
      .filter(w => w.userEmail === userEmail && w.status === 'completed')
      .reduce((sum, w) => sum + w.amountUSD, 0);

    return {
      userEmail,
      totalClaimed,
      totalCashedOut,
      availableToWithdraw: totalClaimed - totalCashedOut,
    };
  }

  getAllLiabilities(): ContractorLiability[] {
    const uniqueEmails = new Set([
      ...this.claims.map(c => c.userEmail),
      ...this.withdrawals.map(w => w.userEmail),
    ]);

    return Array.from(uniqueEmails).map(email => this.getUserLiability(email));
  }

  getTotalMetrics() {
    const totalClaimed = this.claims.reduce((sum, c) => sum + c.amountUSD, 0);
    const totalCashedOut = this.withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amountUSD, 0);
    const totalProcessing = this.withdrawals
      .filter(w => w.status === 'processing')
      .reduce((sum, w) => sum + w.amountUSD, 0);

    return {
      totalClaimed,
      totalCashedOut,
      totalProcessing,
      netLiability: totalClaimed - totalCashedOut,
    };
  }

  getAllWithdrawals(): Withdrawal[] {
    return this.withdrawals;
  }

  seedSampleData(): void {
    if (this.claims.length === 0) {
      this.addClaim('contractor1@example.com', 1500);
      this.addClaim('contractor2@example.com', 2000);
      this.addClaim('contractor3@example.com', 1200);
      this.addClaim('contractor1@example.com', 800);
      
      const w1 = this.addWithdrawal('contractor1@example.com', 1000);
      this.completeWithdrawal(w1.id);
      
      const w2 = this.addWithdrawal('contractor2@example.com', 1500);
      this.completeWithdrawal(w2.id);
    }
  }
}

const ledger = new CompanyLedger();

ledger.seedSampleData();

export default ledger;

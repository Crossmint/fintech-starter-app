"use client";

import { useEffect, useState } from "react";
import { EVMWallet, useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { CreditCard, X, EyeOff, Eye, Plus, Lock, Copy } from "lucide-react";
import { BASE_SEPOLIA_CHAIN_ID, RUSD_CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS } from "@/lib/config";
import {
  createRainUserApplication,
  createRainUserContract,
  getDecryptedCardData,
  getRainUserByWalletAddress,
  getRainUserCards,
  getRainUserContracts,
  getRainUserCreditBalances,
  issueRainCard,
} from "@/server-actions/rain";

const STEPS = ["signup", "approved", "contract-created", "card-issued"] as const;
type FlowStep = (typeof STEPS)[number];

interface ContractToken {
  address: string;
  balance: string;
}

interface ContractData {
  contractId: string;
  chainId: number;
  depositAddress: string;
  proxyAddress: string;
  controllerAddress: string;
  tokens: ContractToken[];
  contractVersion: string;
  rusdToken: ContractToken & { exchangeRate: number; advanceRate: number };
}

interface CardData {
  id: string;
  status: string;
  type: string;
  limit?: { frequency: string; amount: number };
  last4?: string;
  lastFour?: string;
  displayName?: string;
}

interface RainCardFlowProps {
  showManage?: boolean;
  onCloseManage?: () => void;
  onCardStatusChange?: (hasCard: boolean) => void;
}

const CREDIT_BALANCE_POLL_INTERVAL_MS = 10_000;

export default function RainCardFlow({
  showManage,
  onCardStatusChange,
  onCloseManage,
}: RainCardFlowProps) {
  const { wallet } = useWallet();
  const { user } = useCrossmintAuth();

  const [step, setStep] = useState<FlowStep>("signup");

  useEffect(() => {
    onCardStatusChange?.(step === "card-issued");
  }, [step, onCardStatusChange]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [rainUserId, setRainUserId] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [rusdAmount, setRusdAmount] = useState("5");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [decryptedCardData, setDecryptedCardData] = useState<{
    cardNumber: string;
    cvc: string;
  } | null>(null);
  const [creditBalances, setCreditBalances] = useState<{
    creditLimit: number;
    pendingCharges: number;
    postedCharges: number;
    balanceDue: number;
    spendingPower: number;
  } | null>(null);

  const walletEmail = wallet?.owner?.includes("email:")
    ? wallet.owner.replace("email:", "")
    : user?.email;

  const currentStepIndex = STEPS.indexOf(step);

  useEffect(() => {
    const determineCurrentStep = async () => {
      if (!wallet?.address || !walletEmail) return;
      setInitialLoading(true);
      try {
        const existingUsers = await getRainUserByWalletAddress(wallet.address);
        if (existingUsers.length === 0) {
          setStep("signup");
          return;
        }

        const u = existingUsers[0];
        setRainUserId(u.id);

        try {
          const contractInfo = await getRainUserContracts(u.id);
          setContractAddress(contractInfo?.depositAddress);
          setContractData(contractInfo);

          try {
            const cards = await getRainUserCards(u.id);
            if (cards.length > 0) {
              setCardData(cards[0]);
              setStep("card-issued");
              await refreshCreditBalances(u.id);
            } else {
              setStep("contract-created");
            }
          } catch {
            setStep("contract-created");
          }
        } catch {
          try {
            await createRainUserContract(u.id, BASE_SEPOLIA_CHAIN_ID);
            const newContract = await getRainUserContracts(u.id);
            setContractAddress(newContract?.depositAddress);
            setContractData(newContract);
            setStep("contract-created");
          } catch {
            setStep("signup");
          }
        }
      } catch {
        setStep("signup");
      } finally {
        setInitialLoading(false);
      }
    };
    determineCurrentStep();
  }, [wallet?.address, walletEmail]);

  const refreshCreditBalances = async (userId?: string) => {
    const id = userId || rainUserId;
    if (!id) return;
    try {
      const balances = await getRainUserCreditBalances(id);
      setCreditBalances(balances);
    } catch (err) {
      console.error("Failed to refresh credit balances:", err);
    }
  };

  // Rain credits deposited collateral asynchronously (often well after the on-chain
  // transfer confirms), so keep polling while a card exists instead of relying on a
  // single fetch right after funding.
  useEffect(() => {
    if (step !== "card-issued" || !rainUserId) return;
    const interval = setInterval(() => {
      refreshCreditBalances(rainUserId);
    }, CREDIT_BALANCE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [step, rainUserId]);

  const handleRefreshBalance = async () => {
    if (!rainUserId) return;
    setIsRefreshing(true);
    try {
      const updated = await getRainUserContracts(rainUserId);
      setContractData(updated);
      await refreshCreditBalances();
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApply = async () => {
    if (!wallet || !walletEmail) return;
    setIsLoading(true);
    try {
      const result = await createRainUserApplication({
        firstName: walletEmail,
        lastName: "approved",
        birthDate: "1990-01-01",
        nationalId: "123456789",
        countryOfIssue: "US",
        email: walletEmail,
        address: {
          line1: "123 Test Street",
          city: "San Francisco",
          region: "CA",
          postalCode: "94105",
          countryCode: "US",
        },
        ipAddress: "127.0.0.1",
        phoneCountryCode: "1",
        phoneNumber: "5551234567",
        annualSalary: "75000",
        accountPurpose: "personal",
        expectedMonthlyVolume: "2000",
        isTermsOfServiceAccepted: true,
        walletAddress: wallet.address,
      });
      setRainUserId(result.userId);
      await new Promise((r) => setTimeout(r, 5000));
      await createRainUserContract(result.userId, BASE_SEPOLIA_CHAIN_ID);
      const contractInfo = await getRainUserContracts(result.userId);
      setContractAddress(contractInfo?.depositAddress);
      setContractData(contractInfo);
      setStep("contract-created");
    } catch (err) {
      console.error("Rain signup failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCard = async () => {
    if (!rainUserId) return;
    setIsLoading(true);
    try {
      const card = await issueRainCard(rainUserId, {
        type: "virtual",
        limit: { frequency: "allTime", amount: 1000 },
        displayName: walletEmail,
        status: "active",
      });
      let issued: CardData = {
        id: card.cardId,
        type: card.type,
        status: card.status,
        limit: card.limit,
        last4: card.lastFour,
        displayName: card.displayName,
      };
      // The issue response can omit lastFour; the card list has it.
      if (!issued.last4) {
        const cards = await getRainUserCards(rainUserId).catch(() => []);
        const listed = cards.find((c: CardData) => c.id === issued.id) ?? cards[0];
        if (listed) issued = { ...issued, ...listed };
      }
      setCardData(issued);
      await refreshCreditBalances();
      setStep("card-issued");
    } catch (err) {
      console.error("Card issuance failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundCard = async () => {
    if (!wallet || !contractAddress) return;
    setIsLoading(true);
    try {
      const evmWallet = EVMWallet.from(wallet);
      await evmWallet.sendTransaction({
        to: RUSD_CONTRACT_ADDRESS,
        abi: [
          {
            name: "mint",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [{ name: "_amountDollars_Max100", type: "uint256" }],
            outputs: [],
          },
        ],
        functionName: "mint",
        args: [BigInt(rusdAmount)],
      });
      await new Promise((r) => setTimeout(r, 2000));
      const tokenAmount = BigInt(rusdAmount) * BigInt(10 ** 6);
      await evmWallet.sendTransaction({
        to: RUSD_CONTRACT_ADDRESS,
        abi: [
          {
            name: "transfer",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "transfer",
        args: [contractAddress, tokenAmount],
      });
      if (rainUserId) {
        await new Promise((r) => setTimeout(r, 3000));
        const updated = await getRainUserContracts(rainUserId);
        setContractData(updated);
        await refreshCreditBalances();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AuthRejectedError") return;
      console.error("Funding failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealCard = async () => {
    if (!cardData?.id) return;
    setIsRevealing(true);
    try {
      const decrypted = await getDecryptedCardData(cardData.id);
      setDecryptedCardData(decrypted);
      setShowCardDetails(true);
    } catch (err) {
      console.error("Failed to reveal:", err);
    } finally {
      setIsRevealing(false);
    }
  };

  const formatCardNumber = (n: string) => n.replace(/(.{4})/g, "$1 ").trim();
  const last4 = cardData?.last4 || cardData?.lastFour || "••••";

  /* ─── Card Visual (reused in sidebar + modal) ─── */
  const CardVisual = ({ className = "" }: { className?: string }) => (
    <div
      className={`rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-5 text-white ${className}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Rain
          </span>
          <img src="/rainxyz.jpg" alt="Rain" className="h-7 w-10 rounded object-cover" />
        </div>
        <div>
          <p className="mb-3 font-mono text-[13px] tracking-[0.15em] text-white/50">
            {showCardDetails && decryptedCardData
              ? formatCardNumber(decryptedCardData.cardNumber)
              : `•••• •••• •••• ${last4}`}
          </p>
          <div className="flex items-end justify-between text-[11px]">
            <div>
              <p className="mb-0.5 uppercase tracking-wider text-white/30">Name</p>
              <p className="text-white/60">
                {cardData?.displayName || walletEmail || "Cardholder"}
              </p>
            </div>
            <div className="text-right">
              <p className="mb-0.5 uppercase tracking-wider text-white/30">CVC</p>
              <p className="font-mono text-white/60">
                {showCardDetails && decryptedCardData ? decryptedCardData.cvc : "•••"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Pre-card modal (shown when card not yet issued) ─── */
  const preCardModal = showManage && step !== "card-issued" && (
    <>
      <div
        className="animate-fade-in fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
        onClick={onCloseManage}
      />
      <div className="animate-modal-in fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] shadow-2xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute right-1/4 top-0 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-blue-500/[0.06] blur-[100px]" />
          </div>
          <button
            onClick={onCloseManage}
            className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-all hover:bg-white/10 hover:text-white/70"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="relative px-8 pb-8 pt-10">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-gradient-to-br from-blue-500/20 to-emerald-500/20">
                <CreditCard size={24} className="text-white/70" />
              </div>
              <h2 className="mb-1 text-xl font-semibold text-white">Virtual Cards</h2>
              <p className="text-sm text-white/40">
                Get a virtual Visa card backed by crypto collateral
              </p>
            </div>

            {initialLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : step === "signup" ? (
              <div>
                <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="mb-1 text-sm font-medium text-white/80">Rain Virtual Visa</p>
                  <p className="text-xs text-white/40">
                    Apply for a virtual card powered by Rain. Uses test KYC data for demo.
                  </p>
                </div>
                <button
                  onClick={handleApply}
                  disabled={isLoading || !walletEmail}
                  className="w-full rounded-2xl bg-emerald-500 py-4 text-[15px] font-semibold text-white shadow-[0_8px_32px_-8px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Applying...
                    </span>
                  ) : (
                    "Apply for Card"
                  )}
                </button>
              </div>
            ) : step === "contract-created" ? (
              <div>
                <div className="mb-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.08] p-4">
                  <p className="mb-1 text-sm font-medium text-emerald-300/90">Contract Ready</p>
                  <p className="font-mono text-xs text-emerald-300/60">
                    {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={handleIssueCard}
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-emerald-500 py-4 text-[15px] font-semibold text-white shadow-[0_8px_32px_-8px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Issuing...
                    </span>
                  ) : (
                    "Issue Virtual Card"
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
      `}</style>
    </>
  );

  /* ─── Management Modal ─── */
  const manageModal = showManage && step === "card-issued" && cardData && (
    <>
      <div
        className="animate-fade-in fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
        onClick={onCloseManage}
      />
      <div className="animate-modal-in fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] shadow-2xl">
          {/* Background blurs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute right-1/4 top-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-blue-500/[0.06] blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-[300px] w-[300px] translate-y-1/2 rounded-full bg-emerald-500/[0.05] blur-[80px]" />
          </div>

          {/* Close */}
          <button
            onClick={onCloseManage}
            className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-all hover:bg-white/10 hover:text-white/70"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="relative flex-1 overflow-y-auto px-8 pb-8 pt-10">
            {/* Header */}
            <div className="mb-6">
              <h2 className="mb-1 text-xl font-semibold text-white">Your Card</h2>
              <p className="text-sm text-white/40">Rain Virtual Visa · •••• {last4}</p>
            </div>

            {/* Card visual */}
            <CardVisual className="mb-6 aspect-[1.7/1]" />

            {/* Action buttons row — Wise style */}
            <div className="mb-8 flex items-center justify-center gap-6">
              <button
                onClick={() => (showCardDetails ? setShowCardDetails(false) : handleRevealCard())}
                disabled={isRevealing}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] transition-colors group-hover:bg-white/[0.14]">
                  {showCardDetails ? (
                    <EyeOff size={20} className="text-white/70" />
                  ) : (
                    <Eye size={20} className="text-white/70" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-white/50">
                  {isRevealing ? "..." : showCardDetails ? "Conceal" : "Reveal"}
                </span>
              </button>

              <button
                onClick={() =>
                  document.getElementById("fund-section")?.scrollIntoView({ behavior: "smooth" })
                }
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] transition-colors group-hover:bg-white/[0.14]">
                  <Plus size={20} className="text-white/70" />
                </div>
                <span className="text-[11px] font-medium text-white/50">Fund</span>
              </button>

              <button disabled className="group flex flex-col items-center gap-2 opacity-40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
                  <Lock size={20} className="text-white/70" />
                </div>
                <span className="text-[11px] font-medium text-white/50">Freeze</span>
              </button>
            </div>

            {/* Spending section */}
            {creditBalances && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/70">Spending</h3>
                  <button
                    onClick={() => refreshCreditBalances()}
                    disabled={isRefreshing}
                    className="text-[11px] text-white/30 transition-colors hover:text-white/60 disabled:opacity-50"
                  >
                    {isRefreshing ? "..." : "Refresh"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Credit Limit",
                      value: creditBalances.creditLimit,
                      color: "text-white",
                    },
                    {
                      label: "Spending Power",
                      value: creditBalances.spendingPower,
                      color: "text-emerald-400",
                    },
                    {
                      label: "Pending",
                      value: creditBalances.pendingCharges,
                      color: creditBalances.pendingCharges > 0 ? "text-amber-400" : "text-white/60",
                    },
                    {
                      label: "Balance Due",
                      value: creditBalances.balanceDue,
                      color: creditBalances.balanceDue > 0 ? "text-red-400" : "text-emerald-400",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
                    >
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">
                        {label}
                      </p>
                      <p className={`text-sm font-semibold ${color}`}>${value.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fund section */}
            <div id="fund-section" className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-white/70">Fund Card</h3>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="mb-3 text-xs text-white/40">Mint RUSD and deposit as collateral</p>
                <div className="mb-3 flex gap-2">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setRusdAmount(amt.toString())}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                        rusdAmount === amt.toString()
                          ? "border border-white/[0.15] bg-white/[0.12] text-white"
                          : "border border-white/[0.06] bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleFundCard}
                  disabled={
                    isLoading ||
                    !rusdAmount ||
                    parseFloat(rusdAmount) <= 0 ||
                    parseFloat(rusdAmount) > 100
                  }
                  className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_-4px_rgba(16,185,129,0.4)] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing...
                    </span>
                  ) : (
                    `Fund $${rusdAmount}`
                  )}
                </button>
              </div>
            </div>

            {/* Collateral section */}
            {contractData && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/70">Collateral</h3>
                  <button
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                    className="text-[11px] text-white/30 transition-colors hover:text-white/60 disabled:opacity-50"
                  >
                    {isRefreshing ? "..." : "Refresh"}
                  </button>
                </div>
                {contractAddress && (
                  <div className="mb-3 flex items-center gap-2">
                    <p className="text-[11px] text-white/30">Contract</p>
                    <p className="font-mono text-[11px] text-white/50">
                      {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(contractAddress)}
                      className="text-white/20 transition-colors hover:text-white/50"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">RUSD</p>
                    <p
                      className={`text-sm font-semibold ${parseFloat(contractData.rusdToken?.balance || "0") > 0 ? "text-emerald-400" : "text-white/30"}`}
                    >
                      ${contractData.rusdToken?.balance || "0.00"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-white/30">USDC</p>
                    <p
                      className={`text-sm font-semibold ${
                        parseFloat(
                          contractData.tokens?.find(
                            (t: ContractToken) => t.address === USDC_CONTRACT_ADDRESS
                          )?.balance || "0"
                        ) > 0
                          ? "text-emerald-400"
                          : "text-white/30"
                      }`}
                    >
                      $
                      {contractData.tokens?.find(
                        (t: ContractToken) => t.address === USDC_CONTRACT_ADDRESS
                      )?.balance || "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
      `}</style>
    </>
  );

  return (
    <>
      {preCardModal}
      {manageModal}
    </>
  );
}

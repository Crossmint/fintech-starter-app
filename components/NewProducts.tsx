import { useWallet } from "@crossmint/client-sdk-react-ui";
import { Container } from "./common/Container";
import { useYields, useYieldPositions } from "@/hooks/useYields";

interface NewProductProps {
  title: string;
  description: string;
  image: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: React.ReactNode;
}

interface NewProductsProps {
  onEarnYieldClick?: () => void;
}

const NewProduct = ({ title, description, image, onClick, isActive, badge }: NewProductProps) => {
  const isClickable = isActive && onClick;

  return (
    <Container
      className={`flex flex-1 justify-between ${
        isClickable ? "hover:border-primary/30 cursor-pointer transition hover:shadow-md" : ""
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center">
          <img className="w-fit" src={image} alt={title} />
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="text-sm text-slate-500">{description}</div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-start md:justify-center">
        {badge ? (
          badge
        ) : isActive ? (
          <div className="bg-primary/10 text-primary min-w-[92px] rounded-3xl px-2 py-1 text-center text-xs font-medium">
            Available
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground min-w-[92px] rounded-3xl px-2 py-1 text-xs font-medium">
            Coming soon
          </div>
        )}
      </div>
    </Container>
  );
};

export function NewProducts({ onEarnYieldClick }: NewProductsProps) {
  const { wallet } = useWallet();
  const { bestApy } = useYields("base");
  const { positionCount } = useYieldPositions(wallet?.address);

  // Format APY for display
  const formatApy = (apy: number) => `${(apy * 100).toFixed(1)}%`;

  // Build the badge based on position count
  const getYieldBadge = () => {
    if (positionCount > 0) {
      return (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 rounded-3xl bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {positionCount} Active
          </div>
          <div className="text-primary text-xs font-medium">Earning yield</div>
        </div>
      );
    }
    return null;
  };

  const newProducts: (NewProductProps & { id: string })[] = [
    {
      id: "card",
      title: "Get your card",
      description: "Set up a card to start using your funds",
      image: "/credit-card-pro.png",
      isActive: false,
    },
    {
      id: "earn-yield",
      title: "Earn yield",
      description: `Get up to ${formatApy(bestApy || 0.042)} APY on your USDC`,
      image: "/earn-yield.png",
      onClick: onEarnYieldClick,
      isActive: true,
      badge: getYieldBadge(),
    },
  ];

  return (
    <div className="my-2 flex flex-col gap-2 md:flex-row">
      {newProducts.map((product) => (
        <NewProduct key={product.id} {...product} />
      ))}
    </div>
  );
}

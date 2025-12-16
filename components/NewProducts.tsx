import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { Container } from "./common/Container";
import { useYields } from "@/hooks/useYields";
import { cn } from "@/lib/utils";

interface NewProductProps {
  title: string;
  description: string;
  image: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface NewProductsProps {
  onEarnYieldClick?: () => void;
}

const NewProduct = ({ title, description, image, onClick, isActive }: NewProductProps) => {
  const isClickable = isActive && onClick;

  return (
    <Container
      className={cn(
        "flex flex-1 items-center justify-between gap-3 py-4",
        isClickable && "hover:border-primary/30 cursor-pointer transition hover:shadow-md"
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col justify-center">
          <Image
            className="h-fit w-12"
            src={image}
            alt={title}
            width={48}
            height={48}
            unoptimized
          />
        </div>
        <div className="flex flex-col">
          <div className="text-md flex items-center gap-2 font-semibold text-gray-900">
            {title}
            {!isActive && (
              <span className="text-muted-foreground text-xs font-normal">Coming soon</span>
            )}
          </div>
          <div className="text-muted-foreground text-sm">{description}</div>
        </div>
      </div>
      {isClickable && <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />}
    </Container>
  );
};

export function NewProducts({ onEarnYieldClick }: NewProductsProps) {
  const { bestApy } = useYields();

  // Format APY for display
  const formatApy = (apy: number) => `${(apy * 100).toFixed(1)}%`;

  const newProducts: (NewProductProps & { id: string })[] = [
    {
      id: "card",
      title: "Get your card",
      description: "Set up a card to start using your funds",
      image: "/credit-card.png",
      isActive: false,
    },
    {
      id: "earn-yield",
      title: "Earn yield",
      description: `Get up to ${formatApy(bestApy || 0.042)} APY on your USDC`,
      image: "/earn-yield.png",
      onClick: onEarnYieldClick,
      isActive: true,
    },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3 md:flex-row">
      {newProducts.map((product) => (
        <NewProduct key={product.id} {...product} />
      ))}
    </div>
  );
}

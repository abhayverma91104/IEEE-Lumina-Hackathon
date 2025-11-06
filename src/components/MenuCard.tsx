import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

interface MenuCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  estimatedTime: number;
  available: boolean;
}

const MenuCard = ({ id, name, category, price, estimatedTime, available }: MenuCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!available) {
      toast.error("This item is currently unavailable");
      return;
    }

    addItem({ id, name, price, category });
    toast.success(`${name} added to cart!`);
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${!available ? "opacity-50" : ""}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{category}</p>
          </div>
          <Badge className="bg-secondary text-secondary-foreground">
            {estimatedTime} min
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-primary">₹{price}</span>
          <Button
            size="icon"
            onClick={handleAddToCart}
            disabled={!available}
            className="rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Simple inline Badge component since we're not using shadcn's badge
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${className}`}>
    {children}
  </span>
);

export default MenuCard;

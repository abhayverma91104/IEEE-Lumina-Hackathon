import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock, ChefHat, Package } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  token_number: number;
  status: string;
  total_price: number;
  created_at: string;
}

const Track = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error: any) {
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchOrder, 5000);

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
          if (payload.new.status === "ready") {
            toast.success("🎉 Your order is ready for pickup!");
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued":
        return "hsl(var(--status-queued))";
      case "preparing":
        return "hsl(var(--status-preparing))";
      case "ready":
        return "hsl(var(--status-ready))";
      case "delivered":
        return "hsl(var(--status-delivered))";
      default:
        return "hsl(var(--muted))";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <Clock className="w-6 h-6" />;
      case "preparing":
        return <ChefHat className="w-6 h-6" />;
      case "ready":
        return <Package className="w-6 h-6" />;
      case "delivered":
        return <CheckCircle2 className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "queued":
        return 1;
      case "preparing":
        return 2;
      case "ready":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Order not found</h2>
          <p className="text-muted-foreground mb-4">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate("/")}>Back to Menu</Button>
        </Card>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Button>

        <Card className="p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: getStatusColor(order.status), color: "white" }}>
              {getStatusIcon(order.status)}
            </div>
            <h1 className="text-3xl font-bold mb-2">Order #{order.token_number}</h1>
            <p className="text-muted-foreground capitalize">
              Status: <span className="font-semibold" style={{ color: getStatusColor(order.status) }}>
                {order.status}
              </span>
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {/* Progress bar */}
            <div className="relative">
              <div className="flex justify-between mb-2">
                <span className={`text-sm font-medium ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                  Queued
                </span>
                <span className={`text-sm font-medium ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                  Preparing
                </span>
                <span className={`text-sm font-medium ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                  Ready
                </span>
                <span className={`text-sm font-medium ${currentStep >= 4 ? "text-primary" : "text-muted-foreground"}`}>
                  Delivered
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {order.status === "ready" && (
              <div className="bg-primary/10 border border-primary rounded-lg p-4 text-center">
                <p className="font-semibold text-primary">
                  🎉 Your order is ready! Please collect it from the counter.
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₹{order.total_price}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Order Time</span>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>This page updates automatically. No need to refresh!</p>
        </div>
      </div>
    </div>
  );
};

export default Track;

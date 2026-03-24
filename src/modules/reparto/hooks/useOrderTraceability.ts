import { useEffect, useState } from "react";
import api from "../../../api/api";
import type {
  DeliveryAuditEvent,
  DeliveryTraceability,
} from "../types/delivery.types";

interface TraceabilityResponse extends DeliveryTraceability {
  auditEvents: DeliveryAuditEvent[];
}

export const useOrderTraceability = (orderId?: number) => {
  const [data, setData] = useState<TraceabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${orderId}/traceability`);
        setData(res.data);
      } catch (error) {
        console.error("Error cargando trazabilidad:", error);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [orderId]);

  return {
    data,
    loading,
  };
};

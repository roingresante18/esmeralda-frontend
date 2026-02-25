import { useState, useRef, useEffect } from "react";
import api from "../../../api/api";

export type Client = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;

  municipality?: {
    id: number;
    name: string;
  };
};

export function useClientSearch() {
  const [clientQuery, setClientQuery] = useState("");
  const [clientsFound, setClientsFound] = useState<Client[]>([]);

  const latestQueryRef = useRef("");

  useEffect(() => {
    latestQueryRef.current = clientQuery;

    if (clientQuery.trim().length < 3) {
      setClientsFound([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/clients/search", {
          params: { q: clientQuery.trim() },
          signal: controller.signal,
        });

        // Solo actualizamos si la query sigue siendo la misma
        if (latestQueryRef.current === clientQuery) {
          setClientsFound(res.data);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [clientQuery]);

  const selectClient = (client: Client) => {
    // Limpiamos resultados y query, pero **no tocamos la orden ni el municipio**
    setClientsFound([]);
    setClientQuery("");
    return client;
  };

  const clearResults = () => setClientsFound([]);

  return {
    clientQuery,
    setClientQuery,
    clientsFound,
    selectClient,
    clearResults,
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { deliveryApi } from "../api/delivery.api";
import type {
  DriverDailySettlement,
  DriverExpense,
  ExpenseType,
} from "../types/delivery.types";

const createEmptySettlement = (
  driverId: number,
  date: string,
): DriverDailySettlement => ({
  driverId,
  date,
  assignedOrders: 0,
  deliveredOrders: 0,
  partialDeliveredOrders: 0,
  pendingOrders: 0,
  rescheduledOrders: 0,
  notDeliveredOrders: 0,
  cashCollected: 0,
  transferCollected: 0,
  totalCollected: 0,
  openingCash: 0,
  expenses: [],
  expectedClosingBalance: 0,
  declaredClosingBalance: null,
  difference: null,
  auditLog: [],
});

export const useDeliverySettlement = (driverId: number, date: string) => {
  const [settlement, setSettlement] = useState<DriverDailySettlement>(
    createEmptySettlement(driverId, date),
  );
  const [loading, setLoading] = useState(false);

  const fetchSettlement = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deliveryApi.getSettlement(driverId, date);
      setSettlement(data);
    } catch {
      setSettlement(createEmptySettlement(driverId, date));
    } finally {
      setLoading(false);
    }
  }, [driverId, date]);

  useEffect(() => {
    fetchSettlement();
  }, [fetchSettlement]);

  const saveOpeningCash = async (amount: number) => {
    await deliveryApi.saveOpeningCash(driverId, date, amount);
    await fetchSettlement();
  };

  const addExpense = async (payload: {
    type: ExpenseType;
    amount: number;
    note?: string;
    createdBy: string;
  }) => {
    const expense: Omit<DriverExpense, "id"> = {
      ...payload,
      createdAt: new Date().toISOString(),
    };
    await deliveryApi.createExpense(driverId, date, expense);
    await fetchSettlement();
  };

  const declareClosingBalance = async (amount: number) => {
    await deliveryApi.declareClosingBalance(driverId, date, amount);
    await fetchSettlement();
  };

  const computed = useMemo(() => {
    const expensesTotal = settlement.expenses.reduce(
      (acc, e) => acc + e.amount,
      0,
    );
    const expectedClosingBalance =
      settlement.openingCash + settlement.cashCollected - expensesTotal;

    const difference =
      settlement.declaredClosingBalance != null
        ? settlement.declaredClosingBalance - expectedClosingBalance
        : null;

    return {
      expensesTotal,
      expectedClosingBalance,
      difference,
    };
  }, [settlement]);

  return {
    settlement,
    loading,
    fetchSettlement,
    saveOpeningCash,
    addExpense,
    declareClosingBalance,
    computed,
  };
};

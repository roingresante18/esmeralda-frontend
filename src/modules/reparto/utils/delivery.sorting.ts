import type { DeliveryOrder, MunicipalityGroup } from "../types/delivery.types";

export const sortOrdersByOperationalCriteria = (
  orders: DeliveryOrder[],
  driverLocation?: { lat: number; lng: number } | null,
) => {
  const distance = (a?: { lat: number; lng: number } | null) => {
    if (!a || !driverLocation) return Number.MAX_SAFE_INTEGER;
    return Math.sqrt(
      Math.pow(a.lat - driverLocation.lat, 2) +
        Math.pow(a.lng - driverLocation.lng, 2),
    );
  };

  return [...orders].sort((a, b) => {
    const priorityA = a.priority ?? 9999;
    const priorityB = b.priority ?? 9999;
    if (priorityA !== priorityB) return priorityA - priorityB;

    const routeA = a.routeOrder ?? 9999;
    const routeB = b.routeOrder ?? 9999;
    if (routeA !== routeB) return routeA - routeB;

    return distance(a.orderGps) - distance(b.orderGps);
  });
};

export const groupOrdersByMunicipality = (
  orders: DeliveryOrder[],
): MunicipalityGroup[] => {
  const map = new Map<string, MunicipalityGroup>();

  orders.forEach((order) => {
    if (!map.has(order.municipality)) {
      map.set(order.municipality, {
        municipality: order.municipality,
        municipalityOrder: order.municipalityOrder ?? 9999,
        zone: order.zone,
        count: 0,
        deliveredCount: 0,
        pendingCount: 0,
        orders: [],
      });
    }

    const group = map.get(order.municipality)!;
    group.orders.push(order);
    group.count += 1;
    if (["DELIVERED", "PARTIAL_DELIVERED"].includes(order.deliveryStatus)) {
      group.deliveredCount += 1;
    } else {
      group.pendingCount += 1;
    }
  });

  return [...map.values()]
    .filter((group) => group.count > 0)
    .sort((a, b) => a.municipalityOrder - b.municipalityOrder);
};

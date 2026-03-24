import type { DeliveryOrder, MunicipalityGroup } from "../types/delivery.types";

const getApproxDistance = (
  a?: { lat: number; lng: number } | null,
  b?: { lat: number; lng: number } | null,
) => {
  if (!a || !b) return Number.MAX_SAFE_INTEGER;

  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
};

export const sortOrdersByOperationalCriteria = (
  orders: DeliveryOrder[],
  driverLocation?: { lat: number; lng: number } | null,
) => {
  return [...orders].sort((a, b) => {
    const statusPriority = (status: DeliveryOrder["deliveryStatus"]) => {
      switch (status) {
        case "IN_DELIVERY":
          return 1;
        case "ASSIGNED":
          return 2;
        case "PENDING_DELIVERY":
          return 3;
        case "PARTIAL_DELIVERED":
          return 4;
        case "RESCHEDULED":
          return 5;
        case "NOT_DELIVERED":
          return 6;
        case "DELIVERED":
          return 7;
        default:
          return 99;
      }
    };

    const statusA = statusPriority(a.deliveryStatus);
    const statusB = statusPriority(b.deliveryStatus);
    if (statusA !== statusB) return statusA - statusB;

    const priorityA = a.priority ?? 9999;
    const priorityB = b.priority ?? 9999;
    if (priorityA !== priorityB) return priorityA - priorityB;

    const routeA = a.routeOrder ?? 9999;
    const routeB = b.routeOrder ?? 9999;
    if (routeA !== routeB) return routeA - routeB;

    const gpsA = a.orderGps ?? a.customerGps ?? null;
    const gpsB = b.orderGps ?? b.customerGps ?? null;

    const distanceA = getApproxDistance(driverLocation ?? null, gpsA);
    const distanceB = getApproxDistance(driverLocation ?? null, gpsB);
    if (distanceA !== distanceB) return distanceA - distanceB;

    return a.id - b.id;
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

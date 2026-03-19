import type { DeliveryDataFormValues } from "../types/delivery.types";

export interface DeliveryDataFormErrors {
  deliveryDate?: string;
  paymentMethod?: string;
  address?: string;
  municipality?: string;
  zone?: string;
}

export const validateDeliveryDataForm = (
  values: DeliveryDataFormValues,
): DeliveryDataFormErrors => {
  const errors: DeliveryDataFormErrors = {};

  if (!values.deliveryDate) {
    errors.deliveryDate = "La fecha de entrega es obligatoria.";
  }

  if (!values.paymentMethod) {
    errors.paymentMethod = "El método de pago es obligatorio.";
  }

  if (!values.address?.trim()) {
    errors.address = "La dirección es obligatoria.";
  }

  if (!values.municipality?.trim()) {
    errors.municipality = "El municipio es obligatorio.";
  }

  if (!values.zone?.trim()) {
    errors.zone = "La zona es obligatoria.";
  }

  return errors;
};

export const hasDeliveryDataErrors = (
  errors: DeliveryDataFormErrors,
): boolean => {
  return Object.values(errors).some(Boolean);
};

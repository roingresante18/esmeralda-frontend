import type { DeliveryDataFormValues } from "../types/delivery.types";

export interface DeliveryDataFormErrors {
  deliveryDate?: string;
  paymentMethod?: string;
  address?: string;
  municipality?: string;
  zone?: string;
}

const isValidDateValue = (value?: string) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export const validateDeliveryDataForm = (
  values: DeliveryDataFormValues,
): DeliveryDataFormErrors => {
  const errors: DeliveryDataFormErrors = {};

  if (!values.deliveryDate) {
    errors.deliveryDate = "La fecha de entrega es obligatoria.";
  } else if (!isValidDateValue(values.deliveryDate)) {
    errors.deliveryDate = "La fecha de entrega no es válida.";
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

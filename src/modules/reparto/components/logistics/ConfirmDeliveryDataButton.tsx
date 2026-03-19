import { Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export const ConfirmDeliveryDataButton = ({ onClick, disabled }: Props) => {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<CheckCircleIcon />}
      onClick={onClick}
      disabled={disabled}
      fullWidth
    >
      Confirmar para reparto
    </Button>
  );
};

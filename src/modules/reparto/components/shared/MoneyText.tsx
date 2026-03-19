import { Typography, type TypographyProps } from "@mui/material";

interface Props extends TypographyProps {
  value: number;
}

export const MoneyText = ({ value, ...props }: Props) => {
  return (
    <Typography {...props}>
      ${Number(value || 0).toLocaleString("es-AR")}
    </Typography>
  );
};

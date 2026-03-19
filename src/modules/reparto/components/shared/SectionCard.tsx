import { Paper, type PaperProps } from "@mui/material";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<PaperProps>;

export const SectionCard = ({ children, sx, ...rest }: Props) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
};

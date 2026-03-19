import { Box, type BoxProps } from "@mui/material";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<BoxProps>;

export const MobileStickyFooter = ({ children, sx, ...rest }: Props) => {
  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        p: 1.5,
        mt: 2,
        backgroundColor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        zIndex: 10,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

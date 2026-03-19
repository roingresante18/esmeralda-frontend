import { Stack, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

interface Props {
  title: string;
  description?: string;
}

export const EmptyState = ({ title, description }: Props) => {
  return (
    <Stack
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        py: 6,
        textAlign: "center",
      }}
    >
      <InboxIcon color="disabled" sx={{ fontSize: 42 }} />
      <Typography fontWeight={800}>{title}</Typography>
      {description ? (
        <Typography color="text.secondary">{description}</Typography>
      ) : null}
    </Stack>
  );
};

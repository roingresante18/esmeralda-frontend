import { Avatar, Chip, Stack, Typography } from "@mui/material";

interface Props {
  driverName?: string;
  dateLabel: string;
}

export const DeliveryHeader = ({ driverName = "Chofer", dateLabel }: Props) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1.5}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Avatar sx={{ width: 42, height: 42 }}>🚚</Avatar>
        <Stack spacing={0.2}>
          <Typography variant="h6" fontWeight={900}>
            Reparto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {driverName}
          </Typography>
        </Stack>
      </Stack>

      <Chip label={dateLabel} color="primary" variant="outlined" />
    </Stack>
  );
};

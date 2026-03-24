import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import type { MunicipalityGroup } from "../../types/delivery.types";

interface Props {
  group: MunicipalityGroup;
  onClick: (municipality: string) => void;
}

export const MunicipalityProgressCard = ({ group, onClick }: Props) => {
  const progress =
    group.count === 0 ? 0 : (group.deliveredCount / group.count) * 100;

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardActionArea
        onClick={() => onClick(group.municipality)}
        sx={{ borderRadius: 3 }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <LocationCityIcon color="primary" />
                <Stack spacing={0.3}>
                  <Typography fontWeight={900}>{group.municipality}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orden {group.municipalityOrder}
                  </Typography>
                </Stack>
              </Stack>

              <Chip
                label={`${group.count} pedidos`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 999 }}
            />

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`${group.pendingCount} pendientes`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${group.deliveredCount} cerrados`}
                size="small"
                color="success"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

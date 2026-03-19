import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { DeliveryOrder, MunicipalityGroup } from "../../types/delivery.types";
import { DriverOrderCard } from "./DriverOrderCard";

interface Props {
  groups: MunicipalityGroup[];
  onOpenDetail: (order: DeliveryOrder) => void;
  onStartDelivery: (order: DeliveryOrder) => void;
}

export const MunicipalityList = ({ groups, onOpenDetail, onStartDelivery }: Props) => {
  return (
    <Stack spacing={1.2}>
      {groups.map((group) => (
        <Accordion key={group.municipality} defaultExpanded={groups.length === 1} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ width: "100%", pr: 1 }}
            >
              <Stack>
                <Typography fontWeight={800}>{group.municipality}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {group.pendingCount} pendientes · {group.deliveredCount} cerrados
                </Typography>
              </Stack>
              <Badge badgeContent={group.count} color="primary" />
            </Stack>
          </AccordionSummary>

          <AccordionDetails>
            <Stack spacing={1.2}>
              {group.orders.map((order) => (
                <DriverOrderCard
                  key={order.id}
                  order={order}
                  onOpenDetail={onOpenDetail}
                  onStartDelivery={onStartDelivery}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
};
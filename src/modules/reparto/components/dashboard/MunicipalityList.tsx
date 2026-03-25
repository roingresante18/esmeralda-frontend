import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type {
  DeliveryOrder,
  MunicipalityGroup,
} from "../../types/delivery.types";
import { DriverOrderCard } from "./DriverOrderCard";

interface Props {
  groups: MunicipalityGroup[];
  onOpenDetail: (order: DeliveryOrder) => void;
  onStartDelivery: (order: DeliveryOrder) => void;
  startingOrderId?: number | null;
}

export const MunicipalityList = ({
  groups,
  onOpenDetail,
  onStartDelivery,
  startingOrderId = null,
}: Props) => {
  return (
    <Stack spacing={1.2}>
      {groups.map((group) => (
        <Accordion
          key={group.municipality}
          defaultExpanded={groups.length === 1}
          disableGutters
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "none",
            "&:before": {
              display: "none",
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              px: 1.5,
              py: 0.5,
              minHeight: 64,
              "& .MuiAccordionSummary-content": {
                my: 1,
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ width: "100%", pr: 1 }}
              spacing={1}
            >
              <Stack spacing={0.2} minWidth={0}>
                <Typography fontWeight={800} noWrap>
                  {group.municipality}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {group.pendingCount} pendientes · {group.deliveredCount}{" "}
                  cerrados
                </Typography>

                {group.zone ? (
                  <Typography variant="caption" color="text.secondary">
                    Zona: {group.zone}
                  </Typography>
                ) : null}
              </Stack>

              <Box sx={{ flexShrink: 0 }}>
                <Badge badgeContent={group.count} color="primary" />
              </Box>
            </Stack>
          </AccordionSummary>

          <AccordionDetails
            sx={{
              px: 1.2,
              pb: 1.2,
              pt: 0,
            }}
          >
            <Stack spacing={1.2}>
              {group.orders.map((order) => (
                <DriverOrderCard
                  key={order.id}
                  order={order}
                  onOpenDetail={onOpenDetail}
                  onStartDelivery={onStartDelivery}
                  loading={startingOrderId === order.id}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
};

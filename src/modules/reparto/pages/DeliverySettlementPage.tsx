import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { useDeliverySettlement } from "../hooks/useDeliverySettlement";
import type { ExpenseType } from "../types/delivery.types";

interface Props {
  driverId: number;
  date?: string;
}

export default function DeliverySettlementPage({
  driverId,
  date = new Date().toISOString().split("T")[0],
}: Props) {
  const {
    settlement,
    loading,
    saveOpeningCash,
    addExpense,
    declareClosingBalance,
    computed,
  } = useDeliverySettlement(driverId, date);

  const [openingCashInput, setOpeningCashInput] = useState(
    settlement.openingCash || 0,
  );
  const [declaredClosingInput, setDeclaredClosingInput] = useState<number>(0);

  const [expenseType, setExpenseType] = useState<ExpenseType>("TOLL");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNote, setExpenseNote] = useState("");

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Cierre de reparto
        </Typography>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography fontWeight={800}>Resumen del día</Typography>
            <Typography>
              Efectivo cobrado: $
              {settlement.cashCollected.toLocaleString("es-AR")}
            </Typography>
            <Typography>
              Transferencia cobrada: $
              {settlement.transferCollected.toLocaleString("es-AR")}
            </Typography>
            <Typography fontWeight={800}>
              Total general: $
              {settlement.totalCollected.toLocaleString("es-AR")}
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography fontWeight={800}>Monto inicial del chofer</Typography>
            <TextField
              size="small"
              type="number"
              label="Cambio / efectivo operativo"
              value={openingCashInput}
              onChange={(e) => setOpeningCashInput(Number(e.target.value))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => saveOpeningCash(openingCashInput)}
            >
              Guardar monto inicial
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography fontWeight={800}>Gastos del día</Typography>

            <TextField
              select
              size="small"
              label="Tipo"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
              fullWidth
            >
              <MenuItem value="TOLL">Peaje</MenuItem>
              <MenuItem value="BROMATOLOGY">Bromatología</MenuItem>
              <MenuItem value="FUEL">Combustible</MenuItem>
              <MenuItem value="OTHER">Otro</MenuItem>
            </TextField>

            <TextField
              size="small"
              type="number"
              label="Monto"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(Number(e.target.value))}
              fullWidth
            />

            <TextField
              size="small"
              label="Nota"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              fullWidth
            />

            <Button
              variant="outlined"
              onClick={() =>
                addExpense({
                  type: expenseType,
                  amount: expenseAmount,
                  note: expenseNote,
                  createdBy: "driver",
                })
              }
            >
              Agregar gasto
            </Button>

            <Divider />

            <List dense>
              {settlement.expenses.map((expense) => (
                <ListItem key={expense.id} disablePadding>
                  <ListItemText
                    primary={`${expense.type} · $${expense.amount.toLocaleString("es-AR")}`}
                    secondary={expense.note || expense.createdAt}
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography fontWeight={800}>Rendición final</Typography>
            <Typography>
              Efectivo esperado: $
              {computed.expectedClosingBalance.toLocaleString("es-AR")}
            </Typography>
            <Typography>
              Total gastos: ${computed.expensesTotal.toLocaleString("es-AR")}
            </Typography>

            <TextField
              size="small"
              type="number"
              label="Saldo real declarado"
              value={declaredClosingInput}
              onChange={(e) => setDeclaredClosingInput(Number(e.target.value))}
              fullWidth
            />

            <Button
              variant="contained"
              color="success"
              onClick={() => declareClosingBalance(declaredClosingInput)}
            >
              Confirmar cierre
            </Button>

            {computed.difference != null && (
              <Alert
                severity={computed.difference === 0 ? "success" : "warning"}
              >
                Diferencia: ${computed.difference.toLocaleString("es-AR")}
              </Alert>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography fontWeight={800}>Auditoría</Typography>
            {settlement.auditLog.length === 0 ? (
              <Typography color="text.secondary">
                Sin eventos registrados.
              </Typography>
            ) : (
              settlement.auditLog.map((entry) => (
                <Box key={entry.id}>
                  <Typography fontSize={14} fontWeight={700}>
                    {entry.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entry.createdAt} · {entry.createdBy}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </Paper>

        {loading && (
          <Typography color="text.secondary">Actualizando cierre...</Typography>
        )}
      </Stack>
    </Container>
  );
}

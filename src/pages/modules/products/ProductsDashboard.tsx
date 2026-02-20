import { Grid, Card, CardContent, Typography, Button } from "@mui/material";
import type { Metric } from "./types";
import { useNavigate } from "react-router-dom";
export default function ProductsDashboard({ metrics }: { metrics: Metric[] }) {
  const navigate = useNavigate();

  return (
    <Grid container spacing={2}>
      <Button
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          borderRadius: 50,
          zIndex: 1300,
        }}
        variant="contained"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
      >
        ← Volver
      </Button>
      {metrics.map((m) => (
        <Grid sx={{ gridColumn: "initial" }} key={m.label}>
          <Card>
            <CardContent>
              <Typography variant="overline">{m.label}</Typography>
              <Typography variant="h4">{m.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

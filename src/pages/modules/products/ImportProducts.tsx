import { Button } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import * as XLSX from "xlsx";
import api from "../../../api/api";

export default function ImportProducts() {
  const handleFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    await api.post("/products/import", { products: json });
    alert("Importación completada");
  };

  return (
    <Button component="label" startIcon={<UploadFileIcon />}>
      Importar CSV / Excel
      <input
        hidden
        type="file"
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />
    </Button>
  );
}

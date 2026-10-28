import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import AdmZip from "adm-zip";

describe("Compatibilidade das bibliotecas de importação/exportação atualizadas", () => {
  it("preserva nomes, matrículas e notas em um arquivo XLSX real", () => {
    const rows = [
      { aluno: "João da Silva", matricula: "00123", nota: 87.5 },
      { aluno: "María Vitória", matricula: "00456", nota: 0 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Notas");
    const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const restored = XLSX.read(bytes, { type: "buffer" });
    expect(XLSX.utils.sheet_to_json(restored.Sheets.Notas)).toEqual(rows);
  });

  it("exporta um ZIP com evidências binárias sem alterar os bytes", () => {
    const content = Buffer.from([0, 255, 13, 10, 128]);
    const archive = new AdmZip();
    archive.addFile("evidencias/arquivo.bin", content);
    const restored = new AdmZip(archive.toBuffer());
    expect(restored.readFile("evidencias/arquivo.bin")).toEqual(content);
  });
});

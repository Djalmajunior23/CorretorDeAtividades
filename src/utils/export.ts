import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = `${header}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
};

export const exportToPDF = (tableData: any[], tableHeaders: string[], title: string, filename: string, chartData?: any[]) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    autoTable(doc, {
        head: [tableHeaders],
        body: tableData.map(obj => Object.values(obj)),
        startY: 20
    });
    
    if (chartData && chartData.length > 0) {
        doc.addPage();
        doc.text('Desempenho da Turma', 14, 15);
        autoTable(doc, {
            head: [['Dia', 'Nota']],
            body: chartData.map(obj => [obj.name, obj.nota]),
            startY: 20
        });
    }

    doc.save(`${filename}.pdf`);
};

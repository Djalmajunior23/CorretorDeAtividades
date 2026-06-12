import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

export const exportHtmlToPDF = async (elementId: string, title: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.text(title, 14, 15);
        pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error("Error generating PDF", error);
    }
};

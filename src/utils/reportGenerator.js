const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Advanced Report Generator
 * Generates PDF and Excel reports with charts and formatting
 */

class ReportGenerator {
  /**
   * Generate PDF report
   */
  static async generatePDFReport(data, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const fileName = `report_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../../reports', fileName);

        // Ensure reports directory exists
        if (!fs.existsSync(path.join(__dirname, '../../reports'))) {
          fs.mkdirSync(path.join(__dirname, '../../reports'), { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Add header
        doc
          .fontSize(20)
          .text(options.title || 'WorkOrbit Report', { align: 'center' })
          .moveDown();

        // Add metadata
        doc
          .fontSize(10)
          .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
          .text(`Period: ${options.dateRange?.start || 'N/A'} to ${options.dateRange?.end || 'N/A'}`, { align: 'right' })
          .moveDown(2);

        // Add content sections
        if (data.sections) {
          data.sections.forEach(section => {
            doc
              .fontSize(14)
              .text(section.title, { underline: true })
              .moveDown(0.5);

            if (section.type === 'table') {
              this._addTableToPDF(doc, section.data);
            } else if (section.type === 'text') {
              doc
                .fontSize(10)
                .text(section.content)
                .moveDown();
            } else if (section.type === 'metrics') {
              this._addMetricsToPDF(doc, section.data);
            }

            doc.moveDown(1.5);
          });
        }

        // Add footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .text(
              `Page ${i + 1} of ${pages.count}`,
              50,
              doc.page.height - 50,
              { align: 'center' }
            );
        }

        doc.end();

        stream.on('finish', () => {
          resolve({
            success: true,
            filePath,
            fileName
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add table to PDF
   */
  static _addTableToPDF(doc, tableData) {
    const { headers, rows } = tableData;
    const cellWidth = 100;
    const cellHeight = 25;
    let y = doc.y;

    // Draw headers
    doc
      .fontSize(9)
      .font('Helvetica-Bold');

    headers.forEach((header, i) => {
      doc
        .rect(50 + i * cellWidth, y, cellWidth, cellHeight)
        .stroke()
        .text(header, 55 + i * cellWidth, y + 5, {
          width: cellWidth - 10,
          align: 'left'
        });
    });

    y += cellHeight;
    doc.font('Helvetica');

    // Draw rows
    rows.forEach(row => {
      row.forEach((cell, i) => {
        doc
          .rect(50 + i * cellWidth, y, cellWidth, cellHeight)
          .stroke()
          .text(String(cell), 55 + i * cellWidth, y + 5, {
            width: cellWidth - 10,
            align: 'left'
          });
      });
      y += cellHeight;
    });

    doc.y = y + 10;
  }

  /**
   * Add metrics to PDF
   */
  static _addMetricsToPDF(doc, metrics) {
    const metricsPerRow = 3;
    const boxWidth = 150;
    const boxHeight = 60;
    let x = 50;
    let y = doc.y;

    metrics.forEach((metric, index) => {
      if (index % metricsPerRow === 0 && index !== 0) {
        y += boxHeight + 20;
        x = 50;
      }

      // Draw metric box
      doc
        .rect(x, y, boxWidth, boxHeight)
        .fillAndStroke('#f0f0f0', '#cccccc');

      doc
        .fillColor('#333333')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(metric.label, x + 10, y + 10, {
          width: boxWidth - 20,
          align: 'center'
        });

      doc
        .fontSize(20)
        .text(metric.value, x + 10, y + 30, {
          width: boxWidth - 20,
          align: 'center'
        });

      x += boxWidth + 20;
    });

    doc.y = y + boxHeight + 20;
    doc.fillColor('#000000');
    doc.font('Helvetica');
  }

  /**
   * Generate Excel report
   */
  static async generateExcelReport(data, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

    // Add title
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = options.title || 'WorkOrbit Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add metadata
    worksheet.getCell('A2').value = `Generated: ${new Date().toLocaleString()}`;
    worksheet.getCell('A3').value = `Period: ${options.dateRange?.start || 'N/A'} to ${options.dateRange?.end || 'N/A'}`;

    let currentRow = 5;

    // Add data sections
    if (data.sections) {
      data.sections.forEach(section => {
        // Section title
        worksheet.getCell(`A${currentRow}`).value = section.title;
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        currentRow += 1;

        if (section.type === 'table' && section.data) {
          const { headers, rows } = section.data;

          // Add headers
          headers.forEach((header, i) => {
            const cell = worksheet.getCell(currentRow, i + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
          });
          currentRow += 1;

          // Add rows
          rows.forEach(row => {
            row.forEach((value, i) => {
              worksheet.getCell(currentRow, i + 1).value = value;
            });
            currentRow += 1;
          });
        } else if (section.type === 'metrics' && section.data) {
          section.data.forEach(metric => {
            worksheet.getCell(`A${currentRow}`).value = metric.label;
            worksheet.getCell(`B${currentRow}`).value = metric.value;
            currentRow += 1;
          });
        }

        currentRow += 2; // Add spacing between sections
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Save file
    const fileName = `report_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../../reports', fileName);

    // Ensure reports directory exists
    if (!fs.existsSync(path.join(__dirname, '../../reports'))) {
      fs.mkdirSync(path.join(__dirname, '../../reports'), { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    return {
      success: true,
      filePath,
      fileName
    };
  }

  /**
   * Generate attendance report
   */
  static async generateAttendanceReport(attendanceData, format = 'pdf') {
    const reportData = {
      sections: [
        {
          title: 'Attendance Summary',
          type: 'metrics',
          data: [
            { label: 'Total Check-ins', value: attendanceData.totalCheckIns },
            { label: 'On Time', value: attendanceData.onTime },
            { label: 'Late', value: attendanceData.late },
            { label: 'Punctuality Rate', value: `${attendanceData.punctualityRate}%` }
          ]
        },
        {
          title: 'Attendance Records',
          type: 'table',
          data: {
            headers: ['Employee', 'Date', 'Check In', 'Check Out', 'Hours'],
            rows: attendanceData.records.map(r => [
              r.employeeName,
              r.date,
              r.checkIn,
              r.checkOut,
              r.hours
            ])
          }
        }
      ]
    };

    const options = {
      title: 'Attendance Report',
      dateRange: attendanceData.dateRange
    };

    if (format === 'excel') {
      return this.generateExcelReport(reportData, options);
    } else {
      return this.generatePDFReport(reportData, options);
    }
  }

  /**
   * Generate payroll report
   */
  static async generatePayrollReport(payrollData, format = 'pdf') {
    const reportData = {
      sections: [
        {
          title: 'Payroll Summary',
          type: 'metrics',
          data: [
            { label: 'Total Employees', value: payrollData.totalEmployees },
            { label: 'Total Gross Salary', value: `₹${payrollData.totalGross}` },
            { label: 'Total Deductions', value: `₹${payrollData.totalDeductions}` },
            { label: 'Total Net Salary', value: `₹${payrollData.totalNet}` }
          ]
        },
        {
          title: 'Employee Payroll',
          type: 'table',
          data: {
            headers: ['Employee', 'Designation', 'Gross Salary', 'Deductions', 'Net Salary'],
            rows: payrollData.records.map(r => [
              r.employeeName,
              r.designation,
              `₹${r.gross}`,
              `₹${r.deductions}`,
              `₹${r.net}`
            ])
          }
        }
      ]
    };

    const options = {
      title: 'Payroll Report',
      dateRange: payrollData.dateRange
    };

    if (format === 'excel') {
      return this.generateExcelReport(reportData, options);
    } else {
      return this.generatePDFReport(reportData, options);
    }
  }
}

module.exports = ReportGenerator;


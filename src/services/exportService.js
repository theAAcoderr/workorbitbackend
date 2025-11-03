const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const { createObjectCsvStringifier } = require('csv-writer');
const { logger } = require('../middleware/logger');
const fs = require('fs').promises;
const path = require('path');

class ExportService {
  constructor() {
    this.exportDir = path.join(process.cwd(), 'exports');
    this.ensureExportDir();
  }

  async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create export directory:', error);
    }
  }

  /**
   * Export data to Excel format
   */
  async exportToExcel(data, filename, options = {}) {
    try {
      const {
        sheetName = 'Sheet1',
        columns = null,
        formatters = {}
      } = options;

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Prepare data
      let exportData = data;
      if (columns) {
        exportData = data.map(row => {
          const formattedRow = {};
          columns.forEach(col => {
            const value = row[col.key || col];
            formattedRow[col.header || col] = formatters[col.key]
              ? formatters[col.key](value, row)
              : value;
          });
          return formattedRow;
        });
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const columnWidths = this.calculateColumnWidths(exportData);
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const filepath = path.join(this.exportDir, `${filename}.xlsx`);
      await fs.writeFile(filepath, buffer);

      logger.info('Excel export created', { filename, records: data.length });

      return {
        success: true,
        filepath,
        filename: `${filename}.xlsx`,
        size: buffer.length
      };
    } catch (error) {
      logger.error('Excel export error:', error);
      throw new Error(`Failed to export to Excel: ${error.message}`);
    }
  }

  /**
   * Export data to PDF format
   */
  async exportToPDF(data, filename, options = {}) {
    try {
      const {
        title = 'Report',
        columns = null,
        orientation = 'portrait', // 'portrait' or 'landscape'
        formatters = {},
        headerStyle = {},
        bodyStyle = {}
      } = options;

      // Create PDF
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

      // Prepare table data
      let tableColumns = columns || Object.keys(data[0] || {});
      let tableData = data.map(row => {
        return tableColumns.map(col => {
          const key = col.key || col;
          const value = row[key];
          return formatters[key] ? formatters[key](value, row) : value;
        });
      });

      const headers = tableColumns.map(col => col.header || col);

      // Generate table
      doc.autoTable({
        startY: 30,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          ...headerStyle
        },
        bodyStyles: {
          textColor: 50,
          ...bodyStyle
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 30 }
      });

      // Save PDF
      const filepath = path.join(this.exportDir, `${filename}.pdf`);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      await fs.writeFile(filepath, pdfBuffer);

      logger.info('PDF export created', { filename, records: data.length });

      return {
        success: true,
        filepath,
        filename: `${filename}.pdf`,
        size: pdfBuffer.length
      };
    } catch (error) {
      logger.error('PDF export error:', error);
      throw new Error(`Failed to export to PDF: ${error.message}`);
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(data, filename, options = {}) {
    try {
      const {
        columns = null,
        formatters = {}
      } = options;

      // Prepare columns
      let csvColumns = columns || Object.keys(data[0] || {}).map(key => ({
        id: key,
        title: key
      }));

      if (!Array.isArray(csvColumns)) {
        csvColumns = Object.keys(csvColumns).map(key => ({
          id: key,
          title: csvColumns[key]
        }));
      }

      // Create CSV stringifier
      const csvStringifier = createObjectCsvStringifier({
        header: csvColumns.map(col => ({
          id: col.id || col.key,
          title: col.title || col.header || col.id
        }))
      });

      // Prepare data
      const csvData = data.map(row => {
        const formattedRow = {};
        csvColumns.forEach(col => {
          const key = col.id || col.key;
          const value = row[key];
          formattedRow[key] = formatters[key]
            ? formatters[key](value, row)
            : value;
        });
        return formattedRow;
      });

      // Generate CSV
      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);

      const filepath = path.join(this.exportDir, `${filename}.csv`);
      await fs.writeFile(filepath, csvContent);

      logger.info('CSV export created', { filename, records: data.length });

      return {
        success: true,
        filepath,
        filename: `${filename}.csv`,
        size: Buffer.byteLength(csvContent)
      };
    } catch (error) {
      logger.error('CSV export error:', error);
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Export data to JSON format
   */
  async exportToJSON(data, filename, options = {}) {
    try {
      const { pretty = true } = options;

      const jsonContent = pretty
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

      const filepath = path.join(this.exportDir, `${filename}.json`);
      await fs.writeFile(filepath, jsonContent);

      logger.info('JSON export created', { filename, records: data.length });

      return {
        success: true,
        filepath,
        filename: `${filename}.json`,
        size: Buffer.byteLength(jsonContent)
      };
    } catch (error) {
      logger.error('JSON export error:', error);
      throw new Error(`Failed to export to JSON: ${error.message}`);
    }
  }

  /**
   * Calculate column widths for Excel
   */
  calculateColumnWidths(data) {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const widths = keys.map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Max width 50
    });

    return widths;
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(this.exportDir, file);
        const stats = await fs.stat(filepath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filepath);
          logger.info('Old export file deleted', { file });
        }
      }
    } catch (error) {
      logger.error('Cleanup exports error:', error);
    }
  }

  /**
   * Get export file
   */
  async getExportFile(filename) {
    try {
      const filepath = path.join(this.exportDir, filename);
      const exists = await fs.access(filepath).then(() => true).catch(() => false);

      if (!exists) {
        return null;
      }

      return filepath;
    } catch (error) {
      logger.error('Get export file error:', error);
      return null;
    }
  }
}

// Common formatters
const CommonFormatters = {
  date: (value) => value ? new Date(value).toLocaleDateString() : '',
  datetime: (value) => value ? new Date(value).toLocaleString() : '',
  currency: (value) => value ? `$${parseFloat(value).toFixed(2)}` : '$0.00',
  boolean: (value) => value ? 'Yes' : 'No',
  percentage: (value) => value ? `${parseFloat(value).toFixed(2)}%` : '0%',
  truncate: (maxLength = 50) => (value) => {
    const str = String(value || '');
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }
};

module.exports = {
  ExportService,
  CommonFormatters
};

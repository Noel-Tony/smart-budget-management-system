import React, { useState } from 'react';
import { MdDownload, MdPictureAsPdf, MdTableChart } from 'react-icons/md';
import { exportCSV, exportPDF } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function ExportPanel({ transactions = [], analyticsData = {}, user }) {
  const [exporting, setExporting] = useState(false);

  const handleCSV = () => {
    if (!transactions.length) { toast.error('No transactions to export'); return; }
    exportCSV(transactions);
    toast.success('CSV downloaded!');
  };

  const handlePDF = async () => {
    if (!transactions.length && !analyticsData?.overview) {
      toast.error('No data to export'); return;
    }
    setExporting(true);
    try {
      await exportPDF({ transactions, ...analyticsData }, user);
      toast.success('PDF report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed. Try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-panel">
      <div>
        <div className="export-panel-title">
          <MdDownload style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Export & Reports
        </div>
        <div className="export-panel-sub">
          Download your financial data as CSV or a full PDF report with statistics
        </div>
      </div>
      <div className="export-buttons">
        <button className="btn btn-ghost" onClick={handleCSV}>
          <MdTableChart /> Export CSV
        </button>
        <button className="btn btn-export" onClick={handlePDF} disabled={exporting}>
          {exporting
            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</>
            : <><MdPictureAsPdf /> Download PDF Report</>
          }
        </button>
      </div>
    </div>
  );
}

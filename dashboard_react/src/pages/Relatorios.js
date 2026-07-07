import React, { useState, useEffect } from 'react';
import { FileText, Download, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Relatorios() {
  const [reportType, setReportType] = useState('switches');
  const [format, setFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const reportTypes = [
    { value: 'switches', label: 'Ferrovia - Switches' },
    { value: 'trucks', label: 'Mina - Caminhoes' },
    { value: 'port', label: 'Porto - Navios' },
    { value: 'airport', label: 'Aeroporto - Aeronaves' },
    { value: 'full', label: 'Relatorio Completo' },
  ];

  const formats = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel' },
    { value: 'pdf', label: 'PDF' },
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/reports').catch(() => ({ data: [] }));
      setReports(res.data);
    } catch (e) {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      await axios.post('/api/reports/export', {
        reportType,
        format,
        dateFrom,
        dateTo
      });
      toast.success('Relatorio gerado!');
      fetchReports();
    } catch (e) {
      toast.error('Erro ao gerar relatorio');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const res = await axios.get(`/api/reports/${reportId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error('Erro ao baixar relatorio');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-text">Relatorios</h2>
        <p className="text-sm text-muted mt-0.5">Exportacao de dados e analises</p>
      </div>

      {/* Generator */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={12} className="text-accent" />
          Gerar Novo Relatorio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Tipo</label>
            <div className="space-y-1.5">
              {reportTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    reportType === type.value
                      ? 'border-accent/30 bg-accent/5 text-text'
                      : 'bg-card border-border text-muted hover:text-text hover:border-border'
                  }`}
                >
                  <span>{type.label}</span>
                  {reportType === type.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-2">Formato</label>
              <div className="flex gap-2">
                {formats.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      format === f.value
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-card border-border text-muted hover:text-text'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted uppercase tracking-wider mb-2">Periodo</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-text focus:border-accent focus:outline-none"
                />
                <span className="text-muted text-sm">ate</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-text focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-accent hover:bg-accent/80 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader size={14} className="animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download size={14} />
              Gerar Relatorio
            </>
          )}
        </button>
      </div>

      {/* History */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock size={12} className="text-muted" />
          Relatorios Gerados
        </h3>
        {loadingHistory ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted">Nenhum relatorio gerado</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-border transition-colors">
                <div className={`p-1.5 rounded-lg ${
                  report.status === 'completed' ? 'bg-success/10' :
                  report.status === 'failed' ? 'bg-danger/10' : 'bg-warning/10'
                }`}>
                  {report.status === 'completed' ? <CheckCircle size={14} className="text-success" /> :
                   report.status === 'failed' ? <AlertCircle size={14} className="text-danger" /> :
                   <Loader size={14} className="text-warning animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{report.type || report.reportType}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    <Clock size={10} />
                    <span>{report.created_at ? new Date(report.created_at).toLocaleString('pt-BR') : 'N/A'}</span>
                    <span className="uppercase font-medium">{report.format}</span>
                  </div>
                </div>
                {report.status === 'completed' && (
                  <button
                    onClick={() => downloadReport(report.id)}
                    className="p-1.5 text-muted hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

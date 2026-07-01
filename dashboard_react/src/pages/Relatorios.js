import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
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
    { value: 'switches', label: 'Ferrovia - Switches', icon: '🚂' },
    { value: 'trucks', label: 'Mina - Caminhões', icon: '🚛' },
    { value: 'port', label: 'Porto - Navios', icon: '🚢' },
    { value: 'airport', label: 'Aeroporto - Aeronaves', icon: '✈️' },
    { value: 'full', label: 'Relatório Completo', icon: '📊' },
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
      const res = await axios.post('/api/reports/export', {
        reportType,
        format,
        dateFrom,
        dateTo
      });
      toast.success('Relatório gerado com sucesso!');
      fetchReports();
    } catch (e) {
      toast.error('Erro ao gerar relatório');
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
      toast.error('Erro ao baixar relatório');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <p className="text-sm text-gray-500">Exportação de dados e análises</p>
      </div>

      {/* Gerador */}
      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">Gerar Novo Relatório</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Tipo de Relatório</label>
            <div className="space-y-1.5">
              {reportTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all text-sm ${
                    reportType === type.value
                      ? 'bg-maquete-accent/15 border-maquete-accent/30 text-maquete-accent'
                      : 'bg-maquete-card border-maquete-border hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <span className="text-base">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Formato</label>
              <div className="flex gap-2">
                {formats.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      format === f.value
                        ? 'bg-maquete-accent/15 border-maquete-accent/30 text-maquete-accent'
                        : 'bg-maquete-card border-maquete-border text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Período</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-maquete-card border border-maquete-border rounded-lg text-sm focus:border-maquete-accent focus:outline-none"
                />
                <span className="text-gray-600 text-sm">até</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-maquete-card border border-maquete-border rounded-lg text-sm focus:border-maquete-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center justify-center gap-2 w-full py-3 bg-maquete-accent hover:bg-blue-600 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader size={16} className="animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download size={16} />
              Gerar Relatório
            </>
          )}
        </button>
      </div>

      {/* Histórico */}
      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Relatórios Gerados</h3>
        {loadingHistory ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-maquete-card rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto mb-3 text-gray-600 opacity-50" />
            <p className="text-sm text-gray-500">Nenhum relatório gerado recentemente</p>
            <p className="text-xs text-gray-600 mt-1">Gere seu primeiro relatório acima</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center gap-4 p-3 bg-maquete-card rounded-lg border border-maquete-border hover:border-maquete-border transition-all">
                <div className={`p-2 rounded-lg ${
                  report.status === 'completed' ? 'bg-green-500/15' :
                  report.status === 'failed' ? 'bg-red-500/15' : 'bg-maquete-warning/15'
                }`}>
                  {report.status === 'completed' ? <CheckCircle size={16} className="text-green-400" /> :
                   report.status === 'failed' ? <AlertCircle size={16} className="text-red-400" /> :
                   <Loader size={16} className="text-maquete-warning animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{report.type || report.reportType}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Clock size={10} />
                    <span>{report.created_at ? new Date(report.created_at).toLocaleString('pt-BR') : 'N/A'}</span>
                    <span className="uppercase">{report.format}</span>
                  </div>
                </div>
                {report.status === 'completed' && (
                  <button
                    onClick={() => downloadReport(report.id)}
                    className="p-2 text-gray-400 hover:text-maquete-accent hover:bg-maquete-accent/10 rounded-lg transition-all"
                  >
                    <Download size={16} />
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

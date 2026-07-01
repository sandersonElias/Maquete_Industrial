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
    { value: 'switches', label: 'Ferrovia - Switches', icon: '🚂', color: '#3D9EFF' },
    { value: 'trucks', label: 'Mina - Caminhões', icon: '🚛', color: '#FFB800' },
    { value: 'port', label: 'Porto - Navios', icon: '🚢', color: '#A855F7' },
    { value: 'airport', label: 'Aeroporto - Aeronaves', icon: '✈️', color: '#22C55E' },
    { value: 'full', label: 'Relatório Completo', icon: '📊', color: '#00FFB2' },
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
        <h2 className="text-2xl font-bold bg-gradient-to-r from-maquete-danger to-red-300 bg-clip-text text-transparent">
          Relatórios
        </h2>
        <p className="text-sm text-gray-500 mt-1">Exportação de dados e análises</p>
      </div>

      {/* Generator */}
      <div className="bg-maquete-card/60 backdrop-blur-sm border border-maquete-border rounded-xl p-6"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
          <FileText size={14} className="text-maquete-danger" />
          Gerar Novo Relatório
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-3">Tipo de Relatório</label>
            <div className="space-y-2">
              {reportTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-sm ${
                    reportType === type.value
                      ? 'border-opacity-30 text-white'
                      : 'bg-maquete-card/80 border-maquete-border hover:border-gray-500 text-gray-300'
                  }`}
                  style={reportType === type.value ? {
                    background: `linear-gradient(135deg, ${type.color}15, ${type.color}08)`,
                    borderColor: `${type.color}40`,
                    boxShadow: `0 0 20px ${type.color}10`,
                  } : undefined}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                  {reportType === type.value && (
                    <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-3">Formato</label>
              <div className="flex gap-2">
                {formats.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      format === f.value
                        ? 'bg-maquete-accent/15 border-maquete-accent/30 text-maquete-accent shadow-[0_0_15px_rgba(61,158,255,0.1)]'
                        : 'bg-maquete-card/80 border-maquete-border text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-3">Período</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-4 py-3 bg-maquete-card/80 border border-maquete-border rounded-xl text-sm focus:border-maquete-accent focus:outline-none transition-colors"
                />
                <span className="text-gray-600 text-sm">até</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-4 py-3 bg-maquete-card/80 border border-maquete-border rounded-xl text-sm focus:border-maquete-accent focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-maquete-accent to-blue-600 hover:from-blue-600 hover:to-maquete-accent rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-maquete-accent/20 active:scale-[0.98]"
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

      {/* History */}
      <div className="bg-maquete-card/60 backdrop-blur-sm border border-maquete-border rounded-xl p-6"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock size={14} className="text-gray-500" />
          Relatórios Gerados
        </h3>
        {loadingHistory ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-maquete-card/80 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-maquete-surface/80 flex items-center justify-center">
              <FileText size={24} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">Nenhum relatório gerado recentemente</p>
            <p className="text-xs text-gray-600 mt-1">Gere seu primeiro relatório acima</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center gap-4 p-4 bg-maquete-card/80 rounded-xl border border-maquete-border hover:border-maquete-border/60 transition-all duration-200 hover:shadow-md group">
                <div className={`p-2.5 rounded-xl ${
                  report.status === 'completed' ? 'bg-green-500/15' :
                  report.status === 'failed' ? 'bg-red-500/15' : 'bg-maquete-warning/15'
                }`}>
                  {report.status === 'completed' ? <CheckCircle size={18} className="text-green-400" /> :
                   report.status === 'failed' ? <AlertCircle size={18} className="text-red-400" /> :
                   <Loader size={18} className="text-maquete-warning animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{report.type || report.reportType}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                    <Clock size={10} />
                    <span>{report.created_at ? new Date(report.created_at).toLocaleString('pt-BR') : 'N/A'}</span>
                    <span className="uppercase font-medium">{report.format}</span>
                  </div>
                </div>
                {report.status === 'completed' && (
                  <button
                    onClick={() => downloadReport(report.id)}
                    className="p-2.5 text-gray-400 hover:text-maquete-accent hover:bg-maquete-accent/10 rounded-xl transition-all duration-200 border border-transparent hover:border-maquete-accent/20 active:scale-95"
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

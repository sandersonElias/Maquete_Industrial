import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Relatorios() {
  const [reportType, setReportType] = useState('switches');
  const [format, setFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'switches', label: 'Ferrovia - Switches', icon: FileText },
    { value: 'trucks', label: 'Mina - Caminhões', icon: FileText },
    { value: 'port', label: 'Porto - Navios', icon: FileText },
    { value: 'airport', label: 'Aeroporto - Aeronaves', icon: FileText },
    { value: 'full', label: 'Relatório Completo', icon: FileText },
  ];

  const formats = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel (XLSX)' },
    { value: 'pdf', label: 'PDF' },
  ];

  const generateReport = async () => {
    setGenerating(true);
    try {
      await axios.post('/api/reports/export', {
        reportType,
        format,
        dateFrom,
        dateTo
      });
      toast.success('Relatório gerado com sucesso!');
    } catch (e) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <p className="text-gray-500">Exportação de dados e análises</p>
      </div>

      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6">Gerar Novo Relatório</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Tipo de Relatório</label>
            <div className="space-y-2">
              {reportTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                    reportType === type.value
                      ? 'bg-maquete-accent/20 border-maquete-accent text-maquete-accent'
                      : 'bg-maquete-card border-maquete-border hover:border-gray-500'
                  }`}
                >
                  <type.icon size={18} />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Formato</label>
              <div className="flex gap-2">
                {formats.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      format === f.value
                        ? 'bg-maquete-accent/20 border-maquete-accent text-maquete-accent'
                        : 'bg-maquete-card border-maquete-border'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Período</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-maquete-card border border-maquete-border rounded-lg"
                  />
                </div>
                <span className="text-gray-500">até</span>
                <div className="flex-1">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-maquete-card border border-maquete-border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center justify-center gap-2 w-full py-3 bg-maquete-accent hover:bg-blue-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          <span>{generating ? 'Gerando...' : 'Gerar Relatório'}</span>
        </button>
      </div>

      {/* Histórico de Relatórios */}
      <div className="bg-maquete-surface border border-maquete-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Relatórios Gerados</h3>
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum relatório gerado recentemente</p>
        </div>
      </div>
    </div>
  );
}

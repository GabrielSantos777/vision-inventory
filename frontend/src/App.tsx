import { useState } from 'react';
import axios from 'axios';
import { Camera, Package, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DetectionAnalysis {
  produto: string;
  detectado: number;
  minimo_esperado: number;
  status: string;
}

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DetectionAnalysis[] | null>(null);

  const handleUpload = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await axios.post('http://localhost:8000/detect', formData);
      setResults(response.data.analysis);
    } catch (error) {
      console.error("Erro na detecção:", error);
      alert("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 p-8 flex flex-col items-center'>
      <header className='mb-12 text-center'>
        <h1 className='text-4xl font-bold text-slate-800 flex items-center justify-center gap-3'>
          <Package className='text-blue-600' /> Vision Inventory
        </h1>
        <p className='text-slate-500 mt-2'>IA Para Gestão Inteligente de Estoque</p>
      </header>

      <main className='w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8'>
        <div className='border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative'>
          <input type="file" className='absolute inset-0 opacity-0 cursor-pointer' onChange={(e) => setImage(e.target.files?.[0] || null)} accept='image/*' />
          <Camera className='w-12 h-12 text-slate-400 mb-4' />
          <p className="text-slate-600 font-medium">
            {image ? image.name : "Selecione a foto da prateleira"}
          </p>
        </div>

        <button onClick={handleUpload} disabled={!image || loading} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className='animate-spin' /> : "Analisar Estoque com IA"}
        </button>

        {results && (
          <div className='mt-8 space-y-4'>
            <h2 className='text-xl font-semibold text-slate-700 mb-4'>Relatório de Análise:</h2>
            {results.map((item, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-center ${
                  item.status.includes("ALERTA") ? "bg-red-50 border-red-500" : "bg-emerald-50 border-emerald-500"
                }`}
              >
                <div>
                  <h3 className="font-bold text-slate-800">{item.produto}</h3>
                  <p className="text-xs text-slate-500">Mínimo: {item.minimo_esperado} unidades</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">{item.detectado}</span>
                    <span className={`text-[10px] font-bold uppercase block ${item.status.includes("ALERTA") ? "text-red-600" : "text-emerald-600"}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.status.includes("ALERTA") ? <AlertTriangle className="text-red-500" /> : <CheckCircle2 className="text-emerald-500" />}
                </div>
              </div>
            ))}
          </div>
        )}
        {results && (
        <div className="mt-12 bg-white p-6 rounded-xl shadow-inner border border-slate-100">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Tendência de Ocupação da Prateleira</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="produto" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="detectado" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 6 }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}

export default App;
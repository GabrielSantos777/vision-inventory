import { useState } from 'react';
import axios from 'axios';
import { Camera, Package, Loader2, CheckCircle } from 'lucide-react';


interface DetectionSummary {
  [key: string]: number;
}

function App(){
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DetectionSummary | null>(null);

  const handleUpload = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', image);

    try{
      // Chamada para o servidor do FastAPI
      const response = await axios.post('http://localhost:8000/detect', formData)
      setResults(response.data.summary);
    } catch (error){
      console.error("Erro na detecção:", error);
      alert("Houve um erro ao processar a imagem.");
    } finally{
      setLoading(false);
    }
  };

  return(
    <div className="w-screen h-screen flex items-center justify-center bg-slate-900">
    <div className="w-full max-w-2xl">

      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Package className="text-blue-500" /> Vision Inventory
        </h1>
        <p className="text-slate-400 mt-2">
          IA para gestão inteligente de prateleiras
        </p>
      </header>

      <main className="bg-slate-800 rounded-2xl shadow-xl p-8">
        {/* Área de Seleção de Imagem */}
        <div className='border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative'>
          <input type="file" className='absolute inset-0 opacity-0 cursor-pointer' onChange={(e) => setImage(e.target.files?.[0] || null)} accept='image/*'/>
          <Camera className='w-12 h-12 text-slate-400 mb-4'/>
          <p className="text-slate-600 font-medium">
            {image ? image.name : "Clique para selecionar ou arraste uma foto"}
          </p>
        </div>
        <button onClick={handleUpload} disabled={!image|| loading} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className='animate-spin'/> : "Analisar Estoque"}
        </button>
        { results && (
          <div className='mt-8'>
            <h2 className='text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2'>
              <CheckCircle className="text-green-500" /> Itens Detectados:
            </h2>
            <div className='grid grid-cols-2 gap-4'>
              {Object.entries(results).map(([label, count]) => (
                <div key={label} className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                  <span className="capitalize font-medium text-blue-800">{label}</span>
                  <span className="text-2xl font-bold text-blue-900">{count}</span>
                </div>
              ))}

            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  )

}

export default App;
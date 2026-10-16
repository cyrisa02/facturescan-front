"use client";

import { useState } from "react";
import { Camera, Loader2, Download, FileText } from "lucide-react";

type FormData = {
  date: string;
  fournisseur: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  numero_facture: string;
};

export default function Home() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Gestion de la capture photo et conversion en Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageBase64(base64String);
      setData(null); // Reset des données précédentes
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // 2. Envoi à l'API Render
  const handleScan = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'extraction");
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Impossible d'analyser l'image. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Export en CSV
  const exportToCSV = () => {
    if (!data) return;
    const csvContent = `Date,Fournisseur,Numéro Facture,Montant HT,TVA,Total TTC\n${data.date},${data.fournisseur},${data.numero_facture || "N/A"},${data.montant_ht},${data.montant_tva},${data.montant_ttc}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `facture_${data.fournisseur}_${data.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 max-w-md mx-auto">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          FactureScan IA
        </h1>
        <p className="text-sm text-gray-500 mt-1">Numérisez vos notes de frais en 5 secondes</p>
      </header>

      {/* Zone de capture */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Camera className="w-10 h-10 text-blue-500 mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              {imageBase64 ? "Changer la photo" : "Appuyez pour prendre une photo"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Ou choisissez dans la galerie</p>
          </div>
          {/* L'attribut capture="environment" force l'appareil photo arrière sur mobile */}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            capture="environment" 
            onChange={handleImageChange} 
          />
        </label>

        {imageBase64 && !data && (
          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyser la facture"}
          </button>
        )}
      </div>

      {/* État de chargement (Cold Start Render) */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Analyse en cours...</p>
          <p className="text-xs text-gray-400 mt-1">(Premier chargement : ~30s)</p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200 mb-4">
          {error}
        </div>
      )}

      {/* Formulaire de validation */}
      {data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Données extraites
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Fournisseur</label>
              <input type="text" value={data.fournisseur} onChange={(e) => setData({...data, fournisseur: e.target.value})} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Date</label>
                <input type="date" value={data.date} onChange={(e) => setData({...data, date: e.target.value})} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">N° Facture</label>
                <input type="text" value={data.numero_facture || ""} onChange={(e) => setData({...data, numero_facture: e.target.value})} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">HT</label>
                <input type="number" step="0.01" value={data.montant_ht} onChange={(e) => setData({...data, montant_ht: parseFloat(e.target.value)})} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">TVA</label>
                <input type="number" step="0.01" value={data.montant_tva} onChange={(e) => setData({...data, montant_tva: parseFloat(e.target.value)})} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">TTC</label>
                <input type="number" step="0.01" value={data.montant_ttc} onChange={(e) => setData({...data, montant_ttc: parseFloat(e.target.value)})} className="w-full mt-1 p-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold" readOnly />
              </div>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            className="w-full mt-6 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporter en CSV
          </button>
        </div>
      )}
    </main>
  );
}
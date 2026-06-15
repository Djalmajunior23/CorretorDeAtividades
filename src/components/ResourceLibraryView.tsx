import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  Search,
  Upload,
  Star,
  Trash2,
  Download,
  MoreVertical,
  Plus,
  RefreshCw,
  Library,
  Tag,
  Clock,
  Filter,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ResourceLibraryItem } from "../types";

export default function ResourceLibraryView() {
  const [resources, setResources] = useState<ResourceLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resources");
      setResources(await res.json());
    } catch (e) {
      toast.error("Erro ao carregar recursos.");
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/resources/${id}/favorite`, { method: "POST" });
      fetchData();
    } catch {
      toast.error("Erro ao favoritar.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await fetch(`/api/resources/${id}`, { method: "DELETE" });
      toast.success("Excluido com sucesso.");
      fetchData();
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const filteredResources = resources.filter((r) => {
    if (activeFilter === "favorites" && !r.is_favorite) return false;
    if (
      searchQuery &&
      !r.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Library className="w-8 h-8 text-indigo-500" />
            Biblioteca do Professor
          </h1>
          <p className="text-slate-400 mt-2">
            Repositório de recursos, materiais e modelos
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all">
            <Folder className="w-4 h-4" />
            Nova Pasta
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
            <Upload className="w-4 h-4" />
            Novo Recurso
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 space-y-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              Busca
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar recursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === "all" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-white/5"}`}
              >
                Todos os Recursos
              </button>
              <button
                onClick={() => setActiveFilter("favorites")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeFilter === "favorites" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}
              >
                <Star
                  className={`w-4 h-4 ${activeFilter === "favorites" ? "fill-amber-400" : ""}`}
                />{" "}
                Favoritos
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
              <Library className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">
                Nenhum recurso encontrado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 hover:bg-slate-900/60 transition-all group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleFavorite(r.id, e)}
                        className="p-1.5 text-slate-500 hover:text-amber-400 rounded"
                      >
                        <Star
                          className={`w-4 h-4 ${r.is_favorite ? "fill-amber-400 text-amber-400" : ""}`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleDelete(r.id, e)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3
                    className="font-bold text-slate-200 mb-1 line-clamp-1"
                    title={r.title}
                  >
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">
                    {r.type || "Desconhecido"}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    {r.topic && (
                      <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                        {r.topic}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

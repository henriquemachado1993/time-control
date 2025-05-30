"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useSession, signOut } from "next-auth/react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type User = any; // Assuming 'any' is the correct type for User
type Horario = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
  created_at: string;
};

function calcularTotalHoras(start: string, end: string) {
  if (!start || !end) return "-";
  const startTime = dayjs(`2000-01-01T${start}`);
  const endTime = dayjs(`2000-01-01T${end}`);
  let diff = endTime.diff(startTime, "minute");
  if (diff < 0) diff = 0;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}min`;
}

function agruparPorData(horarios: Horario[]) {
  const grupos: { [key: string]: Horario[] } = {};
  horarios.forEach(horario => {
    const data = dayjs(horario.date).format("YYYY-MM-DD");
    if (!grupos[data]) {
      grupos[data] = [];
    }
    grupos[data].push(horario);
  });
  return grupos;
}

function calcularTotalDia(horariosData: Horario[]) {
  const totalMinutos = horariosData.reduce((total, h) => {
    const horas = calcularTotalHoras(h.start_time, h.end_time);
    if (horas === "-") return total;
    const [h_str, m_str] = horas.split("h ");
    const h_num = parseInt(h_str) || 0;
    const m_num = parseInt(m_str.replace("min", "")) || 0;
    return total + h_num * 60 + m_num;
  }, 0);
  
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${h}h ${m}min`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  
  // Estados do formulário
  const [showModal, setShowModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");
  
  // Estados da interface
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [searchDescription, setSearchDescription] = useState("");
  
  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const DIAS_POR_PAGINA = 5;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    } else {
      setUser(session.user);
      setLoading(false);
    }
  }, [session, status, router]);

  const fetchHorarios = async (searchDateParam?: string, searchDescriptionParam?: string) => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchDateParam) params.append('date', searchDateParam);
      if (searchDescriptionParam) params.append('description', searchDescriptionParam);
      
      const url = params.toString() 
        ? `/api/horarios?${params.toString()}`
        : "/api/horarios";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setHorarios(data);
        setCurrentPage(1); // Reset para primeira página quando buscar
      }
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    }
    setListLoading(false);
  };

  useEffect(() => {
    if (user) fetchHorarios();
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const openModal = (horario?: Horario) => {
    if (horario) {
      setEditingHorario(horario);
      setDate(dayjs(horario.date).format("YYYY-MM-DD"));
      setStart(horario.start_time);
      setEnd(horario.end_time);
      setDescription(horario.description || "");
    } else {
      setEditingHorario(null);
      setDate(dayjs().format("YYYY-MM-DD"));
      setStart("");
      setEnd("");
      setDescription("");
    }
    setShowModal(true);
    setFormError("");
    setSuccess("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHorario(null);
    setFormError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    
    if (!start || !end) {
      setFormError("Entrada e saída são obrigatórios.");
      return;
    }
    
    try {
      const url = editingHorario ? `/api/horarios/${editingHorario.id}` : "/api/horarios";
      const method = editingHorario ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          start_time: start,
          end_time: end,
          description: description || null,
        }),
      });

      if (response.ok) {
        setSuccess(editingHorario ? "Horário atualizado!" : "Horário salvo!");
        setTimeout(() => {
          closeModal();
          fetchHorarios(searchDate, searchDescription);
        }, 1000);
      } else {
        const error = await response.json();
        setFormError(error.error || "Erro ao salvar horário");
      }
    } catch (error) {
      setFormError("Erro ao salvar horário");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este horário?")) return;
    
    try {
      const response = await fetch(`/api/horarios/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Horário excluído com sucesso!");
        fetchHorarios(searchDate, searchDescription);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setFormError("Erro ao excluir horário");
      }
    } catch (error) {
      setFormError("Erro ao excluir horário");
    }
  };

  const handleSearch = () => {
    fetchHorarios(searchDate, searchDescription);
  };

  const clearSearch = () => {
    setSearchDate("");
    setSearchDescription("");
    fetchHorarios();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const horariosAgrupados = agruparPorData(horarios);
  const diasOrdenados = Object.entries(horariosAgrupados).sort(([a], [b]) => b.localeCompare(a));
  
  // Paginação
  const totalDias = diasOrdenados.length;
  const totalPaginas = Math.ceil(totalDias / DIAS_POR_PAGINA);
  const startIndex = (currentPage - 1) * DIAS_POR_PAGINA;
  const endIndex = startIndex + DIAS_POR_PAGINA;
  const diasPaginados = diasOrdenados.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-slate-700 to-gray-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Controle de Horas</h1>
              <p className="text-white mt-1">Gerencie seu tempo de trabalho</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/20"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6 shadow-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Controles de busca */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-3 font-semibold text-gray-800">
                  📅 Buscar por data:
                </label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-3 font-semibold text-gray-800">
                  🔍 Buscar por descrição:
                </label>
                <input
                  type="text"
                  placeholder="Digite parte da descrição..."
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  value={searchDescription}
                  onChange={(e) => setSearchDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSearch}
                className="bg-slate-600 text-white px-6 py-3 rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium shadow-lg"
              >
                Buscar
              </button>
              <button
                onClick={clearSearch}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium shadow-lg"
              >
                Limpar
              </button>
              <button
                onClick={() => openModal()}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg"
              >
                ➕ Novo Registro
              </button>
            </div>
          </div>
        </div>

        {/* Lista de horários com paginação */}
        <div className="space-y-6">
          {listLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : diasPaginados.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Nenhum horário encontrado</p>
            </div>
          ) : (
            <>
              {diasPaginados.map(([data, horariosData]) => (
                <div key={data} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-slate-600 to-gray-700 px-6 py-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          📅 {dayjs(data).format("DD/MM/YYYY")} - {dayjs(data).format("dddd")}
                        </h3>
                        <p className="text-white mt-1">
                          ⏱️ Total do dia: <span className="font-semibold">{calcularTotalDia(horariosData)}</span>
                        </p>
                      </div>
                      <div className="text-white text-sm">
                        {horariosData.length} registro{horariosData.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-600">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Entrada</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Saída</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Total</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Descrição</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {horariosData.map((horario, index) => (
                          <tr key={horario.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{horario.start_time}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{horario.end_time}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">
                              {calcularTotalHoras(horario.start_time, horario.end_time)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{horario.description || "—"}</td>
                            <td className="px-6 py-4 text-sm space-x-3">
                              <button
                                onClick={() => openModal(horario)}
                                className="text-slate-600 hover:text-slate-800 font-medium transition-colors"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => handleDelete(horario.id)}
                                className="text-red-600 hover:text-red-800 font-medium transition-colors"
                              >
                                🗑️ Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ⬅️ Anterior
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          currentPage === page
                            ? 'bg-slate-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPaginas, currentPage + 1))}
                    disabled={currentPage === totalPaginas}
                    className="px-4 py-2 rounded-lg bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Próxima ➡️
                  </button>
                </div>
              )}

              {/* Informações da paginação */}
              {totalDias > 0 && (
                <div className="text-center text-gray-600 mt-4">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalDias)} de {totalDias} dias
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingHorario ? "✏️ Editar Horário" : "➕ Novo Horário"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-3 font-semibold text-gray-800">Data</label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-3 font-semibold text-gray-800">Entrada</label>
                  <input
                    type="time"
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-3 font-semibold text-gray-800">Saída</label>
                  <input
                    type="time"
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-3 font-semibold text-gray-800">Descrição (opcional)</label>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Reunião com cliente, desenvolvimento de feature..."
                />
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {formError}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {success}
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-slate-600 text-white py-4 rounded-xl hover:bg-slate-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  {editingHorario ? "Atualizar" : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-500 text-white py-4 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold shadow-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
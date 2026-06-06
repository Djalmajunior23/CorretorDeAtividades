import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  return (
    <div className="p-8 text-white min-h-screen bg-[#0F111A]">
      <h1 className="text-2xl font-bold mb-4">Painel Administrativo</h1>
      <p>Bem-vindo administrador.</p>
      <button onClick={logout} className="mt-4 px-4 py-2 bg-red-600 rounded">Sair</button>
    </div>
  );
}

'use client'

import React, { useState, useEffect } from 'react';
import { Users, Briefcase, FileText, MessageSquare, Clock, CheckCircle, AlertCircle, File } from 'lucide-react';
import { getAdminDashboardStats, getRecentActivity } from "../../actions/admin-dashboard";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    invoices: 0,
    tickets: 0
  });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getAdminDashboardStats();
      if (data) {
        setStats(data);
      }
      const recent = await getRecentActivity();
      setActivity(recent || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
          <p className="text-slate-400 mt-2">Welcome back, here's what's happening today.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition-all shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/90">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden bg-blue-500/10 text-blue-500">
            <Users size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 mb-1 font-medium">Total Clients</span>
            <span className="text-3xl font-bold text-white tracking-tight">{stats.clients}</span>
          </div>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition-all shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/90">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden bg-violet-500/10 text-violet-500">
            <Briefcase size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 mb-1 font-medium">Active Projects</span>
            <span className="text-3xl font-bold text-white tracking-tight">{stats.projects}</span>
          </div>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition-all shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/90">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden bg-blue-500/10 text-blue-500">
            <Briefcase size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 mb-1 font-medium">Total Projects</span>
            <span className="text-3xl font-bold text-white tracking-tight">{stats.totalProjects || 0}</span>
          </div>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition-all shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/90">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden bg-emerald-500/10 text-emerald-500">
            <FileText size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 mb-1 font-medium">Paid Invoices</span>
            <span className="text-3xl font-bold text-white tracking-tight">{stats.invoices}</span>
          </div>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition-all shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800/90">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden bg-amber-500/10 text-amber-500">
            <MessageSquare size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-400 mb-1 font-medium">Open Tickets</span>
            <span className="text-3xl font-bold text-white tracking-tight">{stats.tickets}</span>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
            {activity.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No recent activity found.</div>
            ) : (
                <div className="divide-y divide-white/5">
                    {activity.map((item, index) => (
                        <div key={index} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                ${item.type === 'ticket' ? 'bg-amber-500/10 text-amber-500' : 
                                  item.type === 'update' ? 'bg-blue-500/10 text-blue-500' : 
                                  'bg-emerald-500/10 text-emerald-500'}`}>
                                {item.type === 'ticket' && <MessageSquare size={18} />}
                                {item.type === 'update' && <Clock size={18} />}
                                {item.type === 'file' && <File size={18} />}
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-medium">{item.title}</div>
                                <div className="text-xs text-gray-400">
                                    {item.type === 'ticket' && `New Ticket from ${item.client}`}
                                    {item.type === 'update' && `Project Update for ${item.project}`}
                                    {item.type === 'file' && `New File for ${item.client}`}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(item.date).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

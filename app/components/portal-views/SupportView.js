'use client'

import React, { useState, useEffect } from 'react';
import { getTickets, createTicket, getTicketDetails, replyToTicket } from '../../actions/portal';
import { MessageSquare, AlertCircle, CheckCircle2, Send, Plus, ArrowLeft } from 'lucide-react';

const SupportView = ({ userEmail, openNewTicket, onTicketOpened }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ subject: '', priority: 'medium', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [userEmail]);

  useEffect(() => {
    if (openNewTicket) {
      setShowForm(true);
      setFormData(prev => ({ ...prev, subject: 'New Project Request' }));
      if (onTicketOpened) {
        onTicketOpened();
      }
    }
  }, [openNewTicket, onTicketOpened]);

  const fetchTickets = async () => {
    const result = await getTickets(userEmail);
    if (result.success) {
      setTickets(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const result = await createTicket(userEmail, {
      subject: formData.subject,
      message: formData.message
    });

    if (result.success) {
      setFormData({ subject: '', priority: 'medium', message: '' });
      fetchTickets();
      setShowForm(false);
    }
    setSubmitting(false);
  };



  const handleViewTicket = async (ticketId) => {
    setLoading(true);
    const result = await getTicketDetails(userEmail, ticketId);
    if (result.success) {
      setSelectedTicket(result.data);
    }
    setLoading(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    
    setReplying(true);
    const result = await replyToTicket(userEmail, selectedTicket.id, replyMessage);
    
    if (result.success) {
      setReplyMessage('');
      // Refresh details
      const details = await getTicketDetails(userEmail, selectedTicket.id);
      if (details.success) {
        setSelectedTicket(details.data);
      }
    }
    setReplying(false);
  };

  const getStatusIcon = (status) => {
    return status === 'open' ? 
      <AlertCircle size={18} className="text-yellow-500" /> : 
      <CheckCircle2 size={18} className="text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Support Center</h2>
          <p className="text-slate-400 mt-1">Get help with your projects and account.</p>
        </div>
        {!selectedTicket && (
            <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-lg ${
                showForm 
                ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/20' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/20'
            }`}
            onClick={() => setShowForm(!showForm)}
            >
            {showForm ? 'Cancel' : (
                <>
                <Plus size={18} />
                <span>New Ticket</span>
                </>
            )}
            </button>
        )}
      </div>

      {selectedTicket ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Tickets
            </button>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-2">
                        {getStatusIcon(selectedTicket.status)}
                        <span className={`text-sm font-medium capitalize ${selectedTicket.status === 'open' ? 'text-yellow-500' : 'text-emerald-500'}`}>{selectedTicket.status}</span>
                    </div>
                </div>
                <p className="text-slate-400 text-sm">Ticket #{selectedTicket.id} • Created on {new Date(selectedTicket.created_at).toLocaleDateString()}</p>
            </div>

            <div className="space-y-6 mb-8 max-h-[500px] overflow-y-auto pr-2">
                {selectedTicket.replies?.map((reply) => (
                    <div key={reply.id} className={`flex flex-col ${!reply.is_admin ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-xl ${!reply.is_admin ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'}`}>
                            <p className="text-sm">{reply.message}</p>
                        </div>
                        <span className="text-xs text-slate-500 mt-1">{new Date(reply.created_at).toLocaleString()}</span>
                    </div>
                ))}
                {selectedTicket.replies?.length === 0 && (
                    <div className="text-center text-slate-500 py-8">No messages yet.</div>
                )}
            </div>

            <form onSubmit={handleReply} className="flex gap-4">
                <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    required
                />
                <button 
                    type="submit" 
                    disabled={replying}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Send size={18} />
                    {replying ? 'Sending...' : 'Reply'}
                </button>
            </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {showForm && (
            <div className="lg:col-span-2 bg-slate-800/50 border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-xl font-bold text-white mb-6">Create New Ticket</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Subject</label>
                    <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    required
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Priority</label>
                    <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                    <option value="low" className="bg-slate-900 text-white">Low Priority</option>
                    <option value="medium" className="bg-slate-900 text-white">Medium Priority</option>
                    <option value="high" className="bg-slate-900 text-white">High Priority</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Message</label>
                    <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    rows="5"
                    required
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 resize-none"
                    ></textarea>
                </div>

                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
                    <Send size={16} />
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
                </form>
            </div>
            )}

            <div className={showForm ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <h3 className="text-lg font-semibold text-white mb-4">Recent Tickets</h3>
            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-3">
                {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 rounded-xl border border-white/5">
                    <MessageSquare size={48} className="text-slate-600 mb-4" />
                    <p className="text-slate-500">No support tickets found.</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                    <div key={ticket.id} onClick={() => handleViewTicket(ticket.id)} className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:bg-slate-800 transition-all cursor-pointer group">
                        <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{ticket.subject}</span>
                            <span className="text-xs text-slate-500 flex-shrink-0">{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-400">Ticket #{ticket.id} • Click to view details</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {getStatusIcon(ticket.status)}
                            <span className={`text-sm font-medium capitalize ${
                            ticket.status === 'open' ? 'text-yellow-500' : 'text-emerald-500'
                            }`}>
                            {ticket.status}
                            </span>
                        </div>
                        </div>
                    </div>
                    ))
                )}
                </div>
            )}
            </div>
        </div>
      )}
    </div>
  );
};

export default SupportView;

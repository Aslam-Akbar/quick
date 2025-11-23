'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientById, updateClient } from "../../../../actions/admin-clients";
import { getClientProjects, createProject, deleteProject, updateProject } from "../../../../actions/admin-projects";
import { getClientInvoices, createInvoice, deleteInvoice, markInvoicePaid } from "../../../../actions/admin-invoices";
import { getClientTickets, closeTicket, deleteTicket } from "../../../../actions/admin-tickets";
import { getProjectTimeline, addTimelineEvent, deleteTimelineEvent } from "../../../../actions/admin-timeline";
import { getProjectUpdates, addProjectUpdate, deleteProjectUpdate } from "../../../../actions/admin-updates";
import { getClientFiles, addClientFile, deleteClientFile } from "../../../../actions/admin-files";
import { getTicketDetails, replyToTicket } from "../../../../actions/admin-replies";
import Modal from "../../../../components/admin/Modal";
import {
  Building, Mail, Phone, MapPin, Calendar, File,
  Briefcase, FileText, MessageSquare, ArrowLeft, Plus,
  CheckCircle, Clock, AlertCircle, MoreVertical, Search, Filter, Edit2, Trash2, Globe, Github, History
} from 'lucide-react';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ 
    name: '', 
    status: 'Pending', 
    progress: 0, 
    due_date: '', 
    advanceAmount: '', 
    budget: '',
    currency: 'INR',
    hosted_url: '', 
    github_url: '', 
    next_meeting: '' 
  });
  const [editingProject, setEditingProject] = useState(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ amount: '', currency: 'INR', status: 'Unpaid', date: '', due_date: '' });

  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [currentTimelineProject, setCurrentTimelineProject] = useState(null);
  const [newTimelineEvent, setNewTimelineEvent] = useState({ label: '', status: 'Pending' });

  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [currentUpdatesProject, setCurrentUpdatesProject] = useState(null);
  const [newUpdate, setNewUpdate] = useState({ message: '', type: 'general' });

  const [files, setFiles] = useState([]);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', type: 'Document', url: '', size: '' });

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const refreshData = async () => {
    if (!params.id) return;
    const [pData, iData, tData, fData] = await Promise.all([
      getClientProjects(params.id),
      getClientInvoices(params.id),
      getClientTickets(params.id),
      getClientFiles(params.id),
    ]);
    setProjects(pData || []);
    setInvoices(iData || []);
    setTickets(tData || []);
    setFiles(fData || []);
    router.refresh();
  };

  useEffect(() => {
    const initFetch = async () => {
      if (!params.id) return;
      try {
        setLoading(true);
        const clientData = await getClientById(params.id);
        setClient(clientData);
        await refreshData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initFetch();
  }, [params.id]);

  const formatDateTimeForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const offsetMs = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
  };

  const validateURL = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    
    if (newProject.progress < 0 || newProject.progress > 100) {
      alert('Progress must be between 0 and 100');
      return;
    }
    
    if (newProject.hosted_url && !validateURL(newProject.hosted_url)) {
      alert('Please enter a valid Live Website URL');
      return;
    }
    
    if (newProject.github_url && !validateURL(newProject.github_url)) {
      alert('Please enter a valid GitHub URL');
      return;
    }
    
    startTransition(async () => {
      const payload = { 
        ...newProject, 
        progress: Number(newProject.progress),
        advanceAmount: Number(newProject.advanceAmount),
        budget: Number(newProject.budget),
        currency: newProject.currency,
        next_meeting: newProject.next_meeting || null
      };
      const result = await createProject(params.id, payload);
      if (result?.success) {
        if (result.invoiceError) {
          alert('Project created, but failed to create invoice: ' + result.invoiceError);
        }
        setIsProjectModalOpen(false);
        setNewProject({ 
          name: '', 
          status: 'Pending', 
          progress: 0, 
          due_date: '', 
          advanceAmount: '', 
          hosted_url: '', 
          github_url: '', 
          next_meeting: '' 
        });
        await refreshData();
      } else {
        alert('Error: ' + (result?.error || 'Failed'));
      }
    });
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();
    if (!editingProject) return;
    
    if (editingProject.progress < 0 || editingProject.progress > 100) {
      alert('Progress must be between 0 and 100');
      return;
    }
    
    if (editingProject.hosted_url && !validateURL(editingProject.hosted_url)) {
      alert('Please enter a valid Live Website URL');
      return;
    }
    
    if (editingProject.github_url && !validateURL(editingProject.github_url)) {
      alert('Please enter a valid GitHub URL');
      return;
    }
    
    startTransition(async () => {
        const result = await updateProject(editingProject.id, {
          ...editingProject,
          next_meeting: editingProject.next_meeting || null
        });
        if (result?.success) {
            setIsProjectModalOpen(false);
            setEditingProject(null);
            await refreshData();
        } else {
            alert('Error: ' + (result?.error || 'Failed'));
        }
    });
  };

  const handleUpdateProjectStatus = (projectId, newStatus) => {
    startTransition(async () => {
        const result = await updateProject(projectId, { status: newStatus });
        if (result?.success) await refreshData();
        else alert('Failed to update status');
    });
  };

  const handleDeleteProject = (projectId) => {
    if (!confirm('Delete this project?')) return;
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result?.success) await refreshData();
      else alert('Failed to delete');
    });
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = { ...newInvoice, amount: parseFloat(newInvoice.amount) || 0 };
      const result = await createInvoice(params.id, payload);
      if (result?.success) {
        setIsInvoiceModalOpen(false);
        setNewInvoice({ amount: '', currency: 'INR', status: 'Unpaid', date: '', due_date: '' });
        await refreshData();
      } else {
        alert('Error: ' + (result?.error || 'Failed'));
      }
    });
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (!confirm('Delete this invoice?')) return;
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result?.success) await refreshData();
      else alert('Failed to delete');
    });
  };

  const handleMarkInvoicePaid = (invoiceId) => {
    startTransition(async () => {
      const result = await markInvoicePaid(invoiceId);
      if (result?.success) await refreshData();
      else alert('Failed to update');
    });
  };

  const handleUpdateClient = (e) => {
      e.preventDefault();
      startTransition(async () => {
          const result = await updateClient(params.id, editingClient);
          if (result?.success) {
              setIsEditClientModalOpen(false);
              setClient({ ...client, ...editingClient }); // Optimistic update
              await refreshData();
          } else {
              alert('Error: ' + result?.message);
          }
      });
  };

  const handleCloseTicket = (ticketId) => {
    if (!confirm('Close this ticket?')) return;
    startTransition(async () => {
      const result = await closeTicket(ticketId);
      if (result?.success) await refreshData();
      else alert('Failed to close ticket');
    });
  };

  const handleDeleteTicket = (ticketId) => {
    if (!confirm('Delete this ticket? This action cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteTicket(ticketId);
      if (result?.success) await refreshData();
      else alert('Failed to delete ticket');
    });
  };

  const handleViewTicket = async (ticket) => {
      const details = await getTicketDetails(ticket.id);
      setSelectedTicket(details || { ...ticket, replies: [] });
      setIsTicketModalOpen(true);
  };

  const handleReplyToTicket = (e) => {
      e.preventDefault();
      if (!selectedTicket) return;
      startTransition(async () => {
          const result = await replyToTicket(selectedTicket.id, replyMessage);
          if (result?.success) {
              const details = await getTicketDetails(selectedTicket.id);
              setSelectedTicket(details);
              setReplyMessage('');
          } else {
              alert('Failed to reply');
          }
      });
  };

  const handleManageTimeline = async (project) => {
      setCurrentTimelineProject(project);
      const events = await getProjectTimeline(project.id);
      setTimelineEvents(events);
      setIsTimelineModalOpen(true);
  };

  const handleAddTimelineEvent = (e) => {
      e.preventDefault();
      if (!currentTimelineProject) return;
      startTransition(async () => {
          const result = await addTimelineEvent(currentTimelineProject.id, newTimelineEvent);
          if (result?.success) {
              const events = await getProjectTimeline(currentTimelineProject.id);
              setTimelineEvents(events);
              setNewTimelineEvent({ label: '', status: 'Pending' });
          } else {
              alert('Failed to add event');
          }
      });
  };

  const handleDeleteTimelineEvent = (eventId) => {
      if (!confirm('Delete this event?')) return;
      startTransition(async () => {
          const result = await deleteTimelineEvent(eventId);
          if (result?.success) {
              const events = await getProjectTimeline(currentTimelineProject.id);
              setTimelineEvents(events);
          } else {
              alert('Failed to delete event');
          }
      });
  };

  const handleManageUpdates = async (project) => {
      setCurrentUpdatesProject(project);
      const updates = await getProjectUpdates(project.id);
      setProjectUpdates(updates);
      setIsUpdatesModalOpen(true);
  };

  const handleAddUpdate = (e) => {
      e.preventDefault();
      if (!currentUpdatesProject) return;
      startTransition(async () => {
          const result = await addProjectUpdate(currentUpdatesProject.id, newUpdate);
          if (result?.success) {
              const updates = await getProjectUpdates(currentUpdatesProject.id);
              setProjectUpdates(updates);
              setNewUpdate({ message: '', type: 'general' });
          } else {
              alert('Failed to add update');
          }
      });
  };

  const handleDeleteUpdate = (updateId) => {
      if (!confirm('Delete this update?')) return;
      startTransition(async () => {
          const result = await deleteProjectUpdate(updateId);
          if (result?.success) {
              const updates = await getProjectUpdates(currentUpdatesProject.id);
              setProjectUpdates(updates);
          } else {
              alert('Failed to delete update');
          }
      });
  };

  const handleCreateFile = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addClientFile(params.id, newFile);
      if (result?.success) {
        setIsFilesModalOpen(false);
        setNewFile({ name: '', type: 'Document', url: '', size: '' });
        await refreshData();
      } else {
        alert('Error: ' + (result?.error || 'Failed'));
      }
    });
  };

  const handleDeleteFile = (fileId) => {
    if (!confirm('Delete this file?')) return;
    startTransition(async () => {
      const result = await deleteClientFile(fileId);
      if (result?.success) await refreshData();
      else alert('Failed to delete');
    });
  };

  useEffect(() => {
    const close = () => setActiveDropdown(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const toggleDropdown = (e, type, id) => {
    e.stopPropagation();
    if (activeDropdown?.type === type && activeDropdown?.id === id) {
      setActiveDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveDropdown({ type, id, position: { top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right } });
    }
  };

  const counts = useMemo(() => ({
    projects: projects.length,
    invoices: invoices.length,
    tickets: tickets.length,
    activeProjects: projects.filter(p => p.status !== 'Completed').length,
    completedProjects: projects.filter(p => p.status === 'Completed').length,
    unpaidInvoices: invoices.filter(i => i.status === 'Unpaid').length,
    files: files.length,
  }), [projects, invoices, tickets, files]);

  if (loading) return <div className="p-10 text-center text-white">Loading...</div>;
  if (!client) return <div className="p-10 text-center text-white">Client Not Found</div>;

  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={16} /> <span className="capitalize">{label}</span>
      <span className="ml-2 bg-white/10 px-2 py-0.5 rounded-full text-xs">{count}</span>
    </button>
  );

  return (
    <div className={`animate-in fade-in duration-500 relative ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>
      <header className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-white">{client.company_name}</h1>
                <button 
                    onClick={() => { setEditingClient(client); setIsEditClientModalOpen(true); }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    title="Edit Client Details"
                >
                    <Edit2 size={16} />
                </button>
            </div>
          </div>
          
          <div className="flex gap-2">
             {activeTab === 'projects' && (
                <button onClick={() => setIsProjectModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Plus size={16} /> New Project
                </button>
             )}
             {activeTab === 'invoices' && (
                <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Plus size={16} /> New Invoice
                </button>
             )}
             {activeTab === 'files' && (
                <button onClick={() => setIsFilesModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Plus size={16} /> New File
                </button>
             )}
          </div>
        </div>

        <div className="mt-6 inline-flex bg-white/5 rounded-xl p-1">
          <TabButton id="projects" label="Active Projects" icon={Briefcase} count={counts.activeProjects} />
          <TabButton id="history" label="History" icon={History} count={counts.completedProjects} />
          <TabButton id="invoices" label="Invoices" icon={FileText} count={counts.invoices} />
          <TabButton id="tickets" label="Tickets" icon={MessageSquare} count={counts.tickets} />
          <TabButton id="files" label="Files" icon={File} count={counts.files} />
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4 text-lg">Contact Details</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex gap-3 items-center"><Mail size={16} className="text-blue-400"/> {client.email}</div>
              <div className="flex gap-3 items-center"><Phone size={16} className="text-blue-400"/> {client.phone || '-'}</div>
              <div className="flex gap-3 items-center"><MapPin size={16} className="text-blue-400"/> {client.address || '-'}</div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-8">
            {(activeTab === 'projects' || activeTab === 'history') && (
               <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-white/5 text-white">
                     <tr>
                       <th className="p-4">Name</th>
                       <th className="p-4">Status</th>
                       <th className="p-4">Progress</th>
                       <th className="p-4">Due Date</th>
                       <th className="p-4">Next Meeting</th>
                       <th className="p-4">Links</th>
                       <th className="p-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {projects
                        .filter(p => activeTab === 'history' ? p.status === 'Completed' : p.status !== 'Completed')
                        .map(p => (
                       <tr key={p.id} className="hover:bg-white/5">
                         <td className="p-4 text-white font-medium">{p.name}</td>
                         <td className="p-4">
                            <select 
                                value={p.status}
                                onChange={(e) => handleUpdateProjectStatus(p.id, e.target.value)}
                                className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                         </td>
                         <td className="p-4">{p.progress}%</td>
                         <td className="p-4">{p.due_date ? new Date(p.due_date).toLocaleDateString() : '-'}</td>
                         <td className="p-4">{p.next_meeting ? new Date(p.next_meeting).toLocaleDateString() : '-'}</td>
                         <td className="p-4">
                           <div className="flex gap-2">
                             {p.hosted_url && (
                               <a href={p.hosted_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 rounded text-blue-400" title="Live Website">
                                 <Globe size={14} />
                               </a>
                             )}
                             {p.github_url && (
                               <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-purple-600/20 hover:bg-purple-600/30 rounded text-purple-400" title="Source Code">
                                 <Github size={14} />
                               </a>
                             )}
                             {!p.hosted_url && !p.github_url && '-'}
                           </div>
                         </td>
                         <td className="p-4 text-right relative">
                           <button onClick={(e) => toggleDropdown(e, 'project', p.id)} className="p-2 hover:bg-white/10 rounded"><MoreVertical size={16}/></button>
                         </td>
                       </tr>
                     ))}
                     {projects.filter(p => activeTab === 'history' ? p.status === 'Completed' : p.status !== 'Completed').length === 0 && (
                        <tr><td colSpan="7" className="p-8 text-center">No {activeTab === 'history' ? 'completed' : 'active'} projects found.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            )}

            {activeTab === 'invoices' && (
               <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-white/5 text-white">
                     <tr>
                       <th className="p-4">ID</th>
                       <th className="p-4">Amount</th>
                       <th className="p-4">Status</th>
                       <th className="p-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {invoices.map(inv => (
                       <tr key={inv.id} className="hover:bg-white/5">
                         <td className="p-4">#{inv.id}</td>
                         <td className="p-4 text-white">{inv.currency} {inv.amount}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${inv.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {inv.status}
                            </span>
                         </td>
                         <td className="p-4 text-right relative">
                           <button onClick={(e) => toggleDropdown(e, 'invoice', inv.id)} className="p-2 hover:bg-white/10 rounded"><MoreVertical size={16}/></button>
                         </td>
                       </tr>
                     ))}
                     {invoices.length === 0 && <tr><td colSpan="4" className="p-8 text-center">No invoices found.</td></tr>}
                   </tbody>
                 </table>
               </div>
            )}

            {activeTab === 'tickets' && (
               <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-white/5 text-white">
                     <tr>
                       <th className="p-4">Subject</th>
                       <th className="p-4">Status</th>
                       <th className="p-4">Priority</th>
                       <th className="p-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {tickets.map(t => (
                       <tr key={t.id} className="hover:bg-white/5">
                         <td className="p-4 text-white">{t.subject}</td>
                         <td className="p-4">{t.status}</td>
                         <td className="p-4">{t.priority}</td>
                          <td className="p-4 text-right">
                             <button onClick={() => handleViewTicket(t)} className="text-blue-400 hover:underline text-xs mr-2">View</button>
                             {t.status !== 'Closed' && (
                                 <button onClick={() => handleCloseTicket(t.id)} className="text-yellow-400 hover:underline text-xs mr-2">Close</button>
                             )}
                             <button onClick={() => handleDeleteTicket(t.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                          </td>
                       </tr>
                     ))}
                     {tickets.length === 0 && <tr><td colSpan="4" className="p-8 text-center">No tickets found.</td></tr>}
                   </tbody>
                 </table>
               </div>
            )}

             {activeTab === 'files' && (
                <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-white">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Size</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Link</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {files.map(f => (
                        <tr key={f.id} className="hover:bg-white/5">
                          <td className="p-4 text-white font-medium">{f.name}</td>
                          <td className="p-4"><span className="bg-white/10 px-2 py-1 rounded text-xs">{f.type}</span></td>
                          <td className="p-4">{f.size}</td>
                          <td className="p-4">{new Date(f.date).toLocaleDateString()}</td>
                          <td className="p-4">
                             {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View</a>}
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteFile(f.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                      {files.length === 0 && <tr><td colSpan="6" className="p-8 text-center">No files found.</td></tr>}
                    </tbody>
                  </table>
                </div>
             )}
        </div>
      </main>

      {activeDropdown && (
        <div 
          className="fixed z-50 bg-slate-900 border border-white/10 rounded shadow-xl w-40"
          style={{ top: activeDropdown.position.top, right: activeDropdown.position.right }}
          onClick={(e) => e.stopPropagation()}
        >
           {activeDropdown.type === 'project' && (
              <>
                <button onClick={() => { 
                  const project = projects.find(p => p.id === activeDropdown.id);
                  setEditingProject({
                    ...project,
                    next_meeting: formatDateTimeForInput(project.next_meeting)
                  });
                  setIsProjectModalOpen(true); 
                  setActiveDropdown(null); 
                }} className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-white/5 flex items-center gap-2">
                    <Edit2 size={14}/> Edit
                </button>
                <button onClick={() => { handleManageTimeline(projects.find(p => p.id === activeDropdown.id)); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-white/5 flex items-center gap-2">
                    <Clock size={14}/> Timeline
                </button>
                <button onClick={() => { handleManageUpdates(projects.find(p => p.id === activeDropdown.id)); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-white/5 flex items-center gap-2">
                    <AlertCircle size={14}/> Updates
                </button>
                <button onClick={() => { handleDeleteProject(activeDropdown.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                    <Trash2 size={14}/> Delete
                </button>
              </>
           )}
           {activeDropdown.type === 'invoice' && (
              <>
                <button onClick={() => { handleMarkInvoicePaid(activeDropdown.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-white/5 flex items-center gap-2">
                   <CheckCircle size={14}/> Paid
                </button>
                <button onClick={() => { handleDeleteInvoice(activeDropdown.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                   <Trash2 size={14}/> Delete
                </button>
              </>
           )}
        </div>
      )}

      <Modal isOpen={isProjectModalOpen} onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }} title={editingProject ? "Edit Project" : "New Project"}>
         <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
            <input 
              placeholder="Project Name" 
              className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
              value={editingProject ? editingProject.name : newProject.name} 
              onChange={e => editingProject ? setEditingProject({...editingProject, name: e.target.value}) : setNewProject({...newProject, name: e.target.value})} 
              required 
            />
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Progress (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0" 
                    className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                    value={editingProject ? editingProject.progress : newProject.progress} 
                    onChange={e => editingProject ? setEditingProject({...editingProject, progress: e.target.value}) : setNewProject({...newProject, progress: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                    value={editingProject ? editingProject.due_date : newProject.due_date} 
                    onChange={e => editingProject ? setEditingProject({...editingProject, due_date: e.target.value}) : setNewProject({...newProject, due_date: e.target.value})} 
                    required 
                  />
                </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Next Meeting</label>
              <input 
                type="datetime-local" 
                className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                value={editingProject ? editingProject.next_meeting : newProject.next_meeting} 
                onChange={e => editingProject ? setEditingProject({...editingProject, next_meeting: e.target.value}) : setNewProject({...newProject, next_meeting: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Live Website URL</label>
              <input 
                type="url"
                placeholder="https://example.com" 
                className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                value={editingProject ? (editingProject.hosted_url || '') : newProject.hosted_url} 
                onChange={e => editingProject ? setEditingProject({...editingProject, hosted_url: e.target.value}) : setNewProject({...newProject, hosted_url: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">GitHub Repository URL</label>
              <input 
                type="url"
                placeholder="https://github.com/username/repo" 
                className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                value={editingProject ? (editingProject.github_url || '') : newProject.github_url} 
                onChange={e => editingProject ? setEditingProject({...editingProject, github_url: e.target.value}) : setNewProject({...newProject, github_url: e.target.value})} 
              />
            </div>
            
            {!editingProject && (
              <>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Budget</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                    value={newProject.budget} 
                    onChange={e => setNewProject({...newProject, budget: e.target.value})} 
                  />
                </div>
                <div>
                   <label className="block text-xs text-gray-400 mb-1">Currency</label>
                   <select 
                      className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white"
                      value={newProject.currency}
                      onChange={e => setNewProject({...newProject, currency: e.target.value})}
                   >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className="block text-xs text-gray-400 mb-1">Advance Amount (Optional)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                    value={newProject.advanceAmount} 
                    onChange={e => setNewProject({...newProject, advanceAmount: e.target.value})} 
                  />
                </div>
              </div>
              </>
            )}
            
            <button disabled={isPending} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-500">
              {isPending ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
            </button>
         </form>
      </Modal>

      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="New Invoice">
         <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="flex gap-4">
                <input placeholder="Amount" type="number" className="flex-1 bg-slate-900 p-2 border border-white/10 rounded text-white" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} required />
                <select 
                    className="w-24 bg-slate-900 p-2 border border-white/10 rounded text-white"
                    value={newInvoice.currency}
                    onChange={e => setNewInvoice({...newInvoice, currency: e.target.value})}
                >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                </select>
            </div>
            <input type="date" className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" value={newInvoice.due_date} onChange={e => setNewInvoice({...newInvoice, due_date: e.target.value})} required />
            <button disabled={isPending} className="w-full bg-blue-600 text-white p-2 rounded">{isPending ? 'Saving...' : 'Create'}</button>
         </form>
      </Modal>

      <Modal isOpen={isEditClientModalOpen} onClose={() => setIsEditClientModalOpen(false)} title="Edit Client Details">
        {editingClient && (
            <form onSubmit={handleUpdateClient} className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Company Name</label>
                    <input 
                        className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                        value={editingClient.company_name} 
                        onChange={e => setEditingClient({...editingClient, company_name: e.target.value})} 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Contact Name</label>
                    <input 
                        className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                        value={editingClient.contact_name} 
                        onChange={e => setEditingClient({...editingClient, contact_name: e.target.value})} 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Email (Login)</label>
                    <input 
                        type="email"
                        className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                        value={editingClient.email} 
                        onChange={e => setEditingClient({...editingClient, email: e.target.value})} 
                        required 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Phone</label>
                        <input 
                            className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                            value={editingClient.phone || ''} 
                            onChange={e => setEditingClient({...editingClient, phone: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Plan Type</label>
                        <select 
                            className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white"
                            value={editingClient.plan_type}
                            onChange={e => setEditingClient({...editingClient, plan_type: e.target.value})}
                        >
                            <option value="Basic">Basic</option>
                            <option value="Premium">Premium</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Address</label>
                    <textarea 
                        className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white h-20" 
                        value={editingClient.address || ''} 
                        onChange={e => setEditingClient({...editingClient, address: e.target.value})} 
                    />
                </div>
                <button disabled={isPending} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-500">
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        )}
      </Modal>

      <Modal isOpen={isTimelineModalOpen} onClose={() => setIsTimelineModalOpen(false)} title={`Timeline: ${currentTimelineProject?.name}`}>
          <div className="space-y-6">
              <form onSubmit={handleAddTimelineEvent} className="flex gap-2">
                  <input 
                      className="flex-1 bg-slate-900 p-2 border border-white/10 rounded text-white" 
                      placeholder="New Event Label" 
                      value={newTimelineEvent.label} 
                      onChange={e => setNewTimelineEvent({...newTimelineEvent, label: e.target.value})} 
                      required 
                  />
                  <select 
                      className="bg-slate-900 p-2 border border-white/10 rounded text-white"
                      value={newTimelineEvent.status}
                      onChange={e => setNewTimelineEvent({...newTimelineEvent, status: e.target.value})}
                  >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                  </select>
                  <button disabled={isPending} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-500">Add</button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                  {timelineEvents.map(event => (
                      <div key={event.id} className="flex justify-between items-center bg-white/5 p-3 rounded">
                          <div>
                              <div className="text-sm text-white">{event.label}</div>
                              <div className="text-xs text-gray-400">{event.status}</div>
                          </div>
                          <button onClick={() => handleDeleteTimelineEvent(event.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 size={14} />
                          </button>
                      </div>
                  ))}
                  {timelineEvents.length === 0 && <div className="text-center text-gray-500 text-sm">No events yet.</div>}
              </div>
          </div>
      </Modal>

      <Modal isOpen={isUpdatesModalOpen} onClose={() => setIsUpdatesModalOpen(false)} title={`Updates: ${currentUpdatesProject?.name}`}>
          <div className="space-y-6">
              <form onSubmit={handleAddUpdate} className="space-y-4">
                  <textarea 
                      className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white h-24" 
                      placeholder="Update Message" 
                      value={newUpdate.message} 
                      onChange={e => setNewUpdate({...newUpdate, message: e.target.value})} 
                      required 
                  />
                  <div className="flex gap-2">
                      <select 
                          className="bg-slate-900 p-2 border border-white/10 rounded text-white"
                          value={newUpdate.type}
                          onChange={e => setNewUpdate({...newUpdate, type: e.target.value})}
                      >
                          <option value="general">General</option>
                          <option value="feature">New Feature</option>
                          <option value="fix">Bug Fix</option>
                          <option value="deployment">Deployment</option>
                      </select>
                      <button disabled={isPending} className="flex-1 bg-blue-600 text-white px-4 rounded hover:bg-blue-500">Add Update</button>
                  </div>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                  {projectUpdates.map(update => (
                      <div key={update.id} className="flex justify-between items-start bg-white/5 p-3 rounded">
                          <div>
                              <div className="text-sm text-white">{update.message}</div>
                              <div className="flex gap-2 mt-1">
                                  <span className="text-xs text-gray-400">{new Date(update.date).toLocaleDateString()}</span>
                                  <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 rounded capitalize">{update.type}</span>
                              </div>
                          </div>
                          <button onClick={() => handleDeleteUpdate(update.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 size={14} />
                          </button>
                      </div>
                  ))}
                  {projectUpdates.length === 0 && <div className="text-center text-gray-500 text-sm">No updates yet.</div>}
              </div>
          </div>
      </Modal>

      <Modal isOpen={isFilesModalOpen} onClose={() => setIsFilesModalOpen(false)} title="Add New File">
         <form onSubmit={handleCreateFile} className="space-y-4">
            <input 
                placeholder="File Name" 
                className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                value={newFile.name} 
                onChange={e => setNewFile({...newFile, name: e.target.value})} 
                required 
            />
            <div className="grid grid-cols-2 gap-4">
                <select 
                    className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white"
                    value={newFile.type}
                    onChange={e => setNewFile({...newFile, type: e.target.value})}
                >
                    <option value="Document">Document</option>
                    <option value="Image">Image</option>
                    <option value="Archive">Archive</option>
                    <option value="Design">Design</option>
                    <option value="Other">Other</option>
                </select>
                <input 
                    placeholder="Size (e.g. 2.5 MB)" 
                    className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                    value={newFile.size} 
                    onChange={e => setNewFile({...newFile, size: e.target.value})} 
                />
            </div>
            <input 
                placeholder="File URL (e.g. Google Drive Link)" 
                className="w-full bg-slate-900 p-2 border border-white/10 rounded text-white" 
                value={newFile.url} 
                onChange={e => setNewFile({...newFile, url: e.target.value})} 
                required 
            />
            <button disabled={isPending} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-500">
                {isPending ? 'Adding...' : 'Add File'}
            </button>
         </form>
      </Modal>

      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title={`Ticket #${selectedTicket?.id}: ${selectedTicket?.subject}`}>
         <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Original Message</div>
                <div className="text-white">{selectedTicket?.subject}</div> 
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto">
                {selectedTicket?.replies?.map(reply => (
                    <div key={reply.id} className={`flex flex-col ${reply.is_admin ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${reply.is_admin ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-200'}`}>
                            <div className="text-sm">{reply.message}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(reply.created_at).toLocaleString()}</div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleReplyToTicket} className="flex gap-2">
                <input 
                    className="flex-1 bg-slate-900 p-2 border border-white/10 rounded text-white" 
                    placeholder="Type your reply..." 
                    value={replyMessage} 
                    onChange={e => setReplyMessage(e.target.value)} 
                    required 
                />
                <button disabled={isPending} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-500">Reply</button>
            </form>
         </div>
      </Modal>

    </div>
  );
}

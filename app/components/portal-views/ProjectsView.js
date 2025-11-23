'use client'

import React, { useState, useEffect } from 'react';
import { getProjects } from '../../actions/portal';
import { FolderKanban, Calendar, ArrowRight, MoreHorizontal } from 'lucide-react';

const ProjectsView = ({ userEmail, onNewRequest }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const fetchProjects = async () => {
      const result = await getProjects(userEmail);
      if (result.success) {
        setProjects(result.data);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const s = (status || 'active').toLowerCase();
    if (s.includes('complete')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (s.includes('development') || s.includes('progress')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  };




  const filteredProjects = projects.filter(project => {
    const status = (project.status || '').toLowerCase();
    if (activeTab === 'active') {
      return !status.includes('complete');
    } else {
      return status.includes('complete');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Projects</h2>
          <p className="text-slate-400 mt-1">Track the progress of your ongoing development.</p>
        </div>
        {!selectedProject && (
          <button 
            onClick={onNewRequest}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-blue-500/20"
          >
            <span>New Request</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {selectedProject ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setSelectedProject(null)} 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" /> Back to Projects
          </button>

          {/* Project Header */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-white">{selectedProject.title || 'Untitled Project'}</h3>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status || 'Active'}
                  </span>
                </div>
                <p className="text-slate-400">Web Development Project</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 mb-1">Overall Progress</p>
                <p className="text-2xl font-bold text-white">{selectedProject.progress}%</p>
              </div>
            </div>

            {/* Financials */}
            {(selectedProject.budget > 0 || selectedProject.paidAmount > 0) && (
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-white/10">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Budget</p>
                  <p className="text-lg font-semibold text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedProject.currency }).format(selectedProject.budget)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Amount Paid</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedProject.currency }).format(selectedProject.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Remaining</p>
                  <p className="text-lg font-semibold text-amber-400">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedProject.currency }).format(selectedProject.remainingAmount)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" />
                Project Timeline
              </h4>
              <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {selectedProject.timeline?.map((event, index) => (
                  <div key={event.id || index} className="relative pl-8">
                    <div className={`absolute left-0 top-1.5 w-4.5 h-4.5 rounded-full border-2 ${
                      event.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 
                      event.status === 'in_progress' ? 'bg-blue-500 border-blue-500' : 
                      'bg-slate-800 border-slate-600'
                    }`}></div>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-400 mb-1">
                        {event.date ? new Date(event.date).toLocaleDateString() : 'Pending'}
                      </span>
                      <h5 className="text-white font-medium">{event.title}</h5>
                      {event.description && <p className="text-sm text-slate-400 mt-1">{event.description}</p>}
                    </div>
                  </div>
                ))}
                {(!selectedProject.timeline || selectedProject.timeline.length === 0) && (
                  <p className="text-slate-500 pl-8">No timeline events yet.</p>
                )}
              </div>
            </div>

            {/* Recent Updates */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <FolderKanban size={20} className="text-purple-500" />
                Recent Updates
              </h4>
              <div className="space-y-4">
                {selectedProject.updates?.map((update, index) => (
                  <div key={update.id || index} className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                        {update.type || 'Update'}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(update.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 text-sm">{update.message}</p>
                  </div>
                ))}
                {(!selectedProject.updates || selectedProject.updates.length === 0) && (
                  <p className="text-slate-500">No updates posted yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/10 mb-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'active' 
                  ? 'text-blue-500' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Projects
              {activeTab === 'active' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'completed' 
                  ? 'text-blue-500' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed
              {activeTab === 'completed' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div key={project.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:bg-slate-800 transition-all hover:-translate-y-1 flex flex-col gap-4 group">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <FolderKanban size={24} />
                    </div>
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(project.status)} w-fit`}>
                      {project.status}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => setSelectedProject(project)}>
                      {project.title}
                    </h3>
                    <p className="text-sm text-slate-400">Web Development Project</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {(project.budget > 0 || project.paidAmount > 0) && (
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/10 mt-2">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">Budget</p>
                        <p className="text-sm font-semibold text-white">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(project.budget)}
                        </p>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <p className="text-xs text-slate-400 mb-1">Paid</p>
                        <p className="text-sm font-semibold text-emerald-400">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(project.paidAmount)}
                        </p>
                      </div>
                      <div className="text-center border-l border-white/10">
                        <p className="text-xs text-slate-400 mb-1">Remaining</p>
                        <p className="text-sm font-semibold text-amber-400">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(project.remainingAmount)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar size={16} />
                      <span>Due Dec 31, 2025</span>
                    </div>
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 bg-slate-800/30 rounded-xl border border-white/5 border-dashed">
                <FolderKanban size={48} className="text-slate-600 mb-4" />
                <p className="text-slate-400 font-medium">No {activeTab} projects found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsView;

'use client'

import React, { useState, useEffect } from 'react';
import { getProjectLinks } from '../../actions/portal';
import { ExternalLink, Globe, Calendar, CheckCircle2 } from 'lucide-react';

const LiveSiteView = ({ userEmail }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getProjectLinks(userEmail);
      if (result.success) {
        setProjects(result.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Websites</h2>
          <p className="text-slate-400 mt-1">View your projects' hosted websites and track updates.</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-slate-400">No active projects found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project, index) => (
            <div key={index} className="bg-slate-800/50 border border-white/10 rounded-xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Globe size={32} className="text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {project.projectName || 'Your Project'}
                  </h3>
                  
                  {project.progress !== undefined && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">Development Progress</span>
                        <span className="text-white font-semibold">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-slate-400 mb-6">
                    Your website is live and accessible to the public. Click the link below to view the current version.
                  </p>

                  {project.hostedUrl ? (
                    <a
                      href={project.hostedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/25"
                    >
                      <ExternalLink size={20} />
                      <span>Visit Live Website</span>
                    </a>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-amber-500">
                      <p className="font-medium">Website deployment in progress...</p>
                      <p className="text-sm mt-1 text-amber-400">The hosted link will be available once deployment is complete.</p>
                    </div>
                  )}

                  {project.lastUpdated && (
                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-sm text-slate-400">
                      <Calendar size={16} />
                      <span>Last updated: {new Date(project.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  )}

                  {project.updateHistory && project.updateHistory.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-4">Recent Updates</h4>
                      <div className="space-y-4">
                        {project.updateHistory.map((update, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="mt-1">
                              <CheckCircle2 size={16} className="text-blue-400" />
                            </div>
                            <div>
                              <p className="text-slate-300">{update.message}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs text-slate-500">{new Date(update.date).toLocaleDateString()}</span>
                                {update.type && <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 rounded capitalize">{update.type}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveSiteView;

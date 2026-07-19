import { useState, useEffect, useCallback } from 'react';
import {
  Folder, FolderPlus, Users, Plus, X, Loader2, Check, Link2, Trash2,
  FileImage, Palette as PaletteIcon, Shapes, Code2, Link as LinkIcon,
  ChevronRight, Mail, Crown, Shield, Eye, UserMinus, Copy, LayoutGrid, Monitor
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  owner_id: string;
  team_id: string | null;
  name: string;
  description: string | null;
  color: string;
  status: string;
  created_at: string;
}

interface ProjectItem {
  id: string;
  project_id: string;
  item_type: 'analysis' | 'boxt_design' | 'palette' | 'asset' | 'mockup' | 'code_note' | 'link';
  item_id: string | null;
  title: string;
  content: any;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  owner_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  email?: string;
  username?: string;
}

interface ProjectsHubProps {
  userId: string;
}

const ITEM_META: Record<ProjectItem['item_type'], { icon: React.ReactNode; label: string }> = {
  analysis: { icon: <FileImage size={15} />, label: 'Analysis' },
  boxt_design: { icon: <Shapes size={15} />, label: 'Boxt design' },
  palette: { icon: <PaletteIcon size={15} />, label: 'Palette' },
  asset: { icon: <LayoutGrid size={15} />, label: 'Asset' },
  mockup: { icon: <Monitor size={15} />, label: 'Mockup' },
  code_note: { icon: <Code2 size={15} />, label: 'Code note' },
  link: { icon: <LinkIcon size={15} />, label: 'Link' },
};

const ROLE_ICONS: Record<TeamMember['role'], React.ReactNode> = {
  owner: <Crown size={12} className="text-amber-300" />,
  admin: <Shield size={12} className="text-violet-300" />,
  member: <Users size={12} className="text-blue-300" />,
  viewer: <Eye size={12} className="text-gray-400" />,
};

export function ProjectsHub({ userId }: ProjectsHubProps) {
  const [tab, setTab] = useState<'projects' | 'teams'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadAll = useCallback(async () => {
    const [{ data: projectData }, { data: teamData }] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
    ]);
    setProjects((projectData || []) as unknown as Project[]);
    setTeams((teamData || []) as unknown as Team[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-violet-400" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.08]">
          <button
            onClick={() => { setTab('projects'); setSelectedTeam(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'projects' ? 'bg-violet-500/25 text-violet-200' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-2"><Folder size={15} /> Projects</span>
          </button>
          <button
            onClick={() => { setTab('teams'); setSelectedProject(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'teams' ? 'bg-violet-500/25 text-violet-200' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-2"><Users size={15} /> Teams</span>
          </button>
        </div>
        <button
          onClick={() => tab === 'projects' ? setShowNewProject(true) : setShowNewTeam(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all"
        >
          {tab === 'projects' ? <FolderPlus size={16} /> : <Plus size={16} />}
          {tab === 'projects' ? 'New project' : 'New team'}
        </button>
      </div>

      {/* Body */}
      {tab === 'projects' && !selectedProject && (
        <ProjectGrid projects={projects} teams={teams} onOpen={setSelectedProject} />
      )}
      {tab === 'projects' && selectedProject && (
        <ProjectDetail
          project={selectedProject}
          userId={userId}
          onBack={() => { setSelectedProject(null); loadAll(); }}
          onToast={showToast}
        />
      )}
      {tab === 'teams' && !selectedTeam && (
        <TeamGrid teams={teams} onOpen={setSelectedTeam} />
      )}
      {tab === 'teams' && selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          userId={userId}
          onBack={() => { setSelectedTeam(null); loadAll(); }}
          onToast={showToast}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          userId={userId}
          teams={teams}
          onClose={() => setShowNewProject(false)}
          onCreated={(p) => { setProjects(prev => [p, ...prev]); setShowNewProject(false); }}
        />
      )}
      {showNewTeam && (
        <NewTeamModal
          userId={userId}
          onClose={() => setShowNewTeam(false)}
          onCreated={(t) => { setTeams(prev => [t, ...prev]); setShowNewTeam(false); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm backdrop-blur-md animate-slide-up">
          <Check size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}

function ProjectGrid({ projects, teams, onOpen }: { projects: Project[]; teams: Team[]; onOpen: (p: Project) => void }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-12 text-center">
        <Folder size={40} className="mx-auto text-gray-600 mb-4" />
        <h3 className="font-display text-lg font-semibold text-white mb-2">No projects yet</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Projects pull your analyses, Boxt designs, palettes, assets, mockups, code notes,
          and links into one shareable body of work.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(project => {
        const team = teams.find(t => t.id === project.team_id);
        return (
          <button
            key={project.id}
            onClick={() => onOpen(project)}
            className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-400/30 hover:bg-white/[0.05] transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}26`, color: project.color }}>
                <Folder size={20} />
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="font-display font-semibold text-white truncate">{project.name}</h3>
            {project.description && <p className="text-sm text-gray-400 line-clamp-2 mt-1">{project.description}</p>}
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              {team && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                  <Users size={10} /> {team.name}
                </span>
              )}
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ProjectDetail({ project, userId, onBack, onToast }: {
  project: Project; userId: string; onBack: () => void; onToast: (m: string) => void;
}) {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from('project_items')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order')
      .order('created_at');
    setItems((data || []) as unknown as ProjectItem[]);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const shareProject = async () => {
    const { data, error } = await supabase
      .from('share_links')
      .insert({ owner_id: userId, resource_type: 'project', resource_id: project.id })
      .select('token')
      .single();
    if (!error && data) {
      await navigator.clipboard.writeText(`${window.location.origin}/?share=${data.token}`);
      onToast('Project share link copied');
    }
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project? Items inside it are only removed from the project, not deleted.')) return;
    await supabase.from('projects').delete().eq('id', project.id);
    onBack();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('project_items').delete().eq('id', itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← All projects
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={shareProject}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-gray-300 hover:bg-white/[0.1] transition-colors"
          >
            <Link2 size={14} /> Share
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm text-white font-medium transition-colors"
          >
            <Plus size={14} /> Add to project
          </button>
          {project.owner_id === userId && (
            <button onClick={deleteProject} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}26`, color: project.color }}>
            <Folder size={20} />
          </div>
          <h2 className="font-display text-xl font-semibold text-white">{project.name}</h2>
        </div>
        {project.description && <p className="text-gray-400 ml-13 mt-1">{project.description}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-400" size={22} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-10 text-center text-gray-500 text-sm">
          Nothing here yet — add analyses, designs, palettes, code notes, or links.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const meta = ITEM_META[item.item_type];
            return (
              <div key={item.id} className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-colors">
                <span className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center flex-shrink-0">
                  {meta.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{item.title || 'Untitled'}</div>
                  <div className="text-xs text-gray-500">{meta.label}</div>
                </div>
                {item.item_type === 'link' && item.content?.url && (
                  <a href={item.content.url} target="_blank" rel="noreferrer" className="text-xs text-violet-300 hover:text-violet-200 truncate max-w-[200px]">
                    {item.content.url}
                  </a>
                )}
                {item.item_type === 'code_note' && item.content?.code && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(item.content.code); onToast('Code copied'); }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    <Copy size={14} />
                  </button>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAddItem && (
        <AddItemModal
          project={project}
          userId={userId}
          onClose={() => setShowAddItem(false)}
          onAdded={(item) => { setItems(prev => [...prev, item]); setShowAddItem(false); }}
        />
      )}
    </div>
  );
}

function AddItemModal({ project, userId, onClose, onAdded }: {
  project: Project; userId: string; onClose: () => void; onAdded: (i: ProjectItem) => void;
}) {
  const [mode, setMode] = useState<'pick' | 'code_note' | 'link'>('pick');
  const [pickType, setPickType] = useState<'analysis' | 'boxt_design' | 'palette' | 'asset' | 'mockup'>('analysis');
  const [candidates, setCandidates] = useState<{ id: string; title: string }[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCode, setNoteCode] = useState('');
  const [noteLanguage, setNoteLanguage] = useState('tsx');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadingCandidates(true);
      let rows: { id: string; title: string }[] = [];
      if (pickType === 'analysis') {
        const { data } = await supabase.from('design_analyses').select('id, file_name').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
        rows = (data || []).map(r => ({ id: r.id, title: r.file_name }));
      } else if (pickType === 'boxt_design') {
        const { data } = await supabase.from('boxt_designs').select('id, title').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
        rows = (data || []).map(r => ({ id: r.id, title: r.title }));
      } else if (pickType === 'palette') {
        const { data } = await supabase.from('color_palettes').select('id, name').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
        rows = (data || []).map(r => ({ id: r.id, title: r.name }));
      } else if (pickType === 'asset') {
        const { data } = await supabase.from('design_assets').select('id, name').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
        rows = (data || []).map(r => ({ id: r.id, title: r.name }));
      } else if (pickType === 'mockup') {
        const { data } = await supabase.from('mockup_projects').select('id, title').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
        rows = (data || []).map(r => ({ id: r.id, title: r.title || 'Untitled mockup' }));
      }
      setCandidates(rows);
      setLoadingCandidates(false);
    };
    if (mode === 'pick') load();
  }, [pickType, mode, userId]);

  const addItem = async (payload: Partial<ProjectItem>) => {
    const { data, error } = await supabase
      .from('project_items')
      .insert({
        project_id: project.id,
        added_by: userId,
        item_type: payload.item_type!,
        item_id: payload.item_id ?? null,
        title: payload.title || '',
        content: payload.content ?? {},
      })
      .select()
      .single();
    if (!error && data) onAdded(data as unknown as ProjectItem);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">Add to {project.name}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {(['analysis', 'boxt_design', 'palette', 'asset', 'mockup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setMode('pick'); setPickType(t); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'pick' && pickType === t
                    ? 'bg-violet-500/25 text-violet-200 border border-violet-500/40'
                    : 'bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:text-white'
                }`}
              >
                {ITEM_META[t].label}
              </button>
            ))}
            <button
              onClick={() => setMode('code_note')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === 'code_note'
                  ? 'bg-violet-500/25 text-violet-200 border border-violet-500/40'
                  : 'bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:text-white'
              }`}
            >
              Code note
            </button>
            <button
              onClick={() => setMode('link')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === 'link'
                  ? 'bg-violet-500/25 text-violet-200 border border-violet-500/40'
                  : 'bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:text-white'
              }`}
            >
              Link
            </button>
          </div>

          {mode === 'pick' && (
            <div className="space-y-1.5">
              {loadingCandidates ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-violet-400" size={20} /></div>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">You don't have any {ITEM_META[pickType].label.toLowerCase()}s yet.</p>
              ) : candidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => addItem({ item_type: pickType, item_id: c.id, title: c.title })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-400/40 hover:bg-white/[0.06] transition-colors text-left"
                >
                  <span className="text-violet-300">{ITEM_META[pickType].icon}</span>
                  <span className="text-sm text-gray-200 truncate flex-1">{c.title}</span>
                  <Plus size={14} className="text-gray-500" />
                </button>
              ))}
            </div>
          )}

          {mode === 'code_note' && (
            <div className="space-y-3">
              <input
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder="Note title — e.g. Hero animation snippet"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              />
              <input
                value={noteLanguage}
                onChange={e => setNoteLanguage(e.target.value)}
                placeholder="Language (tsx, css, py…)"
                className="w-40 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-violet-500/50"
              />
              <textarea
                value={noteCode}
                onChange={e => setNoteCode(e.target.value)}
                placeholder="Paste code here…"
                rows={8}
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded-lg text-gray-200 text-sm font-mono focus:outline-none focus:border-violet-500/50 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => addItem({ item_type: 'code_note', title: noteTitle, content: { code: noteCode, language: noteLanguage } })}
                  disabled={!noteTitle.trim() || !noteCode.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
                >
                  Add code note
                </button>
              </div>
            </div>
          )}

          {mode === 'link' && (
            <div className="space-y-3">
              <input
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
                placeholder="Title — e.g. Staging deploy"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              />
              <input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-violet-500/50"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => addItem({ item_type: 'link', title: linkTitle, content: { url: linkUrl } })}
                  disabled={!linkTitle.trim() || !/^https?:\/\//.test(linkUrl)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
                >
                  Add link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamGrid({ teams, onOpen }: { teams: Team[]; onOpen: (t: Team) => void }) {
  if (teams.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-12 text-center">
        <Users size={40} className="mx-auto text-gray-600 mb-4" />
        <h3 className="font-display text-lg font-semibold text-white mb-2">No teams yet</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Create a team, invite people by email, and share projects, designs, and assets with everyone at once.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map(team => (
        <button
          key={team.id}
          onClick={() => onOpen(team)}
          className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-400/30 hover:bg-white/[0.05] transition-all text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${team.color}26`, color: team.color }}>
              <Users size={20} />
            </div>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="font-display font-semibold text-white truncate">{team.name}</h3>
          {team.description && <p className="text-sm text-gray-400 line-clamp-2 mt-1">{team.description}</p>}
        </button>
      ))}
    </div>
  );
}

function TeamDetail({ team, userId, onBack, onToast }: {
  team: Team; userId: string; onBack: () => void; onToast: (m: string) => void;
}) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);

  const myRole = members.find(m => m.user_id === userId)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  const loadMembers = useCallback(async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id)
      .order('joined_at');
    const rows = (data || []) as unknown as TeamMember[];

    // Enrich with profile info (visible to teammates via profiles view RLS
    // only for self/admin, so fall back to a short id)
    const ids = rows.map(r => r.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, email, username').in('id', ids);
    const map = new Map((profiles || []).map(p => [p.id, p]));
    setMembers(rows.map(r => ({
      ...r,
      email: map.get(r.user_id)?.email ?? undefined,
      username: map.get(r.user_id)?.username ?? undefined,
    })));
    setLoading(false);
  }, [team.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const { data, error } = await supabase
      .from('team_invites')
      .insert({ team_id: team.id, email: inviteEmail.trim().toLowerCase(), role: inviteRole, invited_by: userId })
      .select('token')
      .single();
    setInviting(false);
    if (error) {
      onToast('Only team admins can send invites');
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/?invite=${data.token}`);
    setInviteEmail('');
    onToast('Invite link copied — send it to your teammate');
  };

  const removeMember = async (member: TeamMember) => {
    if (member.role === 'owner') return;
    if (!confirm(`Remove ${member.username || member.email || 'this member'} from the team?`)) return;
    await supabase.from('team_members').delete().eq('id', member.id);
    setMembers(prev => prev.filter(m => m.id !== member.id));
  };

  const leaveTeam = async () => {
    if (!confirm('Leave this team?')) return;
    const me = members.find(m => m.user_id === userId);
    if (me) {
      await supabase.from('team_members').delete().eq('id', me.id);
      onBack();
    }
  };

  const deleteTeam = async () => {
    if (!confirm('Delete this team? Shared resources revert to their owners.')) return;
    await supabase.from('teams').delete().eq('id', team.id);
    onBack();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← All teams
        </button>
        <div className="flex items-center gap-2">
          {myRole && myRole !== 'owner' && (
            <button onClick={leaveTeam} className="px-3 py-2 text-sm text-gray-400 hover:text-amber-300 transition-colors">
              Leave team
            </button>
          )}
          {team.owner_id === userId && (
            <button onClick={deleteTeam} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${team.color}26`, color: team.color }}>
            <Users size={20} />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">{team.name}</h2>
            {team.description && <p className="text-sm text-gray-400">{team.description}</p>}
          </div>
        </div>
      </div>

      {canManage && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
          <h3 className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase mb-3">Invite someone</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full pl-9 pr-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
              className="px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none"
            >
              <option value="admin" className="bg-[#12121a]">Admin</option>
              <option value="member" className="bg-[#12121a]">Member</option>
              <option value="viewer" className="bg-[#12121a]">Viewer</option>
            </select>
            <button
              onClick={invite}
              disabled={inviting || !inviteEmail.includes('@')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Invite
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            An invite link is copied to your clipboard — the recipient signs in with that email and accepts.
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.07]">
          <h3 className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase">Members · {members.length}</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-violet-400" size={20} /></div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold text-white uppercase">
                  {(member.username || member.email || member.user_id).slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {member.username ? `@${member.username}` : member.email || `${member.user_id.slice(0, 8)}…`}
                    {member.user_id === userId && <span className="text-gray-500"> (you)</span>}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-[11px] text-gray-300 capitalize">
                  {ROLE_ICONS[member.role]}
                  {member.role}
                </span>
                {canManage && member.role !== 'owner' && member.user_id !== userId && (
                  <button
                    onClick={() => removeMember(member)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove member"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewProjectModal({ userId, teams, onClose, onCreated }: {
  userId: string; teams: Team[]; onClose: () => void; onCreated: (p: Project) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [teamId, setTeamId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        owner_id: userId,
        name: name.trim(),
        description: description.trim() || null,
        color,
        team_id: teamId || null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) onCreated(data as unknown as Project);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">New project</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this project about? (optional)"
            rows={2}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Color</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-14 h-9 rounded cursor-pointer bg-transparent" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Team (optional)</label>
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none"
              >
                <option value="" className="bg-[#12121a]">Just me</option>
                {teams.map(t => <option key={t.id} value={t.id} className="bg-[#12121a]">{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors">Cancel</button>
            <button
              onClick={create}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
              Create project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTeamModal({ userId, onClose, onCreated }: {
  userId: string; onClose: () => void; onCreated: (t: Team) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('teams')
      .insert({ owner_id: userId, name: name.trim(), description: description.trim() || null, color })
      .select()
      .single();

    if (!error && data) {
      // Bootstrap the creator's owner membership (RLS allows this exact insert)
      await supabase.from('team_members').insert({ team_id: data.id, user_id: userId, role: 'owner' });
      onCreated(data as unknown as Team);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">New team</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Team name"
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What does this team work on? (optional)"
            rows={2}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <div>
            <label className="block text-xs text-gray-400 mb-1">Color</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-14 h-9 rounded cursor-pointer bg-transparent" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors">Cancel</button>
            <button
              onClick={create}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

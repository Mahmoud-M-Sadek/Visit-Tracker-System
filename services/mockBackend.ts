import { Agent, AgentStatus, AuthResponse, User, UserRole, Visit } from '../types';

/**
 * NOTE: In a real Node.js + Express environment, this logic would reside on the server.
 * This service simulates the Database (Prisma) and API Routes functionality 
 * using localStorage so the application is fully functional in the browser.
 */

const STORAGE_KEYS = {
  AGENTS: 'vts_agents',
  VISITS: 'vts_visits',
  ADMIN: 'vts_admin',
  SESSION: 'vts_session'
};

// Initialize Mock Data
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.AGENTS)) {
    const mockAgents: Agent[] = [
      {
        id: '1',
        code: 'REP-1001',
        name: 'د. أحمد علي',
        company: 'فايزر (Pfizer)',
        products: 'ليبيتور، نورفاسك، زانكس',
        phone: '01012345678',
        password: 'password123',
        status: AgentStatus.ACTIVE,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        code: 'REP-1002',
        name: 'د. سارة سمير',
        company: 'نوفارتس (Novartis)',
        products: 'فولتارين، كاتافلام، ديوفان',
        phone: '01123456789',
        password: 'password123',
        status: AgentStatus.INACTIVE,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(mockAgents));
  }

  if (!localStorage.getItem(STORAGE_KEYS.VISITS)) {
    const mockVisits: Visit[] = [
      {
        id: '101',
        agentId: '1',
        agentName: 'د. أحمد علي',
        agentCompany: 'فايزر (Pfizer)',
        agentPhone: '01012345678',
        visitDate: new Date().toISOString(),
        notes: 'تم عرض أدوية جديدة للضغط. المندوب قدم عينات مجانية وطلب تحديد موعد للشهر القادم.',
        createdAt: new Date().toISOString(),
        location: { lat: 30.0444, lng: 31.2357 }
      }
    ];
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(mockVisits));
  }
};

initializeData();

// --- Auth Routes Simulation ---

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Admin Login (Hardcoded for demo)
  if (username === 'admin' && password === 'admin') {
    const user: User = { id: 'admin', username: 'admin', name: 'د. المدير', role: UserRole.ADMIN };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    return { token: 'mock-jwt-admin-token', user };
  }

  // Agent Login
  const agents = JSON.parse(localStorage.getItem(STORAGE_KEYS.AGENTS) || '[]');
  const agent = agents.find((a: Agent) => a.code === username && a.password === password);

  if (agent) {
    if (agent.status === AgentStatus.INACTIVE) throw new Error('هذا الحساب غير نشط');
    
    const user: User = { id: agent.id, username: agent.code, name: agent.name, role: UserRole.AGENT };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    return { token: `mock-jwt-agent-${agent.id}`, user };
  }

  throw new Error('بيانات الدخول غير صحيحة');
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
};

export const getSession = (): User | null => {
  const session = localStorage.getItem(STORAGE_KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

// --- Agent Routes Simulation ---

export const getAgents = async (): Promise<Agent[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.AGENTS) || '[]');
};

export const createAgent = async (data: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const agents = await getAgents();
  
  // Check unique code
  if (agents.some(a => a.code === data.code)) throw new Error('كود المندوب موجود مسبقاً');

  const newAgent: Agent = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };

  agents.push(newAgent);
  localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  return newAgent;
};

export const deleteAgent = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get current state
  let agents: Agent[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AGENTS) || '[]');
  let visits: Visit[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');

  // 1. Remove the agent
  const updatedAgents = agents.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(updatedAgents));

  // 2. Cascade delete: Remove all visits by this agent
  const updatedVisits = visits.filter(v => v.agentId !== id);
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(updatedVisits));
};

// --- Visit Routes Simulation ---

export const getVisits = async (): Promise<Visit[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
};

export const createVisit = async (data: Omit<Visit, 'id' | 'createdAt'>): Promise<Visit> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const visits = await getVisits();

  const newVisit: Visit = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };

  visits.unshift(newVisit); // Add to top
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  return newVisit;
};

export const deleteVisit = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let visits = await getVisits();
  visits = visits.filter(v => v.id !== id);
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
};

// --- Report/Dashboard Helpers ---

export const getStats = async () => {
  const agents = await getAgents();
  const visits = await getVisits();
  
  const today = new Date().toISOString().split('T')[0];
  const visitsToday = visits.filter(v => v.visitDate.startsWith(today)).length;
  const activeAgents = agents.filter(a => a.status === AgentStatus.ACTIVE).length;

  return {
    totalAgents: agents.length,
    totalVisits: visits.length,
    visitsToday,
    activeAgents
  };
};
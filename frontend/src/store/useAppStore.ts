import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AppState {
  // Auth
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Rooms
  rooms: any[];
  setRooms: (rooms: any[]) => void;
  fetchRooms: () => Promise<void>;
  
  // Global Stats
  globalStats: {
    totalStudents: number;
    averageSuccessRate: number;
    pendingEvaluations: number;
    activeRooms: number;
  };
  fetchGlobalStats: () => Promise<void>;

  // Active Room View
  currentRoom: any | null;
  currentStudents: any[];
  currentEvaluations: any[];
  currentGrades: any[];
  currentSN: any[];
  currentBonusMalus: any[];
  currentMembers: any[];
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  setCurrentRoom: (room: any | null) => void;
  fetchRoomData: (roomId: string) => Promise<void>;
  updateGrade: (studentId: string, evaluationId: string, score: number | null) => Promise<void>;
  updateSN: (studentId: string, roomId: string, score: number | null) => Promise<void>;
  
  // Student Management
  addStudent: (student: { room_id: string; matricule: string; last_name: string; first_name: string }) => Promise<void>;
  updateStudent: (studentId: string, updates: { matricule?: string; last_name?: string; first_name?: string }) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;

  // Evaluation Management
  addEvaluation: (evaluation: { room_id: string; type: 'CC' | 'TP'; label: string; weight: number; position: number }) => Promise<void>;
  updateEvaluation: (evaluationId: string, updates: { label?: string; weight?: number }) => Promise<void>;
  deleteEvaluation: (evaluationId: string) => Promise<void>;

  addBonusMalus: (adjustment: { student_id: string; room_id: string; value: number; reason: string; created_by: string }) => Promise<void>;
  toggleRoomLock: (roomId: string, isLocked: boolean) => Promise<void>;
  updateRoom: (roomId: string, updates: any) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  fetchMembers: (roomId: string) => Promise<void>;
  addMember: (roomId: string, userEmail: string, permissions: any) => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<void>;

  // UI State
  isCreateRoomModalOpen: boolean;
  setIsCreateRoomModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  fetchRooms: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ rooms: data });
    }
  },

  globalStats: {
    totalStudents: 0,
    averageSuccessRate: 0,
    pendingEvaluations: 0,
    activeRooms: 0
  },

  fetchGlobalStats: async () => {
    const { user } = get();
    if (!user) return;

    const [roomsRes, studentsRes, evalsRes] = await Promise.all([
      supabase.from('rooms').select('id, is_locked').eq('owner_id', user.id),
      supabase.from('students').select('id, room_id'),
      supabase.from('evaluations').select('id, room_id')
    ]);

    if (!roomsRes.error && !studentsRes.error) {
      const activeRooms = roomsRes.data.filter(r => !r.is_locked).length;
      const totalStudents = studentsRes.data.length;
      
      set({ 
        globalStats: {
          totalStudents,
          activeRooms,
          pendingEvaluations: evalsRes.data?.length || 0,
          averageSuccessRate: 0
        }
      });
    }
  },

  currentRoom: null,
  currentStudents: [],
  currentEvaluations: [],
  currentGrades: [],
  currentSN: [],
  currentBonusMalus: [],
  currentMembers: [],

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  fetchRoomData: async (roomId: string) => {
    const [roomRes, studentsRes, evaluationsRes, gradesRes, snRes, bmRes, membersRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      supabase.from('students').select('*').eq('room_id', roomId).order('last_name'),
      supabase.from('evaluations').select('*').eq('room_id', roomId).order('position'),
      supabase.from('grades').select('*').in('student_id', 
        (await supabase.from('students').select('id').eq('room_id', roomId)).data?.map(s => s.id) || []
      ),
      supabase.from('session_normale').select('*').eq('room_id', roomId),
      supabase.from('bonus_malus').select('*').eq('room_id', roomId),
      supabase.from('room_members').select('*, profiles(full_name, email, avatar_url)').eq('room_id', roomId)
    ]);

    if (!roomRes.error) set({ currentRoom: roomRes.data });
    if (!studentsRes.error) set({ currentStudents: studentsRes.data || [] });
    if (!evaluationsRes.error) set({ currentEvaluations: evaluationsRes.data || [] });
    if (!gradesRes.error) set({ currentGrades: gradesRes.data || [] });
    if (!snRes.error) set({ currentSN: snRes.data || [] });
    if (!bmRes.error) set({ currentBonusMalus: bmRes.data || [] });
    if (!membersRes.error) set({ currentMembers: membersRes.data || [] });
  },

  fetchMembers: async (roomId: string) => {
    const { data, error } = await supabase
      .from('room_members')
      .select('*, profiles(full_name, email, avatar_url)')
      .eq('room_id', roomId);
    if (!error) set({ currentMembers: data || [] });
  },

  addMember: async (roomId, userEmail, permissions) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      throw new Error("User with this email not found.");
    }

    const { error: memberError } = await supabase.from('room_members').insert({
      room_id: roomId,
      user_id: profile.id,
      ...permissions
    });

    if (memberError) throw memberError;
    await get().fetchMembers(roomId);
  },

  updateGrade: async (studentId, evaluationId, score) => {
    const { currentGrades } = get();
    
    // Update local state immediately for responsiveness
    const updatedGrades = [...currentGrades.filter(g => !(g.student_id === studentId && g.evaluation_id === evaluationId))];
    if (score !== null) {
      updatedGrades.push({ student_id: studentId, evaluation_id: evaluationId, score, updated_at: new Date().toISOString() });
    }
    set({ currentGrades: updatedGrades });

    const { error } = await supabase.from('grades').upsert({
      student_id: studentId,
      evaluation_id: evaluationId,
      score,
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,evaluation_id' });

    if (error) {
      console.error('Error updating grade:', error);
      // Re-fetch to ensure consistency on error
      const { data } = await supabase.from('grades').select('*').in('student_id', 
        get().currentStudents.map((s: any) => s.id)
      );
      if (data) set({ currentGrades: data });
      throw error;
    }
  },

  updateSN: async (studentId, roomId, score) => {
    const { currentSN } = get();
    
    // Update local state immediately
    const updatedSN = [...currentSN.filter(sn => sn.student_id !== studentId)];
    if (score !== null) {
      updatedSN.push({ student_id: studentId, room_id: roomId, score, updated_at: new Date().toISOString() });
    }
    set({ currentSN: updatedSN });

    const { error } = await supabase.from('session_normale').upsert({
      student_id: studentId,
      room_id: roomId,
      score,
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,room_id' });

    if (error) {
      console.error('Error updating SN:', error);
      // Re-fetch on error
      const { data } = await supabase.from('session_normale').select('*').eq('room_id', roomId);
      if (data) set({ currentSN: data });
      throw error;
    }
  },

  addStudent: async (student) => {
    const { error } = await supabase.from('students').insert(student);
    if (!error) {
      await get().fetchRoomData(student.room_id);
    } else {
      throw error;
    }
  },

  updateStudent: async (studentId: string, updates: any) => {
    const { currentRoom } = get();
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId);
    
    if (!error && currentRoom) {
      await get().fetchRoomData(currentRoom.id);
    } else if (error) {
      throw error;
    }
  },

  deleteStudent: async (studentId: string) => {
    const { currentRoom } = get();
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    
    if (!error && currentRoom) {
      await get().fetchRoomData(currentRoom.id);
    } else if (error) {
      throw error;
    }
  },

  addEvaluation: async (evaluation) => {
    const { error } = await supabase.from('evaluations').insert(evaluation);
    if (!error) {
      await get().fetchRoomData(evaluation.room_id);
    } else {
      throw error;
    }
  },

  updateEvaluation: async (evaluationId, updates) => {
    const { currentRoom } = get();
    const { error } = await supabase
      .from('evaluations')
      .update(updates)
      .eq('id', evaluationId);
    
    if (!error && currentRoom) {
      await get().fetchRoomData(currentRoom.id);
    } else if (error) {
      throw error;
    }
  },

  deleteEvaluation: async (evaluationId) => {
    const { currentRoom } = get();
    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', evaluationId);
    
    if (!error && currentRoom) {
      await get().fetchRoomData(currentRoom.id);
    } else if (error) {
      throw error;
    }
  },

  addBonusMalus: async (adjustment) => {
    const { error } = await supabase.from('bonus_malus').insert(adjustment);
    if (!error) {
       const { data } = await supabase.from('bonus_malus').select('*').eq('room_id', adjustment.room_id);
       if (data) set({ currentBonusMalus: data });
    } else {
      throw error;
    }
  },

  toggleRoomLock: async (roomId, isLocked) => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_locked: isLocked })
      .eq('id', roomId);
    
    if (!error) {
      const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (data) set({ currentRoom: data });
    } else {
      throw error;
    }
  },

  updateRoom: async (roomId, updates) => {
    const { error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', roomId);
    
    if (!error) {
      const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (data) {
        set({ currentRoom: data });
        get().fetchRooms();
      }
    } else {
      throw error;
    }
  },

  deleteRoom: async (roomId) => {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    
    if (!error) {
      await Promise.all([
        get().fetchRooms(),
        get().fetchGlobalStats()
      ]);
    } else {
      throw error;
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: { 
        full_name: updates.full_name ?? user.user_metadata?.full_name, 
        avatar_url: updates.avatar_url ?? user.user_metadata?.avatar_url 
      }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        full_name: updates.full_name ?? user.user_metadata?.full_name ?? 'Professor', 
        avatar_url: updates.avatar_url ?? user.user_metadata?.avatar_url,
        email: user.email,
        updated_at: new Date().toISOString()
      });

    if (profileError) throw profileError;
    set({ user: authData.user });
  },

  isCreateRoomModalOpen: false,
  setIsCreateRoomModalOpen: (open) => set({ isCreateRoomModalOpen: open })
}));

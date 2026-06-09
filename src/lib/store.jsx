import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { DEFAULT_SCORING, DEFAULT_LOCK_AT } from './tournament';
import { fetchResults } from './results';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
export const MODE = supabase ? 'supabase' : 'demo';

// ── Demo persistence (localStorage) ─────────────────────────────────
const LS_KEY = 'wcpool.v1';
const loadLS = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
};
const saveLS = (db) => localStorage.setItem(LS_KEY, JSON.stringify(db));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const newCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[(Math.random() * chars.length) | 0]).join('');
};

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, name }
  const [ready, setReady] = useState(false);
  const [results, setResults] = useState(() => loadLS().results || { matches: {} });

  // ── Auth/session bootstrap ────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      const db = loadLS();
      if (db.profile) setUser(db.profile);
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      hydrateUser(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => hydrateUser(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function hydrateUser(session) {
    if (!session) return setUser(null);
    const u = session.user;
    const { data } = await supabase.from('profiles').select('display_name').eq('id', u.id).maybeSingle();
    setUser({
      id: u.id,
      name: data?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Player',
    });
  }

  // ── Identity ──────────────────────────────────────────────────────
  const setName = useCallback(async (name) => {
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from('profiles').upsert({ id: data.user.id, display_name: name });
      setUser((u) => ({ ...u, name }));
    } else {
      const db = loadLS();
      db.profile = db.profile ? { ...db.profile, name } : { id: uid(), name };
      saveLS(db);
      setUser(db.profile);
    }
  }, []);

  const signInEmail = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
  const signInGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  const signOut = () => supabase.auth.signOut();

  // ── Pools ─────────────────────────────────────────────────────────
  const myPools = useCallback(async () => {
    if (supabase) {
      if (!user) return [];
      const { data: mem } = await supabase.from('pool_members').select('pool_id').eq('user_id', user.id);
      const ids = (mem || []).map((m) => m.pool_id);
      if (!ids.length) return [];
      const { data } = await supabase.from('pools').select('*').in('id', ids);
      return (data || []).map(poolFromRow);
    }
    const db = loadLS();
    return Object.values(db.pools || {});
  }, [user]);

  const createPool = useCallback(async ({ name, isPublic }) => {
    const base = {
      name, code: newCode(), isPublic: !!isPublic,
      lockAt: DEFAULT_LOCK_AT, scoring: DEFAULT_SCORING,
    };
    if (supabase) {
      const { data, error } = await supabase.from('pools').insert({
        name, code: base.code, is_public: base.isPublic, owner_id: user.id,
        lock_at: base.lockAt, scoring: base.scoring,
      }).select().single();
      if (error) throw error;
      await supabase.from('pool_members').insert({ pool_id: data.id, user_id: user.id });
      return poolFromRow(data);
    }
    const db = loadLS();
    const pool = { id: uid(), ...base, ownerId: user.id, members: [{ id: user.id, name: user.name }], brackets: {} };
    db.pools = { ...(db.pools || {}), [pool.id]: pool };
    saveLS(db);
    return pool;
  }, [user]);

  const joinPool = useCallback(async (code) => {
    code = code.trim().toUpperCase();
    if (supabase) {
      const { data: pool, error } = await supabase.from('pools').select('*').eq('code', code).maybeSingle();
      if (error || !pool) throw new Error('Pool not found — check the code.');
      await supabase.from('pool_members').upsert({ pool_id: pool.id, user_id: user.id });
      await supabase.from('profiles').upsert({ id: user.id, display_name: user.name });
      return poolFromRow(pool);
    }
    const db = loadLS();
    const pool = Object.values(db.pools || {}).find((p) => p.code === code);
    if (!pool) throw new Error('Pool not found on this device. Demo mode is single-device — set up Supabase for shared pools.');
    if (!pool.members.find((m) => m.id === user.id)) pool.members.push({ id: user.id, name: user.name });
    saveLS(db);
    return pool;
  }, [user]);

  const loadPool = useCallback(async (poolId) => {
    if (supabase) {
      const [{ data: pool }, { data: members }, { data: brackets }] = await Promise.all([
        supabase.from('pools').select('*').eq('id', poolId).single(),
        supabase.from('pool_members').select('user_id, profiles:user_id(display_name)').eq('pool_id', poolId),
        supabase.from('brackets').select('*').eq('pool_id', poolId),
      ]);
      if (!pool) throw new Error('Pool not found');
      return {
        pool: poolFromRow(pool),
        members: (members || []).map((m) => ({ id: m.user_id, name: m.profiles?.display_name || 'Player' })),
        brackets: Object.fromEntries((brackets || []).map((b) => [
          b.user_id, { picks: b.picks, tiebreaker: b.tiebreaker, updatedAt: b.updated_at },
        ])),
      };
    }
    const db = loadLS();
    const pool = db.pools?.[poolId];
    if (!pool) throw new Error('Pool not found');
    return { pool, members: pool.members, brackets: pool.brackets || {} };
  }, []);

  const saveBracket = useCallback(async (poolId, memberId, picks, tiebreaker) => {
    if (supabase) {
      const { error } = await supabase.from('brackets').upsert({
        pool_id: poolId, user_id: user.id, picks, tiebreaker,
      });
      if (error) throw error;
      return;
    }
    const db = loadLS();
    const pool = db.pools?.[poolId];
    if (!pool) throw new Error('Pool not found');
    if (new Date(pool.lockAt) <= new Date()) throw new Error('Picks are locked for this pool');
    pool.brackets = pool.brackets || {};
    pool.brackets[memberId] = { picks, tiebreaker, updatedAt: new Date().toISOString() };
    saveLS(db);
  }, [user]);

  // Demo-only: pass-and-play — add another player on this device
  const addLocalMember = useCallback((poolId, name) => {
    const db = loadLS();
    const pool = db.pools?.[poolId];
    if (!pool) return null;
    const member = { id: uid(), name };
    pool.members.push(member);
    saveLS(db);
    return member;
  }, []);

  // ── Results ───────────────────────────────────────────────────────
  const refreshResults = useCallback(async () => {
    if (supabase) {
      const { data } = await supabase.from('matches').select('*');
      const matches = Object.fromEntries((data || []).map((m) => [
        m.num, { team1: m.team1, team2: m.team2, score1: m.score1, score2: m.score2, winner: m.winner },
      ]));
      const r = { matches, fetchedAt: new Date().toISOString() };
      setResults(r);
      return r;
    }
    const r = loadLS().results || { matches: {} };
    setResults(r);
    return r;
  }, []);

  const syncResults = useCallback(async () => {
    const feed = await fetchResults(); // public feed, no key
    if (supabase) {
      const rows = Object.entries(feed.matches).map(([num, m]) => ({
        num: +num, round: 'KO', team1: m.team1, team2: m.team2,
        score1: m.score1, score2: m.score2, winner: m.winner,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('matches').upsert(rows);
      if (error) throw error;
      return refreshResults();
    }
    const db = loadLS();
    db.results = feed;
    saveLS(db);
    setResults(feed);
    return feed;
  }, [refreshResults]);

  const setResult = useCallback(async (num, patch) => {
    if (supabase) {
      const { error } = await supabase.from('matches').upsert({
        num, round: 'KO', ...patch, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return refreshResults();
    }
    const db = loadLS();
    db.results = db.results || { matches: {} };
    db.results.matches[num] = { ...(db.results.matches[num] || {}), ...patch };
    saveLS(db);
    setResults({ ...db.results });
  }, [refreshResults]);

  useEffect(() => { refreshResults(); }, [refreshResults]);

  // ── Realtime ──────────────────────────────────────────────────────
  const subscribePool = useCallback((poolId, onChange) => {
    if (!supabase) return () => {};
    const ch = supabase
      .channel(`pool-${poolId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brackets', filter: `pool_id=eq.${poolId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pool_members', filter: `pool_id=eq.${poolId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { refreshResults(); onChange(); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [refreshResults]);

  const value = {
    mode: MODE, ready, user, results,
    setName, signInEmail, signInGoogle, signOut,
    myPools, createPool, joinPool, loadPool, saveBracket, addLocalMember,
    refreshResults, syncResults, setResult, subscribePool,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function poolFromRow(r) {
  return {
    id: r.id, name: r.name, code: r.code, ownerId: r.owner_id,
    isPublic: r.is_public, lockAt: r.lock_at, scoring: r.scoring || DEFAULT_SCORING,
  };
}

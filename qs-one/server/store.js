// Tiny JSON-file database. Fine for a single-process proof of concept;
// production should use a managed database (see the build brief).
import fs from 'node:fs';
import path from 'node:path';
import { buildSeed } from './seed.js';

const DATA_DIR = process.env.QS_DATA_DIR || path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export let db = null;
let timer = null;

export function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (db?.meta?.version !== 3) throw new Error('old version');
  } catch {
    db = buildSeed();
    flush();
  }
  return db;
}

export function reset() { db = buildSeed(); flush(); return db; }

export function save() {
  clearTimeout(timer);
  timer = setTimeout(flush, 150);
}

export function flush() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

export const id = prefix => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

import { StudySource } from '../types';
import { getDatabase } from '../db/database';

export function studySourceKey(source: StudySource): string {
  switch (source.type) {
    case 'jlpt':
      return `jlpt:${source.level}`;
    case 'jlpt-difficult':
      return `jlpt-difficult:${source.level}`;
    case 'jlpt-vocab':
      return `jlpt-vocab:${source.level}`;
    case 'jlpt-grammar':
      return `jlpt-grammar:${source.level}`;
    case 'custom':
      return `custom:${source.deckId}`;
    case 'difficult':
      return 'difficult';
    case 'continue':
      return 'continue';
  }
}

export async function getStudyPosition(source: StudySource): Promise<number> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ current_index: number }>(
    'SELECT current_index FROM study_position WHERE source_key = ?',
    studySourceKey(source),
  );
  return row?.current_index ?? 0;
}

export async function saveStudyPosition(source: StudySource, index: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO study_position (source_key, current_index, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(source_key) DO UPDATE SET
       current_index = excluded.current_index,
       updated_at = excluded.updated_at`,
    studySourceKey(source),
    Math.max(0, index),
    new Date().toISOString(),
  );
}

export async function resetStudyPosition(source: StudySource): Promise<void> {
  await saveStudyPosition(source, 0);
}

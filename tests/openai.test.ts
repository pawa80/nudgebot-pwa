import assert from 'node:assert/strict';
import { getToneInstructions } from '../server/openai.js';

describe('getToneInstructions', () => {
  it('returns motivational instructions', () => {
    const result = getToneInstructions('motivational');
    assert.equal(
      result,
      'Your tone should be motivational and encouraging, focusing on the potential impact and growth opportunities.'
    );
  });

  it('returns reflective instructions', () => {
    const result = getToneInstructions('reflective');
    assert.equal(
      result,
      'Your tone should be thoughtful and introspective, helping the user see deeper meanings and connections.'
    );
  });

  it('returns challenging instructions', () => {
    const result = getToneInstructions('challenging');
    assert.equal(
      result,
      'Your tone should be provocative and challenging, pushing the user to think beyond their comfort zone.'
    );
  });

  it('returns default instructions for unknown tone', () => {
    const result = getToneInstructions('unknown');
    assert.equal(
      result,
      'Your tone should be balanced, combining motivation with thoughtful insights.'
    );
  });
});

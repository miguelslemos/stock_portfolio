import { describe, it, expect, vi } from 'vitest';
import { CompositeOperationRepository } from '../CompositeOperationRepository';
import { type IOperationRepository } from '../../../application/interfaces';
import { type PortfolioOperation } from '../../../domain/operations';

function makeOp(dateStr: string): PortfolioOperation {
  const date = new Date(dateStr);
  return {
    getDate: () => date,
    getDescription: () => `op-${dateStr}`,
    execute: vi.fn(),
  };
}

function makeRepo(ops: PortfolioOperation[]): IOperationRepository {
  return { getAllOperations: async () => ops };
}

function makeFailingRepo(): IOperationRepository {
  return {
    getAllOperations: async () => {
      throw new Error('Repository unavailable');
    },
  };
}

describe('CompositeOperationRepository', () => {
  it('merges operations from multiple repositories', async () => {
    const repo1 = makeRepo([makeOp('2023-01-15'), makeOp('2023-03-01')]);
    const repo2 = makeRepo([makeOp('2023-02-10')]);
    const composite = new CompositeOperationRepository([repo1, repo2]);

    const ops = await composite.getAllOperations();
    expect(ops).toHaveLength(3);
  });

  it('sorts operations chronologically', async () => {
    const repo1 = makeRepo([makeOp('2023-06-01'), makeOp('2023-01-01')]);
    const repo2 = makeRepo([makeOp('2023-03-15')]);
    const composite = new CompositeOperationRepository([repo1, repo2]);

    const ops = await composite.getAllOperations();
    const dates = ops.map((o) => o.getDate().toISOString());
    expect(dates).toEqual([...dates].sort());
  });

  it('returns empty array when no repositories', async () => {
    const composite = new CompositeOperationRepository([]);
    expect(await composite.getAllOperations()).toEqual([]);
  });

  it('silently skips failing repositories and returns results from the others', async () => {
    const good = makeRepo([makeOp('2023-05-01')]);
    const bad = makeFailingRepo();
    const composite = new CompositeOperationRepository([good, bad]);

    const ops = await composite.getAllOperations();
    expect(ops).toHaveLength(1);
  });

  it('returns empty array when all repositories fail', async () => {
    const composite = new CompositeOperationRepository([makeFailingRepo(), makeFailingRepo()]);
    const ops = await composite.getAllOperations();
    expect(ops).toHaveLength(0);
  });
});

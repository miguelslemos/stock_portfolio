import { describe, it, expect } from 'vitest';
import { JSONOperationRepository } from '../JSONOperationRepository';

describe('JSONOperationRepository', () => {
  it('should parse valid vesting operations', async () => {
    const json = JSON.stringify([
      { type: 'vesting', date: '02/15/2023', quantity: 100, price: 6.5 },
    ]);
    const repo = new JSONOperationRepository(json);
    const ops = await repo.getAllOperations();

    expect(ops).toHaveLength(1);
    expect(ops[0]!.getDescription()).toContain('Vesting');
  });

  it('should parse valid trade operations', async () => {
    const json = JSON.stringify([
      { type: 'trade', date: '05/21/2024', settlement_date: '05/21/2024', quantity: 41, price: 11.79 },
    ]);
    const repo = new JSONOperationRepository(json);
    const ops = await repo.getAllOperations();

    expect(ops).toHaveLength(1);
    expect(ops[0]!.getDescription()).toContain('Trade');
  });

  it('should parse dates in MM/DD/YYYY format', async () => {
    const json = JSON.stringify([
      { type: 'vesting', date: '12/25/2023', quantity: 50, price: 10 },
    ]);
    const repo = new JSONOperationRepository(json);
    const ops = await repo.getAllOperations();
    const opDate = ops[0]!.getDate();

    expect(opDate.getMonth()).toBe(11);
    expect(opDate.getDate()).toBe(25);
    expect(opDate.getFullYear()).toBe(2023);
  });

  it('should parse dates in YYYY-MM-DD format', async () => {
    const json = JSON.stringify([
      { type: 'vesting', date: '2023-12-25', quantity: 50, price: 10 },
    ]);
    const repo = new JSONOperationRepository(json);
    const ops = await repo.getAllOperations();
    const opDate = ops[0]!.getDate();

    expect(opDate.getMonth()).toBe(11);
    expect(opDate.getDate()).toBe(25);
    expect(opDate.getFullYear()).toBe(2023);
  });

  it('should handle multiple operations', async () => {
    const json = JSON.stringify([
      { type: 'vesting', date: '01/01/2023', quantity: 100, price: 5 },
      { type: 'vesting', date: '06/01/2023', quantity: 100, price: 8 },
      { type: 'trade', date: '12/01/2023', quantity: 50, price: 10 },
    ]);
    const repo = new JSONOperationRepository(json);
    const ops = await repo.getAllOperations();

    expect(ops).toHaveLength(3);
  });

  it('should throw on invalid JSON', async () => {
    const repo = new JSONOperationRepository('not json');
    await expect(repo.getAllOperations()).rejects.toThrow('Failed to parse JSON');
  });

  it('should throw on unsupported operation type', async () => {
    const json = JSON.stringify([
      { type: 'dividend', date: '01/01/2023', quantity: 10, price: 1 },
    ]);
    const repo = new JSONOperationRepository(json);
    await expect(repo.getAllOperations()).rejects.toThrow('Unsupported operation type');
  });

  it('should throw on invalid date format', async () => {
    const json = JSON.stringify([
      { type: 'vesting', date: 'not-a-date', quantity: 10, price: 1 },
    ]);
    const repo = new JSONOperationRepository(json);
    await expect(repo.getAllOperations()).rejects.toThrow();
  });
});

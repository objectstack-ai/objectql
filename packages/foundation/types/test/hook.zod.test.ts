import { z } from 'zod';

describe('Hook Validations', () => {
  it('should pass for valid input', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });
    const input = { name: 'John Doe', age: 30 };
    const parsed = schema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it('should fail for missing name', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });
    const input = { age: 30 };
    const parsed = schema.safeParse(input);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBeDefined();
  });

  it('should fail for empty name', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });
    const input = { name: '', age: 30 };
    const parsed = schema.safeParse(input);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBeDefined();
  });

  it('should fail for negative age', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });
    const input = { name: 'John Doe', age: -5 };
    const parsed = schema.safeParse(input);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBeDefined();
  });
});

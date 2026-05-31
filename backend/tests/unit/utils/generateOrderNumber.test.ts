import { generateOrderNumberFallback as generateOrderNumber } from '../../../src/utils/generateOrderNumber';

describe('Utility: generateOrderNumberFallback', () => {
  it('should generate an order number with the correct prefix', () => {
    const orderNum = generateOrderNumber();
    expect(orderNum).toMatch(/^QB-/);
  });

  it('should generate a string of length 18 (QB-YYYYMMDD-XXXXXX)', () => {
    const orderNum = generateOrderNumber();
    expect(orderNum.length).toBe(18);
  });

  it('should generate unique order numbers', () => {
    const order1 = generateOrderNumber();
    const order2 = generateOrderNumber();
    expect(order1).not.toBe(order2);
  });
});

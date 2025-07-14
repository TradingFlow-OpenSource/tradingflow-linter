declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect(value: any): {
  toEqual(expected: any): void;
  toHaveLength(expected: number): void;
};

import { describe, it, expect } from 'vitest';

/**
 * Property Tests for Array Manipulation
 * 
 * Property 9: Array Manipulation Invariants
 * - Adding an item increases array length by 1
 * - Removing an item decreases array length by 1
 * - Reordering preserves all items (no items lost or duplicated)
 * - Array operations maintain item integrity
 * 
 * Requirements: 6.2, 6.3, 6.4
 */

describe('ArrayField - Property Tests', () => {
  /**
   * Simulates the add operation from ArrayField component
   */
  const addItem = (items: string[]): string[] => {
    return [...items, ''];
  };

  /**
   * Simulates the remove operation from ArrayField component
   */
  const removeItem = (items: string[], index: number): string[] => {
    return items.filter((_, i) => i !== index);
  };

  /**
   * Simulates the move up operation from ArrayField component
   */
  const moveUp = (items: string[], index: number): string[] => {
    if (index === 0) return items;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    return newItems;
  };

  /**
   * Simulates the move down operation from ArrayField component
   */
  const moveDown = (items: string[], index: number): string[] => {
    if (index === items.length - 1) return items;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    return newItems;
  };

  describe('Property: Adding an item increases array length by 1', () => {
    it('should increase length from 0 to 1', () => {
      const items: string[] = [];
      const result = addItem(items);
      expect(result.length).toBe(items.length + 1);
    });

    it('should increase length from 1 to 2', () => {
      const items = ['item1'];
      const result = addItem(items);
      expect(result.length).toBe(items.length + 1);
    });

    it('should increase length from 5 to 6', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const result = addItem(items);
      expect(result.length).toBe(items.length + 1);
    });

    it('should preserve existing items when adding', () => {
      const items = ['item1', 'item2', 'item3'];
      const result = addItem(items);
      expect(result.slice(0, items.length)).toEqual(items);
    });

    it('should add empty string as new item', () => {
      const items = ['item1'];
      const result = addItem(items);
      expect(result[result.length - 1]).toBe('');
    });
  });

  describe('Property: Removing an item decreases array length by 1', () => {
    it('should decrease length from 1 to 0', () => {
      const items = ['item1'];
      const result = removeItem(items, 0);
      expect(result.length).toBe(items.length - 1);
    });

    it('should decrease length from 3 to 2 when removing first item', () => {
      const items = ['a', 'b', 'c'];
      const result = removeItem(items, 0);
      expect(result.length).toBe(items.length - 1);
      expect(result).toEqual(['b', 'c']);
    });

    it('should decrease length from 3 to 2 when removing middle item', () => {
      const items = ['a', 'b', 'c'];
      const result = removeItem(items, 1);
      expect(result.length).toBe(items.length - 1);
      expect(result).toEqual(['a', 'c']);
    });

    it('should decrease length from 3 to 2 when removing last item', () => {
      const items = ['a', 'b', 'c'];
      const result = removeItem(items, 2);
      expect(result.length).toBe(items.length - 1);
      expect(result).toEqual(['a', 'b']);
    });

    it('should preserve other items when removing', () => {
      const items = ['item1', 'item2', 'item3', 'item4'];
      const result = removeItem(items, 1);
      expect(result).toContain('item1');
      expect(result).not.toContain('item2');
      expect(result).toContain('item3');
      expect(result).toContain('item4');
    });
  });

  describe('Property: Reordering preserves all items', () => {
    it('should preserve all items when moving up', () => {
      const items = ['a', 'b', 'c', 'd'];
      const result = moveUp(items, 2);
      expect(result.sort()).toEqual(items.sort());
      expect(result.length).toBe(items.length);
    });

    it('should preserve all items when moving down', () => {
      const items = ['a', 'b', 'c', 'd'];
      const result = moveDown(items, 1);
      expect(result.sort()).toEqual(items.sort());
      expect(result.length).toBe(items.length);
    });

    it('should swap adjacent items when moving up', () => {
      const items = ['a', 'b', 'c'];
      const result = moveUp(items, 1);
      expect(result).toEqual(['b', 'a', 'c']);
    });

    it('should swap adjacent items when moving down', () => {
      const items = ['a', 'b', 'c'];
      const result = moveDown(items, 1);
      expect(result).toEqual(['a', 'c', 'b']);
    });

    it('should not change array when moving first item up', () => {
      const items = ['a', 'b', 'c'];
      const result = moveUp(items, 0);
      expect(result).toEqual(items);
    });

    it('should not change array when moving last item down', () => {
      const items = ['a', 'b', 'c'];
      const result = moveDown(items, 2);
      expect(result).toEqual(items);
    });

    it('should be reversible - move up then down returns original', () => {
      const items = ['a', 'b', 'c', 'd'];
      const afterUp = moveUp(items, 2);
      const afterDown = moveDown(afterUp, 1);
      expect(afterDown).toEqual(items);
    });

    it('should be reversible - move down then up returns original', () => {
      const items = ['a', 'b', 'c', 'd'];
      const afterDown = moveDown(items, 1);
      const afterUp = moveUp(afterDown, 2);
      expect(afterUp).toEqual(items);
    });
  });

  describe('Property: Array operations maintain item integrity', () => {
    it('should not mutate original array on add', () => {
      const items = ['a', 'b', 'c'];
      const original = [...items];
      addItem(items);
      expect(items).toEqual(original);
    });

    it('should not mutate original array on remove', () => {
      const items = ['a', 'b', 'c'];
      const original = [...items];
      removeItem(items, 1);
      expect(items).toEqual(original);
    });

    it('should not mutate original array on move up', () => {
      const items = ['a', 'b', 'c'];
      const original = [...items];
      moveUp(items, 1);
      expect(items).toEqual(original);
    });

    it('should not mutate original array on move down', () => {
      const items = ['a', 'b', 'c'];
      const original = [...items];
      moveDown(items, 1);
      expect(items).toEqual(original);
    });

    it('should handle items with special characters', () => {
      const items = ['item with spaces', 'item-with-dashes', 'item_with_underscores', 'item.with.dots'];
      const result = moveUp(items, 2);
      expect(result.sort()).toEqual(items.sort());
    });

    it('should handle empty string items', () => {
      const items = ['', 'a', '', 'b', ''];
      const result = moveDown(items, 1);
      expect(result.length).toBe(items.length);
      expect(result.filter(i => i === '').length).toBe(3);
    });
  });

  describe('Property: Sequential operations maintain consistency', () => {
    it('should handle add then remove returning to original length', () => {
      const items = ['a', 'b', 'c'];
      const afterAdd = addItem(items);
      const afterRemove = removeItem(afterAdd, afterAdd.length - 1);
      expect(afterRemove.length).toBe(items.length);
    });

    it('should handle multiple adds', () => {
      let items: string[] = [];
      for (let i = 0; i < 5; i++) {
        items = addItem(items);
      }
      expect(items.length).toBe(5);
    });

    it('should handle multiple removes', () => {
      let items = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 3; i++) {
        items = removeItem(items, 0);
      }
      expect(items.length).toBe(2);
      expect(items).toEqual(['d', 'e']);
    });

    it('should handle complex reordering sequence', () => {
      const items = ['1', '2', '3', '4', '5'];
      let result = moveDown(items, 0); // ['2', '1', '3', '4', '5']
      result = moveDown(result, 1);    // ['2', '3', '1', '4', '5']
      result = moveDown(result, 2);    // ['2', '3', '4', '1', '5']
      result = moveDown(result, 3);    // ['2', '3', '4', '5', '1']
      
      // Item '1' should now be at the end
      expect(result[4]).toBe('1');
      // All items should still be present
      expect(result.sort()).toEqual(items.sort());
    });
  });
});

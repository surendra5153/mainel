// utils/skillTrie.js

/**
 * Trie node for skill name/tag autocomplete and prefix search.
 * Memory-conscious implementation with minimal per-node overhead.
 * @private
 */
class TrieNode {
  constructor() {
    this.children = new Map();
    this.skillIds = [];
    this.isEnd = false;
  }
}

/**
 * Trie data structure for efficient skill autocomplete and prefix search.
 * Supports Unicode safely.
 * Time complexity:
 *   - insert: O(L) where L is text length
 *   - searchPrefix: O(L + m) where L is prefix length, m is matches
 *   - bulkBuild: O(n * L) where n is number of skills
 * 
 * @class SkillTrie
 */
class SkillTrie {
  constructor() {
    this.root = new TrieNode();
    this.totalSkills = 0;
  }

  /**
   * Normalize text for consistent matching (lowercase, trim).
   * @private
   * @param {string} text
   * @returns {string}
   */
  _normalize(text) {
    if (typeof text !== 'string') return '';
    return text.toLowerCase().trim();
  }

  /**
   * Insert a skill into the trie.
   * @param {string|number} skillId - Unique skill identifier
   * @param {string} text - Skill name or tag text
   * @returns {void}
   * @complexity O(L) where L is text length
   */
  insert(skillId, text) {
    const normalized = this._normalize(text);
    if (!normalized || !skillId) return;

    let node = this.root;
    
    for (const char of normalized) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }

    if (!node.skillIds.includes(skillId)) {
      node.skillIds.push(skillId);
      node.isEnd = true;
      this.totalSkills++;
    }
  }

  /**
   * Build trie from an array of skills.
   * More efficient than individual inserts for bulk loading.
   * @param {Array<{skillId: string|number, text: string}>} skillsArray - Array of skill objects
   * @returns {void}
   * @complexity O(n * L) where n is number of skills, L is average text length
   */
  bulkBuild(skillsArray) {
    if (!Array.isArray(skillsArray)) {
      throw new TypeError('skillsArray must be an array');
    }

    this.root = new TrieNode();
    this.totalSkills = 0;

    for (const skill of skillsArray) {
      if (skill && skill.skillId && skill.text) {
        this.insert(skill.skillId, skill.text);
      }
    }
  }

  /**
   * Search for skills matching a prefix.
   * Returns array of {skillId, text} objects limited by the limit parameter.
   * @param {string} prefix - Search prefix
   * @param {number} limit - Maximum number of results (default 10)
   * @returns {Array<{skillId: string|number, text: string}>} Matching skills
   * @complexity O(L + m) where L is prefix length, m is number of matches
   */
  searchPrefix(prefix, limit = 10) {
    const normalized = this._normalize(prefix);
    if (!normalized) return [];

    let node = this.root;
    
    for (const char of normalized) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char);
    }

    const results = [];
    this._collectSkills(node, normalized, results, limit);
    return results;
  }

  /**
   * Recursively collect skills from a node and its descendants.
   * @private
   * @param {TrieNode} node - Starting node
   * @param {string} currentText - Current accumulated text
   * @param {Array} results - Results accumulator
   * @param {number} limit - Maximum results to collect
   */
  _collectSkills(node, currentText, results, limit) {
    if (results.length >= limit) return;

    if (node.isEnd) {
      for (const skillId of node.skillIds) {
        if (results.length >= limit) break;
        results.push({ skillId, text: currentText });
      }
    }

    for (const [char, childNode] of node.children.entries()) {
      if (results.length >= limit) break;
      this._collectSkills(childNode, currentText + char, results, limit);
    }
  }

  /**
   * Get total number of unique skills in the trie.
   * @returns {number}
   */
  size() {
    return this.totalSkills;
  }

  /**
   * Clear all data from the trie.
   * @returns {void}
   */
  clear() {
    this.root = new TrieNode();
    this.totalSkills = 0;
  }

  /**
   * Check if the trie contains an exact skill text.
   * @param {string} text - Text to search for
   * @returns {boolean}
   */
  contains(text) {
    const normalized = this._normalize(text);
    if (!normalized) return false;

    let node = this.root;
    for (const char of normalized) {
      if (!node.children.has(char)) return false;
      node = node.children.get(char);
    }

    return node.isEnd;
  }
}

/**
 * Factory function to create a skill trie.
 * @param {Array} skillsArray - Optional initial skills array
 * @returns {SkillTrie}
 */
function createSkillTrie(skillsArray) {
  const trie = new SkillTrie();
  if (skillsArray) {
    trie.bulkBuild(skillsArray);
  }
  return trie;
}

module.exports = { SkillTrie, createSkillTrie };

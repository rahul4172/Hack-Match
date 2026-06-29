import crypto from 'crypto';

export const CLASH_CHALLENGES = [
  {
    id: 'return-true',
    title: 'Return True',
    prompt: 'Write a function `isAlive()` that returns `true`.',
    hint: 'A one-liner arrow function works perfectly.',
    answer: 'const isAlive = () => true;',
    language: 'javascript',
  },
  {
    id: 'sum-two',
    title: 'Sum Two Numbers',
    prompt: 'Write a function `add(a, b)` that returns the sum of two numbers.',
    hint: 'Use the `+` operator inside a return statement.',
    answer: 'function add(a, b) { return a + b; }',
    language: 'javascript',
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    prompt: 'Write a function `reverse(str)` that reverses a string.',
    hint: 'Try `str.split("").reverse().join("")`.',
    answer: 'const reverse = (str) => str.split("").reverse().join("");',
    language: 'javascript',
  },
  {
    id: 'fizzbuzz-one',
    title: 'FizzBuzz Check',
    prompt: 'Write a function `fizz(n)` that returns `"Fizz"` if n is divisible by 3, otherwise returns n as a string.',
    hint: 'Use the modulo operator `%` and a ternary.',
    answer: 'const fizz = (n) => n % 3 === 0 ? "Fizz" : String(n);',
    language: 'javascript',
  },
  {
    id: 'array-first',
    title: 'First Element',
    prompt: 'Write a function `first(arr)` that returns the first element of an array.',
    hint: 'Array index `[0]` is your friend.',
    answer: 'const first = (arr) => arr[0];',
    language: 'javascript',
  },
  {
    id: 'is-even',
    title: 'Is Even',
    prompt: 'Write a function `isEven(n)` that returns `true` if n is even.',
    hint: 'Even numbers have remainder 0 when divided by 2.',
    answer: 'const isEven = (n) => n % 2 === 0;',
    language: 'javascript',
  },
];

export function pickChallenge(connectionId) {
  const hash = crypto.createHash('md5').update(connectionId).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % CLASH_CHALLENGES.length;
  return CLASH_CHALLENGES[index];
}

export function sanitizeCode(code) {
  return (code || '')
    .toLowerCase()
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateSubmission(challengeId, code) {
  const challenge = CLASH_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) return false;

  const normalized = sanitizeCode(code);
  const expected = sanitizeCode(challenge.answer);

  if (normalized === expected) return true;

  switch (challengeId) {
    case 'return-true':
      return /return\s+(true|!0)/.test(normalized) || normalized.includes('=> true');
    case 'sum-two':
      return normalized.includes('return') && normalized.includes('+');
    case 'reverse-string':
      return normalized.includes('reverse') && (normalized.includes('split') || normalized.includes('reduce'));
    case 'fizzbuzz-one':
      return normalized.includes('% 3') || normalized.includes('%3');
    case 'array-first':
      return normalized.includes('[0]') || normalized.includes('.at(0)');
    case 'is-even':
      return normalized.includes('% 2') || normalized.includes('%2');
    default:
      return normalized.includes(expected.slice(0, 20));
  }
}

export function getChallengePublic(challenge) {
  const { answer, ...rest } = challenge;
  return rest;
}

export function getChallengeWithAnswer(challengeId) {
  return CLASH_CHALLENGES.find(c => c.id === challengeId) || null;
}

export interface ClashChallenge {
  id: string;
  title: string;
  prompt: string;
  hint: string;
  answer: string;
  language: string;
}

export const CLASH_CHALLENGES: ClashChallenge[] = [
  { id: 'return-true', title: 'Return True', prompt: 'Write a function `isAlive()` that returns `true`.', hint: 'A one-liner arrow function works perfectly.', answer: 'const isAlive = () => true;', language: 'javascript' },
  { id: 'sum-two', title: 'Sum Two Numbers', prompt: 'Write a function `add(a, b)` that returns the sum of two numbers.', hint: 'Use the `+` operator inside a return statement.', answer: 'function add(a, b) { return a + b; }', language: 'javascript' },
  { id: 'reverse-string', title: 'Reverse a String', prompt: 'Write a function `reverse(str)` that reverses a string.', hint: 'Try `str.split("").reverse().join("")`.', answer: 'const reverse = (str) => str.split("").reverse().join("");', language: 'javascript' },
  { id: 'fizzbuzz-one', title: 'FizzBuzz Check', prompt: 'Write a function `fizz(n)` that returns `"Fizz"` if n is divisible by 3, otherwise returns n as a string.', hint: 'Use the modulo operator `%` and a ternary.', answer: 'const fizz = (n) => n % 3 === 0 ? "Fizz" : String(n);', language: 'javascript' },
  { id: 'array-first', title: 'First Element', prompt: 'Write a function `first(arr)` that returns the first element of an array.', hint: 'Array index `[0]` is your friend.', answer: 'const first = (arr) => arr[0];', language: 'javascript' },
  { id: 'is-even', title: 'Is Even', prompt: 'Write a function `isEven(n)` that returns `true` if n is even.', hint: 'Even numbers have remainder 0 when divided by 2.', answer: 'const isEven = (n) => n % 2 === 0;', language: 'javascript' },
];

export function getChallengeById(id: string) {
  return CLASH_CHALLENGES.find(c => c.id === id);
}

import { listPatterns } from './app/api/backend.js'

let patterns = await listPatterns();
console.log(patterns);

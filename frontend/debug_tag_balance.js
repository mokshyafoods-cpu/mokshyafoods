const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.join(__dirname, 'app/admin/pos/page.tsx'), 'utf8');
const start = text.indexOf('return (');
const end = text.lastIndexOf(');');
const block = text.slice(start, end + 2);
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const re = /<\s*(\/?)\s*([A-Za-z][A-Za-z0-9_-]*)([^>]*)>/g;
const stack = [];
let m;
while ((m = re.exec(block)) !== null) {
  const closing = m[1] === '/';
  const tag = m[2];
  const attrs = m[3];
  const selfClosing = attrs.trim().endsWith('/') || voidTags.has(tag.toLowerCase());
  const line = block.slice(0, m.index).split(/\r?\n/).length;
  if (closing) {
    if (stack.length === 0) {
      console.log('UNEXPECTED CLOSE', tag, 'line', line);
      break;
    }
    const top = stack[stack.length - 1];
    if (top.tag === tag) {
      stack.pop();
    } else {
      console.log('MISMATCH CLOSE', tag, 'line', line, 'expected', top.tag, 'stack top', stack.slice(-5));
      break;
    }
  } else if (!selfClosing) {
    stack.push({tag, line, text: m[0]});
  }
}
console.log('stack length', stack.length);
console.log(stack.slice(-20));

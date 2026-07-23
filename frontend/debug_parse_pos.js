const fs = require('fs');
const ts = require('typescript');
const path = require('path');
const filePath = path.join(__dirname, 'app/admin/pos/page.tsx');
const text = fs.readFileSync(filePath, 'utf8');
const sf = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log('diagnostics count', sf.parseDiagnostics.length);
sf.parseDiagnostics.forEach((d, i) => {
  const pos = sf.getLineAndCharacterOfPosition(d.start);
  console.log('--- diag', i, '---');
  console.log('line', pos.line+1, 'col', pos.character+1);
  console.log('msg', typeof d.messageText === 'string' ? d.messageText : d.messageText.message);
  console.log('text', JSON.stringify(text.slice(Math.max(0, d.start-40), Math.min(text.length, d.start+40))));
});

function printLines(startLine, endLine) {
  const lines = text.split(/\r?\n/);
  for (let i = startLine-1; i < endLine; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}

printLines(390, 430);
console.log('---');
printLines(1000, 1030);

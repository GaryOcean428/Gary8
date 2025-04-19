#!/usr/bin/env node
import { Project, SyntaxKind } from 'ts-morph';

/**
 * Refine explicit any usages to unknown
 */
async function main() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.app.json',
  });
  const sourceFiles = project.getSourceFiles(['src/**/*.ts', 'src/**/*.tsx']);
  console.log(`Processing ${sourceFiles.length} files for explicit any replacements...`);
  for (const file of sourceFiles) {
    const anyNodes = file.getDescendantsOfKind(SyntaxKind.AnyKeyword);
    anyNodes.forEach(node => {
      const parent = node.getParent();
      if (
        parent &&
        (parent.getKind() === SyntaxKind.TypeReference ||
         parent.getKind() === SyntaxKind.TypeQuery ||
         parent.getKind() === SyntaxKind.Parameter ||
         parent.getKind() === SyntaxKind.PropertySignature)
      ) {
        console.log(`Replacing any in ${file.getBaseName()} at position ${node.getStartLineNumber()}`);
        node.replaceWithText('unknown');
      }
    });
  }
  await project.save();
  console.log('Explicit any refactoring complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
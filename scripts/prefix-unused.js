#!/usr/bin/env node
import { Project, SyntaxKind } from "ts-morph";

// Prefix unused function parameters with an underscore
async function main() {
  const project = new Project({
    tsConfigFilePath: "./tsconfig.app.json",
  });
  const sourceFiles = project.getSourceFiles(["src/**/*.ts", "src/**/*.tsx"]);
  console.log(`Processing ${sourceFiles.length} files...`);
  for (const file of sourceFiles) {
    const functions = [
      ...file.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
      ...file.getDescendantsOfKind(SyntaxKind.FunctionExpression),
      ...file.getDescendantsOfKind(SyntaxKind.ArrowFunction),
      ...file.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ];
    for (const fn of functions) {
      for (const param of fn.getParameters()) {
        const name = param.getName();
        if (!name.startsWith("_")) {
          const refs = param.findReferences();
          // Only declaration reference means unused
          if (refs.length === 1) {
            console.log(`Renaming unused parameter '${name}' in ${file.getBaseName()}`);
            param.rename(`_${name}`);
          }
        }
      }
    }
  }
  await project.save();
  console.log("Unused parameter prefixing complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
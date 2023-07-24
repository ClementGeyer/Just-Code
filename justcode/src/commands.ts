import * as vscode from "vscode";
import { generateJSDocstringComment } from "./api";
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export async function insertDocstringComment() {
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
  }, async (progress) => {

  if (!vscode.window.activeTextEditor) {
      return;
    }
  
  progress.report({
    message: `Generating comments ...`,
  });

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor.');
    return;
  }

  const selection = editor.selection;
  const { start, end } = selection;
  const position = start.line + 1; // Adjust for 0-indexing

  const code = editor.document.getText();
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx'],
    // loc: true,
  });

  let docstring = '';
  let functionRange: vscode.Range | undefined;

  // Non-nested files
  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node as t.FunctionDeclaration;
      const { start, end } = node.loc!;
      if (position >= start.line && position <= end.line) {
        const functionName = node.id?.name || 'unnamedFunction';
        docstring = `/**\n * Function ${functionName}\n * @param {void} paramName - desc\n * @returns {void} - desc\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(end.line, 0)
        );
        path.stop(); // Stop traversing the AST as we found the enclosing function.
      }
    },
    ArrowFunctionExpression(path) {
      const node = path.node as t.ArrowFunctionExpression;
      const { loc } = node;
      if (loc && loc.start.line <= position && loc.end.line >= position) {
        docstring = `/**\n * Arrow Function\n * @returns {void}\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(loc.start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(loc.end.line, 0)
        );
        path.stop(); // Stop traversing the AST as we found the enclosing arrow function.
      }
    },
  });

  if (!docstring) {
    vscode.window.showErrorMessage('Failed to generate docstring.');
    return;
  }

  if (functionRange) {
    // Get the text of the function
    const lastChild = findLastChildFunction(ast, editor.selection.active)
    let lastChildText = "";
    console.log('lastchild', lastChild)

    // Perform custom selection to highlight the function range
    if(lastChild) {
      let lastChildRange = new vscode.Selection(lastChild?.start, lastChild?.end);
      editor.selection = lastChildRange
      lastChildText = editor.document.getText(lastChildRange);
    }

    const docStringComment = await generateJSDocstringComment(lastChildText);

    editor.edit((editBuilder) => {
      // TODO: Adapt it to arrow functions
      const cursorPosition = editor.selection.start
      const declarationLine = getFunctionDeclarationLine(ast, cursorPosition);
      console.log(declarationLine)
      if(declarationLine)
        editBuilder.insert(new vscode.Position(declarationLine - 1, 0), docStringComment.content + '\n\n');
    }); 
  }
})
}

// Rework this (might only need if non-nested file)
function getFunctionDeclarationLine(ast: t.File, position: vscode.Position): number | undefined {
  console.log(position.line)

  let lineNumber: number | undefined;

  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node as t.FunctionDeclaration;
      const { loc } = node;
      if (loc && loc.start.line - 1 <= position.line && loc.end.line >= position.line) {
        lineNumber = loc.start.line;
        path.stop(); // Stop traversing the AST as we found the function declaration.
      }
    },
    ArrowFunctionExpression(path) {
      const node = path.node as t.ArrowFunctionExpression;
      const { loc } = node;
      if (loc && loc.start.line - 1 <= position.line && loc.end.line >= position.line) {
        lineNumber = loc.start.line;
        path.stop(); // Stop traversing the AST as we found the arrow function expression.
      }
    },
  });

  return lineNumber;
}

// Nested functions handle
function findLastChildFunction(node: t.Node, position: vscode.Position): { start: vscode.Position; end: vscode.Position } | null {
  let innermostFunction: { start: vscode.Position; end: vscode.Position } | null = null;

  traverse(node, {
    FunctionDeclaration(path) {
      const fnNode = path.node as t.FunctionDeclaration;
      console.log('func')
      if (fnNode.loc && fnNode.loc.start.line <= position.line && fnNode.loc.end.line >= position.line) {
        console.log(fnNode.loc.start.line, fnNode.loc.end.line)
        innermostFunction = {
          start: new vscode.Position(fnNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(fnNode.loc.end.line, 0),
        };
      }
    },
    //TODO: nested files arrows functions not handled
    ArrowFunctionExpression(path) {
      const arrowNode = path.node as t.ArrowFunctionExpression;
      if (
        arrowNode.loc &&
        arrowNode.loc.start.line <= position.line &&
        arrowNode.loc.start.column <= position.character &&
        arrowNode.loc.end.line >= position.line &&
        arrowNode.loc.end.column >= position.character
      ) {
        console.log('loc', arrowNode)
        innermostFunction = {
          start: new vscode.Position(arrowNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(arrowNode.loc.end.line, 0),
        };
      }
    },
  });

  return innermostFunction;
}
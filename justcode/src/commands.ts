import * as vscode from "vscode";
import { generateJSDocstringComment, generateJSDocstringCommentReactHooks, generateJSDocstringCommentJSXComponent, generateJSDocstringCommentClass } from "./api";
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
    message: `JustCode: Generating comments ...`,
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
    plugins: ["jsx", "typescript"],
    // loc: true,
  });

  let docstring = '';
  let functionRange: vscode.Range | undefined;
  let functionName: string | undefined;

  // Non-nested files get right function, ReactJS get JSX main element
  traverse(ast, {
    FunctionDeclaration(path) {
      const node = path.node as t.FunctionDeclaration;
      const { start, end } = node.loc!;
      if (position >= start.line && position <= end.line) {
        functionName = 'funcD';
        docstring = `/**\n * Function ${functionName}\n * @param {void} paramName - desc\n * @returns {void} - desc\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(end.line, 0)
        );
        path.stop();
      }
    },
    ArrowFunctionExpression(path) {
      const node = path.node as t.ArrowFunctionExpression;
      const { loc } = node;
      if (loc && loc.start.line <= position && loc.end.line >= position) {
        functionName = 'arrowFE';
        docstring = `/**\n * Arrow Function\n * @returns {void}\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(loc.start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(loc.end.line, 0)
        );
        path.stop();
      }
    },
    FunctionExpression(path){
      const node = path.node as t.FunctionExpression;
      const { loc } = node;
      if (loc && loc.start.line <= position && loc.end.line >= position) {
        functionName = 'functionE';
        docstring = `/**\n * Function Expression\n * @returns {void}\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(loc.start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(loc.end.line, 0)
        );
        path.stop();
      }
    },
    ClassDeclaration(path){
      const node = path.node as t.ClassDeclaration;
      const { loc } = node;
      if (loc && loc.start.line <= position && loc.end.line >= position) {
        functionName = 'classD';
        docstring = `/**\n * Class Declaration\n * @returns {void}\n */`;
        functionRange = new vscode.Range(
          new vscode.Position(loc.start.line - 1, 0), // Adjust for 0-indexing
          new vscode.Position(loc.end.line, 0)
        );
        path.stop();
      }
    },
  });

  if (!docstring) {
    vscode.window.showErrorMessage('Failed to generate docstring.');
    return;
  }

  if (functionRange) {
    let lastChildText: string;
    let functionText: string;
    let docStringComment: any;

    const cursorPosition = editor.selection.start

    // Handles ReactJS files, even if not .jsx
    const lastChild = findLastChildFunction(ast, editor.selection.active)
    let isJSXComp = false;

    // Perform custom selection to highlight the function range
    if(lastChild) {
      let lastChildRange = new vscode.Selection(lastChild?.start, lastChild?.end);
      editor.selection = lastChildRange
      lastChildText = editor.document.getText(lastChildRange);
      let firstLineRaw = lastChildText.split('\n')[0];
      let hook = isHook(firstLineRaw);
      //is a JSX component
      console.log(editor.document.languageId)
      if(lastChild.start.line === functionRange.start.line && lastChild.end.line === functionRange.end.line && (editor.document.languageId === "javascriptreact" || editor.document.languageId === "typescriptreact")){
        docStringComment = await generateJSDocstringCommentJSXComponent(lastChildText);
        isJSXComp = true;
      } else{
        if(hook){
          docStringComment = await generateJSDocstringCommentReactHooks(lastChildText);
        }else {
          if(functionName === "classD"){
            docStringComment = await generateJSDocstringCommentClass(lastChildText);
          } else docStringComment = await generateJSDocstringComment(lastChildText);
        }
      }
    } else {
      let range = new vscode.Selection(functionRange?.start, functionRange?.end)
      editor.selection = range
      functionText = editor.document.getText(functionRange);
      console.log(functionName)
      if(functionName === "classD"){
        docStringComment = await generateJSDocstringCommentClass(functionText);
      } else docStringComment = await generateJSDocstringComment(functionText);
    }

    if(docStringComment){
      editor.edit((editBuilder) => {
        const declarationLine = getFunctionDeclarationLine(ast, cursorPosition);
  
        if(declarationLine){
          const lineBeforeFunction = editor.document.lineAt(declarationLine - 1).text;
          const leadingTabs = countLeadingTabs(lineBeforeFunction);
  
          const indentedComment = docStringComment.content
            .split('\n')
            .map((line: any) => '\t'.repeat(leadingTabs) + line)
            .join('\n');
          
          console.log(functionName)
          if(functionName === "classD" && !isJSXComp) editBuilder.replace(editor.selection, indentedComment + '\n');
          else editBuilder.insert(new vscode.Position(declarationLine - 1, 0), indentedComment + '\n');
        }
          
      }); 
    }
  }
})
}

// Rework this (might only need if non-nested file)
function getFunctionDeclarationLine(ast: t.File, position: vscode.Position): number | undefined {

  let lineNumber: number | undefined;

  traverse(ast, {
    FunctionDeclaration(path) {
      const fnNode = path.node as t.FunctionDeclaration;
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line) {
        lineNumber = fnNode.loc.start.line
      }
    },
    ArrowFunctionExpression(path) {
      const arrowNode = path.node as t.ArrowFunctionExpression;
      //Maybe handle column positioning
      if (
        arrowNode.loc &&
        arrowNode.loc.start.line <= position.line + 1 &&
        arrowNode.loc.end.line >= position.line
      ) {
        lineNumber = arrowNode.loc.start.line
      }
    },
    FunctionExpression(path) {
      const fnNode = path.node as t.FunctionExpression;
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line) {
        lineNumber = fnNode.loc.start.line
      }
    },
    ClassDeclaration(path) {
      const fnNode = path.node as t.ClassDeclaration;
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line) {
        lineNumber = fnNode.loc.start.line
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
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line + 1) {
        innermostFunction = {
          start: new vscode.Position(fnNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(fnNode.loc.end.line, 0),
        };
      }
    },
    ArrowFunctionExpression(path) {
      const arrowNode = path.node as t.ArrowFunctionExpression;
      //Maybe handle column positioning
      if (
        arrowNode.loc &&
        arrowNode.loc.start.line <= position.line + 1 &&
        arrowNode.loc.end.line >= position.line + 1
      ) {
        innermostFunction = {
          start: new vscode.Position(arrowNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(arrowNode.loc.end.line, 0),
        };
      }
    },
    FunctionExpression(path) {
      const fnNode = path.node as t.FunctionExpression;
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line + 1) {
        innermostFunction = {
          start: new vscode.Position(fnNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(fnNode.loc.end.line, 0),
        };
      }
    },
    ClassDeclaration(path) {
      const fnNode = path.node as t.ClassDeclaration;
      if (fnNode.loc && fnNode.loc.start.line <= position.line + 1 && fnNode.loc.end.line >= position.line + 1) {
        innermostFunction = {
          start: new vscode.Position(fnNode.loc.start.line - 1, 0), // Adjust for 0-indexing
          end: new vscode.Position(fnNode.loc.end.line, 0),
        };
      }
    },
  });


  return innermostFunction;
}

function countLeadingTabs(line: string): number {
  let spaces = 0
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === ' ') {
      spaces++;
      if(spaces === 4){
        count++;
        spaces = 0;
      }
    } else {
      break;
    }
  }
  return count;
}

function isHook(rawData: string): boolean{
  let isHook;

  let data = removeSpacesAndAfterFirstParenthesis(rawData)

  if(data.substring(0, 3) === "use"){
    isHook = true;
  } else {
    isHook = false
  }

  return isHook
}

function removeSpacesAndAfterFirstParenthesis(inputString: string) {
  let stringWithoutSpaces = inputString.replace(/\s/g, '');

  const firstParenthesisIndex = stringWithoutSpaces.indexOf('(');

  if (firstParenthesisIndex !== -1) {
    stringWithoutSpaces = stringWithoutSpaces.substr(0, firstParenthesisIndex);
  }

  return stringWithoutSpaces;
}
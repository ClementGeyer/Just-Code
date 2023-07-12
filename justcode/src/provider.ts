import * as vscode from "vscode";
import { generateComment } from "./api";
import { getNextLine } from "./functions";

export const contextProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: "javascript" },
      { language: "typescript" },
    ],
    {
        async provideCompletionItems(
            document: vscode.TextDocument,
            position: vscode.Position,
            _token: vscode.CancellationToken,
            _context: vscode.CompletionContext
          ) {
          const textBeforePos = document.lineAt(position).text.substring(0, position.character).trim();
          const lineText = document.lineAt(position).text;
          const commentType = getCommentType(document.languageId);

          try {
            // Checks if text has a commentType and cursor is after comment
            if (textBeforePos.includes(commentType) && isCursorAfterCommentType(lineText, commentType, position)) {
              return new Promise<vscode.CompletionItem[] | undefined>(
                async (resolve, _reject) => {
                  const lang = vscode.window.activeTextEditor?.document.languageId;
                  const textNew = vscode.window.activeTextEditor?.document.lineAt(position).text;

                  // Check for changes
                  if (textNew === lineText) {
                    let comment = await displaySingleComment(position, document, lang);
                    resolve(comment);
                  } else {
                    resolve(undefined);
                  }
                }
              );
            } else {
              return undefined;
            }
          } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
            console.log(error);     
          }
        }

    },
    " ",
    ","
)

const isCursorAfterCommentType = (text: string, commentType: string, position: vscode.Position) => {
  return position.character > text.trim().indexOf(commentType);
}

const getCommentType = (lang: string) => {
  // TODO: Add comment types for different languages
  return "//";
};

export const displaySingleComment = async (
  position: vscode.Position,
  document: vscode.TextDocument,
  language: string = "normal"
) => {
  try {
    let nextLine: string = getNextLine(position, language) ?? ""
    //catch cases
    let comment = await generateComment(nextLine)
    let completionItem = new vscode.CompletionItem(comment.content, vscode.CompletionItemKind.Text);

    completionItem.detail = "JustCode Autocomplete";
    // TODO: Insert generated comment about next line
    completionItem.insertText = comment.content;

    // TODO: figure out this
    completionItem.command = {
      title: "Single Comment Autocomplete",
      command: "justcode.insertSingleComment",
      tooltip: "Single Comment Autocomplete",
      
      arguments: [
        {
          document: document,
          cursor: position,
          language: language,
        },
      ],
    };
    
    return [completionItem];
  } catch (error: any) {
    vscode.window.showErrorMessage(error.response);
    console.log(error.response);
  }
};
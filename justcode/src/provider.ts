import * as vscode from "vscode";

export const contextProvider = vscode.languages.registerCompletionItemProvider(
    [
      { language: "javascript" },
      { language: "typescript" },
    ],
    {
        async provideCompletionItems(
            document: vscode.TextDocument,
            position: vscode.Position,
            token: vscode.CancellationToken,
            context: vscode.CompletionContext
          ) {
            console.log('provider')

            const linePrefix = document
            .lineAt(position)
            .text.substring(0, position.character);

            console.log('line prefix', linePrefix)

          try {
            // if (
            //   linePrefix.includes(commentChar) &&
            //   position.character > line.trimLeft().indexOf(commentChar)
            // ) {
              return new Promise<vscode.CompletionItem[] | undefined>(
                async (resolve, reject) => {
                  let language =
                    vscode.window.activeTextEditor?.document.languageId;
    
                  let updatedText =
                    vscode.window.activeTextEditor?.document.lineAt(position).text;
                  // if (updatedText === line) {
                  //   let comment = await displayInlineComment(
                  //     position,
                  //     document,
                  //     language
                  //   );
                  let completion = new vscode.CompletionItem(
                    "...",
                    vscode.CompletionItemKind.Text
                  );
                  console.log('ggwp')
                  completion.detail = "JustCode";
                  completion.insertText = "";
                  completion.command = {
                    command: "justcode.helloWorld",
                    title: "Insert Inline Comment",
                    arguments: [
                      {
                        doc: document,
                        curs: position,
                        lang: language,
                      },
                    ],
                    tooltip: "Insert Inline Comment",
                  };
                    resolve([completion]);
                  // } else {
                  //   resolve(undefined);
                  // }
                }
              );
            // } else {
            //   return undefined;
            // }
          } catch (err: any) {
            console.log('provider error' + err);
            vscode.window.showErrorMessage(err.message);
          }
        }

    },
    " ",
    ","
)
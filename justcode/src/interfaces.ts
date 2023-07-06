import * as vscode from "vscode";

export interface IContextArgs {
  curs: vscode.Position;
  doc: vscode.TextDocument;
  lang: string;
};
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { contextProvider } from './provider';
import { insertDocstringComment } from './commands';
import { authenticate } from './authenticate';
import { TokenManager } from "./TokenManager";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	TokenManager.globalState = context.globalState;

	console.log('Congratulations, your extension "justcode" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand("justcode.authenticate", () => {
			try {
				authenticate();
			} catch (err) {
				console.log(err);
			}
		})
	);
	
	let disposable = vscode.commands.registerCommand(
		"justcode.docStringComment",
		insertDocstringComment
	);

	context.subscriptions.push(disposable, contextProvider)
}

// This method is called when your extension is deactivated
export function deactivate() {}

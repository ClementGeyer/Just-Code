/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const provider_1 = __webpack_require__(3);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "justcode" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('justcode.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        // vscode.window.showInformationMessage('Hello World from JustCode!');
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
        }, (progress) => __awaiter(this, void 0, void 0, function* () {
            progress.report({
                message: `Generating comments ...`,
            });
            let activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                return;
            }
            let text = activeEditor.document.getText();
            //let data = await generateComment("let disposable = vscode.commands.registerCommand('justcode.helloWorld', () => {");
        }));
    });
    context.subscriptions.push(provider_1.contextProvider, disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */,
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.contextProvider = void 0;
const vscode = __webpack_require__(1);
exports.contextProvider = vscode.languages.registerCompletionItemProvider([
    { language: "javascript" },
    { language: "typescript" },
], {
    provideCompletionItems(document, position, token, context) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(document);
            console.log(position);
            console.log(token);
            console.log(context);
            const linePrefix = document
                .lineAt(position)
                .text.substring(0, position.character);
            console.log('line prefix', linePrefix);
            try {
                // if (
                //   linePrefix.includes(commentChar) &&
                //   position.character > line.trimLeft().indexOf(commentChar)
                // ) {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    let language = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.languageId;
                    let updatedText = (_b = vscode.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.document.lineAt(position).text;
                    // if (updatedText === line) {
                    //   let comment = await displayInlineComment(
                    //     position,
                    //     document,
                    //     language
                    //   );
                    let completion = new vscode.CompletionItem("...", vscode.CompletionItemKind.Text);
                    completion.detail = "Readable";
                    completion.insertText = "";
                    completion.command = {
                        command: "readable.insertInlineComment",
                        title: "Insert Inline Comment",
                        arguments: [
                            {
                                document: document,
                                cursor: position,
                                language: language,
                            },
                        ],
                        tooltip: "Insert Inline Comment",
                    };
                    resolve([completion]);
                    // } else {
                    //   resolve(undefined);
                    // }
                }));
                // } else {
                //   return undefined;
                // }
            }
            catch (err) {
                console.log(err);
                vscode.window.showErrorMessage(err.message);
            }
        });
    }
}, " ", ",");


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map
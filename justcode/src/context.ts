import * as vscode from 'vscode';
import { IContextArgs } from './interfaces';

export const getContext = async (args: IContextArgs) => {
    const position = args.curs as vscode.Position;
    console.log(position)
}
import * as vscode from "vscode";
import axios from "axios";
import axiosRetry from "axios-retry";
import { apiBaseUrl, localhostBaseUrl } from "./const";
import { TokenManager } from "./TokenManager";
import fetch from 'node-fetch';

export const generateSingleLineShortComment = async (
  code: string
  ) => {
    try {
      const { data } = await axios.post(`${apiBaseUrl}/generateSingleLineComment`, { 
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'authorization': `Bearer ${TokenManager.getToken()}`,
        },  
        code: code 
      });
      return data;
    } catch (err: any) {
      // Figure out what went wrong
      axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 5 });
      vscode.window.showErrorMessage(
        "Error: Something went wrong. Try again shortly."
      );
      console.log(err);
      if (err.request.data) {
        vscode.window.showErrorMessage(err.request.data);
      }
    }
  };

export const generateJSDocstringComment = async (
  context: string,
) => {
  try {
    const { data } = await axios.post(`${apiBaseUrl}/generateJSDocstringComment`, { 
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'authorization': `Bearer ${TokenManager.getToken()}`,
      },  
      context: context 
    });
    return data;
  } catch (err: any) {
    // Figure out what went wrong
    axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 5 });
    switch(err.response.data){
      case "HEA":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "TOK":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "UNF":
        vscode.window.showErrorMessage(
          "JustCode Error: User not found"
        );
        break;
      case "UNP":
        vscode.window.showErrorMessage(
          "JustCode Error: User is not premium"
        );
        break;
    }
  }
};

export const generateJSDocstringCommentReactHooks = async (
  context: string,
) => {
  try {
    const { data } = await axios.post(`${apiBaseUrl}/generateJSDocstringCommentReactHooks`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'authorization': `Bearer ${TokenManager.getToken()}`,
      },   
      context: context
    });
    return data;
  } catch (err: any) {
    // Figure out what went wrong
    axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 5 });
    switch(err.response.data){
      case "HEA":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "TOK":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "UNF":
        vscode.window.showErrorMessage(
          "JustCode Error: User not found"
        );
        break;
      case "UNP":
        vscode.window.showErrorMessage(
          "JustCode Error: User is not premium"
        );
        break;
    }
  }
};

export const generateJSDocstringCommentJSXComponent = async (
  context: string,
) => {
  try {
    const { data } = await axios.post(`${apiBaseUrl}/generateJSDocstringCommentJSXComponent`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'authorization': `Bearer ${TokenManager.getToken()}`,
      },   
      context: context
    });
    return data;
  } catch (err: any) {
    // Figure out what went wrong
    axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 5 });
    switch(err.response.data){
      case "HEA":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "TOK":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "UNF":
        vscode.window.showErrorMessage(
          "JustCode Error: User not found"
        );
        break;
      case "UNP":
        vscode.window.showErrorMessage(
          "JustCode Error: User is not premium"
        );
        break;
    }
  }
};

export const generateJSDocstringCommentClass = async (
  context: string,
) => {
  try {
    const { data } = await axios.post(`${apiBaseUrl}/generateJSDocstringCommentClass`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'authorization': `Bearer ${TokenManager.getToken()}`,
      },   
      context: context
    });
    return data;
  } catch (err: any) {
    // Figure out what went wrong
    axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 5 });
    switch(err.response.data){
      case "HEA":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "TOK":
        vscode.window.showErrorMessage(
          "JustCode Error: Something went wrong. Try again shortly."
        );
        break;
      case "UNF":
        vscode.window.showErrorMessage(
          "JustCode Error: User not found"
        );
        break;
      case "UNP":
        vscode.window.showErrorMessage(
          "JustCode Error: User is not premium"
        );
        break;
    }
  }
};

export const getUser = async (accessToken: string) => {
  const response = await fetch(`${apiBaseUrl}/me`, {
    headers: {
        authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();

  let user = (<any>data).user;
  
  return user;
}
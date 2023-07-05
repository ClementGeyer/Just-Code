import * as vscode from "vscode";
import axios from "axios";
import axiosRetry from "axios-retry";

export const generateComment = async (
  code: string
    // fullCode: string,
    // comment: string,
    // language: string,
    // accessToken: string
  ) => {
    try {
      const {data} = await axios.post("http://localhost:8080/generateSingleLineComment", { 
          code: code
          // full_code: fullCode,
          // comment: comment,
          // language: language,
        }
      );
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
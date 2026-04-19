import { DesignAnalysis } from '../types';
import { analyzeDesignWithGroq } from '../services/geminiService';

export function analyzeDesign(fileName: string, file?: File): Promise<DesignAnalysis> {
  if (!file) {
    return Promise.reject(new Error('No file provided for analysis'));
  }

  return analyzeDesignWithGroq(file);
}

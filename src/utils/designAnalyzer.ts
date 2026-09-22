import { DesignAnalysis } from '../types';
import { analyzeDesignWithHackClub } from '../services/hackclubService';

export function analyzeDesign(fileName: string, file?: File): Promise<DesignAnalysis> {
  if (!file) {
    return Promise.reject(new Error('No file provided for analysis'));
  }

  return analyzeDesignWithHackClub(file);
}

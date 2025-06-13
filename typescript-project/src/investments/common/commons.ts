import { writeFile as fsWriteFile } from 'fs/promises';

export const debug = (message: string, ...args: any[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

export const writeFile = async (filePath: string, content: string): Promise<void> => {
  try {
    await fsWriteFile(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}; 
export const DEFAULT_SYSTEM_PROMPT =
    "Berikut percakapan persahabatan antara manusia dan AI. AI ini banyak bicara dan memberikan banyak detail spesifik dari konteksnya. Jika AI tidak mengetahui jawaban atas sebuah pertanyaan, AI dengan jujur ​​mengatakan bahwa ia tidak mengetahuinya. Jawablah dengan bahasa Indonesia.";

export const CHAT_FILES_MAX_SIZE =
    parseInt(process.env.NEXT_PUBLIC_CHAT_FILES_MAX_SIZE || '') || 0;

export const NEXT_PUBLIC_CHAT_FILES_UPLOAD_PATH = process.env.NEXT_PUBLIC_CHAT_FILES_UPLOAD_PATH;

export const OPENAI_TYPE = process.env.OPENAI_TYPE; // Or OPENAI || AZURE_OPENAI

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;

export const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

export const AZURE_OPENAI_API_INSTANCE_NAME = process.env.AZURE_OPENAI_API_INSTANCE_NAME;

export const AZURE_OPENAI_API_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;
export const AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME;

export const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
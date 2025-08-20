// Dynamic imports for heavy libraries to improve bundle splitting and loading performance
// These should only be used in server-side contexts

// Server-side only imports
export const getPuppeteerLazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Puppeteer can only be used on the server side');
  }
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer;
};

export const getGoogleApisLazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Google APIs can only be used on the server side');
  }
  const { google } = await import('googleapis');
  return google;
};

export const getOpenAILazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('OpenAI can only be used on the server side');
  }
  const { default: OpenAI } = await import('openai');
  return OpenAI;
};

export const getBullMQLazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('BullMQ can only be used on the server side');
  }
  const { Queue, Worker } = await import('bullmq');
  return { Queue, Worker };
};

export const getMicrosoftGraphLazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Microsoft Graph can only be used on the server side');
  }
  const { Client } = await import('@microsoft/microsoft-graph-client');
  return Client;
};

export const getAzureMSALLazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Azure MSAL can only be used on the server side');
  }
  const { ConfidentialClientApplication } = await import('@azure/msal-node');
  return ConfidentialClientApplication;
};

export const getGoogleKMSLazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Google KMS can only be used on the server side');
  }
  const { KeyManagementServiceClient } = await import('@google-cloud/kms');
  return KeyManagementServiceClient;
};

export const getRedisLazy = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Redis can only be used on the server side');
  }
  const { Redis } = await import('@upstash/redis');
  return Redis;
};

// Client-side safe imports
export const getFramerMotionLazy = async () => {
  const { motion, AnimatePresence } = await import('framer-motion');
  return { motion, AnimatePresence };
};

export const getRechartsLazy = async () => {
  const recharts = await import('recharts');
  return recharts;
};

export const getGridLayoutLazy = async () => {
  const { default: GridLayout } = await import('react-grid-layout');
  return GridLayout;
};

export const getDOMPurifyLazy = async () => {
  const { default: DOMPurify } = await import('isomorphic-dompurify');
  return DOMPurify;
};

// Export type helpers for better TypeScript support
export type PuppeteerType = Awaited<ReturnType<typeof getPuppeteerLazy>>;
export type GoogleApisType = Awaited<ReturnType<typeof getGoogleApisLazy>>;
export type OpenAIType = Awaited<ReturnType<typeof getOpenAILazy>>;
export type BullMQType = Awaited<ReturnType<typeof getBullMQLazy>>;
export type FramerMotionType = Awaited<ReturnType<typeof getFramerMotionLazy>>;
export type RechartsType = Awaited<ReturnType<typeof getRechartsLazy>>;
export type GridLayoutType = Awaited<ReturnType<typeof getGridLayoutLazy>>;
export type DOMPurifyType = Awaited<ReturnType<typeof getDOMPurifyLazy>>;
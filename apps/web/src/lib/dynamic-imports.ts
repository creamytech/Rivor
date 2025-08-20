// Dynamic imports for heavy libraries to improve bundle splitting and loading performance

// PDF Generation - only load when needed
export const getPuppeteerLazy = async () => {
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer;
};

// Google APIs - only load when needed
export const getGoogleApisLazy = async () => {
  const { google } = await import('googleapis');
  return google;
};

// OpenAI - only load when needed  
export const getOpenAILazy = async () => {
  const { default: OpenAI } = await import('openai');
  return OpenAI;
};

// BullMQ - only load when needed
export const getBullMQLazy = async () => {
  const { Queue, Worker } = await import('bullmq');
  return { Queue, Worker };
};

// Framer Motion - only load when needed
export const getFramerMotionLazy = async () => {
  const { motion, AnimatePresence } = await import('framer-motion');
  return { motion, AnimatePresence };
};

// Recharts - only load when needed
export const getRechartsLazy = async () => {
  const recharts = await import('recharts');
  return recharts;
};

// React Grid Layout - only load when needed
export const getGridLayoutLazy = async () => {
  const { default: GridLayout } = await import('react-grid-layout');
  return GridLayout;
};

// DOMPurify - only load when needed
export const getDOMPurifyLazy = async () => {
  const { default: DOMPurify } = await import('isomorphic-dompurify');
  return DOMPurify;
};

// Microsoft Graph - only load when needed
export const getMicrosoftGraphLazy = async () => {
  const { Client } = await import('@microsoft/microsoft-graph-client');
  return Client;
};

// Azure MSAL - only load when needed
export const getAzureMSALLazy = async () => {
  const { ConfidentialClientApplication } = await import('@azure/msal-node');
  return ConfidentialClientApplication;
};

// Google Cloud KMS - only load when needed
export const getGoogleKMSLazy = async () => {
  const { KeyManagementServiceClient } = await import('@google-cloud/kms');
  return KeyManagementServiceClient;
};

// Upstash Redis - only load when needed
export const getRedisLazy = async () => {
  const { Redis } = await import('@upstash/redis');
  return Redis;
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
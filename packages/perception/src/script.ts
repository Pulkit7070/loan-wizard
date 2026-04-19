import type { FormData } from '@loan-wizard/contracts';
import {
  extractName,
  extractEmployment,
  extractIncome,
  extractLoanDetails,
  extractConsent,
} from './extraction/regex-extractors';

export interface ExtractResult<T = any> {
  value: T;
  confidence: number;
}

export interface ScriptQuestion {
  id: string;
  text: string;
  expectedField: keyof FormData;
  extractor: (transcript: string) => ExtractResult | null;
}

export interface AgentScript {
  questions: ScriptQuestion[];
}

export const DEFAULT_SCRIPT: AgentScript = {
  questions: [
    {
      id: 'consent',
      text: 'Hi, I am your loan assistant. This call is being recorded for verification. Do you consent to continue?',
      expectedField: 'name',
      extractor: (t) => extractConsent(t),
    },
    {
      id: 'name',
      text: 'Great. Please tell me your full name.',
      expectedField: 'name',
      extractor: extractName,
    },
    {
      id: 'employment',
      text: 'What is your current employment type? Salaried, self employed, or something else?',
      expectedField: 'employment_type',
      extractor: extractEmployment,
    },
    {
      id: 'income',
      text: 'What is your approximate monthly income in rupees?',
      expectedField: 'monthly_income',
      extractor: extractIncome,
    },
    {
      id: 'purpose',
      text: 'Finally, what is the loan for, and how much do you need?',
      expectedField: 'loan_amount_requested',
      extractor: (t) => {
        const r = extractLoanDetails(t);
        return r ? { value: r.value.amount, confidence: r.confidence } : null;
      },
    },
  ],
};

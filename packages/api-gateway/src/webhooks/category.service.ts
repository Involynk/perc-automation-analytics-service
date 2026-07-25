import { Injectable } from '@nestjs/common';
import { CATEGORY_KEYWORDS, CATEGORY_MESSAGES, ORDERED_CATEGORIES } from '@perc/shared';

@Injectable()
export class CategoryService {
  detect(text: string | null | undefined): string[] {
    if (!text) return ['general_enquiry'];

    const lower = text.toLowerCase();
    const matched: string[] = [];

    for (const cat of ORDERED_CATEGORIES) {
      const keywords = CATEGORY_KEYWORDS[cat];
      if (keywords.some((kw) => lower.includes(kw))) {
        matched.push(cat);
      }
    }

    return matched.length > 0 ? matched : ['general_enquiry'];
  }

  composeAskMessage(firstName: string, categories?: string[]): string {
    if (!categories || categories.includes('general_enquiry')) {
      return `Hi ${firstName}! Thank you for reaching out! I'd be happy to help you with the information you need. Please share your WhatsApp number so I can send you all the details there.`;
    }

    const topics: string[] = [];
    for (const cat of ORDERED_CATEGORIES) {
      if (categories.includes(cat)) {
        const msg = CATEGORY_MESSAGES[cat];
        if (msg) topics.push(msg);
      }
    }

    let greeting: string;
    if (topics.length === 1) {
      greeting = `Thank you for your interest in ${topics[0]}!`;
    } else if (topics.length === 2) {
      greeting = `Thank you for your interest in ${topics[0]} and ${topics[1]}!`;
    } else {
      const last = topics.pop();
      greeting = `Thank you for your interest in ${topics.join(', ')}, and ${last}!`;
    }

    return `Hi ${firstName}! ${greeting} Please share your WhatsApp number so I can send you all the details there.`;
  }

  composeGenericMessage(firstName: string, categories?: string[]): string {
    if (!categories || categories.includes('general_enquiry')) {
      return `Hi ${firstName}! Thank you for reaching out! We will get back to you shortly.`;
    }

    const topics: string[] = [];
    for (const cat of ORDERED_CATEGORIES) {
      if (categories.includes(cat)) {
        const msg = CATEGORY_MESSAGES[cat];
        if (msg) topics.push(msg);
      }
    }

    if (topics.length === 1) {
      return `Hi ${firstName}! Thank you for your interest in ${topics[0]}! We will get back to you shortly.`;
    } else if (topics.length === 2) {
      return `Hi ${firstName}! Thank you for your interest in ${topics[0]} and ${topics[1]}! We will get back to you shortly.`;
    } else {
      const last = topics.pop();
      return `Hi ${firstName}! Thank you for your interest in ${topics.join(', ')}, and ${last}! We will get back to you shortly.`;
    }
  }
}

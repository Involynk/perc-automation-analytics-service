import { clear } from '../recorder';
import * as leadWithPhone from './lead-with-phone';
import * as leadWithoutPhone from './lead-without-phone';

const scenarios: { name: string; run: () => Promise<boolean> }[] = [
  { name: 'Lead with phone → WhatsApp welcome message', run: leadWithPhone.run },
  { name: 'Lead without phone → ask WhatsApp number', run: leadWithoutPhone.run },
];

export async function runAll(): Promise<boolean> {
  let allPassed = true;

  for (const scenario of scenarios) {
    clear();
    try {
      const passed = await scenario.run();
      console.log(passed ? '✓ PASS' : '✗ FAIL');
      if (!passed) allPassed = false;
    } catch (err: any) {
      console.log(`✗ FAIL: ${err.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

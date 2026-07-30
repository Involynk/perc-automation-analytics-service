import { startMockServer } from './mock-server';
import { runAll } from './scenarios';

async function main() {
  const mockPort = parseInt(process.env.MOCK_PORT || '9100');

  const server = await startMockServer(mockPort);

  const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
  console.log(`Gateway: ${gatewayUrl}`);
  console.log(`Mock server port: ${mockPort}`);

  const allPassed = await runAll();

  server.close();
  console.log(`\n${allPassed ? 'All scenarios passed!' : 'Some scenarios failed'}`);
  process.exit(allPassed ? 0 : 1);
}

main();

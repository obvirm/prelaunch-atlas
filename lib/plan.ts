import type { FarmStep, SnapshotProtocol } from './types.ts';

const CHEAP_CHAINS = ['Solana', 'Tron', 'Binance', 'Bittensor', 'Noble', 'Algorand', 'Ripple', 'Stellar', 'Sui', 'Aptos', 'Monad', 'Plume'];

function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 2_000_000_000) return 250;
  if (p.tvl_usd >= 500_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  if (p.tvl_usd >= 25_000_000) return 75;
  return 50;
}

function holdFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 90) return 60;
  if (age < 365) return 45;
  return 30;
}

function gasFor(chain: string): string {
  if (chain === 'Ethereum') return 'about $6-12';
  if (CHEAP_CHAINS.some((c) => chain.includes(c))) return 'under $0.20';
  return 'about $0.50-2';
}

function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('curator') || c.includes('allocator') || c.includes('index') || c.includes('liquidity manager') || c.includes('governance') || c.includes('farm')) {
    return `Deposit $${capital} of USDC into ${p.name}'s flagship USDC vault on ${chain} and keep the vault receipt.`;
  }
  if (c.includes('cdp') || c.includes('stablecoin wrapper') || c.includes('dual-token')) {
    return `Open a ${p.name} vault on ${chain}, lock $${capital} of the chain's accepted collateral and mint the protocol's stable asset with the debt at half the collateral or less.`;
  }
  if (c.includes('lend') || c.includes('collateral')) {
    return `Supply $${capital} of USDC to ${p.name}'s ${chain} market and keep the position open.`;
  }
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('option')) {
    return `Deposit $${capital} of USDC as margin with ${p.name} on ${chain} and open one small hedge.`;
  }
  if (c.includes('dex') || c.includes('prediction') || c.includes('leveraged')) {
    return `Provide $${capital} of USDC to ${p.name}'s main ${chain} market and keep the position.`;
  }
  if (c.includes('rwa')) {
    return `Mint or buy $${capital} of ${p.name}'s yield asset on ${chain} and hold it.`;
  }
  if (c.includes('basis')) {
    return `Deposit $${capital} into ${p.name}'s basis-trading vault on ${chain} and keep the receipt.`;
  }
  if (c.includes('staking') || c.includes('restak') || c.includes('liquid')) {
    return `Stake $${capital} of the ${chain} staking asset through ${p.name} and keep the receipt.`;
  }
  if (c.includes('insurance')) {
    return `Buy $${capital} of cover from ${p.name} on ${chain} and keep the policy.`;
  }
  if (c.includes('payment')) {
    return `Open a ${p.name} payment channel with $${capital} of BTC on ${chain} and route a few payments.`;
  }
  if (c.includes('chain')) {
    return `Bridge $${capital} to ${chain} and use ${p.name}'s native app; the chain itself is the protocol.`;
  }
  return `Deposit $${capital} of USDC into ${p.name} on ${chain} and keep the position open.`;
}

export function farmPlan(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdFor(age);
  const gas = gasFor(chain);
  const action = actionFor(p, capital, chain);
  return [
    { text: `Create a fresh wallet for ${p.name} and fund it with $${capital} of USDC on ${chain}; keep the seed phrase offline.`, cost: 'no fee to create the wallet; the capital is not spent', time: '10 minutes' },
    { text: action, cost: `$${capital} of capital plus ${gas} of gas`, time: '10-20 minutes' },
    { text: `Leave the position open for at least ${hold} days so the activity spans more than one weekly snapshot.`, cost: 'the capital stays at work; no extra fee', time: `${hold} days` },
    { text: 'Make one more qualifying move in week two, such as a deposit, a claim, a vote or a small swap.', cost: `${gas} of gas`, time: '10 minutes' },
    { text: `Check ${p.name}'s own site or social account for a points or claim page; never pay to claim and never share the seed phrase.`, cost: '$0; a claim should never ask for a fee', time: '10 minutes' },
    { text: 'Log the wallet, the dates, the position and the exit plan in a farm journal so the position can be repeated or unwound.', cost: '$0', time: '5 minutes' },
  ];
}

export function stepText(step: FarmStep): string {
  let text = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (text.length > 600) text = `${text.slice(0, 596)}...`;
  if (text.length < 20) text = `${text} Hold the position and check the protocol's own page.`;
  return text;
}

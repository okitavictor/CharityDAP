# Decentralized Autonomous Charity (DAC)

A blockchain-based charitable organization where donors can collectively decide on fund allocation through democratic voting processes.

## Features

- 🏦 Transparent donation management
- 📋 Community-driven proposal system
- 🗳️ Democratic voting mechanism
- 💰 Automated fund distribution
- 🎨 Proof of donation NFTs
- 🔒 Secure smart contract implementation

## Technical Architecture

### Smart Contracts

- `dao-charity.clar`: Main contract handling:
    - Donation processing
    - Proposal management
    - Voting system
    - Fund distribution
    - NFT minting

### Test Suite

- Comprehensive Vitest test suite
- Coverage for all contract functions
- Simulated blockchain testing

## Getting Started

### Prerequisites

```bash
npm install -g clarinet
npm install
```

### Development Setup

1. Initialize project:
```bash
clarinet new dao-charity
cd dao-charity
```

2. Deploy contract:
```bash
clarinet contract deploy
```

3. Run tests:
```bash
npm test
```

## Contract Interaction

### Making Donations

```clarity
;; Donate minimum amount (1 STX)
(contract-call? .dao-charity donate)
```

### Creating Proposals

```clarity
(contract-call? .dao-charity create-proposal
  "Help Local Food Bank"
  "Provide meals to local community"
  'beneficiary-address
  u1000000  ;; 1 STX
  u100)     ;; Duration in blocks
```

### Voting

```clarity
;; Vote in favor of proposal #1
(contract-call? .dao-charity vote u1 true)
```

## Security Considerations

- Minimum donation requirements
- Proposal duration limits
- Vote weight based on donation amount
- Fund distribution safety checks
- Access control for administrative functions

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test dao-charity

# Generate coverage report
npm run coverage
```

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## Deployment Guide

1. **Testnet Deployment**
```bash
clarinet contract deploy --testnet
```

2. **Mainnet Deployment**
```bash
clarinet contract deploy --mainnet
```

## Future Roadmap

1. Multi-signature proposal execution
2. Quadratic voting implementation
3. Milestone-based fund distribution
4. Charitable project tracking
5. Impact reporting system

## License

MIT License

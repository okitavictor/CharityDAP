// tests/dao-charity.test.ts
import { describe, beforeEach, test, expect } from 'vitest';
import {
  initSimnet,
  deployContract,
  getAddresses,
  callPublicFn,
  queryContract,
} from '@stacks/stacks-network-js';

describe('Decentralized Autonomous Charity', () => {
  let simnet;
  let deployer;
  let donor1;
  let donor2;
  let beneficiary;
  
  beforeEach(async () => {
    // Initialize simnet and get test accounts
    simnet = await initSimnet();
    const addresses = await getAddresses(simnet);
    [deployer, donor1, donor2, beneficiary] = addresses;
    
    // Deploy contract
    await deployContract(simnet, {
      contractName: 'dao-charity',
      senderKey: deployer.privateKey,
      path: '../contracts/dao-charity.clar'
    });
  });
  
  describe('Donations', () => {
    test('should accept valid donations', async () => {
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'donate',
        senderKey: donor1.privateKey,
        amount: 1000000 // 1 STX
      });
      
      expect(result.success).toBe(true);
      
      const donorTokens = await queryContract(simnet, {
        contractName: 'dao-charity',
        fnName: 'get-donor-tokens',
        args: [donor1.address]
      });
      
      expect(donorTokens.value).toBe('u1');
    });
    
    test('should reject donations below minimum', async () => {
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'donate',
        senderKey: donor1.privateKey,
        amount: 500000 // 0.5 STX
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ERR-INVALID-AMOUNT');
    });
  });
  
  describe('Proposal Management', () => {
    beforeEach(async () => {
      // Setup: Make donation to get governance tokens
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'donate',
        senderKey: donor1.privateKey,
        amount: 1000000
      });
    });
    
    test('should create proposal successfully', async () => {
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'create-proposal',
        senderKey: donor1.privateKey,
        args: [
          'Help Local Food Bank',
          'Provide meals to local community',
          beneficiary.address,
          'u1000000',
          'u100' // 100 blocks duration
        ]
      });
      
      expect(result.success).toBe(true);
      
      const proposal = await queryContract(simnet, {
        contractName: 'dao-charity',
        fnName: 'get-proposal',
        args: ['u1']
      });
      
      expect(proposal.value.title).toBe('Help Local Food Bank');
    });
    
    test('should reject proposal from non-donor', async () => {
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'create-proposal',
        senderKey: donor2.privateKey,
        args: [
          'Invalid Proposal',
          'Should fail',
          beneficiary.address,
          'u1000000',
          'u100'
        ]
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ERR-NOT-AUTHORIZED');
    });
  });
  
  describe('Voting System', () => {
    beforeEach(async () => {
      // Setup: Create donors and proposal
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'donate',
        senderKey: donor1.privateKey,
        amount: 1000000
      });
      
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'donate',
        senderKey: donor2.privateKey,
        amount: 2000000
      });
      
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'create-proposal',
        senderKey: donor1.privateKey,
        args: [
          'Test Proposal',
          'Description',
          beneficiary.address,
          'u1000000',
          'u100'
        ]
      });
    });
    
    test('should allow voting on active proposal', async () => {
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'vote',
        senderKey: donor1.privateKey,
        args: ['u1', 'true']
      });
      
      expect(result.success).toBe(true);
      
      const hasVoted = await queryContract(simnet, {
        contractName: 'dao-charity',
        fnName: 'has-voted',
        args: ['u1', donor1.address]
      });
      
      expect(hasVoted.value).toBe(true);
    });
    
    test('should prevent double voting', async () => {
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'vote',
        senderKey: donor1.privateKey,
        args: ['u1', 'true']
      });
      
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'vote',
        senderKey: donor1.privateKey,
        args: ['u1', 'true']
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ERR-ALREADY-VOTED');
    });
  });
  
  describe('Proposal Execution', () => {
    beforeEach(async () => {
      // Setup: Create proposal and votes
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'donate',
        senderKey: donor1.privateKey,
        amount: 1000000
      });
      
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'create-proposal',
        senderKey: donor1.privateKey,
        args: [
          'Test Proposal',
          'Description',
          beneficiary.address,
          'u1000000',
          'u10'
        ]
      });
      
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'vote',
        senderKey: donor1.privateKey,
        args: ['u1', 'true']
      });
    });
    
    test('should execute passed proposal', async () => {
      // Advance blocks
      await simnet.mineEmptyBlock(11);
      
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'execute-proposal',
        senderKey: deployer.privateKey,
        args: ['u1']
      });
      
      expect(result.success).toBe(true);
      
      const proposal = await queryContract(simnet, {
        contractName: 'dao-charity',
        fnName: 'get-proposal',
        args: ['u1']
      });
      
      expect(proposal.value.executed).toBe(true);
    });
  });
  
  describe('NFT Minting', () => {
    test('should mint NFT for valid donor', async () => {
      await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'donate',
        senderKey: donor1.privateKey,
        amount: 1000000
      });
      
      const result = await callPublicFn(simnet, {
        contractName: 'dao-charity',
        fnName: 'mint-donation-nft',
        senderKey: donor1.privateKey,
        args: ['ipfs://QmExample']
      });
      
      expect(result.success).toBe(true);
    });
  });
});

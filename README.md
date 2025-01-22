# 0x365's Web3 Sandbox

## About

This is a tool to interact with multiple publically deployed smart contracts in a simple interface.

## Requirements

- Metamask wallet on your browser with a small amount of sepolia ETH
- Sepolia deployed contract (More versions coming soon)

## How to use

1. Use the current deployed contracts that are in `public/deployments/` or copy and create your own one in the same place. All the details in the `.json` file is required for the smart contract. Whenever a new smart contract is added the react app must be restarted.

2. Create .env file and fill in required api key information.

```
cp setup/.env-template .env
```

3. Spin up react app.

```bash
./app.sh dev
```

### Other Commands:

```bash
./app.sh dev
./app.sh build
./app.sh serve
```


### Dev

This is still in development but works okay....


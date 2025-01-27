// src/networks.js

export const networks = {
    31337: { 
        name: "Localhost", 
        rpc: process.env.REACT_APP_LOCAL_URL, 
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
        },
        blockExplorerUrls: ["https://www.google.com"]
    },
    11155111: {
        name: "Sepolia",
        rpc: process.env.REACT_APP_API_URL,
        nativeCurrency: {
            name: 'SepoliaETH',
            symbol: 'ETH',
            decimals: 18,
        },
        blockExplorerUrls: ["https://www.google.com"]
    }
};

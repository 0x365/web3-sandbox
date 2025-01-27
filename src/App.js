// Web3 Sandbox
// Author: Robert Cowlishaw (0x365)
// Info: 
// - Main code for the webfront
// - Still in development but works with sepolia at the moment


import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { networks } from './networks'; 
import "./App.css";

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [networkName, setNetworkName] = useState("Unknown");
    const [walletBalance, setWalletBalance] = useState(null);
    const [chainHex, setChainHex] = useState(null);
    const [contractABI, setContractABI] = useState([]);
    const [contractAddress, setContractAddress] = useState([]);
    const [fileNames, setFileNames] = useState([]);
    const [currentContractData, setCurrentContractData] = useState({
        contractAddress: null,
        contractFileName: null,
        contractABI: null,
    });
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [contractButtons, setContractButtons] = useState([]);
    const [stateVariables, setStateVariables] = useState([]);
    const [contractFunctionButtons, setContractFunctionButtons] = useState([]);
    const [funcArgs, setFuncArgs] = useState({});
    const [funcValue, setFuncValue] = useState(null);


    const getProvider = () => {
        if (!window.ethereum) throw new Error("MetaMask is not installed!");
        return new ethers.BrowserProvider(window.ethereum);
    };

    const handleFuncArgs = (inputIndex, value) => {
        setFuncArgs((prevValues) => ({
            ...prevValues,
            [inputIndex]: value,
        }));
    };

    const handleFuncValue = (e) => {
        setFuncValue(e.target.value);
        console.log(e.target.value);
    };

    const getSigner = async () => {
        if (!window.ethereum) {
            throw new Error("MetaMask is not installed!");
        }
        try {
            // Create a provider instance
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Request account access if not already connected
            await provider.send("eth_requestAccounts", []);
            
            // Get the signer from the provider
            const signer = await provider.getSigner();
            return signer;
        } catch (error) {
            console.error("Error getting signer:", error);
            alert("Please connect your wallet to interact with the app.");
        }
    };

    const callContractFunction = async (contractData, func, args=[], valueInEther = null) => {
        try {
            // For functions with parameters, use a prompt or form to gather input
            args = Object.values(args);
            const signer = await getSigner();
            const contractInstance = new ethers.Contract(contractData.contractAddress, contractData.contractABI, signer);

            const valueInEth = valueInEther || "0";
            const tx = await contractInstance[func.name](...args, {value: ethers.parseEther(valueInEth)});

            console.log(`Transaction sent for ${func.name}:`, tx);
            const receipt = await tx.wait();
            console.log(`Transaction mined for ${func.name}:`, receipt);

            alert(`Function ${func.name} called successfully!`);
        } catch (error) {
            console.error(`Error calling function ${func.name}:`, error);
            alert(`Failed to call function ${func.name}.`);
        }
    };

    const displayContract = async (address, abi, fileName) => {
        
        if (!chainHex) {
            console.error("Provider not connected.");
            return;
        }
        try {
            const provider = new ethers.JsonRpcProvider(networks[chainHex]?.rpc);
            const contractInstance = new ethers.Contract(address, abi, provider);

            setFuncArgs({});
            setCurrentContractData({
                contractAddress: address,
                contractFileName: fileName.substring(0,fileName.length-5),
                contractABI: abi,
            });

            const tempStateVariables = [];
            for (let i = 0; i < abi.length; i++) {
                if (abi[i].type === 'function' && abi[i].stateMutability === 'view') {
                    try {
                        // Check if the function is a getter for a state variable
                        const variableName = abi[i].name;
                        const variableType = abi[i].outputs[0].type;
                        if (variableName && variableName !== 'owner') { // Avoid displaying 'owner' again
                            const value = await contractInstance[variableName]();
                            tempStateVariables.push({ name: variableName, type: variableType, value: value.toString() });
                        }
                    } catch (error) {
                        console.error(`Error fetching ${abi[i].name}:`, error);
                    }
                }
            }
            setStateVariables(tempStateVariables);
        } catch (error) {
            console.error("Error interacting with contract:", error);
        }
    };

    

    const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

    useEffect(() => {
        const initialize = async () => {
            try {
                const provider = getProvider();
                const network = await provider.getNetwork();
                setNetworkName(networks[network.chainId]?.name || "Unknown");
                setChainHex(Number(network.chainId));

                const accounts = await provider.send("eth_requestAccounts", []);
                setWalletAddress(accounts[0]);
                const balance = await provider.getBalance(accounts[0]);
                setWalletBalance(Number.parseFloat(ethers.formatEther(balance)).toFixed(6));
            } catch (error) {
                console.error("Error initializing provider:", error);
            }
        };
        initialize();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetch("/fileManifest.json").then((res) => res.json());
                console.log(data)
                const results = await Promise.all(
                  data.map(async (file) => {
                    const file_data = await fetch(`/targets/${file}`).then((res) => res.json());
                    // console.log(file_data)

                    const buttonLabel = `${file_data.address.substring(0, 10)}...${file_data.address.substring(32)} ${file_data.deploy_block}`;

                    return {
                      abi: file_data.abi,
                      address: file_data.address,
                      label: buttonLabel,
                      fileName: file,
                    };
                  })
                );

                const filteredResults = results.filter(Boolean);
                setContractABI(filteredResults.map((r) => r.abi));
                setContractAddress(filteredResults.map((r) => r.address));
                setContractButtons(filteredResults.map((r) => r.label));
                setFileNames(filteredResults.map((r) => r.fileName));
                const addresses = filteredResults.map((r) => r.address);
                const fileNames = filteredResults.map((r) => r.fileName);

                displayContract(addresses[0], filteredResults.map((r) => r.abi)[0], fileNames[0]);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        if (chainHex) fetchData();
    }, [chainHex]);  // eslint-disable-line react-hooks/exhaustive-deps


    

    

    useEffect(() => {
        const getFunctionCallButtons = async () => {
            const functions = currentContractData.contractABI.filter(item => item.type === 'function' && item.stateMutability !== 'view');
            const functionButtons = functions.map((func, index) => (
                <div key={index} className="function-container">
                <h3 className="function-title">Call {func.name}</h3>
                <div className="function-row">
                <div className="input-group">
                    {func.stateMutability === "payable" ? (
                    <>
                        <div className="input-field">
                        <label>Pay Contract Amount</label>
                        <input
                            type="number"
                            value={funcValue}
                            onChange={handleFuncValue}
                            placeholder="Enter ETH Value"
                        />
                        </div>
                    </>
                    ) : (<></>)}
                    {func.inputs.map((input, inputIndex) => (
                    <div key={inputIndex} className="input-field">
                        <label>{input.name} ({input.type})</label>
                        <input
                        type="text"
                        placeholder={`Enter ${input.name}`}
                        value={funcArgs[inputIndex] || ''}
                        onChange={(e) => handleFuncArgs(inputIndex, e.target.value)}
                        />
                    </div>
                    ))}
                </div>
                <button
                    className="contract-buttons"
                    onClick={() => callContractFunction(currentContractData, func, funcArgs, funcValue)}
                >
                    Call {func.name}
                </button>
                </div>
            </div>
            ));
            setContractFunctionButtons(functionButtons);
        };
        if (currentContractData.contractABI) getFunctionCallButtons();
    }, [currentContractData, funcArgs, funcValue]); // eslint-disable-line react-hooks/exhaustive-deps

    

  


    useEffect(() => {
        const initialize = async () => {
            try {
                const provider = getProvider();
                // const network = await provider.getNetwork();
                const accounts = await provider.send("eth_requestAccounts", []);
                setWalletAddress(accounts[0]);
                const balance = await provider.getBalance(accounts[0]);
                setWalletBalance(Number.parseFloat(ethers.formatEther(balance)).toFixed(6));
            } catch (error) {
                console.error("Error initializing provider:", error);
            }
        };

        initialize();

        const handleNetworkChange = (chainId) => {
            console.log(`Network changed to ${chainId}`);
            setChainHex(Number(chainId));
            initialize();
        };

        if (window.ethereum) {
            window.ethereum.on("chainChanged", handleNetworkChange);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("chainChanged", handleNetworkChange);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    

    return (
        <div className="app-container">
            <header className="header">
                <h1>Smart Contract Playground</h1>
                <div className={`burger-menu ${sidebarVisible ? "active" : ""}`} onClick={toggleSidebar}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </header>

            <div className={`sidebar ${sidebarVisible ? "active" : ""}`}>
                <div className="sidebar-content">
                    <h3>Network Selector</h3>
                    {walletAddress ? (
                        <>
                            <div className="sidebar-content-subdetails">
                                <p>
                                    <strong>Currently Selected:</strong>
                                </p>
                                <p>{networkName || "Loading..."}</p>
                            </div>
                            <div className="sidebar-content-subdetails">
                                <p>
                                    <strong>Wallet Address:</strong>
                                </p>
                                <p>{walletAddress.substring(0, 27) + "..."}</p>
                            </div>
                            <div className="sidebar-content-subdetails">
                                <p>
                                    <strong>Wallet Balance:</strong>
                                </p>
                                <p>{walletBalance + " ETH" || "Loading..."}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Please connect your wallet to interact with the app.</p>
                        </>
                    )}
                </div>
                 

                <div className="spacer"></div>

                <div className="sidebar-content">
                    <h3>Contract Selector</h3>
                    <div className="sidebar-content-subdetails">
                        <p>
                            <strong>Currently chosen contract:</strong>
                        </p>
                        <p>{currentContractData.contractFileName || "Loading..."}</p>
                    </div>
                </div>

                <div className="button-list">
                    {contractButtons.map((label, index) => (
                        <button
                            key={index}
                            onClick={() => displayContract(contractAddress[index], contractABI[index], fileNames[index])}
                        >
                          <span className="button-left-text">{fileNames[index].substring(0,fileNames[index].length-5)}</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className="main-content">
              
              <div className="contractData">
                <strong>Connected Contract: </strong> {currentContractData.contractAddress ? currentContractData.contractAddress : "Loading..."}
              </div>
              <div className="contractData">
                <strong>Contract Name: </strong> {currentContractData.contractFileName ? currentContractData.contractFileName : "Loading..."}
              </div>

              <div className="contractData">
                <strong>State Variables: </strong>
                {stateVariables.length > 0 ? (
                    <table className="state-variables-table">
                        <thead>
                            <tr>
                                <th>Variable Name</th>
                                <th>Type</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stateVariables.map((label, index) => (
                                <tr key={index}>
                                    <td>{label.name}</td>
                                    <td>{label.type}</td>
                                    <td>{label.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    "No state variables found"
                )}
            </div>

            <div className="function-calls">
                <strong>Function Calls:</strong>
                <div className="all-functions">
                    {contractFunctionButtons.map((button, index) => (
                        <div key={index} className="function-boxes">
                            {button}
                        </div>
                    ))}
                </div>
            </div>

            </main>
        </div>
  );
};


export default App;
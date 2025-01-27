// Web3 Sandbox
// Author: Robert Cowlishaw (0x365)
// Info: 
// - Main code for the webfront
// - Still in development but works with sepolia at the moment


import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [networkName, setNetworkName] = useState("Unknown");
    const [walletBalance, setWalletBalance] = useState(null);
    const [chainHex, setChainHex] = useState(null);
    const [contractABI, setContractABI] = useState([]);
    const [contractAddress, setContractAddress] = useState([]);
    const [fileNames, setFileNames] = useState([]);
    const [currentAddress, setCurrentAddress] = useState(null);
    const [currentABI, setCurrentABI] = useState(null);
    const [currentFileName, setCurrentFileName] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [contractButtons, setContractButtons] = useState([]);
    const [stateVariables, setStateVariables] = useState([]);
    const [contractFunctionButtons, setContractFunctionButtons] = useState([]);
    const [funcValue, setFuncValue] = useState('');
    
    const targetContract = process.env.REACT_APP_TARGET_CONTRACT;

    const networks = {
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

    const getProvider = () => {
        if (!window.ethereum) throw new Error("MetaMask is not installed!");
        return new ethers.BrowserProvider(window.ethereum);
    };

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
                let target = 0
                for (let i = 0; i < addresses.length; i++) {
                  if (addresses[i] === targetContract) {
                    target = i;
                  }
                }
                // console.log("test")
                displayContract(addresses[target], filteredResults.map((r) => r.abi)[target], fileNames[target]);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        if (chainHex) fetchData();
    }, [chainHex]);  // eslint-disable-line react-hooks/exhaustive-deps

    // const changeRPC = async (chainId) => {
    //     const network = networks[chainId];
    //     if (!network) throw new Error("Unsupported network");

    //     try {
    //       await window.ethereum.request({
    //         method: 'wallet_switchEthereumChain',
    //         params: [{ chainId: ethers.toBeHex(chainId) }],
    //       });
    //       console.log('Successfully switched network.');
    //     } catch (switchError) {
    //       if (switchError.code === 4902) {
    //         // Network not found in MetaMask, try adding it
    //         console.log('Network not found. Attempting to add network...');
    //         try {
    //           await window.ethereum.request({
    //               method: "wallet_addEthereumChain",
    //               params: [
    //                   {
    //                       chainId: ethers.toBeHex(chainId),
    //                       rpcUrls: [network.rpc],
    //                       chainName: network.name,
    //                       nativeCurrency: network.nativeCurrency,
    //                       blockExplorerUrls: network.blockExplorerUrls,
    //                   },
    //               ],
    //           });
    //         } catch (addError) {
    //           console.error('Error adding network:', addError.message, addError);
    //         }
    //       } else if (switchError.code === 4001) {
    //         // User rejected the request
    //         console.log('User canceled network switch.');
    //       } else {
    //         console.error('Error switching network:', switchError.message, switchError);
    //       }
    //     }
    // };

    const displayContract = async (address, abi, fileName) => {
        
        if (!chainHex) {
            console.error("Provider not connected.");
            return;
        }
        try {
            const provider = new ethers.JsonRpcProvider(networks[chainHex]?.rpc);
            const contractInstance = new ethers.Contract(address, abi, provider);
            // const owner = await contractInstance.owner();
            // const contractBalance = await contractInstance.balance;
            // console.log(contractBalance);
            // setContractOwner(owner);
            setCurrentAddress(address);
            setCurrentFileName(fileName.substring(0,fileName.length-5));
            setCurrentABI(abi);
            setFuncArgs({});
            // setContractBalance(contractBalance);

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

    const [funcArgs, setFuncArgs] = useState({});

    useEffect(() => {
      const getFunctionCallButtons = async () => {
          const functions = currentABI.filter(item => item.type === 'function' && item.stateMutability !== 'view');
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
                onClick={() => callContractFunction(currentAddress, currentABI, func, funcArgs, funcValue)}
              >
                Call {func.name}
              </button>
            </div>
          </div>
          ));
          setContractFunctionButtons(functionButtons);
      };
      if (currentABI) getFunctionCallButtons();
    }, [currentABI, funcArgs, funcValue]); // eslint-disable-line react-hooks/exhaustive-deps

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
          // console.log("Signer address:", await signer.getAddress());
          return signer;
      } catch (error) {
          console.error("Error getting signer:", error);
          alert("Please connect your wallet to interact with the app.");
      }
  };

    const callContractFunction = async (address, abi, func, args=[], valueInEther = "0") => {
      try {
          // For functions with parameters, use a prompt or form to gather input
          // const args = []; // Populate with argument values as needed

          // console.log("Here1")
          args = Object.values(args);
          // console.log(args);
          const signer = await getSigner();
          // console.log(signer)
          const contractInstance = new ethers.Contract(address, abi, signer);
          // console.log("Here2")
            //   console.log(abi)

            // console.log(args)

          // if (valueInEther != "0") {
          //   const valueInWei = ethers.parseEther(valueInEther);
          //   console.log("Here3")
          //   const tx = await contractInstance[func.name](...args, {
          //     value: valueInWei
          //   });
          // } else {
          // console.log(func.name)
          // console.log(args)
          const tx = await contractInstance[func.name](...args, {});

          // console.log("Here")
          console.log(`Transaction sent for ${func.name}:`, tx);
          const receipt = await tx.wait();
          console.log(`Transaction mined for ${func.name}:`, receipt);

          alert(`Function ${func.name} called successfully!`);
      } catch (error) {
          console.error(`Error calling function ${func.name}:`, error);
          alert(`Failed to call function ${func.name}.`);
      }
  };

  


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

    const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

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
                 

                {/*
                This breaks everything at the moment for some reason
                <div className="button-list">
                    <button onClick={() => changeRPC(31337)}>Switch to Localhost</button>
                    <button onClick={() => changeRPC(11155111)}>Switch to Sepolia</button>
                </div> */}

                <div className="spacer"></div>

                <div className="sidebar-content">
                    <h3>Contract Selector</h3>
                    <div className="sidebar-content-subdetails">
                        <p>
                            <strong>Contract Address:</strong>
                        </p>
                        <p>{currentAddress?.substring(0, 27) + "..." || "Loading..."}</p>
                    </div>
                    <div className="sidebar-content-subdetails">
                        <p>
                            <strong>Contract Owner:</strong>
                        </p>
                        {/* <p>{contractOwner?.substring(0, 27) + "..." || "Loading..."}</p> */}
                    </div>
                </div>

                <div className="button-list">
                    {contractButtons.map((label, index) => (
                        <button
                            key={index}
                            onClick={() => displayContract(contractAddress[index], contractABI[index], fileNames[index])}
                        >
                          <span className="button-left-text">{fileNames[index].substring(0,fileNames[index].length-5)}</span>
                          {/* <span className="button-right-text">{label.substring(23)}</span> */}
                        </button>
                    ))}
                </div>
            </div>

            <main className="main-content">
              
              <div className="contractData">
                <strong>Connected Contract:</strong> {currentAddress ? currentAddress : "Loading..."}
              </div>
              <div className="contractData">
                <strong>Contract Name:</strong> {currentFileName ? currentFileName : "Loading..."}
              </div>
              <div className="contractData">
                {/* <strong>Contract Owner:</strong> {contractOwner ? contractOwner : "Loading..."} */}
              </div>
              <div className="contractData">
                {/* <strong>Contract Balance:</strong> {contractBalance ? contractBalance : "Loading..."} */}
              </div>

              <div className="stateVariables">
                <strong>State Variables</strong>
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
                    <p>No state variables found or loading...</p>
                )}
            </div>

            <div className="function-calls">
              <strong>Function Calls</strong>
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
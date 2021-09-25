import React, { useState } from "react";
import { Web3ReactProvider, useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import { NoEthereumProviderError, UserRejectedRequestError as UserRejectedRequestErrorInjected } from "@web3-react/injected-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from "@web3-react/walletconnect-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorFrame } from "@web3-react/frame-connector";
import { Web3Provider } from "@ethersproject/providers";
import { formatEther } from "@ethersproject/units";
import { ethers } from "ethers";
import { useEagerConnect, useInactiveListener } from "../hooks";
import { injected, network, walletconnect, walletlink, ledger, trezor, lattice, frame, authereum, fortmatic, magic, portis, torus } from "../connectors";
import { Spinner } from "../components/Spinner";
import { MAINNET_CRANIUM_ABI, MAINNET_CRANIUM_CONTRACT, MAINNET_STALLION_ABI, MAINNET_STALLION_CONTRACT } from "../constants";
import { MAINNET_STAKING_ABI, MAINNET_STAKING_CONTRACT } from "../mainnetConstants";

/**
 * Object mapping connector names with names for connector buttons.
 */
enum ConnectorNames {
  Injected = "Metamask",
  Network = "Network",
  WalletConnect = "WalletConnect",
  WalletLink = "WalletLink",
  Ledger = "Ledger",
  Trezor = "Trezor",
  Lattice = "Lattice",
  Frame = "Frame",
  Authereum = "Authereum",
  Fortmatic = "Fortmatic",
  Magic = "Magic",
  Portis = "Portis",
  Torus = "Torus",
}

/**
 * Object mapping names of connector buttons to the actual connector object.
 */
const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.Network]: network,
  [ConnectorNames.WalletConnect]: walletconnect,
  [ConnectorNames.WalletLink]: walletlink,
  [ConnectorNames.Ledger]: ledger,
  [ConnectorNames.Trezor]: trezor,
  [ConnectorNames.Lattice]: lattice,
  [ConnectorNames.Frame]: frame,
  [ConnectorNames.Authereum]: authereum,
  [ConnectorNames.Fortmatic]: fortmatic,
  [ConnectorNames.Magic]: magic,
  [ConnectorNames.Portis]: portis,
  [ConnectorNames.Torus]: torus,
};

/**
 * Converts an Error object to its associated error message string.
 * @param error Error object for which to get the message.
 * @returns As error message string to be displayed to the user.
 */
function getErrorMessage(error: Error): string {
  if (error instanceof NoEthereumProviderError) {
    return "No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.";
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect ||
    error instanceof UserRejectedRequestErrorFrame
  ) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
}

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

export default function Named() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  );
}

/**
 * Gets the chainId from the Web3ReactContext returns
 * a returns a JSX.Element representing it.
 * @returns JSX.Element representing the Chain Id span
 */
function ChainId() {
  const { chainId } = useWeb3React();
  return (
    <>
      <span>Chain Id</span>
      <span role="img" aria-label="chain">
        ⛓
      </span>
      <span>{chainId ?? ""}</span>
    </>
  );
}

function BlockNumber() {
  const { chainId, library } = useWeb3React();

  const [blockNumber, setBlockNumber] = React.useState<number>();
  React.useEffect((): any => {
    if (!!library) {
      let stale = false;

      library
        .getBlockNumber()
        .then((blockNumber: number) => {
          if (!stale) {
            setBlockNumber(blockNumber);
          }
        })
        .catch(() => {
          if (!stale) {
            setBlockNumber(null);
          }
        });

      const updateBlockNumber = (blockNumber: number) => {
        setBlockNumber(blockNumber);
      };
      library.on("block", updateBlockNumber);

      return () => {
        stale = true;
        library.removeListener("block", updateBlockNumber);
        setBlockNumber(undefined);
      };
    }
  }, [library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <>
      <span>Block Number</span>
      <span role="img" aria-label="numbers">
        🔢
      </span>
      <span>{blockNumber === null ? "Error" : blockNumber ?? ""}</span>
    </>
  );
}

function Account() {
  const { account } = useWeb3React();

  return (
    <>
      <span>Account</span>
      <span role="img" aria-label="robot">
        🤖
      </span>
      <span>{account === null ? "-" : account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ""}</span>
    </>
  );
}

function Balance() {
  const { account, library, chainId } = useWeb3React();

  const [balance, setBalance] = React.useState();
  React.useEffect((): any => {
    if (!!account && !!library) {
      let stale = false;

      library
        .getBalance(account)
        .then((balance: any) => {
          if (!stale) {
            setBalance(balance);
          }
        })
        .catch(() => {
          if (!stale) {
            setBalance(null);
          }
        });

      return () => {
        stale = true;
        setBalance(undefined);
      };
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <>
      <span>Balance</span>
      <span role="img" aria-label="gold">
        💰
      </span>
      <span>{balance === null ? "Error" : balance ? `Ξ${formatEther(balance)}` : ""}</span>
    </>
  );
}

function Header() {
  const { active, error } = useWeb3React();

  return (
    <>
      <h1 style={{ margin: "1rem", textAlign: "right" }}>{active ? "🟢" : error ? "🔴" : "🟠"}</h1>
      <h1 style={{ textAlign: "center" }}>Wicked Staking</h1>
      <h3
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "1fr min-content 1fr",
          maxWidth: "20rem",
          lineHeight: "2rem",
          margin: "auto",
        }}
      >
        {/* <ChainId /> */}
        {/* <BlockNumber /> */}
        {/* <Account /> */}
        {/* <Balance /> */}
      </h3>
    </>
  );
}

function App() {
  const context = useWeb3React<Web3Provider>();
  const { connector, library, chainId, account, activate, deactivate, active, error } = context;

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  return (
    <>
      <Header />
      <Interact library={library} account={account}></Interact>

      <hr style={{ margin: "2rem" }} />
      <div
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "20rem",
          margin: "auto",
        }}
      >
        {Object.keys(connectorsByName).map((name) => {
          const currentConnector = connectorsByName[name];
          const activating = currentConnector === activatingConnector;
          const connected = currentConnector === connector;
          const disabled = !triedEager || !!activatingConnector || connected || !!error;

          return (
            <button
              style={{
                height: "3rem",
                borderRadius: "1rem",
                borderColor: activating ? "orange" : connected ? "green" : "unset",
                cursor: disabled ? "unset" : "pointer",
                position: "relative",
              }}
              disabled={disabled}
              key={name}
              onClick={() => {
                setActivatingConnector(currentConnector);
                activate(connectorsByName[name]);
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  color: "black",
                  margin: "0 0 0 1rem",
                }}
              >
                {activating && <Spinner color={"black"} style={{ height: "25%", marginLeft: "-1rem" }} />}
                {connected && (
                  <span role="img" aria-label="check">
                    ✅
                  </span>
                )}
              </div>
              {name}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {(active || error) && (
          <button
            style={{
              height: "3rem",
              marginTop: "2rem",
              borderRadius: "1rem",
              borderColor: "red",
              cursor: "pointer",
            }}
            onClick={() => {
              deactivate();
            }}
          >
            Deactivate
          </button>
        )}

        {!!error && <h4 style={{ marginTop: "1rem", marginBottom: "0" }}>{getErrorMessage(error)}</h4>}
      </div>

      <hr style={{ margin: "2rem" }} />

      <div
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "fit-content",
          maxWidth: "20rem",
          margin: "auto",
        }}
      >
        {!!(connector === connectorsByName[ConnectorNames.Network] && chainId) && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              (connector as any).changeChainId(chainId === 1 ? 4 : 1);
            }}
          >
            Switch Networks
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.WalletConnect] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill WalletConnect Session
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.WalletLink] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill WalletLink Session
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.Fortmatic] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill Fortmatic Session
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.Magic] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill Magic Session
          </button>
        )}
        {connector === connectorsByName[ConnectorNames.Portis] && (
          <>
            {chainId !== undefined && (
              <button
                style={{
                  height: "3rem",
                  borderRadius: "1rem",
                  cursor: "pointer",
                }}
                onClick={() => {
                  (connector as any).changeNetwork(chainId === 1 ? 100 : 1);
                }}
              >
                Switch Networks
              </button>
            )}
            <button
              style={{
                height: "3rem",
                borderRadius: "1rem",
                cursor: "pointer",
              }}
              onClick={() => {
                (connector as any).close();
              }}
            >
              Kill Portis Session
            </button>
          </>
        )}
        {connector === connectorsByName[ConnectorNames.Torus] && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              (connector as any).close();
            }}
          >
            Kill Torus Session
          </button>
        )}
      </div>
    </>
  );
}

function Interact(props) {
  let [craniumBalance, setCraniumBalance] = useState([]);
  let [stallionBalance, setStallionBalance] = useState([]);
  let [checkedCraniums, setCheckedCraniums] = useState([]);
  let [checkedStallions, setCheckedStallions] = useState([]);
  return (
    !!(props.library && props.account) && (
      <div style={{ textAlign: "center" }}>
        <h3>Step 1. Approve the Staking Contract to transfer your Craniums and Stallions</h3>
        <p>(Manual approval is needed to move NFTs owned by you, just like Opensea)</p>
        <p>
          <button
            onClick={() => {
              let signer = props.library.getSigner(props.account);
              const cranium_contract = new ethers.Contract(MAINNET_CRANIUM_CONTRACT, MAINNET_CRANIUM_ABI, signer);
              cranium_contract
                .setApprovalForAll(MAINNET_STAKING_CONTRACT, true)
                .then((res) => {
                  console.log("successful cranium approval");
                  console.log(res);
                })
                .catch((error) => {
                  console.log(error);
                  window.alert("Failure approving Craniums!" + (error && error.message ? `\n\n${JSON.stringify(error.message)}` : ""));
                });
            }}
            style={{ margin: "0.4rem" }}
          >
            Approve Craniums
          </button>
          <button
            onClick={() => {
              let signer = props.library.getSigner(props.account);
              const cranium_contract = new ethers.Contract(MAINNET_STALLION_CONTRACT, MAINNET_STALLION_ABI, signer);
              cranium_contract
                .setApprovalForAll(MAINNET_STAKING_CONTRACT, true)
                .then((res) => {
                  console.log("successful stallion approval");
                  console.log(res);
                })
                .catch((error) => {
                  console.log(error);
                  window.alert("Failure approving Stallions!" + (error && error.message ? `\n\n${JSON.stringify(error.message)}` : ""));
                });
            }}
            style={{ margin: "0.4rem" }}
          >
            Approve Stallions
          </button>
        </p>
        <h3>Step 2. Fetch your Cranuims and Stallions and select an equal # of each to Stake.</h3>
        <button
          onClick={() => {
            let signer = props.library.getSigner(props.account);
            const cranium_contract = new ethers.Contract(MAINNET_CRANIUM_CONTRACT, MAINNET_CRANIUM_ABI, signer);
            const stallion_contract = new ethers.Contract(MAINNET_STALLION_CONTRACT, MAINNET_STALLION_ABI, signer);
            const cranium_balance_promise = cranium_contract.balanceOf(props.account);
            const stallion_balance_promise = stallion_contract.balanceOf(props.account);
            Promise.all([cranium_balance_promise, stallion_balance_promise])
              .then(([cranium_balance, stallion_balance]) => {
                const cranium_token_promises = Array.apply(null, Array(Number(cranium_balance))).map((_e, i) =>
                  cranium_contract.tokenOfOwnerByIndex(props.account, i)
                );

                const stallion_token_promises = Array.apply(null, Array(Number(stallion_balance))).map((_e, i) =>
                  stallion_contract.tokenOfOwnerByIndex(props.account, i)
                );

                Promise.all(cranium_token_promises).then((cranium_token_array) => {
                  setCraniumBalance(cranium_token_array.map((e) => Number(e)));
                });
                Promise.all(stallion_token_promises).then((stallion_token_array) => {
                  setStallionBalance(stallion_token_array.map((e) => Number(e)));
                });
              })
              .catch((error) => {
                console.log(error);
                window.alert("Failure fetching Cranium & Stallion balance!" + (error && error.message ? `\n\n${JSON.stringify(error.message)}` : ""));
              });
          }}
        >
          Fetch Craniums + Stallions
        </button>

        <p>
          {craniumBalance.length > 0 && (
            <>
              <span style={{ fontSize: "large" }}>Craniums</span>
              <br />
            </>
          )}
          {craniumBalance.map((n, i) => {
            return (
              <>
                <span id={`span-id-cranium-${i}`} style={{ padding: "0.7em" }}>
                  <input
                    id={`input-id-cranium-${i}`}
                    name={`input-name-cranium-${i}`}
                    onChange={(e) =>
                      e.target.checked ? setCheckedCraniums([n, ...checkedCraniums]) : setCheckedCraniums(checkedCraniums.filter((e) => e !== n))
                    }
                    style={{ margin: "0.4rem" }}
                    type="checkbox"
                  ></input>
                  <label htmlFor={`input-name-cranium-${i}`}>{`#${n}`}</label>
                </span>
              </>
            );
          })}
        </p>

        <p>
          {stallionBalance.length > 0 && (
            <>
              <span style={{ fontSize: "large" }}>Stallions</span>
              <br />
            </>
          )}
          {stallionBalance.map((n, i) => {
            return (
              <>
                <span id={`span-id-stallion-${i}`} style={{ padding: "0.7em" }}>
                  <input
                    id={`input-id-stallion-${i}`}
                    name={`input-name-stallion-${i}`}
                    onChange={(e) =>
                      e.target.checked ? setCheckedStallions([n, ...checkedStallions]) : setCheckedStallions(checkedStallions.filter((e) => e !== n))
                    }
                    style={{ margin: "0.4rem" }}
                    type="checkbox"
                  ></input>
                  <label htmlFor={`input-name-stallion-${i}`}>{`#${n}`}</label>
                </span>
              </>
            );
          })}
        </p>
        <h3>Step 3. Stake</h3>
        <button
          onClick={() => {
            let signer = props.library.getSigner(props.account);
            const staking_contract = new ethers.Contract(MAINNET_STAKING_CONTRACT, MAINNET_STAKING_ABI, signer);
            staking_contract
              .stake(checkedCraniums, checkedStallions)
              .then((res) => {
                console.log("staking transaction done");
                console.log(res);
              })
              .catch((error) => {
                console.log(error);
                window.alert("Staking transaction could not be sent!" + (error && error.message ? `\n\n${JSON.stringify(error.message)}` : ""));
              });
          }}
          disabled={checkedCraniums.length !== checkedStallions.length || checkedCraniums.length === 0 || checkedStallions.length === 0}
        >
          Stake
        </button>
      </div>
    )
  );
}

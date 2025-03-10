# forge-utils

Forge-utils is a collection of utility scripts for working with Foundry projects. It provides various commands to help manage and process Foundry deployments and artifacts.

## Installation

You can install forge-utils using npm or yarn:

```
npm install -g forge-utils
# or
yarn global add forge-utils
```

## Usage

Forge-utils provides several commands that can be run using the `forge-utils` CLI:

### Generate Subgraph Networks JSON

Generates a `networks.json` file based on Forge deployment scripts.

Usage:
```
forge-utils generate-subgraph-networks <package> [env] --output <output_path> --dir <broadcast_dir>
```

- `<package>`: NPM package or path to the directory of Forge build artifacts
- `[env]`: (Optional) Environment to filter deployments (e.g., staging, production)
- `--output`: Path to output the `networks.json` file (default: current directory)
- `--dir`: Folder where the broadcast directory is located (default: 'broadcast')

Example:
```
forge-utils generate-subgraph-networks my-forge-project staging --output ./subgraph --dir ./broadcast
```

This will generate a `networks.json` file in the `./subgraph` directory. The file might look like this:

```
{
  "mainnet": {
    "MyContract": {
      "address": "0x1234567890123456789012345678901234567890"
    },
    "AnotherContract": {
      "address": "0x0987654321098765432109876543210987654321"
    }
  },
  "goerli": {
    "MyContract": {
      "address": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    },
    "AnotherContract": {
      "address": "0xfedcbafedcbafedcbafedcbafedcbafedcbafed"
    }
  }
}
```

### Generate Deployments JSON

Generates a `deployments.json` file based on Forge deployment scripts.

Usage:
```
forge-utils generate-deployments-json --dir <broadcast_dir> --output <output_path>
```

- `--dir`: Directory of Forge broadcast files (default: './broadcast')
- `--output`: Where to output the `deployments.json` file (default: current directory)

Example:
```
forge-utils generate-deployments-json --dir ./broadcast --output ./deployments
```

This will generate a `deployments.json` file in the `./deployments` directory. The file might contain:

```
{
  "production": {
    "1": {
      "MyContract": {
        "address": "0x1234567890123456789012345678901234567890",
        "deploymentBlock": 12345678
      }
    },
    "5": {
      "MyContract": {
        "address": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "deploymentBlock": 87654321
      }
    }
  }
}
```

### Clean Typechain Bytecode

Removes all bytecodes from Typechain factories.

Usage:
```
forge-utils clean-typechain-bytecode [path]
```

- `[path]`: Path to the folder to clean the bytecode from (default: './typechain')

Example:
```
forge-utils clean-typechain-bytecode ./typechain
```

This command doesn't produce any output file, but it modifies the Typechain factory files in the specified directory. For example, a line in a factory file might change from:

```
const _bytecode = "0x60806040...long bytecode...";
```

to:

```
const _bytecode = "0x";
```

### Append Meta to Broadcast Files

Appends meta information to Forge broadcast JSON files. The command will automatically use any metadata stored in `.forge-utils/meta.json` in addition to any metadata specified on the command line.

Usage:
```
forge-utils append-meta --dir <broadcast_dir> --meta <meta_info> [--new-files]
```

- `--dir`: Directory containing broadcast files (default: './broadcast')
- `--meta`: Meta information to append (e.g., meta.env=staging)
- `--new-files`: Only process files that are new to Git (optional)

Example:
```
forge-utils append-meta --dir ./broadcast --meta meta.env=staging --new-files
```

This command modifies the broadcast JSON files in the specified directory. It doesn't create new files, but updates existing ones. For example, a broadcast file might be updated to include:

```
{
  "transactions": [...],
  "meta": {
    "env": "staging"
  }
}
```

### record-meta

Records metadata that can be used by the append-meta command. The data is stored in `.forge-utils/meta.json`. Supports dot notation for nested objects and arrays.

```bash
forge-utils record-meta <key> <value> --output <output-dir>
```

Where:
- `<key>`: The key to identify the metadata (e.g., "env", "network", "config.timeout")
- `<value>`: The value to record (strings, numbers, booleans, or JSON objects/arrays)
- `--output`: Directory to store the meta.json file (default: ".forge-utils")

The command supports dot notation for keys, allowing you to create nested objects and arrays:

```bash
# Create a nested object
forge-utils record-meta "config.timeout" 30
forge-utils record-meta "config.retries" 3

# Create an array
forge-utils record-meta "networks[0]" "mainnet"
forge-utils record-meta "networks[1]" "goerli"

# Store complex values (as JSON)
forge-utils record-meta "contracts" '{"Token":"0x1234...","Vault":"0xabcd..."}'
```

#### Example usage in a Forge script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

contract RecordMeta is Script {
    function run() public {
        // Record environment metadata
        string[] memory envInputs = new string[](4);
        envInputs[0] = "forge-utils";
        envInputs[1] = "record-meta";
        envInputs[2] = "env";
        envInputs[3] = "production";
        vm.ffi(envInputs);
        
        // Record nested configuration
        string[] memory configInputs = new string[](4);
        configInputs[0] = "forge-utils";
        configInputs[1] = "record-meta";
        configInputs[2] = "config.gasLimit";
        configInputs[3] = "8000000";
        vm.ffi(configInputs);
        
        // Record array of networks
        string[] memory networkInputs = new string[](4);
        networkInputs[0] = "forge-utils";
        networkInputs[1] = "record-meta";
        networkInputs[2] = "networks[0]";
        networkInputs[3] = "mainnet";
        vm.ffi(networkInputs);
        
        // Later, you can use the append-meta command to apply this metadata to broadcast files
        // forge-utils append-meta --dir ./broadcast
    }
}
```

## Commands

### deployments

Generates a deployments.json based on the forge deployment scripts. The command will read from any existing deployments in the `.forge-utils` directory and merge them with the new deployments.

```bash
forge-utils deployments --dir <broadcast-dir> --output <output-dir>
```

- `--dir`: Directory of forge broadcast files (default: './broadcast')
- `--output`: Where to output the deployments.json file (default: '.forge-utils')

### record-deployment

Records deployment data with the given key and address. This command is useful when you want to record deployment addresses directly from a Solidity Forge script. The data is stored in `.forge-utils/deployments.json`.

```bash
forge-utils record-deployment <key> <address> --output <output-dir>
```

Where:
- `<key>`: The key to identify the deployment (e.g., "Token", "Vault")
- `<address>`: The contract address to record
- `--output`: Directory to store the deployments.json file (default: ".forge-utils")

#### Example usage in a Forge script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

contract RecordDeployment is Script {
    function run() public {
        // Deploy contracts
        address tokenAddress = 0x1234567890123456789012345678901234567890;
        address vaultAddress = 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd;

        // Record token deployment
        string[] memory tokenInputs = new string[](4);
        tokenInputs[0] = "forge-utils";
        tokenInputs[1] = "record-deployment";
        tokenInputs[2] = "Token";
        tokenInputs[3] = vm.toString(tokenAddress);
        vm.ffi(tokenInputs);
        
        // Record vault deployment
        string[] memory vaultInputs = new string[](4);
        vaultInputs[0] = "forge-utils";
        vaultInputs[1] = "record-deployment";
        vaultInputs[2] = "Vault";
        vaultInputs[3] = vm.toString(vaultAddress);
        vm.ffi(vaultInputs);
    }
}
```

## Development

To set up the project for development:

1. Clone the repository
2. Install dependencies: `yarn install`
3. Build the project: `yarn compile`
4. Run tests: `yarn test`

## License

This project is licensed under the MIT License.

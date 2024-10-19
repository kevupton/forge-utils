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

Appends meta information to Forge broadcast JSON files.

Usage:
```
forge-utils append-meta-to-broadcast --dir <broadcast_dir> --meta <meta_info> [--new-files]
```

- `--dir`: Directory containing broadcast files (default: './broadcast')
- `--meta`: Meta information to append (e.g., meta.env=staging)
- `--new-files`: Only process files that are new to Git (optional)

Example:
```
forge-utils append-meta-to-broadcast --dir ./broadcast --meta meta.env=staging --new-files
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

## Development

To set up the project for development:

1. Clone the repository
2. Install dependencies: `yarn install`
3. Build the project: `yarn compile`
4. Run tests: `yarn test`

## License

This project is licensed under the MIT License.

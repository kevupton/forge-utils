# forge-utils

Forge-utils is a collection of utility scripts for working with Foundry projects. It provides various commands to help manage and process Foundry deployments and artifacts.

## Installation

You can install forge-utils using npm or yarn:

## Usage

Forge-utils provides several commands that can be run using the `forge-utils` CLI:

### Generate Subgraph Networks JSON

Generates a `networks.json` file based on Forge deployment scripts.

- `<package>`: NPM package or path to the directory of Forge build artifacts
- `[env]`: (Optional) Environment to filter deployments (e.g., staging, production)
- `--output`: Path to output the `networks.json` file (default: current directory)
- `--dir`: Folder where the broadcast directory is located (default: 'broadcast')

### Generate Deployments JSON

Generates a `deployments.json` file based on Forge deployment scripts.

- `--dir`: Directory of Forge broadcast files (default: './broadcast')
- `--output`: Where to output the `deployments.json` file (default: current directory)

### Clean Typechain Bytecode

Removes all bytecodes from Typechain factories.

- `[path]`: Path to the folder to clean the bytecode from (default: './typechain')

### Append Meta to Broadcast Files

Appends meta information to Forge broadcast JSON files.

- `--dir`: Directory containing broadcast files (default: './broadcast')
- `--meta`: Meta information to append (e.g., meta.env=staging)
- `--new-files`: Only process files that are new to Git (optional)

## Development

To set up the project for development:

1. Clone the repository
2. Install dependencies: `yarn install`
3. Build the project: `yarn compile`
4. Run tests: `yarn test`

## License

This project is licensed under the MIT License.

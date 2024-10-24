export const getDeployment = (
  deployments: Record<string, any>,
  chainId: string | number,
  env?: string
) => {
  const result = env ? deployments[env][chainId] : deployments[chainId];
  if (!result) {
    throw new Error(
      `Deployment for chainId ${chainId}${
        env ? ` and env ${env}` : ''
      } not found`
    );
  }
  return result;
};

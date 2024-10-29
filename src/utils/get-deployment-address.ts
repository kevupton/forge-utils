export const getDeploymentAddress = (
  deployments: Record<string, any>,
  name: string,
  chainId: string | number,
  env?: string
): string => {
  const result = env
    ? deployments?.[env]?.[chainId]?.[name]
    : deployments?.[chainId]?.[name];

  if (!result) {
    throw new Error(
      `Deployment for chainId ${chainId}${
        env ? ` and env ${env}` : ''
      } not found`
    );
  }

  return result;
};

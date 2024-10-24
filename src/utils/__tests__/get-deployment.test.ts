import {getDeployment} from '../get-deployment';

describe('getDeployment', () => {
  const mockDeployments = {
    1: {address: '0x123'},
    5: {address: '0x456'},
    staging: {
      1: {address: '0x789'},
      5: {address: '0xabc'},
    },
  };

  it('should return deployment for a given chainId', () => {
    const result = getDeployment(mockDeployments, 1);
    expect(result).toEqual({address: '0x123'});
  });

  it('should return deployment for a given chainId and env', () => {
    const result = getDeployment(mockDeployments, 5, 'staging');
    expect(result).toEqual({address: '0xabc'});
  });

  it('should throw an error if deployment is not found for chainId', () => {
    expect(() => getDeployment(mockDeployments, 10)).toThrow(
      'Deployment for chainId 10 not found'
    );
  });

  it('should throw an error if deployment is not found for chainId and env', () => {
    expect(() => getDeployment(mockDeployments, 10, 'staging')).toThrow(
      'Deployment for chainId 10 and env staging not found'
    );
  });

  it('should work with chainId as a string', () => {
    const result = getDeployment(mockDeployments, '1');
    expect(result).toEqual({address: '0x123'});
  });
});

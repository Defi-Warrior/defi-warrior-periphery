import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { BigNumber, bigNumberify } from 'ethers/utils'
import { MaxUint256 } from 'ethers/constants'
import IUniswapV2Pair from '@defi-warrior/core/build/IUniswapV2Pair.json'

import { v2Fixture } from './shared/fixtures'
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY } from './shared/utilities'

import DeflatingERC20 from '../build/DeflatingERC20.json'
import { ecsign } from 'ethereumjs-util'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999
}

describe('UniswapV2Router02', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
  const [wallet, other] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet, other])

  let token0: Contract
  let token1: Contract
  let router: Contract
  let factory: Contract
  let nftFactory: Contract

  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)
    token0 = fixture.token0
    token1 = fixture.token1
    router = fixture.router
    factory = fixture.factory
    nftFactory = fixture.nftFactory
  })

  it("Add liquidity success", async() => {
    let pairAddress = await factory.getPair(token0.address, token1.address);

    console.log("pair address: ", pairAddress);

    console.log("allowed to farm: ", await nftFactory.allowedToFarm(pairAddress, wallet.address))
    console.log("allowance: ", await token0.allowance(wallet.address, router.address))

    await router.addLiquidity(token0.address, token1.address, 
      expandTo18Decimals(1), expandTo18Decimals(1), 
      0, 0, 
      wallet.address, MaxUint256, overrides)
    
    await router.mintCharacter(token0.address, token1.address, expandTo18Decimals(15), expandTo18Decimals(15))

    console.log("allowed to farm: ", await nftFactory.allowedToFarm(pairAddress, wallet.address))

    const testLib = await deployContract(wallet, TestLib);

    console.log("testLib address: ", await testLib.pairFor(factory.address, token0.address, token1.address))

    // await expect(router.addLiquidity(token0.address, token1.address, 
    //   expandTo18Decimals(1), expandTo18Decimals(1), 
    //   0, 0, 
    //   wallet.address, MaxUint256, overrides))
    //   .to.emit(router, "Fuck")
    //   .withArgs(100, 100)
  })
})

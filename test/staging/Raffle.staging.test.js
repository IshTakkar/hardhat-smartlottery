const { assert, expect } = require('chai')
const { network, getNamedAccounts, deployments, ethers } = require('hardhat')
const { developmentChains, networkConfig } = require('../../helper-hardhat-config')

developmentChains.includes(network.name)
    ? describe.skip
    : describe('Raffle Unit Tests', () => {
          let raffle, raffleEntranceFee, accounts, interval
          const chainId = network.config.chainId
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              const raffleContract = await ethers.getContract('Raffle')
              raffle = raffleContract.connect(accounts[0])
              raffleEntranceFee = await raffle.getEntranceFee()
          })
          describe('fulfillRandomWords', () => {
              it('works with live Chainlink Keepers and Chainlink VRF, we get a random winner', async () => {
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  await new Promise(async (resolve, reject) => {
                      raffle.once('WinnerPicked', async () => {
                          console.log('WinnerPicked event fired!')
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayers(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error);
                              reject(error)
                          }
                      })

                      await raffle.enterRaffle({ value: raffleEntranceFee })
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })

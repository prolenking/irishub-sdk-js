/** @module gov */
import {isEmpty} from "../../utils"
import AbstractModule from "../module"
import {Method} from "../../constants"

class Gov extends AbstractModule {
    /**
     *
     * @param provider {WsProvider|HttpProvider} - agent of network
     * @param opt {object} - other configurable parameters
     * @return {Gov}
     */
    constructor(provider, opt) {
        super(provider, opt)
    }

    /**
     * Query proposals information with parameters
     *
     * @param voter {string} - voter's address
     * @param depositor {string} - depositor's address
     * @param status {string} - proposal's status,valid values can be "DepositPeriod", "VotingPeriod", "Passed", "Rejected"
     * @param limit {number} - limit to latest [number] proposals. Defaults to all proposals
     * @return {Promise}
     */
    getProposals(voter, depositor, status, limit) {
        return super.__get(Method.GetProposals, voter, depositor, status, limit);
    }

    /**
     * Query a proposal by proposalId
     *
     * @param proposalId {number} - proposal's id
     * @return {Promise}
     */
    getProposal(proposalId) {
        if (isEmpty(proposalId)) {
            throw new Error("proposalId is empty");
        }
        return super.__get(Method.GetProposal, proposalId);
    }

    /**
     * Query deposits by proposalId
     *
     * @param proposalId {number} - proposal's id
     * @return {Promise}
     */
    getDeposits(proposalId) {
        if (isEmpty(proposalId)) {
            throw new Error("proposalId is empty");
        }
        return super.__get(Method.GetDeposits, proposalId);
    }

    /**
     * Query deposit by proposalId and depositor address
     *
     * @param proposalId {number} - proposal's id
     * @param depositor {string} - depositor's address
     * @return {Promise}
     */
    getDeposit(proposalId, depositor) {
        if (isEmpty(proposalId)) {
            throw new Error("proposalId is empty");
        }
        if (isEmpty(depositor)) {
            throw new Error("depositor is empty");
        }
        return super.__get(Method.GetDeposit, proposalId, depositor);
    }

    /**
     * Query voters information by proposalId
     *
     * @param proposalId {number} - proposal's id
     * @return {Promise}
     */
    getVotes(proposalId) {
        if (isEmpty(proposalId)) {
            throw new Error("proposalId is empty");
        }
        return super.__get(Method.GetVotes, proposalId);
    }

    /**
     * Query vote information by proposalId and voter address
     *
     * @param proposalId {number} - proposal's id
     * @param voter {string} - voter's address
     * @return {Promise}
     */
    getVote(proposalId, voter) {
        if (isEmpty(proposalId)) {
            throw new Error("proposalId is empty");
        }
        if (isEmpty(voter)) {
            throw new Error("voter is empty");
        }
        return super.__get(Method.GetVote, proposalId, voter);
    }

    /**
     * Query parameters
     *
     * @param module {string} - module's symbol,valid values can be "gov","stake","bank","auth"
     * @return {Promise}
     */
    getParams(module) {
        return super.__get(Method.GetParams, module);
    }

    /**
     * Send transaction to deposit tokens to a proposal
     *
     * @param depositor {string} - address of the depositor
     * @param proposalId {int} - iD of the proposal
     * @param amount {Coin[]} - coins to add to the proposal's deposit
     * @param config {Object} - config information includes: fee,gas,memo,timeout,network,chain,privateKey.if some properties is null ,will use the IrisClient default options
     * @return {Promise<{resp: *, hash: string}>}
     */
    deposit(depositor, proposalId, amount, config = {}) {
        let msg = {
            proposal_id: proposalId,
            amount: amount
        };
        config.txType = "deposit";
        return super.__sendTransaction(depositor, msg, config);
    }

    /**
     * Vote a proposal
     *
     * @param voter {string} - address of the voter
     * @param proposalId {int} - iD of the proposal
     * @param option {int} - option from OptionSet chosen by the voter
     * @param config {Object} - config information includes: fee,gas,memo,timeout,network,chain,privateKey.if some properties is null ,will use the IrisClient default options
     * @return {Promise<{resp: *, hash: string}>}
     */
    vote(voter, proposalId, option, config = {}) {
        let msg = {
            proposal_id: proposalId,
            option: option
        };
        config.txType = "vote";
        return super.__sendTransaction(voter, msg, config);
    }
}

export default Gov;
